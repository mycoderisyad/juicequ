"""Order schemas for request/response validation."""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


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


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status."""
    status: OrderStatus
    internal_notes: Optional[str] = None


class OrderSummary(BaseModel):
    """Schema for order summary/statistics."""
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: float
    average_order_value: float


class CustomerOrderItemRequest(BaseModel):
    """Schema for an order item from customer."""
    product_id: str
    name: str
    price: float
    quantity: int
    size: str | None = Field("medium")


class CustomerOrderCreate(BaseModel):
    """Request to create a new order from customer."""
    items: list[CustomerOrderItemRequest] = Field(..., min_length=1)
    notes: str | None = Field(None, max_length=500)
    payment_method: str = Field("cash")
    is_preorder: bool = Field(False)
    scheduled_pickup_date: str | None = Field(None)
    scheduled_pickup_time: str | None = Field(None)
    voucher_id: str | None = Field(None)
    voucher_code: str | None = Field(None)
    voucher_discount: float = Field(0)


class WalkInOrderItemRequest(BaseModel):
    """Request for a single item in walk-in order."""
    product_id: str = Field(...)
    quantity: int = Field(1, ge=1, le=99)
    size: str = Field("medium")
    notes: Optional[str] = Field(None, max_length=200)


class WalkInOrderCreate(BaseModel):
    """Request to create a walk-in order (direct purchase at store)."""
    items: list[WalkInOrderItemRequest] = Field(..., min_length=1)
    customer_name: Optional[str] = Field(None, max_length=100)
    customer_phone: Optional[str] = Field(None, max_length=20)
    payment_method: str = Field("cash")
    notes: Optional[str] = Field(None, max_length=500)


class CashierOrderStatusUpdate(BaseModel):
    """Request to update order status from cashier."""
    status: str = Field(...)
    notes: str | None = Field(None, max_length=500)
