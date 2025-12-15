"""Customer Orders API - Place orders and view order history."""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import CurrentUser
from app.core.exceptions import BadRequestException, NotFoundException, ForbiddenException
from app.db.session import get_db
from app.models.order import OrderStatus
from app.models.user import User
from app.schemas.order import (
    CustomerOrderCreate,
    OrderCreate,
    OrderItemCreate,
    ProductSize,
)
from app.serializers.order_serializer import OrderSerializer
from app.services.order_service import OrderService
from app.utils.pagination import calculate_total_pages

logger = logging.getLogger(__name__)

router = APIRouter()

SIZE_MAP = {
    "small": ProductSize.SMALL,
    "medium": ProductSize.MEDIUM,
    "large": ProductSize.LARGE,
}

PAYMENT_METHOD_MAP = {
    "cash": "cash",
    "qris": "qris",
    "transfer": "transfer",
    "digital": "qris",
    "card": "transfer",
}


@router.get("", summary="Get my orders")
async def get_my_orders(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get the current user's orders."""
    if not isinstance(current_user, User):
        return {"orders": [], "total": 0}

    status_enum = None
    if status_filter:
        try:
            status_enum = OrderStatus(status_filter)
        except ValueError:
            pass

    orders, total = OrderService.get_user_orders(
        db,
        user_id=current_user.id,
        status=status_enum,
        page=page,
        page_size=page_size,
    )

    return {
        "orders": [OrderSerializer.to_customer_list_dict(o) for o in orders],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": calculate_total_pages(total, page_size) or 1,
    }


@router.post("", summary="Create order")
async def create_order(
    request: CustomerOrderCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Create a new order."""
    if not isinstance(current_user, User):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to place an order",
        )

    try:
        order_items = [
            OrderItemCreate(
                product_id=item.product_id,
                quantity=item.quantity,
                size=SIZE_MAP.get(item.size or "medium", ProductSize.MEDIUM),
            )
            for item in request.items
        ]

        order_data = OrderCreate(
            items=order_items,
            customer_notes=request.notes,
            payment_method=PAYMENT_METHOD_MAP.get(request.payment_method, "cash"),
            is_preorder=request.is_preorder,
            scheduled_pickup_date=request.scheduled_pickup_date,
            scheduled_pickup_time=request.scheduled_pickup_time,
            voucher_id=request.voucher_id,
            voucher_code=request.voucher_code,
            voucher_discount=request.voucher_discount,
        )

        order = OrderService.create_order(db, order_data, current_user)

        return {
            "message": "Order placed successfully",
            "order": {
                "id": order.id,
                "order_number": order.order_number,
                "status": order.status.value,
                "subtotal": order.subtotal,
                "tax": order.tax,
                "total": order.total,
                "items": [
                    {
                        "product_id": item.product_id,
                        "name": item.product_name,
                        "quantity": item.quantity,
                        "price": item.unit_price,
                    }
                    for item in order.items
                ],
                "created_at": order.created_at.isoformat(),
            },
            "success": True,
        }
    except ValueError as e:
        logger.error("Order creation failed: %s", str(e))
        raise BadRequestException(str(e))
    except Exception as e:
        logger.error("Unexpected error creating order: %s", str(e))
        raise BadRequestException(f"Order creation failed: {str(e)}")


@router.get("/{order_id}", summary="Get order details")
async def get_order(
    order_id: str,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Get details of a specific order."""
    if not isinstance(current_user, User):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    order = OrderService.get_order_by_id(db, order_id)

    if not order:
        raise NotFoundException("Order", order_id)

    if order.user_id != current_user.id:
        raise ForbiddenException("You don't have permission to view this order")

    return OrderSerializer.to_customer_dict(order)


@router.post("/{order_id}/cancel", summary="Cancel order")
async def cancel_order(
    order_id: str,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Cancel a pending order."""
    if not isinstance(current_user, User):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    order = OrderService.get_order_by_id(db, order_id)

    if not order:
        raise NotFoundException("Order", order_id)

    if order.user_id != current_user.id:
        raise ForbiddenException("You don't have permission to cancel this order")

    try:
        cancelled_order = OrderService.cancel_order(db, order_id, "Cancelled by customer")
        return {
            "message": "Order cancelled successfully",
            "order": {
                "id": cancelled_order.id,
                "order_number": cancelled_order.order_number,
                "status": cancelled_order.status.value,
            },
            "success": True,
        }
    except ValueError as e:
        raise BadRequestException(str(e))
