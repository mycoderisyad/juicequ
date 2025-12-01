"""
Customer endpoints package.
Handles all customer-facing functionality.
"""
from fastapi import APIRouter

from app.api.v1.endpoints.customer import products, cart, orders, profile

router = APIRouter()

router.include_router(products.router, prefix="/products", tags=["Customer - Products"])
router.include_router(cart.router, prefix="/cart", tags=["Customer - Cart"])
router.include_router(orders.router, prefix="/orders", tags=["Customer - Orders"])
router.include_router(profile.router, prefix="/profile", tags=["Customer - Profile"])