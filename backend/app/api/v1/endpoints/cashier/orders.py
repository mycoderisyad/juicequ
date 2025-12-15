"""Cashier Orders API - Process and manage incoming orders."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.permissions import require_roles
from app.db.session import get_db
from app.models.order import OrderStatus as DbOrderStatus
from app.models.user import User, UserRole
from app.schemas.order import (
    CashierOrderStatusUpdate,
    OrderCreate,
    OrderItemCreate,
    OrderStatusUpdate,
    PaymentMethod,
    ProductSize,
    WalkInOrderCreate,
)
from app.serializers.order_serializer import OrderSerializer
from app.services.order_service import OrderService

router = APIRouter()

VALID_TRANSITIONS = {
    "pending": ["paid", "cancelled"],
    "paid": ["preparing", "cancelled"],
    "preparing": ["ready", "cancelled"],
    "ready": ["completed"],
    "completed": [],
    "cancelled": [],
}

SIZE_MAP = {
    "small": ProductSize.SMALL,
    "medium": ProductSize.MEDIUM,
    "large": ProductSize.LARGE,
}

PAYMENT_MAP = {
    "cash": PaymentMethod.CASH,
    "qris": PaymentMethod.QRIS,
    "transfer": PaymentMethod.TRANSFER,
}


@router.get("", summary="Get all orders")
async def get_orders(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
    status: str | None = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
):
    """Get all orders for processing."""
    status_enum = None
    if status:
        try:
            status_enum = DbOrderStatus(status)
        except ValueError:
            pass

    orders, total = OrderService.get_all_orders(
        db, status=status_enum, page=1, page_size=limit
    )

    return {
        "orders": [OrderSerializer.to_cashier_dict(order) for order in orders],
        "total": total,
    }


@router.get("/pending", summary="Get pending orders")
async def get_pending_orders(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Get pending orders that need attention."""
    pending_orders = OrderService.get_pending_orders(db)

    return {
        "orders": [OrderSerializer.to_cashier_dict(order) for order in pending_orders],
        "total": len(pending_orders),
    }


@router.get("/{order_id}", summary="Get order details")
async def get_order_details(
    order_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Get details of a specific order."""
    order = OrderService.get_order_by_id(db, order_id)

    if not order:
        raise NotFoundException("Order", order_id)

    return OrderSerializer.to_cashier_dict(order)


@router.put("/{order_id}/status", summary="Update order status")
async def update_order_status(
    order_id: str,
    request: CashierOrderStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Update the status of an order."""
    order = OrderService.get_order_by_id(db, order_id)

    if not order:
        raise NotFoundException("Order", order_id)

    current_status = order.status.value
    new_status = request.status

    valid_next_statuses = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in valid_next_statuses:
        raise BadRequestException(
            f"Cannot transition from '{current_status}' to '{new_status}'. "
            f"Valid transitions: {valid_next_statuses}"
        )

    try:
        new_status_enum = DbOrderStatus(new_status)
        updated_order = OrderService.update_status(
            db,
            order_id,
            OrderStatusUpdate(status=new_status_enum, internal_notes=request.notes),
        )

        return {
            "message": f"Order status updated to '{new_status}'",
            "order": OrderSerializer.to_cashier_dict(updated_order),
            "success": True,
        }
    except ValueError as e:
        raise BadRequestException(str(e))


@router.post("/{order_id}/complete", summary="Complete order")
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

    staff_name = getattr(current_user, "full_name", None) or current_user.email
    updated_order = OrderService.update_status(
        db,
        order_id,
        OrderStatusUpdate(
            status=DbOrderStatus.COMPLETED,
            internal_notes=f"Completed by {staff_name}",
        ),
    )

    return {
        "message": "Order completed successfully",
        "order": OrderSerializer.to_cashier_dict(updated_order),
        "success": True,
    }


@router.post("/walk-in", summary="Create walk-in order")
async def create_walkin_order(
    request: WalkInOrderCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Create a walk-in order for direct store purchases."""
    try:
        order_items = [
            OrderItemCreate(
                product_id=item.product_id,
                quantity=item.quantity,
                size=SIZE_MAP.get(item.size.lower(), ProductSize.MEDIUM),
                notes=item.notes,
            )
            for item in request.items
        ]

        payment_method = PAYMENT_MAP.get(
            request.payment_method.lower(), PaymentMethod.CASH
        )

        order_data = OrderCreate(
            items=order_items,
            customer_notes=request.notes,
            payment_method=payment_method,
            guest_name=request.customer_name,
            guest_phone=request.customer_phone,
        )

        order = OrderService.create_order(db, order_data, user=None)

        staff_name = getattr(current_user, "full_name", None) or current_user.email
        updated_order = OrderService.update_status(
            db,
            order.id,
            OrderStatusUpdate(
                status=DbOrderStatus.PAID,
                internal_notes=f"Walk-in order created by {staff_name}",
            ),
        )

        return {
            "message": "Walk-in order created successfully",
            "order": OrderSerializer.to_cashier_dict(updated_order),
            "success": True,
        }
    except ValueError as e:
        raise BadRequestException(str(e))
