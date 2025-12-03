"""
Analytics Service for generating reports and statistics.
"""
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product, ProductCategory
from app.models.user import User, UserRole


class AnalyticsService:
    """Service class for analytics and reporting."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_dashboard_data(self) -> dict:
        """Get main dashboard statistics."""
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        # User stats
        total_users = self.db.query(User).count()
        active_users = self.db.query(User).filter(User.is_active == True).count()
        
        # Product stats
        total_products = self.db.query(Product).count()
        available_products = self.db.query(Product).filter(Product.is_available == True).count()
        
        # Order stats
        total_orders = self.db.query(Order).count()
        orders_today = self.db.query(Order).filter(Order.created_at >= today_start).count()
        pending_orders = self.db.query(Order).filter(
            Order.status.in_([OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PREPARING])
        ).count()
        
        # Revenue
        total_revenue = self.db.query(func.sum(Order.total)).filter(
            Order.status == OrderStatus.COMPLETED
        ).scalar() or 0.0
        
        revenue_today = self.db.query(func.sum(Order.total)).filter(
            Order.status == OrderStatus.COMPLETED,
            Order.created_at >= today_start
        ).scalar() or 0.0
        
        transactions_today = self.db.query(Order).filter(
            Order.status == OrderStatus.COMPLETED,
            Order.created_at >= today_start
        ).count()
        
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
                "today": orders_today,
                "pending": pending_orders,
            },
            "revenue": {
                "total": float(total_revenue),
                "today": float(revenue_today),
                "transactions_today": transactions_today,
            },
        }
    
    def get_sales_analytics(
        self,
        period: str = "week",
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> dict:
        """Get sales analytics for a period."""
        if not date_to:
            date_to = datetime.utcnow()
        
        if not date_from:
            if period == "day":
                date_from = date_to - timedelta(days=1)
            elif period == "week":
                date_from = date_to - timedelta(weeks=1)
            elif period == "month":
                date_from = date_to - timedelta(days=30)
            elif period == "year":
                date_from = date_to - timedelta(days=365)
            else:
                date_from = date_to - timedelta(weeks=1)
        
        # Orders in period
        orders_query = self.db.query(Order).filter(
            Order.created_at >= date_from,
            Order.created_at <= date_to,
        )
        
        total_orders = orders_query.count()
        completed_orders = orders_query.filter(Order.status == OrderStatus.COMPLETED).count()
        cancelled_orders = orders_query.filter(Order.status == OrderStatus.CANCELLED).count()
        
        # Revenue
        total_revenue = orders_query.filter(
            Order.status == OrderStatus.COMPLETED
        ).with_entities(func.sum(Order.total)).scalar() or 0.0
        
        avg_order_value = total_revenue / completed_orders if completed_orders > 0 else 0.0
        
        return {
            "period": period,
            "date_from": date_from.isoformat(),
            "date_to": date_to.isoformat(),
            "orders": {
                "total": total_orders,
                "completed": completed_orders,
                "cancelled": cancelled_orders,
                "completion_rate": (completed_orders / total_orders * 100) if total_orders > 0 else 0,
            },
            "revenue": {
                "total": float(total_revenue),
                "average_order_value": float(avg_order_value),
            },
        }
    
    def get_top_products(self, limit: int = 10) -> list[dict]:
        """Get top selling products."""
        results = (
            self.db.query(
                Product.id,
                Product.name,
                func.sum(OrderItem.quantity).label("quantity_sold"),
                func.sum(OrderItem.subtotal).label("revenue"),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(Order.status == OrderStatus.COMPLETED)
            .group_by(Product.id, Product.name)
            .order_by(desc("quantity_sold"))
            .limit(limit)
            .all()
        )
        
        return [
            {
                "id": str(r.id),
                "name": r.name,
                "quantity_sold": int(r.quantity_sold or 0),
                "revenue": float(r.revenue or 0),
            }
            for r in results
        ]
    
    def get_category_sales(self) -> list[dict]:
        """Get sales breakdown by category."""
        results = (
            self.db.query(
                ProductCategory.id,
                ProductCategory.name,
                func.count(OrderItem.id).label("order_count"),
                func.sum(OrderItem.subtotal).label("revenue"),
            )
            .join(Product, Product.category_id == ProductCategory.id)
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(Order.status == OrderStatus.COMPLETED)
            .group_by(ProductCategory.id, ProductCategory.name)
            .order_by(desc("revenue"))
            .all()
        )
        
        return [
            {
                "id": str(r.id),
                "name": r.name,
                "order_count": int(r.order_count or 0),
                "revenue": float(r.revenue or 0),
            }
            for r in results
        ]
    
    def get_user_activity(self, limit: int = 10) -> list[dict]:
        """Get most active users."""
        results = (
            self.db.query(
                User.id,
                User.full_name,
                User.email,
                func.count(Order.id).label("order_count"),
                func.sum(Order.total).label("total_spent"),
            )
            .join(Order, Order.user_id == User.id)
            .filter(Order.status == OrderStatus.COMPLETED)
            .group_by(User.id, User.full_name, User.email)
            .order_by(desc("total_spent"))
            .limit(limit)
            .all()
        )
        
        return [
            {
                "id": str(r.id),
                "name": r.full_name,
                "email": r.email,
                "order_count": int(r.order_count or 0),
                "total_spent": float(r.total_spent or 0),
            }
            for r in results
        ]
