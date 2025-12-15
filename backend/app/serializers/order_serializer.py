"""Order model serialization."""
from typing import Any

from app.models.order import Order, OrderItem


class OrderSerializer:
    """Handles Order model to dict conversion."""

    @staticmethod
    def item_to_dict(item: OrderItem, include_details: bool = False) -> dict[str, Any]:
        """Convert OrderItem to dict."""
        base = {
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "subtotal": item.subtotal,
        }
        if include_details:
            base.update(
                {
                    "size": item.size,
                    "customizations": item.customizations,
                    "notes": item.notes,
                }
            )
        return base

    @staticmethod
    def to_list_dict(order: Order) -> dict[str, Any]:
        """Convert Order to list response dict (minimal details)."""
        customer_name = order.guest_name or "Guest"
        if order.user:
            customer_name = order.user.full_name or order.user.email

        return {
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
        }

    @staticmethod
    def to_detail_dict(order: Order) -> dict[str, Any]:
        """Convert Order to detailed response dict."""
        customer_name = order.guest_name or "Guest"
        customer_email = None
        if order.user:
            customer_name = order.user.full_name or order.user.email
            customer_email = order.user.email

        return {
            "id": order.id,
            "order_number": order.order_number,
            "user_id": order.user_id,
            "customer_name": customer_name,
            "customer_email": customer_email,
            "customer_phone": order.guest_phone,
            "status": order.status.value,
            "subtotal": order.subtotal,
            "discount": order.discount,
            "tax": order.tax,
            "total": order.total,
            "payment_method": order.payment_method.value if order.payment_method else None,
            "payment_reference": order.payment_reference,
            "items": [
                OrderSerializer.item_to_dict(item, include_details=True)
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

    @staticmethod
    def to_cashier_dict(order: Order) -> dict[str, Any]:
        """Convert Order to cashier response dict."""
        return {
            "id": order.id,
            "order_number": order.order_number,
            "user_id": order.user_id,
            "status": order.status.value,
            "subtotal": order.subtotal,
            "tax": order.tax,
            "total": order.total,
            "payment_method": order.payment_method.value if order.payment_method else None,
            "customer_notes": order.customer_notes,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "subtotal": item.subtotal,
                }
                for item in order.items
            ],
            "created_at": order.created_at.isoformat(),
            "updated_at": order.updated_at.isoformat(),
        }

    @staticmethod
    def to_customer_dict(order: Order) -> dict[str, Any]:
        """Convert Order to customer response dict."""
        return {
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status.value,
            "subtotal": order.subtotal,
            "discount": order.discount,
            "tax": order.tax,
            "total": order.total,
            "payment_method": order.payment_method.value if order.payment_method else None,
            "customer_notes": order.customer_notes,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "size": item.size,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "subtotal": item.subtotal,
                    "notes": item.notes,
                }
                for item in order.items
            ],
            "created_at": order.created_at.isoformat(),
            "updated_at": order.updated_at.isoformat(),
        }

    @staticmethod
    def to_customer_list_dict(order: Order) -> dict[str, Any]:
        """Convert Order to customer list response dict."""
        return {
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status.value,
            "subtotal": order.subtotal,
            "tax": order.tax,
            "total": order.total,
            "payment_method": order.payment_method.value if order.payment_method else None,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "subtotal": item.subtotal,
                }
                for item in order.items
            ],
            "created_at": order.created_at.isoformat(),
            "updated_at": order.updated_at.isoformat(),
        }

