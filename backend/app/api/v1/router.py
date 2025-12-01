"""
API v1 Router - aggregates all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth

api_router = APIRouter()

# Health check for API v1
@api_router.get("/health")
async def api_health():
    """API v1 health check."""
    return {"status": "ok", "version": "v1"}


# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Future routers (uncomment as implemented):
# from app.api.v1.endpoints import users, products, orders, cart, ai
# api_router.include_router(users.router, prefix="/users", tags=["Users"])
# api_router.include_router(products.router, prefix="/products", tags=["Products"])
# api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
# api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
# api_router.include_router(ai.router, prefix="/ai", tags=["AI"])
