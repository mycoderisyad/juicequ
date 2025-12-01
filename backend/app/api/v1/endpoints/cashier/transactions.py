"""
Cashier Transactions API.
Handle payment processing and receipts.
"""
from datetime import datetime
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.models.user import User, UserRole

router = APIRouter()


# In-memory transactions (replace with DB)
TRANSACTIONS: dict[str, dict] = {}


class PaymentMethod:
    """Payment method constants."""
    CASH = "cash"
    CARD = "card"
    DIGITAL = "digital"  # e-wallet, QRIS
    
    ALL = [CASH, CARD, DIGITAL]


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
    description="Get transaction history.",
)
async def get_transactions(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN)),
    date_from: str | None = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: str | None = Query(None, description="End date (YYYY-MM-DD)"),
    payment_method: str | None = Query(None, description="Filter by payment method"),
    limit: int = Query(50, ge=1, le=100),
):
    """Get transaction history."""
    transactions = list(TRANSACTIONS.values())
    
    # Filter by payment method
    if payment_method:
        transactions = [t for t in transactions if t["payment_method"] == payment_method]
    
    # Sort by date (newest first)
    transactions = sorted(
        transactions,
        key=lambda x: x["created_at"],
        reverse=True
    )[:limit]
    
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
    from app.api.v1.endpoints.customer.orders import ORDERS
    from app.core.exceptions import NotFoundException, BadRequestException
    
    # Validate payment method
    if request.payment_method not in PaymentMethod.ALL:
        raise BadRequestException(
            f"Invalid payment method. Must be one of: {PaymentMethod.ALL}"
        )
    
    # Find the order
    target_order = None
    for user_id, orders in ORDERS.items():
        for order in orders:
            if order["id"] == request.order_id:
                target_order = order
                break
        if target_order:
            break
    
    if not target_order:
        raise NotFoundException("Order", request.order_id)
    
    # Validate order status
    if target_order["status"] not in ["pending", "confirmed"]:
        raise BadRequestException(
            f"Cannot process payment for order with status '{target_order['status']}'"
        )
    
    # Validate payment amount
    total = target_order["total"]
    if request.amount_received < total:
        raise BadRequestException(
            f"Insufficient payment. Order total: Rp {total:,.0f}, "
            f"received: Rp {request.amount_received:,.0f}"
        )
    
    # Calculate change
    change = request.amount_received - total
    
    # Create transaction
    transaction_id = str(uuid.uuid4())
    transaction = {
        "id": transaction_id,
        "order_id": request.order_id,
        "payment_method": request.payment_method,
        "amount": total,
        "amount_received": request.amount_received,
        "change": change,
        "cashier_id": current_user.id,
        "cashier_name": current_user.nama,
        "status": "completed",
        "notes": request.notes,
        "created_at": datetime.now().isoformat(),
    }
    
    TRANSACTIONS[transaction_id] = transaction
    
    # Update order status
    target_order["status"] = "confirmed"
    target_order["payment_status"] = "paid"
    target_order["transaction_id"] = transaction_id
    target_order["updated_at"] = datetime.now().isoformat()
    
    return {
        "message": "Payment processed successfully",
        "transaction": transaction,
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
    transaction = TRANSACTIONS.get(transaction_id)
    
    if not transaction:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Transaction", transaction_id)
    
    return transaction


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
    from app.api.v1.endpoints.customer.orders import ORDERS
    from app.core.exceptions import NotFoundException
    
    transaction = TRANSACTIONS.get(transaction_id)
    if not transaction:
        raise NotFoundException("Transaction", transaction_id)
    
    # Find the order
    order_id = transaction["order_id"]
    target_order = None
    
    for user_id, orders in ORDERS.items():
        for order in orders:
            if order["id"] == order_id:
                target_order = order
                break
        if target_order:
            break
    
    if not target_order:
        raise NotFoundException("Order", order_id)
    
    # Generate receipt
    receipt = {
        "receipt_number": f"RCP-{transaction_id[:8].upper()}",
        "store_name": "JuiceQu",
        "store_tagline": "Fresh & Healthy Juice",
        "date": transaction["created_at"],
        "items": target_order["items"],
        "subtotal": target_order["subtotal"],
        "tax": target_order.get("tax", 0),
        "total": target_order["total"],
        "payment_method": transaction["payment_method"],
        "amount_received": transaction["amount_received"],
        "change": transaction["change"],
        "cashier": transaction["cashier_name"],
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
    from app.core.exceptions import NotFoundException, BadRequestException
    
    transaction = TRANSACTIONS.get(transaction_id)
    if not transaction:
        raise NotFoundException("Transaction", transaction_id)
    
    if transaction.get("refunded"):
        raise BadRequestException("This transaction has already been refunded")
    
    # Mark as refunded
    transaction["refunded"] = True
    transaction["refund_reason"] = request.reason
    transaction["refund_by"] = current_user.id
    transaction["refund_at"] = datetime.now().isoformat()
    transaction["status"] = "refunded"
    
    return {
        "message": "Refund processed successfully",
        "transaction": transaction,
        "success": True,
    }
