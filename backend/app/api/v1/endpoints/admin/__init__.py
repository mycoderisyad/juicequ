"""
Admin endpoints package.
Handles all administrative functionality.
"""
from fastapi import APIRouter

from app.api.v1.endpoints.admin import users, products, categories, analytics, settings, upload

router = APIRouter()

router.include_router(users.router, prefix="/users", tags=["Admin - Users"])
router.include_router(products.router, prefix="/products", tags=["Admin - Products"])
router.include_router(categories.router, prefix="/categories", tags=["Admin - Categories"])
router.include_router(analytics.router, prefix="/analytics", tags=["Admin - Analytics"])
router.include_router(settings.router, prefix="/settings", tags=["Admin - Settings"])
router.include_router(upload.router, prefix="/upload", tags=["Admin - Upload"])