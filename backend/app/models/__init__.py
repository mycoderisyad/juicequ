# Models module
# All SQLAlchemy models are imported here for Alembic to detect

from app.models.user import User, UserRole
from app.models.product import Product, ProductCategory, ProductSize
from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.cart import Cart, CartItem
from app.models.ai_interaction import AIInteraction, InteractionType, InteractionStatus

__all__ = [
    # User
    "User",
    "UserRole",
    # Product
    "Product",
    "ProductCategory",
    "ProductSize",
    # Order
    "Order",
    "OrderItem",
    "OrderStatus",
    "PaymentMethod",
    # Cart
    "Cart",
    "CartItem",
    # AI
    "AIInteraction",
    "InteractionType",
    "InteractionStatus",
]
