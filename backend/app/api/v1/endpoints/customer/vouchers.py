"""
Customer Voucher API endpoints.
Validate and apply vouchers.
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import OptionalUser
from app.services.promo_service import VoucherService
from app.schemas.promo import VoucherValidateRequest, VoucherValidateResponse

router = APIRouter()


@router.post("/validate", summary="Validate voucher code")
async def validate_voucher(
    data: VoucherValidateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: OptionalUser,
):
    """
    Validate a voucher code for an order.
    Returns discount amount and validation status.
    """
    user_id = current_user.id if current_user else None
    
    is_valid, message, voucher, discount_amount = VoucherService.validate_voucher(
        db,
        code=data.code,
        order_amount=data.order_amount,
        user_id=user_id,
    )
    
    voucher_response = None
    if voucher:
        voucher_response = {
            "id": voucher.id,
            "code": voucher.code,
            "name": voucher.name,
            "voucher_type": voucher.voucher_type.value,
            "discount_value": voucher.discount_value,
            "min_order_amount": voucher.min_order_amount,
            "max_discount": voucher.max_discount,
        }
    
    return {
        "valid": is_valid,
        "message": message,
        "voucher": voucher_response,
        "discount_amount": discount_amount,
        "final_amount": max(0, data.order_amount - discount_amount),
    }
