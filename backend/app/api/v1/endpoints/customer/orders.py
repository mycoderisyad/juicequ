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
from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse
from app.services.order_service import OrderService

router = APIRouter()


class OrderItemRequest(BaseModel):
    """Schema for an order item."""
    product_id: str
    name: str
    price: float
    quantity: int
    size: str | None = Field("medium", description="Product size")


class CreateOrderRequest(BaseModel):
    """Request to create a new order."""
    items: list[OrderItemRequest] = Field(..., min_length=1, description="Order items")
    notes: str | None = Field(None, max_length=500, description="Special instructions")
    payment_method: str = Field("cash", description="Payment method")
    # Pre-order fields
    is_preorder: bool = Field(False, description="Whether this is a pre-order")
    scheduled_pickup_date: str | None = Field(None, description="Scheduled pickup date (YYYY-MM-DD)")
    scheduled_pickup_time: str | None = Field(None, description="Scheduled pickup time (HH:MM)")
    # Voucher fields
    voucher_id: str | None = Field(None, description="Voucher ID (UUID)")
    voucher_code: str | None = Field(None, description="Voucher code")
    voucher_discount: float = Field(0, description="Voucher discount amount")


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
    
    # Use database
    status_enum = None
    if status_filter:
        try:
            status_enum = OrderStatus(status_filter)
        except ValueError:
            pass
    
    orders, total = OrderService.get_user_orders(
        db,
        user_id=user.id,
        status=status_enum,
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
    request: CreateOrderRequest,
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
    
    # Use database - create order items
    try:
        from app.schemas.order import OrderCreate as OrderCreateSchema, OrderItemCreate, ProductSize
        
        # Map size string to ProductSize enum
        size_map = {
            "small": ProductSize.SMALL,
            "medium": ProductSize.MEDIUM,
            "large": ProductSize.LARGE,
        }
        
        order_items = [
            OrderItemCreate(
                product_id=item.product_id,
                quantity=item.quantity,
                size=size_map.get(item.size or "medium", ProductSize.MEDIUM),
            )
            for item in request.items
        ]
        
        # Map payment method
        payment_method_map = {
            "cash": "cash",
            "qris": "qris",
            "transfer": "transfer",
            "digital": "qris",
            "card": "transfer",
        }
        mapped_payment = payment_method_map.get(request.payment_method, "cash")
        
        order_data = OrderCreateSchema(
            items=order_items,
            customer_notes=request.notes,
            payment_method=mapped_payment,
            # Pre-order fields
            is_preorder=request.is_preorder,
            scheduled_pickup_date=request.scheduled_pickup_date,
            scheduled_pickup_time=request.scheduled_pickup_time,
            # Voucher fields
            voucher_id=request.voucher_id,
            voucher_code=request.voucher_code,
            voucher_discount=request.voucher_discount,
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
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order creation failed: {str(e)}"
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
