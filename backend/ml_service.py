"""
RISKFORGE — XGBoost Forecasting Service
Two models:
  1. Resolution-time predictor — per-case time-to-close estimate.
  2. Volume projection — 14-day naive + trend forecast.

Models are trained on-demand and cached on disk.
"""
from __future__ import annotations
import logging
import os
import pickle
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase

from models import ForecastRequest, ForecastResponse

logger = logging.getLogger(__name__)

MODEL_PATH = os.getenv("ML_MODEL_PATH", "./data/xgb_resolution.pkl")
_VOLUME_CACHE: Optional[List[Tuple[str, int]]] = None


# ── Feature engineering ─────────────────────────────────────────────────────
def _features_for_case(complaint: Dict[str, Any], assessment: Optional[Dict[str, Any]]) -> List[float]:
    """Build a numeric feature vector for the resolution-time model."""
    risk_map = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Unclassified": 2}
    product_map = {"Banking": 1, "Credit Card": 2, "Mortgage": 3, "Debt Collection": 4,
                   "Student Loan": 5, "Personal Loan": 6, "Money Transfer": 7, "Other": 0}

    narrative = complaint.get("narrative", "")
    return [
        float(risk_map.get(complaint.get("risk", "Unclassified"), 2)),
        float(product_map.get(complaint.get("product", "Other"), 0)),
        float(len(narrative)),
        float(len(narrative.split())),
        float((assessment or {}).get("confidence_score", 0.5)),
        float(len((assessment or {}).get("fraud_signals", []) or [])),
    ]


# ── Resolution-time model ───────────────────────────────────────────────────
async def train_resolution_model(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    """Train (or retrain) the XGBoost resolution-time model on closed complaints."""
    try:
        import xgboost as xgb
        import numpy as np
    except ImportError:
        logger.warning("XGBoost not installed — using a linear-regression fallback")
        xgb = None

    cursor = db.complaints.find(
        {"stage": "Closed", "closed_at": {"$exists": True}},
        {"created_at": 1, "closed_at": 1, "risk": 1, "product": 1, "narrative": 1},
    ).limit(5000)

    X: List[List[float]] = []
    y: List[float] = []
    async for doc in cursor:
        try:
            created = doc["created_at"] if isinstance(doc["created_at"], datetime) else datetime.fromisoformat(str(doc["created_at"]))
            closed = doc["closed_at"] if isinstance(doc["closed_at"], datetime) else datetime.fromisoformat(str(doc["closed_at"]))
            hours = max(0.1, (closed - created).total_seconds() / 3600)
        except (KeyError, ValueError, TypeError):
            continue
        X.append(_features_for_case(doc, None))
        y.append(hours)

    if len(X) < 50:
        return {"status": "insufficient_data", "samples": len(X), "mae": None, "rmse": None}

    if xgb is not None:
        import numpy as np
        X_arr = np.array(X, dtype=np.float32)
        y_arr = np.array(y, dtype=np.float32)
        model = xgb.XGBRegressor(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.85,
            random_state=42,
        )
        model.fit(X_arr, y_arr)
        preds = model.predict(X_arr)
        mae = float(np.mean(np.abs(preds - y_arr)))
        rmse = float(np.sqrt(np.mean((preds - y_arr) ** 2)))
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({"model": model, "mae": mae, "rmse": rmse, "trained_at": datetime.utcnow().isoformat()}, f)
    else:
        # Fallback: simple mean predictor
        mae = sum(abs(v - sum(y) / len(y)) for v in y) / len(y)
        rmse = (sum((v - sum(y) / len(y)) ** 2 for v in y) / len(y)) ** 0.5
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({"model": None, "mae": mae, "rmse": rmse, "mean_hours": sum(y) / len(y), "trained_at": datetime.utcnow().isoformat()}, f)

    logger.info("Resolution model trained — samples=%d mae=%.2f rmse=%.2f", len(X), mae, rmse)
    return {"status": "trained", "samples": len(X), "mae": round(mae, 2), "rmse": round(rmse, 2)}


async def predict_resolution(complaint: Dict[str, Any], assessment: Optional[Dict[str, Any]]) -> ForecastResponse:
    """Predict resolution time for a single complaint. Returns prediction + confidence interval."""
    try:
        with open(MODEL_PATH, "rb") as f:
            bundle = pickle.load(f)
    except FileNotFoundError:
        return ForecastResponse(
            target="resolution_time",
            prediction=0.0,
            confidence_low=0.0,
            confidence_high=0.0,
            model_status="not_trained",
        )

    features = _features_for_case(complaint, assessment)
    if bundle.get("model") is not None:
        import numpy as np
        prediction = float(bundle["model"].predict(np.array([features], dtype=np.float32))[0])
    else:
        prediction = float(bundle.get("mean_hours", 48.0))

    mae = float(bundle.get("mae", prediction * 0.2))
    return ForecastResponse(
        target="resolution_time",
        prediction=round(prediction, 2),
        confidence_low=round(max(0.1, prediction - mae * 1.5), 2),
        confidence_high=round(prediction + mae * 1.5, 2),
        model_status="trained",
    )


# ── Volume forecasting ──────────────────────────────────────────────────────
async def forecast_volume(db: AsyncIOMotorDatabase, horizon_days: int = 14) -> Dict[str, Any]:
    """Naive + trend volume projection over the next N days."""
    # Aggregate per-day counts
    pipeline = [
        {"$match": {"created_at": {"$exists": True}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    history: List[Tuple[str, int]] = []
    async for doc in db.complaints.aggregate(pipeline):
        history.append((doc["_id"], int(doc["count"])))

    if len(history) < 3:
        return {"status": "insufficient_history", "forecast": []}

    values = [v for _, v in history]
    avg = sum(values) / len(values)
    # Simple trend = last 7 avg vs overall avg
    recent = values[-7:] if len(values) >= 7 else values
    trend = (sum(recent) / len(recent)) - avg

    forecast_days: List[Dict[str, Any]] = []
    last_date = datetime.fromisoformat(history[-1][0])
    for i in range(1, horizon_days + 1):
        d = last_date + timedelta(days=i)
        # Weekend dip
        weekend_factor = 0.7 if d.weekday() >= 5 else 1.0
        projected = max(0, (avg + trend * (i / horizon_days)) * weekend_factor)
        forecast_days.append({"date": d.strftime("%Y-%m-%d"), "forecast": round(projected, 1)})

    return {
        "status": "ok",
        "history_days": len(history),
        "weekly_forecast": round(sum(f["forecast"] for f in forecast_days[:7]), 1),
        "monthly_forecast": round(sum(f["forecast"] for f in forecast_days) * (30 / horizon_days), 1),
        "forecast": forecast_days,
    }


async def feature_importance() -> Dict[str, float]:
    """Return the feature importance dict from the trained model."""
    try:
        with open(MODEL_PATH, "rb") as f:
            bundle = pickle.load(f)
    except FileNotFoundError:
        return {}
    model = bundle.get("model")
    if model is None:
        return {}
    names = ["risk_score", "product_type", "narrative_chars", "narrative_words", "confidence", "fraud_signal_count"]
    try:
        importances = list(model.feature_importances_)
        return {n: round(float(v), 4) for n, v in zip(names, importances)}
    except AttributeError:
        return {}
