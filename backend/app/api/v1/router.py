"""
API v1 Router - aggregates all endpoint routers.
Organized by role: customer, cashier, admin.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, ai, currency, upload
from app.api.v1.endpoints.customer import router as customer_router
from app.api.v1.endpoints.cashier import router as cashier_router
from app.api.v1.endpoints.admin import router as admin_router

api_router = APIRouter()


# Health check for API v1
@api_router.get("/health")
async def api_health():
    """API v1 health check."""
    return {"status": "ok", "version": "v1"}


# Authentication (public)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# AI Assistant endpoints (public, optional auth)
api_router.include_router(ai.router, prefix="/ai", tags=["AI Assistant"])

# Currency exchange rates (public + admin)
api_router.include_router(currency.router, prefix="/currency", tags=["Currency"])

# File upload endpoints (authenticated, admin/kasir)
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])

# Customer endpoints (authenticated users)
api_router.include_router(customer_router, prefix="/customer")

# Cashier endpoints (kasir/admin only)
api_router.include_router(cashier_router, prefix="/cashier")

# Admin endpoints (admin only)
api_router.include_router(admin_router, prefix="/admin")
