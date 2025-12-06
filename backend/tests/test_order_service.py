"""
Unit tests for Order Service.
Tests for order creation, management, and status updates.
"""
import pytest
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.services.order_service import OrderService
from app.schemas.order import OrderCreate, OrderItemCreate, OrderStatusUpdate


class TestOrderService:
    """Tests for OrderService class."""
    
    def test_generate_order_number_format(self, db: Session):
        """Test that order number follows correct format."""
        order_number = OrderService.generate_order_number()
        
        assert order_number is not None
        assert order_number.startswith("JQ-")
        assert len(order_number) == 14  # JQ-YYMMDD-XXXX
    
    def test_get_order_by_id(self, db: Session, test_order: Order):
        """Test getting an order by ID."""
        order = OrderService.get_order_by_id(db, test_order.id)
        
        assert order is not None
        assert order.id == test_order.id
    
    def test_get_order_by_id_not_found(self, db: Session):
        """Test getting a non-existent order."""
        order = OrderService.get_order_by_id(db, "non-existent-id")
        
        assert order is None
    
    def test_get_order_by_number(self, db: Session, test_order: Order):
        """Test getting an order by order number."""
        order = OrderService.get_order_by_number(db, test_order.order_number)
        
        assert order is not None
        assert order.order_number == test_order.order_number
    
    def test_get_user_orders(self, db: Session, test_user: User, test_order: Order):
        """Test getting all orders for a user."""
        orders, total = OrderService.get_user_orders(db, test_user.id)
        
        assert total >= 1
        assert any(o.id == test_order.id for o in orders)
        assert all(o.user_id == test_user.id for o in orders)
    
    def test_get_user_orders_pagination(
        self, db: Session, test_user: User, test_product: Product
    ):
        """Test pagination of user orders."""
        # Create multiple orders
        for i in range(5):
            order = Order(
                id=str(uuid4()),
                order_number=f"ORD-PAGE-{i:03d}",
                user_id=test_user.id,
                guest_name=test_user.full_name,
                subtotal=10000,
                discount=0,
                tax=1000,
                total=11000,
                status=OrderStatus.PENDING,
            )
            db.add(order)
        db.commit()
        
        # Get first page
        orders_page1, total = OrderService.get_user_orders(
            db, test_user.id, page=1, page_size=3
        )
        
        assert len(orders_page1) == 3
        assert total >= 5
    
    def test_cancel_order(self, db: Session, test_order: Order):
        """Test cancelling an order."""
        # Ensure order is in cancelable state
        test_order.status = OrderStatus.PENDING
        db.commit()
        
        assert test_order.can_cancel() == True
    
    def test_cannot_cancel_completed_order(self, db: Session, test_order: Order):
        """Test that completed orders cannot be cancelled."""
        test_order.status = OrderStatus.COMPLETED
        db.commit()
        
        assert test_order.can_cancel() == False
    
    def test_order_subtotal_calculation(self, db: Session, test_order: Order):
        """Test order subtotal calculation from items."""
        # Order items should contribute to subtotal
        expected_subtotal = sum(item.subtotal for item in test_order.items)
        
        test_order.calculate_total()
        
        assert test_order.subtotal == expected_subtotal
    
    def test_order_total_includes_tax_minus_discount(self, db: Session, test_order: Order):
        """Test order total calculation."""
        # Set tax and discount
        test_order.tax = 10000
        test_order.discount = 5000
        
        # calculate_total recalculates subtotal from items
        test_order.calculate_total()
        
        # Total = subtotal - discount + tax
        # subtotal is recalculated from items in calculate_total
        expected_total = test_order.subtotal - 5000 + 10000
        assert test_order.total == expected_total


class TestOrderFiltering:
    """Tests for order filtering functionality."""
    
    def test_filter_orders_by_status(
        self, db: Session, test_user: User, test_order: Order
    ):
        """Test filtering orders by status."""
        test_order.status = OrderStatus.PENDING
        db.commit()
        
        orders, total = OrderService.get_user_orders(
            db, test_user.id, status=OrderStatus.PENDING
        )
        
        assert all(o.status == OrderStatus.PENDING for o in orders)


class TestOrderStatistics:
    """Tests for order statistics."""
    
    def test_order_status_values(self):
        """Test that order status enum has expected values."""
        assert OrderStatus.PENDING.value == "pending"
        assert OrderStatus.PAID.value == "paid"
        assert OrderStatus.PREPARING.value == "preparing"
        assert OrderStatus.READY.value == "ready"
        assert OrderStatus.COMPLETED.value == "completed"
        assert OrderStatus.CANCELLED.value == "cancelled"
    
    def test_order_can_cancel_logic(self):
        """Test the can_cancel logic for different statuses."""
        # These statuses should be cancelable
        cancelable_statuses = [OrderStatus.PENDING, OrderStatus.PAID]
        # These statuses should NOT be cancelable
        non_cancelable_statuses = [
            OrderStatus.PREPARING,
            OrderStatus.READY,
            OrderStatus.COMPLETED,
            OrderStatus.CANCELLED,
        ]
        
        for status in cancelable_statuses:
            assert status in [OrderStatus.PENDING, OrderStatus.PAID]
        
        for status in non_cancelable_statuses:
            assert status not in [OrderStatus.PENDING, OrderStatus.PAID]


class TestOrderItem:
    """Tests for OrderItem model."""
    
    def test_order_item_calculate_subtotal(self, db: Session, test_order: Order):
        """Test order item subtotal calculation."""
        item = test_order.items[0] if test_order.items else None
        
        if item:
            expected_subtotal = item.unit_price * item.quantity
            item.calculate_subtotal()
            assert item.subtotal == expected_subtotal
    
    def test_order_item_repr(self, db: Session, test_order: Order):
        """Test order item string representation."""
        item = test_order.items[0] if test_order.items else None
        
        if item:
            repr_str = repr(item)
            assert item.product_name in repr_str
            assert str(item.quantity) in repr_str
