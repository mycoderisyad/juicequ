"""
Cashier Reports API.
Generate sales and performance reports.
"""
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole

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
    from app.api.v1.endpoints.cashier.transactions import TRANSACTIONS
    
    # Default to today
    report_date = date or datetime.now().strftime("%Y-%m-%d")
    
    # Filter transactions for the date
    daily_transactions = [
        t for t in TRANSACTIONS.values()
        if t["created_at"].startswith(report_date) and t["status"] == "completed"
    ]
    
    # Calculate metrics
    total_sales = sum(t["amount"] for t in daily_transactions)
    total_transactions = len(daily_transactions)
    
    # Group by payment method
    by_payment_method = {}
    for t in daily_transactions:
        method = t["payment_method"]
        if method not in by_payment_method:
            by_payment_method[method] = {"count": 0, "total": 0}
        by_payment_method[method]["count"] += 1
        by_payment_method[method]["total"] += t["amount"]
    
    return {
        "date": report_date,
        "total_sales": total_sales,
        "total_transactions": total_transactions,
        "average_transaction": total_sales / total_transactions if total_transactions else 0,
        "by_payment_method": by_payment_method,
        "transactions": daily_transactions,
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
    from app.api.v1.endpoints.cashier.transactions import TRANSACTIONS
    from app.api.v1.endpoints.customer.orders import ORDERS
    
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
    
    start_str = start_date.isoformat()
    
    # Get transactions in range
    period_transactions = [
        t for t in TRANSACTIONS.values()
        if t["created_at"] >= start_str and t["status"] == "completed"
    ]
    
    # Get orders stats
    all_orders = []
    for user_id, orders in ORDERS.items():
        all_orders.extend(orders)
    
    period_orders = [
        o for o in all_orders
        if o["created_at"] >= start_str
    ]
    
    completed_orders = [o for o in period_orders if o["status"] == "completed"]
    cancelled_orders = [o for o in period_orders if o["status"] == "cancelled"]
    pending_orders = [
        o for o in period_orders 
        if o["status"] in ["pending", "confirmed", "preparing", "ready"]
    ]
    
    return {
        "period": period,
        "start_date": start_str,
        "end_date": now.isoformat(),
        "sales": {
            "total": sum(t["amount"] for t in period_transactions),
            "count": len(period_transactions),
            "average": (
                sum(t["amount"] for t in period_transactions) / len(period_transactions)
                if period_transactions else 0
            ),
        },
        "orders": {
            "total": len(period_orders),
            "completed": len(completed_orders),
            "cancelled": len(cancelled_orders),
            "pending": len(pending_orders),
        },
        "refunds": {
            "count": len([t for t in period_transactions if t.get("refunded")]),
            "total": sum(
                t["amount"] for t in period_transactions if t.get("refunded")
            ),
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
    from app.api.v1.endpoints.customer.orders import ORDERS
    
    # Aggregate item sales
    item_sales: dict[str, dict] = {}
    
    for user_id, orders in ORDERS.items():
        for order in orders:
            if order["status"] == "completed":
                for item in order.get("items", []):
                    product_id = item.get("product_id", item.get("name"))
                    if product_id not in item_sales:
                        item_sales[product_id] = {
                            "id": product_id,
                            "name": item.get("name", "Unknown"),
                            "quantity": 0,
                            "revenue": 0,
                        }
                    item_sales[product_id]["quantity"] += item.get("quantity", 1)
                    item_sales[product_id]["revenue"] += item.get("subtotal", 0)
    
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
