"""
Order service for business logic.
"""
import random
import string
from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.product import Product, ProductSize
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderStatusUpdate,
    OrderItemCreate,
)
from app.services.product_service import ProductService
from app.services.promo_service import PromoService


class OrderService:
    """Service class for order operations."""
    
    TAX_RATE = 0.10  # 10% tax
    
    # ==========================================================================
    # Order Number Generation
    # ==========================================================================
    
    @staticmethod
    def generate_order_number() -> str:
        """Generate a unique order number."""
        # Format: JQ-YYMMDD-XXXX (e.g., JQ-241202-A1B2)
        date_part = datetime.now().strftime("%y%m%d")
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"JQ-{date_part}-{random_part}"
    
    # ==========================================================================
    # Order CRUD
    # ==========================================================================
    
    @staticmethod
    def create_order(
        db: Session,
        order_data: OrderCreate,
        user: Optional[User] = None,
    ) -> Order:
        """Create a new order."""
        # Generate order number
        order_number = OrderService.generate_order_number()
        
        # Ensure unique order number
        while db.query(Order).filter(Order.order_number == order_number).first():
            order_number = OrderService.generate_order_number()
        
        # Calculate totals
        subtotal = 0.0
        order_items = []
        
        for item_data in order_data.items:
            # Get product
            product = ProductService.get_by_id(db, item_data.product_id)
            if not product:
                raise ValueError(f"Product not found: {item_data.product_id}")
            
            if not product.is_in_stock(item_data.quantity):
                raise ValueError(f"Insufficient stock for: {product.name}")
            
            # Calculate price based on size
            size_enum = ProductSize(item_data.size.value)
            unit_price = ProductService.get_price(product, size_enum)
            item_subtotal = unit_price * item_data.quantity
            subtotal += item_subtotal
            
            # Create order item
            order_item = OrderItem(
                product_id=product.id,
                product_name=product.name,
                size=item_data.size.value,
                quantity=item_data.quantity,
                unit_price=unit_price,
                subtotal=item_subtotal,
                customizations=item_data.customizations,
                notes=item_data.notes,
            )
            order_items.append(order_item)
            
            # Reduce stock
            ProductService.reduce_stock(db, product.id, item_data.quantity)
        
        # Calculate tax and total
        tax = round(subtotal * OrderService.TAX_RATE, 2)
        
        # Apply voucher discount if provided
        voucher_discount = 0.0
        if order_data.voucher_id and order_data.voucher_code:
            voucher_discount = order_data.voucher_discount or 0.0
            # Record voucher usage
            if user:
                try:
                    PromoService.use_voucher(
                        db=db,
                        voucher_id=order_data.voucher_id,
                        user_id=user.id,
                        order_total=subtotal,
                    )
                except ValueError:
                    # Voucher validation failed, ignore discount
                    voucher_discount = 0.0
        
        total = round(subtotal + tax - voucher_discount, 2)
        
        # Parse scheduled pickup date if pre-order
        scheduled_pickup_date = None
        if order_data.is_preorder and order_data.scheduled_pickup_date:
            try:
                scheduled_pickup_date = datetime.strptime(
                    order_data.scheduled_pickup_date, "%Y-%m-%d"
                )
            except ValueError:
                pass
        
        # Create order
        order = Order(
            order_number=order_number,
            user_id=user.id if user else None,
            guest_name=order_data.guest_name if not user else None,
            guest_phone=order_data.guest_phone if not user else None,
            status=OrderStatus.PENDING,
            subtotal=subtotal,
            discount=voucher_discount,
            tax=tax,
            total=total,
            payment_method=PaymentMethod(order_data.payment_method.value),
            customer_notes=order_data.customer_notes,
            # Pre-order fields
            is_preorder=order_data.is_preorder,
            scheduled_pickup_date=scheduled_pickup_date,
            scheduled_pickup_time=order_data.scheduled_pickup_time,
            # Voucher fields
            voucher_id=order_data.voucher_id if voucher_discount > 0 else None,
            voucher_code=order_data.voucher_code if voucher_discount > 0 else None,
            voucher_discount=voucher_discount,
            items=order_items,
        )
        
        db.add(order)
        db.commit()
        db.refresh(order)
        
        return order
    
    @staticmethod
    def get_user_orders(
        db: Session,
        user_id: str,
        status: Optional[OrderStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Order], int]:
        """Get orders for a specific user."""
        query = db.query(Order).options(
            joinedload(Order.items)
        ).filter(Order.user_id == user_id)
        
        if status:
            query = query.filter(Order.status == status)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        orders = query.order_by(
            Order.created_at.desc()
        ).offset(offset).limit(page_size).all()
        
        return orders, total
    
    @staticmethod
    def get_order_by_id(
        db: Session,
        order_id: str,
    ) -> Optional[Order]:
        """Get an order by ID."""
        return db.query(Order).options(
            joinedload(Order.items),
            joinedload(Order.user),
        ).filter(Order.id == order_id).first()
    
    @staticmethod
    def get_order_by_number(
        db: Session,
        order_number: str,
    ) -> Optional[Order]:
        """Get an order by order number."""
        return db.query(Order).options(
            joinedload(Order.items),
            joinedload(Order.user),
        ).filter(Order.order_number == order_number).first()
    
    @staticmethod
    def update_order(
        db: Session,
        order_id: str,
        order_data: OrderUpdate,
    ) -> Optional[Order]:
        """Update an order."""
        order = OrderService.get_order_by_id(db, order_id)
        if not order:
            return None
        
        update_data = order_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(order, field, value)
        
        db.commit()
        db.refresh(order)
        return order
    
    @staticmethod
    def update_status(
        db: Session,
        order_id: str,
        status_data: OrderStatusUpdate,
    ) -> Optional[Order]:
        """Update order status."""
        order = OrderService.get_order_by_id(db, order_id)
        if not order:
            return None
        
        old_status = order.status
        new_status = status_data.status
        
        # Update status
        order.status = new_status
        
        if status_data.internal_notes:
            existing_notes = order.internal_notes or ""
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            new_note = f"\n[{timestamp}] {old_status.value} -> {new_status.value}: {status_data.internal_notes}"
            order.internal_notes = existing_notes + new_note
        
        # Handle status-specific updates
        if new_status == OrderStatus.PAID:
            order.paid_at = datetime.now()
        elif new_status == OrderStatus.COMPLETED:
            order.completed_at = datetime.now()
        elif new_status == OrderStatus.CANCELLED:
            # Restore stock for cancelled orders
            for item in order.items:
                ProductService.restore_stock(db, item.product_id, item.quantity)
        
        db.commit()
        db.refresh(order)
        return order
    
    @staticmethod
    def cancel_order(
        db: Session,
        order_id: str,
        reason: Optional[str] = None,
    ) -> Optional[Order]:
        """Cancel an order."""
        order = OrderService.get_order_by_id(db, order_id)
        if not order:
            return None
        
        if not order.can_cancel():
            raise ValueError("Order cannot be cancelled in its current status")
        
        return OrderService.update_status(
            db,
            order_id,
            OrderStatusUpdate(
                status=OrderStatus.CANCELLED,
                internal_notes=reason or "Cancelled by user",
            ),
        )
    
    # ==========================================================================
    # Order Queries (for Kasir/Admin)
    # ==========================================================================
    
    @staticmethod
    def get_all_orders(
        db: Session,
        status: Optional[OrderStatus] = None,
        payment_method: Optional[PaymentMethod] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Order], int]:
        """Get all orders with filters."""
        query = db.query(Order).options(
            joinedload(Order.items),
            joinedload(Order.user),
        )
        
        if status:
            query = query.filter(Order.status == status)
        
        if payment_method:
            query = query.filter(Order.payment_method == payment_method)
        
        if date_from:
            query = query.filter(Order.created_at >= date_from)
        
        if date_to:
            query = query.filter(Order.created_at <= date_to)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        orders = query.order_by(
            Order.created_at.desc()
        ).offset(offset).limit(page_size).all()
        
        return orders, total
    
    @staticmethod
    def get_pending_orders(
        db: Session,
    ) -> list[Order]:
        """Get all pending orders for kasir."""
        return db.query(Order).options(
            joinedload(Order.items),
        ).filter(
            Order.status.in_([
                OrderStatus.PENDING,
                OrderStatus.PAID,
                OrderStatus.PREPARING,
            ])
        ).order_by(Order.created_at.asc()).all()
    
    @staticmethod
    def get_ready_orders(
        db: Session,
    ) -> list[Order]:
        """Get all ready orders."""
        return db.query(Order).options(
            joinedload(Order.items),
        ).filter(
            Order.status == OrderStatus.READY
        ).order_by(Order.created_at.asc()).all()
    
    # ==========================================================================
    # Analytics
    # ==========================================================================
    
    @staticmethod
    def get_order_stats(
        db: Session,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> dict:
        """Get order statistics."""
        query = db.query(Order)
        
        if date_from:
            query = query.filter(Order.created_at >= date_from)
        if date_to:
            query = query.filter(Order.created_at <= date_to)
        
        total_orders = query.count()
        
        # Count by status
        pending = query.filter(Order.status == OrderStatus.PENDING).count()
        completed = query.filter(Order.status == OrderStatus.COMPLETED).count()
        cancelled = query.filter(Order.status == OrderStatus.CANCELLED).count()
        
        # Revenue (only completed orders)
        revenue_query = query.filter(Order.status == OrderStatus.COMPLETED)
        total_revenue = revenue_query.with_entities(
            func.sum(Order.total)
        ).scalar() or 0.0
        
        avg_order_value = total_revenue / completed if completed > 0 else 0.0
        
        return {
            "total_orders": total_orders,
            "pending_orders": pending,
            "completed_orders": completed,
            "cancelled_orders": cancelled,
            "total_revenue": round(total_revenue, 2),
            "average_order_value": round(avg_order_value, 2),
        }
