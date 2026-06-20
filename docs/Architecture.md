# RISKFORGE — System Architecture

> Triage. Decide. Govern.
> End-to-end AI-powered risk triage & workflow automation for CFPB consumer complaints.

---

## 1. Overview

RISKFORGE is a three-tier application:

```
┌──────────────────────────────────────────────────────────────┐
│                    React + Vite + Tailwind                    │
│  pages/  components/  services/  lib/ (state + data)         │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / REST + JWT
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    FastAPI (Python 3.11+)                     │
│  server.py ─ routes/ ─ auth.py ─ models.py ─ database.py     │
│  llm_service.py ─ workflow_engine.py ─ rag_service.py        │
│  ml_service.py (XGBoost)                                      │
└──────────────────────────────┬───────────────────────────────┘
                               │ async driver (Motor)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                          MongoDB                               │
│  users  complaints  risk_assessments  workflow_instances     │
│  audit_logs  forecasts  workflows                             │
└──────────────────────────────────────────────────────────────┘
```

## 2. Layer Responsibilities

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| **API Layer** | Receive & validate HTTP requests, enforce auth, serialise JSON | FastAPI + Pydantic v2 |
| **Service Layer** | Business logic — classification, routing, forecasting, search | Python modules (auth, llm, workflow, rag, ml) |
| **AI Layer** | LLM-based risk classification + structured JSON output | Anthropic Claude (primary), OpenAI GPT (fallback) |
| **Workflow Layer** | Deterministic triage path + SLA + audit logging | In-memory engine + persisted instances |
| **Data Layer** | Persistent, time-series, text-indexed storage | MongoDB 7.x |

## 3. Data Flow — Single Complaint

```
  [React UI] ──POST /api/complaints──▶ [FastAPI]
                                                │
                                                ▼
                                     ┌── llm_service.classify_complaint() ──┐
                                     │  (structured prompt + JSON validation) │
                                     └─────────────────────────────────────────┘
                                                │
                                                ▼
                                     workflow_engine.execute_workflow()
                                     ├─ trigger
                                     ├─ ai_classify
                                     ├─ risk_condition ─┬─ Critical → escalate → manager_approval → compliance_review
                                     │                   └─ Other    → manager_approval (auto) → compliance_review (auto)
                                     ├─ notify_teams
                                     └─ close
                                                │
                                                ▼
                                     _audit() → audit_logs (SHA-256 chained)
```

## 4. AI Architecture

```
  Complaint Narrative
         │
         ▼
  Prompt Engineering (v1.0)
  ├─ System prompt  — compliance-analyst persona
  ├─ User template  — schema + risk tier definitions + narrative
  └─ Guardrails     — "return ONLY valid JSON"
         │
         ▼
  LLM Analysis (Claude Sonnet 4.5)
  ├─ risk_tier        (Critical | High | Medium | Low)
  ├─ confidence_score (0.0–1.0)
  ├─ product_category (controlled vocab)
  ├─ sentiment
  ├─ fraud_signals    (multi-label)
  ├─ department_routing
  └─ escalation_flag
         │
         ▼
  JSON Schema Validation (Pydantic)
  ├─ type checking
  ├─ value-space enforcement (enums)
  └─ rule-based fallback on LLM failure
         │
         ▼
  Structured JSON Output → risk_assessments collection
```

## 5. Workflow Architecture

```
  Complaint Created
         │
         ▼
  AI Classification
         │
         ▼
  Risk Evaluation ─┬─ Low        → Auto-close (standard template)
                   ├─ Medium     → Standard review queue (24h SLA)
                   ├─ High       → Escalation queue → Manager approval
                   └─ Critical   → Escalation queue → Manager approval → Compliance review → Legal
                                                          │
                                                          ▼
                                                  Case Closure (audit + archive)
```

## 6. RAG Architecture

```
  Historical Complaints (MongoDB text index)
         │
         ▼
  TF-IDF Vectorization (custom, no heavy runtime deps)
  ├─ tokenisation + stop-word removal
  ├─ per-document TF normalisation
  └─ IDF over the corpus
         │
         ▼
  Cosine-similarity Search (top-K)
         │
         ▼
  Analyst Recommendation (similarity-scored hits with product + company)
```

## 7. ML Architecture

```
  Complaint Data
         │
         ▼
  Feature Engineering
  ├─ risk_score (numeric)
  ├─ product_type (one-hot)
  ├─ narrative_chars / narrative_words (length)
  ├─ confidence (from LLM)
  └─ fraud_signal_count
         │
         ▼
  XGBoost Regressor (n_estimators=150, max_depth=5, lr=0.08)
         │
         ▼
  Predictions
  ├─ resolution_time  (hours, per-case)
  └─ complaint_volume (daily, 14-day horizon)
```

## 8. Database Collections

| Collection | Purpose | Key indexes |
|------------|---------|-------------|
| `users` | Identities + roles | email (unique), role |
| `complaints` | Complaint records + state | created_at DESC, (risk, created_at), product, $text on narrative |
| `risk_assessments` | LLM output per complaint | complaint_id (unique) |
| `workflow_instances` | Executed flow per complaint | complaint_id, status |
| `audit_logs` | Append-only, time-series | timestamp DESC, (user, timestamp), action |
| `forecasts` | ML predictions | created_at DESC |
| `workflows` | Flow definitions (nodes + edges) | name |

## 9. Technology Decisions — Justification

| Decision | Rationale |
|----------|-----------|
| **FastAPI** | Async by default, Pydantic v2 contracts, auto-generated OpenAPI docs, great for typed APIs. |
| **MongoDB** | Flexible schema for evolving complaint fields; native text-index + aggregation pipelines for dashboard queries. |
| **Anthropic Claude** | Superior long-context reasoning and strict JSON adherence — critical for structured classification at scale. |
| **XGBoost** | Industry-standard gradient boosting; handles mixed numeric/categorical features, fast inference, explainable via `feature_importances_`. |
| **Custom TF-IDF** | Avoids heavy runtime dependencies; deterministic, auditable, fast enough for 50k-document corpora. |
| **JWT + bcrypt** | Stateless auth; industry-standard password hashing; role-based access control at the route level. |
| **React + Vite** | Fast HMR during development; small production bundles; mature ecosystem for dashboard tooling. |
| **Tailwind CSS** | Design-token-free utility styling; enables the "ops terminal" aesthetic without a heavy UI library. |

## 10. Integration Points

- **Frontend → Backend**: REST over HTTPS on `/api/*`. JWT in `Authorization: Bearer <token>`.
- **Backend → LLM providers**: Anthropic Messages API (primary) with OpenAI Chat Completions as fallback.
- **Backend → MongoDB**: Motor async driver; indexes ensured at startup.
- **External systems** (documented design): SharePoint List (CFPB Incoming Queue), Microsoft Teams (escalation channel), Microsoft Planner (tasks), Power BI (governance dashboard).

## 11. Observability & Governance

- Every write action produces a cryptographically-chained audit record (SHA-256).
- SLA breach job runs hourly; flag + alert + log.
- Model risk assessment: bias testing, PSI drift detection, PII redaction verification.
- Data retention: active 5y, closed 7y, audit logs 10y (immutable).
- Encryption: AES-256-GCM at rest, TLS 1.3 in transit.

---

*Version 1.0 · Author: Senior BA / AI Automation Engineer · Review date: 2026-06-19*
