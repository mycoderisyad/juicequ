"""Admin Orders API - Manage and view all orders."""
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.exceptions import BadRequestException, NotFoundException
from app.core.permissions import require_roles
from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.serializers.order_serializer import OrderSerializer
from app.services.order_service import OrderService

from sqlalchemy import desc
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("", summary="Get all orders")
async def get_all_orders(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    status: str | None = Query(None, description="Filter by status"),
    search: str | None = Query(None, description="Search by order number or customer name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all orders with optional filtering."""
    query = db.query(Order)

    if status:
        try:
            status_enum = OrderStatus(status)
            query = query.filter(Order.status == status_enum)
        except ValueError:
            pass

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Order.order_number.ilike(search_term))
            | (Order.guest_name.ilike(search_term))
        )

    total = query.count()
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()

    return {
        "orders": [OrderSerializer.to_list_dict(o) for o in orders],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/stats", summary="Get order statistics")
async def get_order_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get order statistics by status."""
    stats = OrderService.get_order_stats(db)

    by_status = {}
    for order_status in OrderStatus:
        count = db.query(Order).filter(Order.status == order_status).count()
        by_status[order_status.value] = count

    return {
        "by_status": by_status,
        "total": db.query(Order).count(),
        "revenue": stats,
    }


@router.get("/{order_id}", summary="Get order by ID")
async def get_order_by_id(
    order_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get detailed order information."""
    order = OrderService.get_order_by_id(db, order_id)

    if not order:
        raise NotFoundException("Order", order_id)

    return OrderSerializer.to_detail_dict(order)


@router.put("/{order_id}/status", summary="Update order status")
async def update_order_status(
    order_id: str,
    status: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update order status."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise NotFoundException("Order", order_id)

    try:
        new_status = OrderStatus(status)
    except ValueError:
        raise BadRequestException(f"Invalid status: {status}")

    old_status = order.status
    order.status = new_status

    if new_status == OrderStatus.COMPLETED:
        order.completed_at = datetime.now()
    elif new_status == OrderStatus.PAID:
        order.paid_at = datetime.now()

    db.commit()
    db.refresh(order)

    return {
        "message": f"Order status updated from {old_status.value} to {new_status.value}",
        "order_id": order.id,
        "old_status": old_status.value,
        "new_status": new_status.value,
    }
