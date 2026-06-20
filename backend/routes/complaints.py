"""
RISKFORGE — Complaints API routes
CRUD + AI classification + workflow trigger endpoints.
"""
from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from database import get_db
from auth import get_current_user, require_role
from models import (
    UserRole,
    ComplaintIn,
    ComplaintOut,
    RiskAssessment,
    WorkflowInstance,
    Product,
    RiskTier,
    WorkflowStage,
)
from llm_service import classify_complaint
from workflow_engine import execute_workflow, compute_sla_deadline

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


def _serialize(doc: dict) -> ComplaintOut:
    return ComplaintOut(
        id=str(doc["_id"]),
        product=Product(doc.get("product", "Other")),
        issue=doc.get("issue", ""),
        company=doc.get("company"),
        state=doc.get("state"),
        risk=RiskTier(doc.get("risk", "Unclassified")),
        stage=WorkflowStage(doc.get("stage", "Received")),
        narrative=doc.get("narrative", ""),
        confidence=doc.get("confidence"),
        created_at=doc.get("created_at", datetime.utcnow()),
        assigned_to=doc.get("assigned_to"),
    )


@router.get("", response_model=List[ComplaintOut])
async def list_complaints(
    risk: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    product: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict = {}
    if risk:
        query["risk"] = risk
    if stage:
        query["stage"] = stage
    if product:
        query["product"] = product
    if search:
        query["$text"] = {"$search": search}

    cursor = db.complaints.find(query).sort("created_at", -1).skip(offset).limit(limit)
    return [_serialize(doc) async for doc in cursor]


@router.get("/{complaint_id}", response_model=ComplaintOut)
async def get_complaint(
    complaint_id: str,
    _user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found")
    return _serialize(doc)


@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintIn,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = payload.model_dump()
    doc["created_at"] = datetime.utcnow()
    doc["risk"] = RiskTier.UNCLASSIFIED.value
    doc["stage"] = WorkflowStage.RECEIVED.value
    doc["created_by"] = user["email"]
    doc["sla_deadline"] = compute_sla_deadline(RiskTier.UNCLASSIFIED, doc["created_at"])

    result = await db.complaints.insert_one(doc)
    doc["_id"] = result.inserted_id

    if payload.auto_classify:
        assessment = await classify_complaint(
            complaint_id=str(result.inserted_id),
            product=payload.product.value,
            narrative=payload.narrative,
        )
        await db.risk_assessments.insert_one(assessment.model_dump())
        await db.complaints.update_one(
            {"_id": result.inserted_id},
            {
                "$set": {
                    "risk": assessment.risk_tier.value,
                    "confidence": assessment.confidence_score,
                    "stage": WorkflowStage.AI_CLASSIFIED.value,
                }
            },
        )
        await execute_workflow(
            workflow_id="standard_triage_v1",
            complaint_id=str(result.inserted_id),
            risk_tier=assessment.risk_tier,
            triggered_by=user["email"],
            db=db,
        )
        doc["risk"] = assessment.risk_tier.value
        doc["confidence"] = assessment.confidence_score
        doc["stage"] = WorkflowStage.AI_CLASSIFIED.value

    return _serialize(doc)


@router.post("/{complaint_id}/classify", response_model=RiskAssessment)
async def classify(
    complaint_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found")

    assessment = await classify_complaint(
        complaint_id=complaint_id,
        product=doc.get("product", "Other"),
        narrative=doc["narrative"],
    )
    await db.risk_assessments.replace_one(
        {"complaint_id": complaint_id},
        assessment.model_dump(),
        upsert=True,
    )
    await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": {"risk": assessment.risk_tier.value, "confidence": assessment.confidence_score, "stage": WorkflowStage.AI_CLASSIFIED.value}},
    )
    return assessment


@router.post("/{complaint_id}/workflow", response_model=WorkflowInstance)
async def trigger_workflow(
    complaint_id: str,
    user: dict = Depends(require_role(UserRole.MANAGER, UserRole.ADMIN)),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found")

    return await execute_workflow(
        workflow_id="standard_triage_v1",
        complaint_id=complaint_id,
        risk_tier=RiskTier(doc.get("risk", "Unclassified")),
        triggered_by=user["email"],
        db=db,
    )


@router.delete("/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_complaint(
    complaint_id: str,
    _user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    result = await db.complaints.delete_one({"_id": ObjectId(complaint_id)})
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found")
