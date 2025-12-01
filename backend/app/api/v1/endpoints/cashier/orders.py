"""
Cashier Orders API.
Process and manage incoming orders.
"""
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.models.user import User, UserRole

router = APIRouter()


class UpdateOrderStatusRequest(BaseModel):
    """Request to update order status."""
    status: str = Field(..., description="New order status")
    notes: str | None = Field(None, max_length=500, description="Staff notes")


class OrderStatus:
    """Order status constants."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    
    VALID_TRANSITIONS = {
        PENDING: [CONFIRMED, CANCELLED],
        CONFIRMED: [PREPARING, CANCELLED],
        PREPARING: [READY, CANCELLED],
        READY: [COMPLETED],
        COMPLETED: [],
        CANCELLED: [],
    }


# Reference to customer orders storage
def get_all_orders():
    """Get all orders from all users."""
    from app.api.v1.endpoints.customer.orders import ORDERS
    all_orders = []
    for user_id, orders in ORDERS.items():
        for order in orders:
            order_copy = order.copy()
            order_copy["user_id"] = user_id
            all_orders.append(order_copy)
    return all_orders


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
    all_orders = get_all_orders()
    
    # Filter by status
    if status:
        all_orders = [order for order in all_orders if order["status"] == status]
    
    # Sort by date (newest first)
    all_orders = sorted(
        all_orders,
        key=lambda x: x["created_at"],
        reverse=True
    )[:limit]
    
    return {
        "orders": all_orders,
        "total": len(all_orders),
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
    all_orders = get_all_orders()
    
    pending_orders = [
        order for order in all_orders 
        if order["status"] in [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING]
    ]
    
    # Sort by date (oldest first - FIFO)
    pending_orders = sorted(
        pending_orders,
        key=lambda x: x["created_at"]
    )
    
    return {
        "orders": pending_orders,
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
    all_orders = get_all_orders()
    
    order = next(
        (order for order in all_orders if order["id"] == order_id),
        None
    )
    
    if not order:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Order", order_id)
    
    return order


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
    from app.api.v1.endpoints.customer.orders import ORDERS
    
    # Find the order
    target_order = None
    target_user_id = None
    
    for user_id, orders in ORDERS.items():
        for order in orders:
            if order["id"] == order_id:
                target_order = order
                target_user_id = user_id
                break
        if target_order:
            break
    
    if not target_order:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Order", order_id)
    
    # Validate status transition
    current_status = target_order["status"]
    new_status = request.status
    
    valid_next_statuses = OrderStatus.VALID_TRANSITIONS.get(current_status, [])
    if new_status not in valid_next_statuses:
        from app.core.exceptions import BadRequestException
        raise BadRequestException(
            f"Cannot transition from '{current_status}' to '{new_status}'. "
            f"Valid transitions: {valid_next_statuses}"
        )
    
    # Update status
    target_order["status"] = new_status
    target_order["updated_at"] = datetime.now().isoformat()
    if request.notes:
        target_order["staff_notes"] = request.notes
    target_order["processed_by"] = current_user.id
    
    return {
        "message": f"Order status updated to '{new_status}'",
        "order": target_order,
        "success": True,
    }


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
    from app.api.v1.endpoints.customer.orders import ORDERS
    
    # Find the order
    for user_id, orders in ORDERS.items():
        for order in orders:
            if order["id"] == order_id:
                if order["status"] != OrderStatus.READY:
                    from app.core.exceptions import BadRequestException
                    raise BadRequestException("Only 'ready' orders can be completed")
                
                order["status"] = OrderStatus.COMPLETED
                order["updated_at"] = datetime.now().isoformat()
                order["completed_at"] = datetime.now().isoformat()
                order["processed_by"] = current_user.id
                
                return {
                    "message": "Order completed successfully",
                    "order": order,
                    "success": True,
                }
    
    from app.core.exceptions import NotFoundException
    raise NotFoundException("Order", order_id)
