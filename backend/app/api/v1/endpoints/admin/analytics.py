"""
Admin Analytics API.
Business analytics and reports.
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
    "/dashboard",
    summary="Dashboard overview",
    description="Get dashboard analytics overview.",
)
async def get_dashboard(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get dashboard overview with key metrics."""
    from app.api.v1.endpoints.customer.orders import ORDERS
    from app.api.v1.endpoints.customer.products import PRODUCTS
    from app.api.v1.endpoints.cashier.transactions import TRANSACTIONS
    
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    # User stats
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Product stats
    total_products = len(PRODUCTS)
    available_products = len([p for p in PRODUCTS if p.get("is_available", True)])
    
    # Order stats
    all_orders = []
    for user_id, orders in ORDERS.items():
        all_orders.extend(orders)
    
    total_orders = len(all_orders)
    today_orders = len([o for o in all_orders if o["created_at"] >= today_start])
    pending_orders = len([
        o for o in all_orders 
        if o["status"] in ["pending", "confirmed", "preparing", "ready"]
    ])
    
    # Transaction stats
    all_transactions = list(TRANSACTIONS.values())
    today_transactions = [t for t in all_transactions if t["created_at"] >= today_start]
    
    today_revenue = sum(t["amount"] for t in today_transactions if t["status"] == "completed")
    total_revenue = sum(t["amount"] for t in all_transactions if t["status"] == "completed")
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
        },
        "products": {
            "total": total_products,
            "available": available_products,
        },
        "orders": {
            "total": total_orders,
            "today": today_orders,
            "pending": pending_orders,
        },
        "revenue": {
            "today": today_revenue,
            "total": total_revenue,
            "transactions_today": len(today_transactions),
        },
        "generated_at": now.isoformat(),
    }


@router.get(
    "/sales",
    summary="Sales analytics",
    description="Get detailed sales analytics.",
)
async def get_sales_analytics(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    period: str = Query("week", description="Period: today, week, month, year"),
):
    """Get sales analytics for the specified period."""
    from app.api.v1.endpoints.cashier.transactions import TRANSACTIONS
    
    now = datetime.now()
    
    # Calculate date range
    period_days = {
        "today": 0,
        "week": 7,
        "month": 30,
        "year": 365,
    }
    
    days = period_days.get(period, 7)
    if days == 0:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = now - timedelta(days=days)
    
    start_str = start_date.isoformat()
    
    # Filter transactions
    period_transactions = [
        t for t in TRANSACTIONS.values()
        if t["created_at"] >= start_str and t["status"] == "completed"
    ]
    
    # Group by date
    daily_sales: dict[str, dict] = {}
    for t in period_transactions:
        date = t["created_at"][:10]
        if date not in daily_sales:
            daily_sales[date] = {"date": date, "revenue": 0, "transactions": 0}
        daily_sales[date]["revenue"] += t["amount"]
        daily_sales[date]["transactions"] += 1
    
    # Sort by date
    daily_data = sorted(daily_sales.values(), key=lambda x: x["date"])
    
    # Calculate totals
    total_revenue = sum(t["amount"] for t in period_transactions)
    total_transactions = len(period_transactions)
    avg_transaction = total_revenue / total_transactions if total_transactions else 0
    
    # Group by payment method
    by_payment = {}
    for t in period_transactions:
        method = t["payment_method"]
        if method not in by_payment:
            by_payment[method] = {"count": 0, "revenue": 0}
        by_payment[method]["count"] += 1
        by_payment[method]["revenue"] += t["amount"]
    
    return {
        "period": period,
        "start_date": start_str,
        "end_date": now.isoformat(),
        "summary": {
            "total_revenue": total_revenue,
            "total_transactions": total_transactions,
            "average_transaction": avg_transaction,
        },
        "daily": daily_data,
        "by_payment_method": by_payment,
    }


@router.get(
    "/products",
    summary="Product analytics",
    description="Get product performance analytics.",
)
async def get_product_analytics(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    limit: int = Query(20, ge=1, le=100),
):
    """Get product performance analytics."""
    from app.api.v1.endpoints.customer.orders import ORDERS
    from app.api.v1.endpoints.customer.products import PRODUCTS, CATEGORIES
    
    # Aggregate product sales
    product_sales: dict[str, dict] = {}
    
    for user_id, orders in ORDERS.items():
        for order in orders:
            if order["status"] == "completed":
                for item in order.get("items", []):
                    product_id = str(item.get("product_id", item.get("name")))
                    if product_id not in product_sales:
                        product_sales[product_id] = {
                            "id": product_id,
                            "name": item.get("name", "Unknown"),
                            "quantity_sold": 0,
                            "revenue": 0,
                            "orders": 0,
                        }
                    product_sales[product_id]["quantity_sold"] += item.get("quantity", 1)
                    product_sales[product_id]["revenue"] += item.get("subtotal", 0)
                    product_sales[product_id]["orders"] += 1
    
    # Sort by revenue
    top_products = sorted(
        product_sales.values(),
        key=lambda x: x["revenue"],
        reverse=True
    )[:limit]
    
    # Category performance
    category_sales: dict[str, dict] = {}
    for product_id, data in product_sales.items():
        # Find product to get category
        product = next((p for p in PRODUCTS if str(p["id"]) == product_id), None)
        if product:
            category = product["category"]
            if category not in category_sales:
                cat_info = next((c for c in CATEGORIES if c["id"] == category), None)
                category_sales[category] = {
                    "id": category,
                    "name": cat_info["name"] if cat_info else category,
                    "quantity_sold": 0,
                    "revenue": 0,
                    "products_sold": 0,
                }
            category_sales[category]["quantity_sold"] += data["quantity_sold"]
            category_sales[category]["revenue"] += data["revenue"]
            category_sales[category]["products_sold"] += 1
    
    top_categories = sorted(
        category_sales.values(),
        key=lambda x: x["revenue"],
        reverse=True
    )
    
    return {
        "top_products": top_products,
        "top_categories": top_categories,
        "total_products_sold": sum(p["quantity_sold"] for p in product_sales.values()),
        "total_product_revenue": sum(p["revenue"] for p in product_sales.values()),
    }


@router.get(
    "/customers",
    summary="Customer analytics",
    description="Get customer analytics.",
)
async def get_customer_analytics(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get customer analytics."""
    from app.api.v1.endpoints.customer.orders import ORDERS
    
    # Customer order stats
    customer_stats: dict[int, dict] = {}
    
    for user_id, orders in ORDERS.items():
        completed_orders = [o for o in orders if o["status"] == "completed"]
        customer_stats[user_id] = {
            "user_id": user_id,
            "total_orders": len(orders),
            "completed_orders": len(completed_orders),
            "total_spent": sum(o["total"] for o in completed_orders),
        }
    
    # Top customers by spending
    top_customers = sorted(
        customer_stats.values(),
        key=lambda x: x["total_spent"],
        reverse=True
    )[:10]
    
    # Enrich with user data
    for customer in top_customers:
        user = db.query(User).filter(User.id == customer["user_id"]).first()
        if user:
            customer["name"] = user.nama
            customer["email"] = user.email
    
    return {
        "total_customers": len(customer_stats),
        "top_customers": top_customers,
        "average_orders_per_customer": (
            sum(c["total_orders"] for c in customer_stats.values()) / len(customer_stats)
            if customer_stats else 0
        ),
        "average_spent_per_customer": (
            sum(c["total_spent"] for c in customer_stats.values()) / len(customer_stats)
            if customer_stats else 0
        ),
    }
