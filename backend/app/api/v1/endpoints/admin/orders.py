"""
Admin Orders API.
Manage and view all orders.
"""
from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus

router = APIRouter()


@router.get(
    "",
    summary="Get all orders",
    description="Get all orders with filtering and pagination.",
)
async def get_all_orders(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by order number or customer name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all orders with optional filtering."""
    query = db.query(Order)
    
    # Filter by status
    if status:
        try:
            status_enum = OrderStatus(status)
            query = query.filter(Order.status == status_enum)
        except ValueError:
            pass
    
    # Search by order number or customer name
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Order.order_number.ilike(search_term)) |
            (Order.guest_name.ilike(search_term))
        )
    
    # Get total count
    total = query.count()
    
    # Get orders with pagination
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    # Format response
    orders_data = []
    for order in orders:
        # Get customer name
        customer_name = order.guest_name or "Guest"
        if order.user:
            customer_name = order.user.full_name or order.user.email
        
        orders_data.append({
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": customer_name,
            "customer_phone": order.guest_phone,
            "status": order.status.value,
            "subtotal": order.subtotal,
            "discount": order.discount,
            "tax": order.tax,
            "total": order.total,
            "payment_method": order.payment_method.value if order.payment_method else None,
            "items_count": len(order.items),
            "items": [
                {
                    "id": item.id,
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "subtotal": item.subtotal,
                    "size": item.size,
                }
                for item in order.items
            ],
            "customer_notes": order.customer_notes,
            "internal_notes": order.internal_notes,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "paid_at": order.paid_at.isoformat() if order.paid_at else None,
            "completed_at": order.completed_at.isoformat() if order.completed_at else None,
        })
    
    return {
        "orders": orders_data,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get(
    "/stats",
    summary="Get order statistics",
    description="Get order statistics by status.",
)
async def get_order_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get order statistics."""
    stats = {}
    
    for status in OrderStatus:
        count = db.query(Order).filter(Order.status == status).count()
        stats[status.value] = count
    
    total = db.query(Order).count()
    
    return {
        "by_status": stats,
        "total": total,
    }


@router.get(
    "/{order_id}",
    summary="Get order by ID",
    description="Get detailed order information.",
)
async def get_order_by_id(
    order_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get order by ID."""
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get customer name
    customer_name = order.guest_name or "Guest"
    if order.user:
        customer_name = order.user.full_name or order.user.email
    
    return {
        "id": order.id,
        "order_number": order.order_number,
        "customer_name": customer_name,
        "customer_email": order.user.email if order.user else None,
        "customer_phone": order.guest_phone,
        "status": order.status.value,
        "subtotal": order.subtotal,
        "discount": order.discount,
        "tax": order.tax,
        "total": order.total,
        "payment_method": order.payment_method.value if order.payment_method else None,
        "payment_reference": order.payment_reference,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
                "size": item.size,
                "customizations": item.customizations,
                "notes": item.notes,
            }
            for item in order.items
        ],
        "customer_notes": order.customer_notes,
        "internal_notes": order.internal_notes,
        "ai_session_id": order.ai_session_id,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "completed_at": order.completed_at.isoformat() if order.completed_at else None,
    }


@router.put(
    "/{order_id}/status",
    summary="Update order status",
    description="Update the status of an order.",
)
async def update_order_status(
    order_id: str,
    status: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update order status."""
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        new_status = OrderStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    old_status = order.status
    order.status = new_status
    
    # Update timestamps
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
