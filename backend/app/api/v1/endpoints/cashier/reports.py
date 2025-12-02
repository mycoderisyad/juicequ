"""
Cashier Reports API.
Generate sales and performance reports.
"""
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus, PaymentMethod

router = APIRouter()


@router.get(
    "/daily",
    summary="Daily sales report",
    description="Get today's sales summary.",
)
async def get_daily_report(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
    date: str | None = Query(None, description="Date (YYYY-MM-DD), defaults to today"),
):
    """Get daily sales report."""
    # Default to today
    if date:
        try:
            report_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            report_date = datetime.now()
    else:
        report_date = datetime.now()
    
    start_of_day = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    # Get completed orders for the date from database
    completed_orders = db.query(Order).filter(
        Order.status == OrderStatus.COMPLETED,
        Order.completed_at >= start_of_day,
        Order.completed_at < end_of_day
    ).all()
    
    # Calculate metrics
    total_sales = sum(o.total for o in completed_orders)
    total_transactions = len(completed_orders)
    
    # Group by payment method
    by_payment_method: dict = {}
    for order in completed_orders:
        method = order.payment_method.value if order.payment_method else "unknown"
        if method not in by_payment_method:
            by_payment_method[method] = {"count": 0, "total": 0}
        by_payment_method[method]["count"] += 1
        by_payment_method[method]["total"] += order.total
    
    # Format transactions for response
    transactions = [
        {
            "id": o.id,
            "order_number": o.order_number,
            "amount": o.total,
            "payment_method": o.payment_method.value if o.payment_method else None,
            "status": "completed",
            "created_at": o.completed_at.isoformat() if o.completed_at else o.created_at.isoformat(),
        }
        for o in completed_orders
    ]
    
    return {
        "date": report_date.strftime("%Y-%m-%d"),
        "total_sales": total_sales,
        "total_transactions": total_transactions,
        "average_transaction": total_sales / total_transactions if total_transactions else 0,
        "by_payment_method": by_payment_method,
        "transactions": transactions,
    }


@router.get(
    "/summary",
    summary="Sales summary",
    description="Get sales summary for a period.",
)
async def get_sales_summary(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
    period: str = Query("today", description="Period: today, week, month"),
):
    """Get sales summary for the specified period."""
    now = datetime.now()
    
    # Calculate date range
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get orders in range from database
    period_orders = db.query(Order).filter(Order.created_at >= start_date).all()
    
    # Completed orders (sales)
    completed_orders = [o for o in period_orders if o.status == OrderStatus.COMPLETED]
    cancelled_orders = [o for o in period_orders if o.status == OrderStatus.CANCELLED]
    pending_orders = [
        o for o in period_orders 
        if o.status in [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY]
    ]
    
    total_sales = sum(o.total for o in completed_orders)
    
    return {
        "period": period,
        "start_date": start_date.isoformat(),
        "end_date": now.isoformat(),
        "sales": {
            "total": total_sales,
            "count": len(completed_orders),
            "average": total_sales / len(completed_orders) if completed_orders else 0,
        },
        "orders": {
            "total": len(period_orders),
            "completed": len(completed_orders),
            "cancelled": len(cancelled_orders),
            "pending": len(pending_orders),
        },
        "refunds": {
            "count": len(cancelled_orders),  # Using cancelled as refunds for now
            "total": sum(o.total for o in cancelled_orders),
        },
    }


@router.get(
    "/popular-items",
    summary="Popular items",
    description="Get most popular items sold.",
)
async def get_popular_items(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
    limit: int = Query(10, ge=1, le=50, description="Number of items"),
):
    """Get most popular items by sales."""
    # Get completed orders
    completed_orders = db.query(Order).filter(
        Order.status == OrderStatus.COMPLETED
    ).all()
    
    # Aggregate item sales from order items
    item_sales: dict[str, dict] = {}
    
    for order in completed_orders:
        for item in order.items:
            product_id = item.product_id
            if product_id not in item_sales:
                item_sales[product_id] = {
                    "id": product_id,
                    "name": item.product_name,
                    "quantity": 0,
                    "revenue": 0,
                }
            item_sales[product_id]["quantity"] += item.quantity
            item_sales[product_id]["revenue"] += item.subtotal
    
    # Sort by quantity sold
    popular_items = sorted(
        item_sales.values(),
        key=lambda x: x["quantity"],
        reverse=True
    )[:limit]
    
    return {
        "items": popular_items,
        "total": len(item_sales),
    }
