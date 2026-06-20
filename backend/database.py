"""
RISKFORGE — MongoDB connection layer
Uses Motor for async operations. Collections are typed via Pydantic models.
"""
from __future__ import annotations
import os
import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

logger = logging.getLogger(__name__)

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def get_client() -> AsyncIOMotorClient:
    """Return the singleton MongoDB client."""
    global _client
    if _client is None:
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        _client = AsyncIOMotorClient(
            uri,
            maxPoolSize=50,
            minPoolSize=5,
            serverSelectionTimeoutMS=5000,
        )
        logger.info("MongoDB client initialised")
    return _client


def get_db() -> AsyncIOMotorDatabase:
    """Return the application database."""
    global _db
    if _db is None:
        _db = get_client()[os.getenv("MONGODB_DB", "riskforge")]
    return _db


async def ensure_indexes() -> None:
    """Create the compound indexes needed for query performance."""
    db = get_db()

    # users
    await db.users.create_index([("email", ASCENDING)], unique=True)
    await db.users.create_index([("role", ASCENDING)])

    # complaints
    await db.complaints.create_index([("created_at", DESCENDING)])
    await db.complaints.create_index([("risk", ASCENDING), ("created_at", DESCENDING)])
    await db.complaints.create_index([("product", ASCENDING)])
    await db.complaints.create_index([("stage", ASCENDING)])
    await db.complaints.create_index(
        [("narrative", "text")],
        name="narrative_text_idx",
    )

    # risk_assessments
    await db.risk_assessments.create_index([("complaint_id", ASCENDING)], unique=True)
    await db.risk_assessments.create_index([("risk_tier", ASCENDING)])

    # workflow_instances
    await db.workflow_instances.create_index([("complaint_id", ASCENDING)])
    await db.workflow_instances.create_index([("status", ASCENDING)])

    # audit_logs — append-only, time-series
    await db.audit_logs.create_index([("timestamp", DESCENDING)])
    await db.audit_logs.create_index([("user", ASCENDING), ("timestamp", DESCENDING)])
    await db.audit_logs.create_index([("action", ASCENDING)])

    # forecasts
    await db.forecasts.create_index([("created_at", DESCENDING)])

    logger.info("MongoDB indexes ensured")


async def close_connection() -> None:
    """Gracefully close the MongoDB client on shutdown."""
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB client closed")
