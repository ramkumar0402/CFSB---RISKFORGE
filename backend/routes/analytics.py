"""
RISKFORGE — Analytics API routes
Dashboard KPIs, risk distribution, RAG search, and ML forecasting endpoints.
"""
from __future__ import annotations
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from database import get_db
from auth import get_current_user
from models import RAGQuery, RAGResponse, ForecastRequest, ForecastResponse, AuditEvent
from rag_service import run_query, build_index
from ml_service import train_resolution_model, predict_resolution, forecast_volume, feature_importance
from workflow_engine import flag_sla_breaches

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/kpis")
async def kpis(
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Dict[str, Any]:
    total = await db.complaints.count_documents({})
    high_risk = await db.complaints.count_documents({"risk": {"$in": ["Critical", "High"]}})
    escalated = await db.complaints.count_documents({"stage": "Escalated"})
    closed = await db.complaints.count_documents({"stage": "Closed"})
    sla_breaches = await db.complaints.count_documents({"sla_breached": True})

    return {
        "total_cases": total,
        "high_risk": high_risk,
        "escalated": escalated,
        "closed": closed,
        "escalation_rate": round((escalated / total) * 100, 1) if total else 0,
        "sla_compliance_pct": round(((total - sla_breaches) / total) * 100, 1) if total else 100.0,
    }


@router.get("/risk-distribution")
async def risk_distribution(
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Dict[str, int]:
    pipeline = [{"$group": {"_id": "$risk", "count": {"$sum": 1}}}]
    result: Dict[str, int] = {}
    async for doc in db.complaints.aggregate(pipeline):
        result[doc["_id"]] = int(doc["count"])
    return result


@router.get("/volume-by-product")
async def volume_by_product(
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Dict[str, int]:
    pipeline = [{"$group": {"_id": "$product", "count": {"$sum": 1}}}]
    result: Dict[str, int] = {}
    async for doc in db.complaints.aggregate(pipeline):
        result[doc["_id"]] = int(doc["count"])
    return result


@router.get("/daily-volume")
async def daily_volume(
    days: int = 14,
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    pipeline = [
        {"$match": {"created_at": {"$exists": True}}},
        {"$group": {"_id": {"$dateToString": {"format": "%m-%d", "date": "$created_at"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    return [{"date": doc["_id"], "volume": int(doc["count"])} async for doc in db.complaints.aggregate(pipeline)]


@router.post("/rag/search", response_model=RAGResponse)
async def rag_search(
    query: RAGQuery,
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await run_query(query, db)


@router.post("/rag/rebuild")
async def rag_rebuild(
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    index = await build_index(db)
    return {"status": "ok", "documents_indexed": len(index.documents)}


@router.post("/ml/train")
async def ml_train(
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await train_resolution_model(db)


@router.post("/ml/predict", response_model=ForecastResponse)
async def ml_predict(
    request: ForecastRequest,
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not request.complaint_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "complaint_id required")
    doc = await db.complaints.find_one({"_id": ObjectId(request.complaint_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found")
    assessment = await db.risk_assessments.find_one({"complaint_id": request.complaint_id})
    return await predict_resolution(doc, assessment)


@router.get("/ml/forecast-volume")
async def ml_forecast_volume(
    horizon: int = 14,
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await forecast_volume(db, horizon_days=horizon)


@router.get("/ml/feature-importance")
async def ml_feature_importance(_user: dict = Depends(get_current_user)):
    return await feature_importance()


@router.post("/jobs/sla-breaches")
async def sla_breach_job(
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    count = await flag_sla_breaches(db)
    return {"flagged": count}


@router.get("/audit-log")
async def audit_log(
    limit: int = 100,
    action: Optional[str] = None,
    user: Optional[str] = None,
    _u: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict = {}
    if action:
        query["action"] = action
    if user:
        query["user"] = user
    cursor = db.audit_logs.find(query).sort("timestamp", -1).limit(limit)
    return [doc async for doc in cursor]
