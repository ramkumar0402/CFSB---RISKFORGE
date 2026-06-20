"""
RISKFORGE — Pydantic schemas (v2)
Defines the data contracts flowing between layers.
"""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ── Enums ──────────────────────────────────────────────────────────────────
class RiskTier(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    UNCLASSIFIED = "Unclassified"


class WorkflowStage(str, Enum):
    RECEIVED = "Received"
    AI_CLASSIFIED = "AI Classified"
    ESCALATED = "Escalated"
    ASSIGNED = "Assigned"
    CLOSED = "Closed"


class Product(str, Enum):
    BANKING = "Banking"
    CREDIT_CARD = "Credit Card"
    MORTGAGE = "Mortgage"
    DEBT_COLLECTION = "Debt Collection"
    STUDENT_LOAN = "Student Loan"
    PERSONAL_LOAN = "Personal Loan"
    MONEY_TRANSFER = "Money Transfer"
    OTHER = "Other"


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    MANAGER = "MANAGER"
    COMPLIANCE = "COMPLIANCE"
    AI_AGENT = "AI-AGENT"


# ── Auth ───────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.ANALYST


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    expires_in: int = 3600


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: EmailStr
    role: UserRole
    status: str = "Active"
    last_active: Optional[datetime] = None


# ── Complaints ─────────────────────────────────────────────────────────────
class ComplaintIn(BaseModel):
    product: Product
    sub_product: Optional[str] = None
    issue: str
    company: Optional[str] = None
    state: Optional[str] = None
    channel: str = "Web"
    narrative: str = Field(..., min_length=10)
    auto_classify: bool = True


class RiskAssessment(BaseModel):
    complaint_id: str
    risk_tier: RiskTier
    risk_rationale: str
    product_category: Product
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    escalation_flag: bool
    sentiment: Optional[str] = None
    fraud_signals: Optional[List[str]] = None
    department: Optional[str] = None
    model_version: str = "claude-sonnet-4.5-20250929"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product: Product
    issue: str
    company: Optional[str] = None
    state: Optional[str] = None
    risk: RiskTier = RiskTier.UNCLASSIFIED
    stage: WorkflowStage = WorkflowStage.RECEIVED
    narrative: str
    confidence: Optional[float] = None
    created_at: datetime
    assigned_to: Optional[str] = None


# ── Workflows ──────────────────────────────────────────────────────────────
class WorkflowNode(BaseModel):
    id: str
    type: str  # trigger | ai | condition | approval | escalate | notify | close
    label: str
    config: Dict[str, Any] = Field(default_factory=dict)


class WorkflowDefinition(BaseModel):
    id: Optional[str] = None
    name: str
    version: str = "1.0.0"
    nodes: List[WorkflowNode]
    edges: List[Dict[str, Any]] = Field(default_factory=list)
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WorkflowInstance(BaseModel):
    id: Optional[str] = None
    workflow_id: str
    complaint_id: str
    current_node: str
    history: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = "running"
    started_at: datetime = Field(default_factory=datetime.utcnow)


# ── RAG ────────────────────────────────────────────────────────────────────
class RAGQuery(BaseModel):
    query: str = Field(..., min_length=3)
    top_k: int = 8


class RAGHit(BaseModel):
    complaint_id: str
    product: Product
    company: Optional[str] = None
    narrative: str
    similarity: float


class RAGResponse(BaseModel):
    query: str
    hits: List[RAGHit]
    total_hits: int


# ── Forecasting ────────────────────────────────────────────────────────────
class ForecastRequest(BaseModel):
    target: str = "resolution_time"  # resolution_time | volume
    complaint_id: Optional[str] = None


class ForecastResponse(BaseModel):
    target: str
    prediction: float
    confidence_low: float
    confidence_high: float
    model_status: str
    feature_importance: Optional[Dict[str, float]] = None


# ── Audit ──────────────────────────────────────────────────────────────────
class AuditEvent(BaseModel):
    event_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user: str
    action: str
    target: Optional[str] = None
    details: Optional[str] = None
    hash: str


# ── Generic ────────────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
