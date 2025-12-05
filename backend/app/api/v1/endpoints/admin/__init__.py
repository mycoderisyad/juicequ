"""
Admin endpoints package.
Handles all administrative functionality.
"""
from fastapi import APIRouter

from app.api.v1.endpoints.admin import users, products, categories, analytics, settings, upload, orders, promos, vouchers

router = APIRouter()

router.include_router(users.router, prefix="/users", tags=["Admin - Users"])
router.include_router(products.router, prefix="/products", tags=["Admin - Products"])
router.include_router(categories.router, prefix="/categories", tags=["Admin - Categories"])
router.include_router(analytics.router, prefix="/analytics", tags=["Admin - Analytics"])
router.include_router(settings.router, prefix="/settings", tags=["Admin - Settings"])
router.include_router(upload.router, prefix="/upload", tags=["Admin - Upload"])
router.include_router(orders.router, prefix="/orders", tags=["Admin - Orders"])
router.include_router(promos.router, prefix="/promos", tags=["Admin - Promos"])
router.include_router(vouchers.router, prefix="/vouchers", tags=["Admin - Vouchers"])