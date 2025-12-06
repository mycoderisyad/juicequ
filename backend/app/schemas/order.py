"""
Order schemas for request/response validation.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# Enums
# =============================================================================

class OrderStatus(str, Enum):
    """Order status values."""
    PENDING = "pending"
    PAID = "paid"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentMethod(str, Enum):
    """Payment method values."""
    CASH = "cash"
    QRIS = "qris"
    TRANSFER = "transfer"


class ProductSize(str, Enum):
    """Product size values."""
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


# =============================================================================
# Order Item Schemas
# =============================================================================

class OrderItemCreate(BaseModel):
    """Schema for creating an order item."""
    product_id: str
    size: ProductSize = ProductSize.MEDIUM
    quantity: int = Field(..., ge=1, le=99)
    customizations: Optional[str] = None  # JSON string
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    """Schema for order item response."""
    id: str
    product_id: str
    product_name: str
    size: str
    quantity: int
    unit_price: float
    subtotal: float
    customizations: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Order Schemas
# =============================================================================

class OrderCreate(BaseModel):
    """Schema for creating an order."""
    items: list[OrderItemCreate] = Field(..., min_length=1)
    customer_notes: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CASH
    # For guest orders
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    # Pre-order scheduling
    is_preorder: bool = False
    scheduled_pickup_date: Optional[str] = None  # YYYY-MM-DD format
    scheduled_pickup_time: Optional[str] = None  # HH:MM format
    # Voucher
    voucher_id: Optional[str] = None
    voucher_code: Optional[str] = None
    voucher_discount: float = 0


class OrderUpdate(BaseModel):
    """Schema for updating an order (admin/kasir)."""
    status: Optional[OrderStatus] = None
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    internal_notes: Optional[str] = None


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: str
    order_number: str
    user_id: Optional[str] = None
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    status: OrderStatus
    subtotal: float
    discount: float
    tax: float
    total: float
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    paid_at: Optional[datetime] = None
    customer_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    # Pre-order info
    is_preorder: bool = False
    scheduled_pickup_date: Optional[datetime] = None
    scheduled_pickup_time: Optional[str] = None
    # Voucher info
    voucher_id: Optional[int] = None
    voucher_code: Optional[str] = None
    voucher_discount: float = 0
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class OrderListResponse(BaseModel):
    """Schema for order list response with pagination."""
    items: list[OrderResponse]
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1


# =============================================================================
# Order Status Update
# =============================================================================

class OrderStatusUpdate(BaseModel):
    """Schema for updating order status."""
    status: OrderStatus
    internal_notes: Optional[str] = None


# =============================================================================
# Order Summary (for analytics)
# =============================================================================

class OrderSummary(BaseModel):
    """Schema for order summary/statistics."""
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: float
    average_order_value: float
