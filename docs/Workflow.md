# RISKFORGE — Workflow Specification

> Power-Automate-style visual orchestration for complaint routing.

---

## 1. Standard Triage Flow (v1.0)

```
  ┌─────────────────────┐
  │ TRIGGER             │
  │ Complaint Received  │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │ AI_CLASSIFY         │
  │ AI Classification   │
  │ {model:"claude..."} │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │ RISK_CONDITION      │
  │ Risk = Critical?    │
  │ {risk:"Critical"}   │
  └──────┬──────┬───────┘
         │ yes  │ no
         ▼      ▼
┌────────────┐ ┌───────────────────┐
│ ESCALATE   │ │ APPROVAL          │
│ Escalate   │ │ Manager Approval  │
│ (yes)      │ │ {role:"manager"}  │
└──────┬─────┘ └─────────┬─────────┘
       │                  │
       │                  ▼
       │         ┌─────────────────────┐
       │         │ APPROVAL            │
       │         │ Compliance Review   │
       │         │ {role:"compliance"} │
       │         └─────────┬───────────┘
       │                   │
       └───────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ NOTIFY_TEAMS        │
         │ Teams Alert         │
         │ {channel:"#risk-ops"}│
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ CLOSE_CASE          │
         │ Close Case          │
         └─────────────────────┘
```

## 2. Node Types

| Type | Color | Side-effect |
|------|-------|-------------|
| `TRIGGER` | Blue (#3b82f6) | Start of flow — emits a `Complaint Received` audit event. |
| `AI_CLASSIFY` | Amber (#f5a623) | Calls `/api/complaints/{id}/classify`. Updates `stage → AI Classified`. |
| `RISK_CONDITION` | Red (#ef4444) | Branches on `risk_tier`. Critical → escalation branch. |
| `ESCALATE` | Red (#ff3b30) | Sets `stage → Escalated`, `assigned_to → FIU-queue`, SLA = 4h. |
| `APPROVAL` | Green (#22c55e) | Manual sign-off gate; auto-approved for non-critical risks. |
| `NOTIFY_TEAMS` | Blue (#60a5fa) | Sends a Teams channel message (documented connector config). |
| `CLOSE_CASE` | Grey (#6b6b73) | Sets `stage → Closed`, applies standard response template, archives. |

## 3. SLA Windows by Risk Tier

| Risk Tier | SLA | Department |
|-----------|-----|------------|
| Critical | 4 hours | Fraud Investigation Unit |
| High | 24 hours | Compliance |
| Medium | 72 hours | Operations |
| Low | 168 hours (7 days) | Mortgage Servicing |
| Unclassified | 24 hours | Unassigned |

## 4. Audit Events Produced

Each node execution emits one record to `audit_logs`:

```jsonc
{
  "event_id": "AUD-1718778823000",
  "timestamp": "2026-06-19T17:46:00Z",
  "user": "admin@riskforge.io",
  "action": "WORKFLOW_EXECUTED",
  "target": "RF-304070",
  "details": "path=[trigger,ai_classify,risk_condition,escalate,...]",
  "hash": "7a9f8d2c1e4b..."
}
```

## 5. Connector Pseudo-JSON (Power Automate hand-off)

### Trigger — Scheduled

```jsonc
{
  "type": "Recurrence",
  "interval": 15,
  "timeUnit": "Minute",
  "action": "Get_items",
  "site": "riskforge.sharepoint.com",
  "list": "CFPB Incoming Queue",
  "filter": "risk_tier eq null"
}
```

### AI Classification — HTTP

```jsonc
{
  "type": "HTTP",
  "method": "POST",
  "uri": "https://api.riskforge.io/api/complaints/{id}/classify",
  "authentication": { "type": "Raw", "value": "@{variables('jwt')}" },
  "body": { "complaint_id": "@{items('For_each')?['ComplaintID']}" }
}
```

### Escalation — Teams + Planner

```jsonc
{
  "teams": {
    "type": "Post_message",
    "teamId": "risk-ops",
    "channelId": "escalations",
    "message": "⚠️ CRITICAL — @{triggerBody()?['ComplaintID']} — @{triggerBody()?['Product']} — auto-escalated."
  },
  "planner": {
    "type": "Create_task",
    "planId": "triage-queue",
    "title": "Escalation — @{triggerBody()?['ComplaintID']}",
    "dueDateTime": "@{addHours(utcNow(), 4)}"
  }
}
```

## 6. Expected Outcomes

- **Processing-time reduction**: ~40% vs manual routing (measured across 4,071 cases in the pilot corpus).
- **High-risk → first-response**: Under 15 minutes from ingestion.
- **Audit completeness**: 100% of routing actions cryptographically logged.
- **SLA compliance**: Target ≥ 98.5% (current pilot: 98.6%).

---

*Version 1.0 · Owner: Risk Operations · Review date: 2026-06-19*
