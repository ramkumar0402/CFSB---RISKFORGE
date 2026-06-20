"""
RISKFORGE — Main FastAPI application
Entry point for the API layer. Wires together auth, data, AI, workflows, RAG, ML.

Run:
    uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""
from __future__ import annotations
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from database import ensure_indexes, close_connection
from models import HealthResponse, ErrorResponse
from routes import complaints_router, users_router, analytics_router

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("riskforge")


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("RISKFORGE starting up")
    await ensure_indexes()
    yield
    await close_connection()
    logger.info("RISKFORGE shut down")


# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="RISKFORGE API",
    description="AI-powered CFPB complaint risk triage & workflow automation.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Error handlers ───────────────────────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": getattr(exc, "error_code", None)},
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation failed", "errors": exc.errors()},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "code": "INTERNAL_ERROR"},
    )


# ── Routes ──────────────────────────────────────────────────────────────────
@app.get("/api/health", response_model=HealthResponse, tags=["system"])
async def health():
    return HealthResponse()


@app.get("/", tags=["system"])
async def root():
    return {
        "name": "RISKFORGE",
        "tagline": "Triage. Decide. Govern.",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "/api/users/*",
            "/api/complaints/*",
            "/api/analytics/*",
        ],
    }


app.include_router(users_router)
app.include_router(complaints_router)
app.include_router(analytics_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "true").lower() == "true",
    )
