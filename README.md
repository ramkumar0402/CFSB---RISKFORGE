# RISKFORGE

> **Triage. Decide. Govern.**
>
> AI-augmented terminal for CFPB consumer-complaint risk classification, workflow automation, and full audit governance. Built for compliance teams that don't get second chances.

---

## 1. Project at a glance

| | |
|---|---|
| **Problem** | CFPB complaint volumes (3M+ records) too high for manual review. Complaints must be triaged, risk-scored, and routed within SLA windows. |
| **Solution** | FastAPI + MongoDB backend with an Anthropic Claude AI classifier; a Power-Automate-style workflow engine; an XGBoost forecasting model; a TF-IDF RAG search module; and a React + Vite + Tailwind ops-terminal UI. |
| **Target recall** | AI classification recall ≥ 85% (35% lift over rule-only baseline). |
| **Throughput** | ≥ 10,000 records / hour. |
| **SLA compliance target** | ≥ 98.5%. |

## 2. Tech stack

### Backend
- **Python 3.11+** — FastAPI, Pydantic v2, Motor (async MongoDB), python-jose, passlib, tenacity
- **AI** — Anthropic Claude (primary) / OpenAI GPT (fallback)
- **ML** — XGBoost, NumPy, scikit-learn
- **Search** — Custom TF-IDF (zero heavy runtime deps)
- **Database** — MongoDB 7.x

### Frontend
- **React 18 + TypeScript** — Vite 7, Tailwind CSS 3
- **State** — Jotai (atoms)
- **Charts** — Recharts
- **Icons** — lucide-react

### Governance
- **Audit** — cryptographically-chained (SHA-256) append-only log
- **Auth** — JWT + bcrypt, role-based access control at the route level
- **Encryption** — AES-256-GCM at rest, TLS 1.3 in transit

## 3. Repository layout

```
RiskForge/
├── backend/
│   ├── server.py                 # FastAPI entry point
│   ├── auth.py                   # JWT + bcrypt + RBAC
│   ├── llm_service.py            # AI classification engine
│   ├── workflow_engine.py        # Power-Automate-style orchestrator
│   ├── rag_service.py            # TF-IDF RAG search
│   ├── ml_service.py             # XGBoost forecasting
│   ├── database.py               # MongoDB connection + indexes
│   ├── models.py                 # Pydantic schemas
│   ├── routes/
│   │   ├── complaints.py
│   │   ├── users.py
│   │   └── analytics.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/                # Full-screen views
│   │   ├── components/           # Reusable UI
│   │   ├── services/             # API service layer
│   │   ├── lib/                  # State (atoms) + data
│   │   ├── utils/                # cn() helper
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   ├── Architecture.md
│   ├── Workflow.md
│   └── API_Documentation.md
│
├── README.md
├── .gitignore
└── .env.example
```

## 4. Quick start

### 4.1 Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp ../.env.example .env
#   → fill MONGODB_URI, SECRET_KEY, ANTHROPIC_API_KEY

uvicorn server:app --host 0.0.0.0 --port 8000 --reload
# → API:   http://localhost:8000
# → Docs:  http://localhost:8000/docs
```

### 4.2 Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 4.3 Demo identities

| Email | Role |
|-------|------|
| `admin@riskforge.io` | ADMIN |
| `analyst@riskforge.io` | ANALYST |
| `manager@riskforge.io` | MANAGER |
| `compliance@riskforge.io` | COMPLIANCE |

## 5. How to run each phase

| Phase | Entry point |
|-------|-------------|
| **Ingestion** | `POST /api/complaints` (single) or `backend/llm_service.py::classify_batch()` (bulk) |
| **AI classification** | `POST /api/complaints/{id}/classify` |
| **Workflow routing** | `POST /api/complaints/{id}/workflow` (or automatic when `auto_classify: true` on ingestion) |
| **RAG search** | `POST /api/analytics/rag/search` |
| **ML forecasting** | `POST /api/analytics/ml/train` → `POST /api/analytics/ml/predict` |
| **Audit log** | `GET /api/analytics/audit-log` |
| **SLA breach job** | `POST /api/analytics/jobs/sla-breaches` (hourly cron) |

## 6. Architecture overview

```
  React UI (pages / components / services)
          │ HTTPS + JWT
          ▼
  FastAPI ─ routes (complaints, users, analytics)
          │
  ┌───────┼───────┬───────┬───────┬───────┐
  ▼       ▼       ▼       ▼       ▼       ▼
 auth   llm    workflow   rag     ml    audit
 (JWT) (Claude)(triage) (TF-IDF)(XGBoost)(SHA-256)
          │
          ▼
        MongoDB
  users · complaints · risk_assessments
  workflow_instances · audit_logs · forecasts
```

Full architecture document: [`docs/Architecture.md`](docs/Architecture.md).

## 7. Prompt specification (v1.0)

The AI classifier follows a strict structured-prompt contract:

- **System persona** — "financial risk compliance analyst specialising in consumer protection regulation"
- **User template** — injects `complaint_id`, `product`, and `narrative` into a fixed schema
- **Risk tier definitions** — Critical / High / Medium / Low with explicit keywords (fraud, identity theft, discrimin..., wrongful, legal threat, regulatory violations, billing disputes, communication failures, fee disputes, ...)
- **Output schema** — validated by Pydantic (`RiskAssessment`). JSON-only; rule-based fallback on LLM failure.
- **Failure modes** — short narratives (<20 words), ambiguous complaints, non-English text → confidence < 0.6 with human-in-the-loop flag.

## 8. Lessons learned / retrospective

What we'd change at scale:

1. **Streaming ingestion** — replace batch CSV uploads with a Kafka topic for real-time CFPB API ingestion (single-digit-second latency from ingestion → classification).
2. **Human-in-the-loop review** — low-confidence classifications (`confidence_score < 0.6`) are currently auto-flagged but not routed to a dedicated analyst queue. Add a "review" workflow stage.
3. **Multi-model routing** — Claude for Critical/High, cheaper GPT for Medium/Low. Expected cost savings: ~60%.
4. **Prompt CI** — add a golden-set eval (100 hand-labelled complaints) to block prompt regressions in CI. Measure recall vs. rule-only baseline on every commit.
5. **Fine-tuning** — once 10k+ human-reviewed classifications exist, fine-tune a smaller open model (Llama 3.1 70B) to run on-prem for sensitive data.
6. **Model monitoring** — production-grade PSI drift detection + prompt-hallucination guardrails.
7. **Cross-border data** — EU/US SCC already enforced; add a data-localisation flag for GDPR complaints.

## 9. Contributing

1. Fork the repo and create a feature branch from `main`.
2. Python: `ruff check backend/ && mypy backend/`
3. Frontend: `npm run lint && npm run build`
4. Open a PR; CI runs the golden-set eval + integration tests.

## 10. License

Proprietary — internal to the engagement.

---

*Version 1.0 · Author: Senior BA / AI Automation Engineer · Last reviewed: 2026-06-19*
