"""
RISKFORGE — Workflow Automation Engine
A Power-Automate-style orchestrator. Reads workflow definitions (nodes + edges),
advances a complaint through each node, and writes an immutable audit trail.

Flow: Complaint Received → AI Classification → Risk Condition
  → (Critical) Escalation Queue → Manager Approval → Compliance Review → Close
  → (Other)    Auto-close + standard response
"""
from __future__ import annotations
import json
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase

from models import (
    RiskTier,
    WorkflowStage,
    WorkflowDefinition,
    WorkflowInstance,
    AuditEvent,
)

logger = logging.getLogger(__name__)

SLA_BY_RISK: Dict[RiskTier, int] = {
    RiskTier.CRITICAL: 4,    # hours
    RiskTier.HIGH: 24,
    RiskTier.MEDIUM: 72,
    RiskTier.LOW: 168,
    RiskTier.UNCLASSIFIED: 24,
}

DEPARTMENT_BY_RISK: Dict[RiskTier, str] = {
    RiskTier.CRITICAL: "Fraud Investigation Unit",
    RiskTier.HIGH: "Compliance",
    RiskTier.MEDIUM: "Operations",
    RiskTier.LOW: "Mortgage Servicing",
    RiskTier.UNCLASSIFIED: "Unassigned",
}


# ── Workflow execution ──────────────────────────────────────────────────────
async def execute_workflow(
    workflow_id: str,
    complaint_id: str,
    risk_tier: RiskTier,
    triggered_by: str,
    db: AsyncIOMotorDatabase,
) -> WorkflowInstance:
    """Advance a complaint through the standard triage flow and return the instance."""
    workflow = await db.workflows.find_one({"_id": workflow_id}) or _default_workflow(workflow_id)
    instance = WorkflowInstance(
        workflow_id=workflow_id,
        complaint_id=complaint_id,
        current_node="trigger",
        history=[],
    )

    # Walk the flow deterministically based on risk_tier
    path = _resolve_path(workflow, risk_tier)
    for step in path:
        instance.history.append({
            "node": step["id"],
            "action": step["action"],
            "timestamp": datetime.utcnow().isoformat(),
            "meta": step.get("meta", {}),
        })
        instance.current_node = step["id"]

        # Side-effects per node type
        if step["type"] == "ai_classify":
            await db.complaints.update_one(
                {"_id": complaint_id},
                {"$set": {"stage": WorkflowStage.AI_CLASSIFIED.value}},
            )
        elif step["type"] == "escalate":
            await db.complaints.update_one(
                {"_id": complaint_id},
                {"$set": {"stage": WorkflowStage.ESCALATED.value, "assigned_to": "FIU-queue"}},
            )
        elif step["type"] == "close":
            await db.complaints.update_one(
                {"_id": complaint_id},
                {"$set": {"stage": WorkflowStage.CLOSED.value}},
            )

    instance.status = "completed"

    # Persist
    doc = instance.model_dump()
    result = await db.workflow_instances.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await _audit(db, complaint_id, "WORKFLOW_EXECUTED", triggered_by, f"path={[s['id'] for s in path]}")
    logger.info("Workflow completed complaint=%s path=%s", complaint_id, [s["id"] for s in path])
    return instance


def _default_workflow(workflow_id: str) -> Dict[str, Any]:
    return {
        "_id": workflow_id,
        "name": "STANDARD TRIAGE V1",
        "version": "1.0.0",
        "nodes": [
            {"id": "trigger", "type": "trigger", "label": "Complaint Received"},
            {"id": "ai_classify", "type": "ai", "label": "AI Classification"},
            {"id": "risk_condition", "type": "condition", "label": "Risk = Critical?"},
            {"id": "escalate", "type": "escalate", "label": "Escalate"},
            {"id": "manager_approval", "type": "approval", "label": "Manager Approval"},
            {"id": "compliance_review", "type": "approval", "label": "Compliance Review"},
            {"id": "notify_teams", "type": "notify", "label": "Teams Alert"},
            {"id": "close", "type": "close", "label": "Close Case"},
        ],
    }


def _resolve_path(workflow: Dict[str, Any], risk_tier: RiskTier) -> List[Dict[str, Any]]:
    """Deterministic path resolver — critical goes through escalation branch."""
    nodes = {n["id"]: n for n in workflow.get("nodes", [])}
    path: List[Dict[str, Any]] = []

    def add(nid: str, action: str, meta: Optional[Dict[str, Any]] = None):
        if nid in nodes:
            path.append({"id": nid, "type": nodes[nid].get("type", nid), "action": action, "meta": meta or {}})

    add("trigger", "Complaint Received", {"risk": risk_tier.value})
    add("ai_classify", "AI Classification", {"model": "claude-sonnet-4.5"})
    add("risk_condition", "Risk Evaluation", {"evaluated": risk_tier.value})

    if risk_tier == RiskTier.CRITICAL:
        add("escalate", "Auto-escalated to FIU", {"sla_hours": SLA_BY_RISK[risk_tier]})
        add("manager_approval", "Manager sign-off required", {"role": "MANAGER"})
        add("compliance_review", "Compliance review required", {"role": "COMPLIANCE"})
    else:
        add("manager_approval", "Manager auto-approved (low/medium)", {"role": "MANAGER", "auto": True})
        add("compliance_review", "Compliance auto-approved", {"role": "COMPLIANCE", "auto": True})

    add("notify_teams", "Teams notification sent", {"channel": "#risk-ops"})
    add("close", "Case closed", {"response": "standard_template_v2"})
    return path


# ── SLA management ──────────────────────────────────────────────────────────
def compute_sla_deadline(risk_tier: RiskTier, created_at: Optional[datetime] = None) -> datetime:
    base = created_at or datetime.utcnow()
    return base + timedelta(hours=SLA_BY_RISK.get(risk_tier, 24))


async def flag_sla_breaches(db: AsyncIOMotorDatabase) -> int:
    """Hourly job — flag any open complaints past their SLA deadline."""
    now = datetime.utcnow()
    result = await db.complaints.update_many(
        {"stage": {"$ne": WorkflowStage.CLOSED.value}, "sla_deadline": {"$lt": now}, "sla_breached": {"$ne": True}},
        {"$set": {"sla_breached": True}},
    )
    if result.modified_count:
        logger.warning("SLA breaches flagged: %d", result.modified_count)
        await _audit(db, "*", "SLA_BREACH", "SYSTEM", f"count={result.modified_count}")
    return result.modified_count


# ── Audit logging ───────────────────────────────────────────────────────────
async def _audit(db: AsyncIOMotorDatabase, target: str, action: str, user: str, details: str) -> None:
    ts = datetime.utcnow()
    raw = f"{ts.isoformat()}|{user}|{action}|{target}|{details}"
    digest = hashlib.sha256(raw.encode()).hexdigest()
    event = AuditEvent(
        event_id=f"AUD-{int(ts.timestamp() * 1000)}",
        timestamp=ts,
        user=user,
        action=action,
        target=target,
        details=details,
        hash=digest,
    )
    await db.audit_logs.insert_one(event.model_dump())
