"""RISKFORGE — route package."""
from .complaints import router as complaints_router
from .users import router as users_router
from .analytics import router as analytics_router

__all__ = ["complaints_router", "users_router", "analytics_router"]
