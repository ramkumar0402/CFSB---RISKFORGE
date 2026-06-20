# RISKFORGE — API Documentation

> Base URL: `https://api.riskforge.io` (or `http://localhost:8000` in development)
> All write endpoints require `Authorization: Bearer <jwt>`.
> Auto-generated interactive docs are available at `/docs` (Swagger) and `/redoc`.

---

## 1. Authentication

### `POST /api/users/register`

Create a new identity.

**Request**
```jsonc
{
  "name": "Jane Doe",
  "email": "jane@riskforge.io",
  "password": "change-me-123",
  "role": "ANALYST"
}
```

**Response `201`**
```jsonc
{
  "id": "U-66c3f1a9",
  "name": "Jane Doe",
  "email": "jane@riskforge.io",
  "role": "ANALYST",
  "status": "Active"
}
```

### `POST /api/users/login`

Exchange credentials for a short-lived JWT.

**Request**
```jsonc
{ "email": "admin@riskforge.io", "password": "demo-token" }
```

**Response `200`**
```jsonc
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "token_type": "bearer",
  "role": "ADMIN",
  "expires_in": 3600
}
```

### `GET /api/users/me`

Return the authenticated user's profile.

**Response `200`**
```jsonc
{
  "id": "U-01",
  "name": "admin",
  "email": "admin@riskforge.io",
  "role": "ADMIN",
  "status": "Active"
}
```

---

## 2. Complaints

### `GET /api/complaints`

Paginated complaint listing. Supports filters.

**Query params**
- `risk` — Critical | High | Medium | Low | Unclassified
- `stage` — Received | AI Classified | Escalated | Assigned | Closed
- `product` — Banking | Credit Card | Mortgage | ...
- `search` — free-text (uses MongoDB text index on `narrative`)
- `limit` — default 50, max 200
- `offset` — default 0

**Response `200`**
```jsonc
[
  {
    "id": "RF-304070",
    "product": "Banking",
    "issue": "Unauthorized transactions",
    "company": "JPMORGAN CHASE & CO.",
    "state": "CA",
    "risk": "Critical",
    "stage": "AI Classified",
    "narrative": "I have been the victim of identity theft...",
    "confidence": 0.92,
    "created_at": "2026-06-19T17:46:00Z"
  }
]
```

### `POST /api/complaints`

Ingest a new complaint. Triggers AI classification + workflow when `auto_classify: true`.

**Request**
```jsonc
{
  "product": "Banking",
  "issue": "Unauthorized transactions",
  "company": "JPMORGAN CHASE & CO.",
  "state": "CA",
  "channel": "Web",
  "narrative": "I have been the victim of identity theft...",
  "auto_classify": true
}
```

**Response `201`** — same shape as `GET /api/complaints/{id}`.

### `POST /api/complaints/{id}/classify`

Force re-classification for a single complaint.

**Response `200`**
```jsonc
{
  "complaint_id": "RF-304070",
  "risk_tier": "Critical",
  "risk_rationale": "Narrative alleges identity theft and unauthorized transactions.",
  "product_category": "Banking",
  "confidence_score": 0.92,
  "escalation_flag": true,
  "sentiment": "Highly Negative",
  "fraud_signals": ["Identity Theft", "Unauthorized Transactions"],
  "department": "Fraud Investigation Unit"
}
```

### `POST /api/complaints/{id}/workflow`

Manually trigger the standard triage workflow. Requires MANAGER or ADMIN.

**Response `200`** — the `WorkflowInstance` document.

### `DELETE /api/complaints/{id}`

Soft-delete a complaint. Requires ADMIN.

**Response `204`**

---

## 3. Analytics

### `GET /api/analytics/kpis`

Top-line dashboard metrics.

**Response `200`**
```jsonc
{
  "total_cases": 4071,
  "high_risk": 14,
  "escalated": 0,
  "closed": 4,
  "escalation_rate": 0.0,
  "sla_compliance_pct": 98.6
}
```

### `GET /api/analytics/risk-distribution`

Counts per risk tier.

### `GET /api/analytics/volume-by-product`

Counts per product category.

### `GET /api/analytics/daily-volume`

14-day daily complaint volume.

### `POST /api/analytics/rag/search`

Semantic search across the complaint corpus.

**Request**
```jsonc
{ "query": "identity theft credit card california", "top_k": 8 }
```

**Response `200`**
```jsonc
{
  "query": "identity theft credit card california",
  "total_hits": 8,
  "hits": [
    {
      "complaint_id": "RF-301222",
      "product": "Credit Card",
      "company": "CAPITAL ONE",
      "narrative": "Someone opened a credit card in my name...",
      "similarity": 0.94
    }
  ]
}
```

### `POST /api/analytics/rag/rebuild`

Rebuild the TF-IDF index from the complaints collection.

### `POST /api/analytics/ml/train`

Retrain the XGBoost resolution-time model on closed complaints.

### `POST /api/analytics/ml/predict`

Predict resolution time for a single complaint.

**Request**
```jsonc
{ "target": "resolution_time", "complaint_id": "RF-304070" }
```

**Response `200`**
```jsonc
{
  "target": "resolution_time",
  "prediction": 12.4,
  "confidence_low": 4.1,
  "confidence_high": 20.7,
  "model_status": "trained"
}
```

### `GET /api/analytics/ml/forecast-volume?horizon=14`

14-day daily volume forecast.

### `GET /api/analytics/ml/feature-importance`

Feature importance dict from the trained XGBoost model.

### `POST /api/analytics/jobs/sla-breaches`

Hourly job — flag open complaints past their SLA deadline.

### `GET /api/analytics/audit-log`

Paginated, filterable audit log.

**Query params**
- `limit` (default 100)
- `action` — e.g. `WORKFLOW_EXECUTED`
- `user` — email

---

## 4. System

### `GET /api/health`

Liveness + readiness probe.

**Response `200`**
```jsonc
{ "status": "ok", "version": "1.0.0", "timestamp": "2026-06-19T17:46:00Z" }
```

### `GET /`

API landing — returns name, version, docs URL, and endpoint list.

---

## 5. Error Contract

All error responses share the same shape:

```jsonc
{
  "detail": "Complaint not found",
  "code": "NOT_FOUND"
}
```

Common status codes:

| Code | Meaning |
|------|---------|
| `400` | Validation failure — `errors` array included |
| `401` | Missing or invalid JWT |
| `403` | Insufficient role |
| `404` | Resource not found |
| `409` | Email already registered |
| `422` | Request-body validation failure |
| `500` | Internal server error |

---

## 6. Rate Limiting & Retry

- **Classification endpoints**: 100 requests / minute / user. 429 on breach.
- **Recommended client retry**: exponential backoff with jitter, max 3 attempts.
- **Idempotency**: POST endpoints accept `Idempotency-Key: <uuid>` for safe retries.

---

*Version 1.0 · Contact: engineering@riskforge.io · Review date: 2026-06-19*
