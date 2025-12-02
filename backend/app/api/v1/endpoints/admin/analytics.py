"""
Admin Analytics API.
Business analytics and reports.
"""
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order, OrderStatus

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
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # User stats from database
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Product stats from database
    total_products = db.query(Product).count()
    available_products = db.query(Product).filter(
        Product.is_available == True,
        Product.stock_quantity > 0
    ).count()
    
    # Order stats from database
    total_orders = db.query(Order).count()
    today_orders = db.query(Order).filter(Order.created_at >= today_start).count()
    pending_orders = db.query(Order).filter(
        Order.status.in_([
            OrderStatus.PENDING,
            OrderStatus.PAID,
            OrderStatus.PREPARING,
            OrderStatus.READY
        ])
    ).count()
    
    # Revenue stats from database
    completed_orders = db.query(Order).filter(Order.status == OrderStatus.COMPLETED)
    total_revenue = completed_orders.with_entities(func.sum(Order.total)).scalar() or 0.0
    
    today_completed = completed_orders.filter(Order.created_at >= today_start)
    today_revenue = today_completed.with_entities(func.sum(Order.total)).scalar() or 0.0
    transactions_today = today_completed.count()
    
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
            "transactions_today": transactions_today,
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
    
    # Query completed orders from database
    completed_orders = db.query(Order).filter(
        Order.status == OrderStatus.COMPLETED,
        Order.created_at >= start_date
    ).all()
    
    # Group by date
    daily_sales: dict[str, dict] = {}
    for order in completed_orders:
        date = order.created_at.strftime("%Y-%m-%d")
        if date not in daily_sales:
            daily_sales[date] = {"date": date, "revenue": 0, "transactions": 0}
        daily_sales[date]["revenue"] += order.total
        daily_sales[date]["transactions"] += 1
    
    # Sort by date
    daily_data = sorted(daily_sales.values(), key=lambda x: x["date"])
    
    # Calculate totals
    total_revenue = sum(o.total for o in completed_orders)
    total_transactions = len(completed_orders)
    avg_transaction = total_revenue / total_transactions if total_transactions else 0
    
    # Group by payment method
    by_payment: dict = {}
    for order in completed_orders:
        method = order.payment_method.value if order.payment_method else "unknown"
        if method not in by_payment:
            by_payment[method] = {"count": 0, "revenue": 0}
        by_payment[method]["count"] += 1
        by_payment[method]["revenue"] += order.total
    
    return {
        "period": period,
        "start_date": start_date.isoformat(),
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
    from app.models.order import OrderItem
    from app.models.product import ProductCategory
    
    # Get completed orders
    completed_orders = db.query(Order).filter(
        Order.status == OrderStatus.COMPLETED
    ).all()
    
    # Aggregate product sales from order items
    product_sales: dict[str, dict] = {}
    for order in completed_orders:
        for item in order.items:
            product_id = item.product_id
            if product_id not in product_sales:
                product_sales[product_id] = {
                    "id": product_id,
                    "name": item.product_name,
                    "quantity_sold": 0,
                    "revenue": 0,
                    "orders": 0,
                }
            product_sales[product_id]["quantity_sold"] += item.quantity
            product_sales[product_id]["revenue"] += item.subtotal
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
        product = db.query(Product).filter(Product.id == product_id).first()
        if product and product.category_id:
            category_id = product.category_id
            if category_id not in category_sales:
                category = db.query(ProductCategory).filter(
                    ProductCategory.id == category_id
                ).first()
                category_sales[category_id] = {
                    "id": category_id,
                    "name": category.name if category else "Unknown",
                    "quantity_sold": 0,
                    "revenue": 0,
                    "products_sold": 0,
                }
            category_sales[category_id]["quantity_sold"] += data["quantity_sold"]
            category_sales[category_id]["revenue"] += data["revenue"]
            category_sales[category_id]["products_sold"] += 1
    
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
    # Get all users with pembeli role
    customers = db.query(User).filter(User.role == UserRole.PEMBELI).all()
    
    # Customer order stats from database
    customer_stats: list[dict] = []
    
    for customer in customers:
        customer_orders = db.query(Order).filter(Order.user_id == customer.id).all()
        completed_orders = [o for o in customer_orders if o.status == OrderStatus.COMPLETED]
        total_spent = sum(o.total for o in completed_orders)
        
        customer_stats.append({
            "user_id": customer.id,
            "name": customer.nama,
            "email": customer.email,
            "total_orders": len(customer_orders),
            "completed_orders": len(completed_orders),
            "total_spent": total_spent,
        })
    
    # Sort by spending and get top 10
    top_customers = sorted(
        customer_stats,
        key=lambda x: x["total_spent"],
        reverse=True
    )[:10]
    
    total_customers = len(customer_stats)
    total_orders = sum(c["total_orders"] for c in customer_stats)
    total_spent = sum(c["total_spent"] for c in customer_stats)
    
    return {
        "total_customers": total_customers,
        "top_customers": top_customers,
        "average_orders_per_customer": (
            total_orders / total_customers if total_customers else 0
        ),
        "average_spent_per_customer": (
            total_spent / total_customers if total_customers else 0
        ),
    }
