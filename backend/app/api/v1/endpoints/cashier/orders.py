"""
Cashier Orders API.
Process and manage incoming orders.
"""
from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus as DbOrderStatus
from app.services.order_service import OrderService
from app.schemas.order import OrderStatusUpdate, OrderCreate, OrderItemCreate, ProductSize, PaymentMethod

router = APIRouter()


class WalkInOrderItemRequest(BaseModel):
    """Request for a single item in walk-in order."""
    product_id: str = Field(..., description="Product ID")
    quantity: int = Field(1, ge=1, le=99, description="Quantity")
    size: str = Field("medium", description="Product size: small, medium, large")
    notes: Optional[str] = Field(None, max_length=200, description="Item notes")


class CreateWalkInOrderRequest(BaseModel):
    """Request to create a walk-in order (direct purchase at store)."""
    items: list[WalkInOrderItemRequest] = Field(..., min_length=1, description="Order items")
    customer_name: Optional[str] = Field(None, max_length=100, description="Customer name (optional)")
    customer_phone: Optional[str] = Field(None, max_length=20, description="Customer phone (optional)")
    payment_method: str = Field("cash", description="Payment method: cash, qris, transfer")
    notes: Optional[str] = Field(None, max_length=500, description="Order notes")


class UpdateOrderStatusRequest(BaseModel):
    """Request to update order status."""
    status: str = Field(..., description="New order status")
    notes: str | None = Field(None, max_length=500, description="Staff notes")


# Valid status transitions
VALID_TRANSITIONS = {
    "pending": ["paid", "cancelled"],
    "paid": ["preparing", "cancelled"],
    "preparing": ["ready", "cancelled"],
    "ready": ["completed"],
    "completed": [],
    "cancelled": [],
}


def order_to_dict(order: Order) -> dict:
    """Convert Order model to dict format."""
    return {
        "id": order.id,
        "order_number": order.order_number,
        "user_id": order.user_id,
        "status": order.status.value,
        "subtotal": order.subtotal,
        "tax": order.tax,
        "total": order.total,
        "payment_method": order.payment_method.value if order.payment_method else None,
        "customer_notes": order.customer_notes,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ],
        "created_at": order.created_at.isoformat(),
        "updated_at": order.updated_at.isoformat(),
    }


@router.get(
    "",
    summary="Get all orders",
    description="Get all orders (for cashier/admin).",
)
async def get_orders(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
    status: str | None = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
):
    """Get all orders for processing."""
    # Convert status string to enum if provided
    status_enum = None
    if status:
        try:
            status_enum = DbOrderStatus(status)
        except ValueError:
            pass
    
    orders, total = OrderService.get_all_orders(
        db,
        status=status_enum,
        page=1,
        page_size=limit
    )
    
    return {
        "orders": [order_to_dict(order) for order in orders],
        "total": total,
    }


@router.get(
    "/pending",
    summary="Get pending orders",
    description="Get orders waiting to be processed.",
)
async def get_pending_orders(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Get pending orders that need attention."""
    pending_orders = OrderService.get_pending_orders(db)
    
    return {
        "orders": [order_to_dict(order) for order in pending_orders],
        "total": len(pending_orders),
    }


@router.get(
    "/{order_id}",
    summary="Get order details",
    description="Get detailed information about an order.",
)
async def get_order_details(
    order_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Get details of a specific order."""
    order = OrderService.get_order_by_id(db, order_id)
    
    if not order:
        raise NotFoundException("Order", order_id)
    
    return order_to_dict(order)


@router.put(
    "/{order_id}/status",
    summary="Update order status",
    description="Update the status of an order.",
)
async def update_order_status(
    order_id: str,
    request: UpdateOrderStatusRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Update the status of an order."""
    order = OrderService.get_order_by_id(db, order_id)
    
    if not order:
        raise NotFoundException("Order", order_id)
    
    # Validate status transition
    current_status = order.status.value
    new_status = request.status
    
    valid_next_statuses = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in valid_next_statuses:
        raise BadRequestException(
            f"Cannot transition from '{current_status}' to '{new_status}'. "
            f"Valid transitions: {valid_next_statuses}"
        )
    
    # Update status using service
    try:
        new_status_enum = DbOrderStatus(new_status)
        updated_order = OrderService.update_status(
            db,
            order_id,
            OrderStatusUpdate(
                status=new_status_enum,
                internal_notes=request.notes
            )
        )
        
        return {
            "message": f"Order status updated to '{new_status}'",
            "order": order_to_dict(updated_order),
            "success": True,
        }
    except ValueError as e:
        raise BadRequestException(str(e))


@router.post(
    "/{order_id}/complete",
    summary="Complete order",
    description="Mark an order as completed.",
)
async def complete_order(
    order_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Quick action to complete a ready order."""
    order = OrderService.get_order_by_id(db, order_id)
    
    if not order:
        raise NotFoundException("Order", order_id)
    
    if order.status != DbOrderStatus.READY:
        raise BadRequestException("Only 'ready' orders can be completed")
    
    updated_order = OrderService.update_status(
        db,
        order_id,
        OrderStatusUpdate(
            status=DbOrderStatus.COMPLETED,
            internal_notes=f"Completed by {current_user.nama}"
        )
    )
    
    return {
        "message": "Order completed successfully",
        "order": order_to_dict(updated_order),
        "success": True,
    }


@router.post(
    "/walk-in",
    summary="Create walk-in order",
    description="Create an order for customers who purchase directly at the store.",
)
async def create_walkin_order(
    request: CreateWalkInOrderRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Create a walk-in order for direct store purchases."""
    try:
        # Convert request items to OrderItemCreate format
        order_items = []
        for item in request.items:
            # Map size string to enum
            size_map = {
                "small": ProductSize.SMALL,
                "medium": ProductSize.MEDIUM,
                "large": ProductSize.LARGE,
            }
            size_enum = size_map.get(item.size.lower(), ProductSize.MEDIUM)
            
            order_items.append(OrderItemCreate(
                product_id=item.product_id,
                quantity=item.quantity,
                size=size_enum,
                notes=item.notes,
            ))
        
        # Map payment method
        payment_map = {
            "cash": PaymentMethod.CASH,
            "qris": PaymentMethod.QRIS,
            "transfer": PaymentMethod.TRANSFER,
        }
        payment_method = payment_map.get(request.payment_method.lower(), PaymentMethod.CASH)
        
        # Create order data
        order_data = OrderCreate(
            items=order_items,
            customer_notes=request.notes,
            payment_method=payment_method,
            guest_name=request.customer_name,
            guest_phone=request.customer_phone,
        )
        
        # Create the order (without user - it's a guest/walk-in order)
        order = OrderService.create_order(db, order_data, user=None)
        
        # For walk-in orders, we can mark as paid immediately since payment is at counter
        # Update status to PAID
        updated_order = OrderService.update_status(
            db,
            order.id,
            OrderStatusUpdate(
                status=DbOrderStatus.PAID,
                internal_notes=f"Walk-in order created by {current_user.nama}"
            )
        )
        
        return {
            "message": "Walk-in order created successfully",
            "order": order_to_dict(updated_order),
            "success": True,
        }
    except ValueError as e:
        raise BadRequestException(str(e))
