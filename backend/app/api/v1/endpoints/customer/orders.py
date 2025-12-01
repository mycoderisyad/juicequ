"""
Customer Orders API.
Place orders and view order history.
"""
from datetime import datetime
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import CurrentUser
from app.models.user import User

router = APIRouter()


class OrderItem(BaseModel):
    """Schema for an order item."""
    product_id: int
    name: str
    price: float
    quantity: int


class CreateOrderRequest(BaseModel):
    """Request to create a new order."""
    items: list[OrderItem] = Field(..., min_length=1, description="Order items")
    notes: str | None = Field(None, max_length=500, description="Special instructions")
    payment_method: str = Field("cash", description="Payment method")


class OrderStatus:
    """Order status constants."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# In-memory order storage (will be replaced with database)
ORDERS: dict[str, list[dict]] = {}


@router.get(
    "",
    summary="Get my orders",
    description="Get current user's order history.",
)
async def get_my_orders(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    status: str | None = None,
):
    """Get the current user's orders."""
    user = current_user
    if not isinstance(user, User):
        return {"orders": [], "total": 0}
    
    user_orders = ORDERS.get(user.id, [])
    
    # Filter by status if provided
    if status:
        user_orders = [
            order for order in user_orders 
            if order["status"] == status
        ]
    
    # Sort by date (newest first)
    user_orders = sorted(
        user_orders, 
        key=lambda x: x["created_at"], 
        reverse=True
    )
    
    return {
        "orders": user_orders,
        "total": len(user_orders),
    }


@router.post(
    "",
    summary="Create order",
    description="Create a new order from cart or direct items.",
)
async def create_order(
    request: CreateOrderRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Create a new order."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    # Initialize orders list if not exists
    if user.id not in ORDERS:
        ORDERS[user.id] = []
    
    # Calculate total
    subtotal = sum(item.price * item.quantity for item in request.items)
    tax = subtotal * 0.1  # 10% tax
    total = subtotal + tax
    
    # Create order
    order = {
        "id": str(uuid4())[:8].upper(),
        "user_id": user.id,
        "items": [item.model_dump() for item in request.items],
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "total": round(total, 2),
        "status": OrderStatus.PENDING,
        "notes": request.notes,
        "payment_method": request.payment_method,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    
    ORDERS[user.id].append(order)
    
    # Clear cart after order (if using cart storage)
    from app.api.v1.endpoints.customer.cart import CARTS
    if user.id in CARTS:
        CARTS[user.id] = []
    
    return {
        "message": "Order placed successfully",
        "order": order,
        "success": True,
    }


@router.get(
    "/{order_id}",
    summary="Get order details",
    description="Get details of a specific order.",
)
async def get_order(
    order_id: str,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Get details of a specific order."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    user_orders = ORDERS.get(user.id, [])
    order = next(
        (order for order in user_orders if order["id"] == order_id),
        None
    )
    
    if not order:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Order", order_id)
    
    return order


@router.post(
    "/{order_id}/cancel",
    summary="Cancel order",
    description="Cancel a pending order.",
)
async def cancel_order(
    order_id: str,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Cancel a pending order."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    user_orders = ORDERS.get(user.id, [])
    order = next(
        (order for order in user_orders if order["id"] == order_id),
        None
    )
    
    if not order:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Order", order_id)
    
    # Only pending orders can be cancelled
    if order["status"] != OrderStatus.PENDING:
        from app.core.exceptions import BadRequestException
        raise BadRequestException("Only pending orders can be cancelled")
    
    order["status"] = OrderStatus.CANCELLED
    order["updated_at"] = datetime.now().isoformat()
    
    return {
        "message": "Order cancelled successfully",
        "order": order,
        "success": True,
    }
