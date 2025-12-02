"""
Customer Orders API.
Place orders and view order history.
"""
from datetime import datetime
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import CurrentUser
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse
from app.services.order_service import OrderService

router = APIRouter()


# Fallback in-memory storage (for development without database connection)
ORDERS: dict[str, list[dict]] = {}


class OrderItem(BaseModel):
    """Schema for an order item (legacy support)."""
    product_id: str
    name: str
    price: float
    quantity: int


class CreateOrderRequestLegacy(BaseModel):
    """Request to create a new order (legacy format)."""
    items: list[OrderItem] = Field(..., min_length=1, description="Order items")
    notes: str | None = Field(None, max_length=500, description="Special instructions")
    payment_method: str = Field("cash", description="Payment method")


class OrderStatusConst:
    """Order status constants."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


def _use_in_memory_storage() -> bool:
    """Check if we should use in-memory storage (development mode)."""
    # For now, always use in-memory storage until database is seeded
    return True


@router.get(
    "",
    summary="Get my orders",
    description="Get current user's order history.",
)
async def get_my_orders(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get the current user's orders."""
    user = current_user
    if not isinstance(user, User):
        return {"orders": [], "total": 0}
    
    if _use_in_memory_storage():
        user_orders = ORDERS.get(user.id, [])
        
        # Filter by status if provided
        if status_filter:
            user_orders = [
                order for order in user_orders 
                if order["status"] == status_filter
            ]
        
        # Sort by date (newest first)
        user_orders = sorted(
            user_orders, 
            key=lambda x: x["created_at"], 
            reverse=True
        )
        
        # Pagination
        total = len(user_orders)
        start = (page - 1) * page_size
        end = start + page_size
        items = user_orders[start:end]
        
        return {
            "orders": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
        }
    
    # Use database
    orders, total = OrderService.get_user_orders(
        db,
        user_id=user.id,
        status=status_filter,
        page=page,
        page_size=page_size,
    )
    
    return {
        "orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "status": o.status.value,
                "subtotal": o.subtotal,
                "tax": o.tax,
                "total": o.total,
                "payment_method": o.payment_method.value if o.payment_method else None,
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "product_name": item.product_name,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "subtotal": item.subtotal,
                    }
                    for item in o.items
                ],
                "created_at": o.created_at.isoformat(),
                "updated_at": o.updated_at.isoformat(),
            }
            for o in orders
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
    }


@router.post(
    "",
    summary="Create order",
    description="Create a new order from cart or direct items.",
)
async def create_order(
    request: CreateOrderRequestLegacy,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Create a new order."""
    user = current_user
    if not isinstance(user, User):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to place an order"
        )
    
    if _use_in_memory_storage():
        # Initialize orders list if not exists
        if user.id not in ORDERS:
            ORDERS[user.id] = []
        
        # Calculate total
        subtotal = sum(item.price * item.quantity for item in request.items)
        tax = subtotal * 0.1  # 10% tax
        total = subtotal + tax
        
        # Generate order number
        date_part = datetime.now().strftime("%y%m%d")
        order_num = f"JQ-{date_part}-{str(uuid4())[:4].upper()}"
        
        # Create order
        order = {
            "id": order_num,
            "order_number": order_num,
            "user_id": user.id,
            "items": [item.model_dump() for item in request.items],
            "subtotal": round(subtotal, 2),
            "tax": round(tax, 2),
            "total": round(total, 2),
            "status": OrderStatusConst.PENDING,
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
    
    # Use database - convert legacy format to new format
    try:
        from app.schemas.order import OrderCreate as OrderCreateSchema, OrderItemCreate, ProductSize
        
        order_items = [
            OrderItemCreate(
                product_id=item.product_id,
                quantity=item.quantity,
                size=ProductSize.MEDIUM,
            )
            for item in request.items
        ]
        
        order_data = OrderCreateSchema(
            items=order_items,
            customer_notes=request.notes,
        )
        
        order = OrderService.create_order(db, order_data, user)
        
        return {
            "message": "Order placed successfully",
            "order": {
                "id": order.id,
                "order_number": order.order_number,
                "status": order.status.value,
                "subtotal": order.subtotal,
                "tax": order.tax,
                "total": order.total,
                "items": [
                    {
                        "product_id": item.product_id,
                        "name": item.product_name,
                        "quantity": item.quantity,
                        "price": item.unit_price,
                    }
                    for item in order.items
                ],
                "created_at": order.created_at.isoformat(),
            },
            "success": True,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if _use_in_memory_storage():
        user_orders = ORDERS.get(user.id, [])
        order = next(
            (order for order in user_orders if order["id"] == order_id),
            None
        )
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {order_id} not found"
            )
        
        return order
    
    # Use database
    order = OrderService.get_order_by_id(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )
    
    # Verify order belongs to user
    if order.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this order"
        )
    
    return {
        "id": order.id,
        "order_number": order.order_number,
        "status": order.status.value,
        "subtotal": order.subtotal,
        "discount": order.discount,
        "tax": order.tax,
        "total": order.total,
        "payment_method": order.payment_method.value if order.payment_method else None,
        "customer_notes": order.customer_notes,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "size": item.size,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
                "notes": item.notes,
            }
            for item in order.items
        ],
        "created_at": order.created_at.isoformat(),
        "updated_at": order.updated_at.isoformat(),
    }


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if _use_in_memory_storage():
        user_orders = ORDERS.get(user.id, [])
        order = next(
            (order for order in user_orders if order["id"] == order_id),
            None
        )
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {order_id} not found"
            )
        
        # Only pending orders can be cancelled
        if order["status"] != OrderStatusConst.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending orders can be cancelled"
            )
        
        order["status"] = OrderStatusConst.CANCELLED
        order["updated_at"] = datetime.now().isoformat()
        
        return {
            "message": "Order cancelled successfully",
            "order": order,
            "success": True,
        }
    
    # Use database
    order = OrderService.get_order_by_id(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )
    
    # Verify order belongs to user
    if order.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to cancel this order"
        )
    
    try:
        cancelled_order = OrderService.cancel_order(db, order_id, "Cancelled by customer")
        return {
            "message": "Order cancelled successfully",
            "order": {
                "id": cancelled_order.id,
                "order_number": cancelled_order.order_number,
                "status": cancelled_order.status.value,
            },
            "success": True,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
