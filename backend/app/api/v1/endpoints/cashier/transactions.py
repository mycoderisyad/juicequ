"""
Cashier Transactions API.
Handle payment processing and receipts.
"""
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus, PaymentMethod
from app.services.order_service import OrderService

router = APIRouter()


class ProcessPaymentRequest(BaseModel):
    """Request to process a payment."""
    order_id: str = Field(..., description="Order ID to process payment for")
    payment_method: str = Field(..., description="Payment method used")
    amount_received: float = Field(..., gt=0, description="Amount received from customer")
    notes: str | None = Field(None, max_length=500, description="Transaction notes")


class RefundRequest(BaseModel):
    """Request to process a refund."""
    reason: str = Field(..., min_length=10, max_length=500, description="Refund reason")


@router.get(
    "",
    summary="Get transactions",
    description="Get transaction history (completed payments).",
)
async def get_transactions(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
    date_from: str | None = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: str | None = Query(None, description="End date (YYYY-MM-DD)"),
    payment_method: str | None = Query(None, description="Filter by payment method"),
    limit: int = Query(50, ge=1, le=100),
):
    """Get transaction history from paid orders."""
    # Query paid/completed orders from database
    query = db.query(Order).filter(
        Order.status.in_([OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED])
    )
    
    # Filter by payment method
    if payment_method:
        try:
            pm_enum = PaymentMethod(payment_method)
            query = query.filter(Order.payment_method == pm_enum)
        except ValueError:
            pass
    
    # Filter by date range
    if date_from:
        try:
            start_date = datetime.fromisoformat(date_from)
            query = query.filter(Order.paid_at >= start_date)
        except ValueError:
            pass
    
    if date_to:
        try:
            end_date = datetime.fromisoformat(date_to)
            query = query.filter(Order.paid_at <= end_date)
        except ValueError:
            pass
    
    # Get orders
    orders = query.order_by(Order.paid_at.desc()).limit(limit).all()
    
    # Convert to transaction format
    transactions = []
    for order in orders:
        transactions.append({
            "id": order.id,
            "order_id": order.id,
            "order_number": order.order_number,
            "payment_method": order.payment_method.value if order.payment_method else None,
            "amount": order.total,
            "status": "completed" if order.status == OrderStatus.COMPLETED else "paid",
            "cashier_id": None,  # Not tracked in current Order model
            "created_at": order.paid_at.isoformat() if order.paid_at else order.created_at.isoformat(),
        })
    
    return {
        "transactions": transactions,
        "total": len(transactions),
    }


@router.post(
    "/process",
    summary="Process payment",
    description="Process payment for an order.",
)
async def process_payment(
    request: ProcessPaymentRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Process payment for an order."""
    # Map payment method
    payment_method_map = {
        "cash": PaymentMethod.CASH,
        "card": PaymentMethod.TRANSFER,
        "digital": PaymentMethod.QRIS,
        "qris": PaymentMethod.QRIS,
        "transfer": PaymentMethod.TRANSFER,
    }
    
    payment_method = payment_method_map.get(request.payment_method.lower())
    if not payment_method:
        raise BadRequestException(
            f"Invalid payment method. Must be one of: cash, qris, transfer"
        )
    
    # Find the order
    order = OrderService.get_order_by_id(db, request.order_id)
    
    if not order:
        raise NotFoundException("Order", request.order_id)
    
    # Validate order status
    if order.status not in [OrderStatus.PENDING]:
        raise BadRequestException(
            f"Cannot process payment for order with status '{order.status.value}'"
        )
    
    # Validate payment amount
    if request.amount_received < order.total:
        raise BadRequestException(
            f"Insufficient payment. Order total: Rp {order.total:,.0f}, "
            f"received: Rp {request.amount_received:,.0f}"
        )
    
    # Calculate change
    change = request.amount_received - order.total
    
    # Update order with payment info
    order.payment_method = payment_method
    order.status = OrderStatus.PAID
    order.paid_at = datetime.now()
    order.payment_reference = f"PMT-{order.order_number}"
    
    if request.notes:
        existing_notes = order.internal_notes or ""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        order.internal_notes = existing_notes + f"\n[{timestamp}] Payment: {request.notes}"
    
    db.commit()
    db.refresh(order)
    
    return {
        "message": "Payment processed successfully",
        "transaction": {
            "id": order.id,
            "order_id": order.id,
            "order_number": order.order_number,
            "payment_method": order.payment_method.value,
            "amount": order.total,
            "amount_received": request.amount_received,
            "change": change,
            "cashier_id": current_user.id,
            "cashier_name": current_user.nama,
            "status": "completed",
            "created_at": order.paid_at.isoformat(),
        },
        "change": change,
        "success": True,
    }


@router.get(
    "/{transaction_id}",
    summary="Get transaction details",
    description="Get detailed information about a transaction.",
)
async def get_transaction(
    transaction_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Get details of a specific transaction."""
    order = OrderService.get_order_by_id(db, transaction_id)
    
    if not order:
        raise NotFoundException("Transaction", transaction_id)
    
    if not order.paid_at:
        raise NotFoundException("Transaction", transaction_id)
    
    return {
        "id": order.id,
        "order_id": order.id,
        "order_number": order.order_number,
        "payment_method": order.payment_method.value if order.payment_method else None,
        "amount": order.total,
        "status": "completed" if order.status == OrderStatus.COMPLETED else "paid",
        "payment_reference": order.payment_reference,
        "created_at": order.paid_at.isoformat() if order.paid_at else order.created_at.isoformat(),
    }


@router.get(
    "/{transaction_id}/receipt",
    summary="Get receipt",
    description="Generate receipt for a transaction.",
)
async def get_receipt(
    transaction_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Generate a receipt for the transaction."""
    order = OrderService.get_order_by_id(db, transaction_id)
    
    if not order:
        raise NotFoundException("Transaction", transaction_id)
    
    # Generate receipt
    receipt = {
        "receipt_number": f"RCP-{order.order_number}",
        "store_name": "JuiceQu",
        "store_tagline": "Fresh & Healthy Juice",
        "date": order.paid_at.isoformat() if order.paid_at else order.created_at.isoformat(),
        "items": [
            {
                "name": item.product_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ],
        "subtotal": order.subtotal,
        "discount": order.discount,
        "tax": order.tax,
        "total": order.total,
        "payment_method": order.payment_method.value if order.payment_method else None,
        "message": "Terima kasih telah berbelanja di JuiceQu! 🍹",
    }
    
    return receipt


@router.post(
    "/{transaction_id}/refund",
    summary="Process refund",
    description="Process refund for a transaction.",
)
async def process_refund(
    transaction_id: str,
    request: RefundRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
):
    """Process refund for a transaction."""
    order = OrderService.get_order_by_id(db, transaction_id)
    
    if not order:
        raise NotFoundException("Transaction", transaction_id)
    
    if order.status == OrderStatus.CANCELLED:
        raise BadRequestException("This order has already been cancelled/refunded")
    
    # Cancel the order (which also restores stock)
    try:
        cancelled_order = OrderService.cancel_order(
            db,
            transaction_id,
            f"Refund by {current_user.nama}: {request.reason}"
        )
        
        return {
            "message": "Refund processed successfully",
            "transaction": {
                "id": cancelled_order.id,
                "order_number": cancelled_order.order_number,
                "status": "refunded",
                "refund_reason": request.reason,
                "refund_by": current_user.id,
                "refund_at": datetime.now().isoformat(),
            },
            "success": True,
        }
    except ValueError as e:
        raise BadRequestException(str(e))
