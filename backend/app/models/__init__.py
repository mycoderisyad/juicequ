# Models module
# All SQLAlchemy models are imported here for Alembic to detect

from app.models.user import User, UserRole
from app.models.product import Product, ProductCategory, ProductSize
from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.cart import Cart, CartItem
from app.models.ai_interaction import AIInteraction, InteractionType, InteractionStatus
from app.models.settings import StoreSetting, DEFAULT_SETTINGS
from app.models.promo import ProductPromo, Voucher, VoucherUsage, PromoType, VoucherType

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
    # Settings
    "StoreSetting",
    "DEFAULT_SETTINGS",
    # Promo
    "ProductPromo",
    "Voucher",
    "VoucherUsage",
    "PromoType",
    "VoucherType",
]
