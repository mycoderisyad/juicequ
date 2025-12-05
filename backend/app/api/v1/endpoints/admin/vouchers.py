"""
Admin Voucher API endpoints.
Manage discount vouchers.
"""
from typing import Annotated, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.services.promo_service import VoucherService
from app.schemas.promo import (
    VoucherCreate,
    VoucherUpdate,
    VoucherResponse,
    VoucherListResponse,
)

router = APIRouter()


def voucher_to_response(voucher) -> dict:
    """Convert voucher model to response dict."""
    now = datetime.now(timezone.utc)
    is_valid = voucher.is_active and voucher.start_date <= now <= voucher.end_date
    
    # Calculate usage remaining
    usage_remaining = None
    if voucher.usage_limit:
        usage_remaining = max(0, voucher.usage_limit - voucher.usage_count)
    
    # Format discount display
    if voucher.voucher_type.value == "percentage":
        discount_display = f"{int(voucher.discount_value)}%"
        if voucher.max_discount:
            discount_display += f" (maks. Rp {voucher.max_discount:,.0f})"
    elif voucher.voucher_type.value == "free_shipping":
        discount_display = "Gratis Ongkir"
    else:
        discount_display = f"Rp {voucher.discount_value:,.0f}"
    
    return {
        "id": voucher.id,
        "code": voucher.code,
        "name": voucher.name,
        "description": voucher.description,
        "voucher_type": voucher.voucher_type.value,
        "discount_value": voucher.discount_value,
        "min_order_amount": voucher.min_order_amount,
        "max_discount": voucher.max_discount,
        "usage_limit": voucher.usage_limit,
        "usage_count": voucher.usage_count,
        "per_user_limit": voucher.per_user_limit,
        "start_date": voucher.start_date.isoformat(),
        "end_date": voucher.end_date.isoformat(),
        "is_active": voucher.is_active,
        "created_at": voucher.created_at.isoformat(),
        "updated_at": voucher.updated_at.isoformat(),
        "is_valid": is_valid,
        "usage_remaining": usage_remaining,
        "discount_display": discount_display,
    }


@router.get("", summary="Get all vouchers")
async def get_vouchers(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by code or name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get all vouchers with optional filtering."""
    vouchers, total = VoucherService.get_all(
        db,
        is_active=is_active,
        search=search,
        page=page,
        page_size=page_size,
    )
    
    return {
        "items": [voucher_to_response(v) for v in vouchers],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{voucher_id}", summary="Get voucher by ID")
async def get_voucher(
    voucher_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get a specific voucher by ID."""
    voucher = VoucherService.get_by_id(db, voucher_id)
    if not voucher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voucher tidak ditemukan",
        )
    return voucher_to_response(voucher)


@router.post("", summary="Create voucher", status_code=status.HTTP_201_CREATED)
async def create_voucher(
    data: VoucherCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Create a new voucher."""
    try:
        voucher = VoucherService.create(db, data)
        return voucher_to_response(voucher)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/{voucher_id}", summary="Update voucher")
async def update_voucher(
    voucher_id: str,
    data: VoucherUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update an existing voucher."""
    voucher = VoucherService.get_by_id(db, voucher_id)
    if not voucher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voucher tidak ditemukan",
        )
    
    try:
        voucher = VoucherService.update(db, voucher, data)
        return voucher_to_response(voucher)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{voucher_id}", summary="Delete voucher")
async def delete_voucher(
    voucher_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Delete a voucher."""
    voucher = VoucherService.get_by_id(db, voucher_id)
    if not voucher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voucher tidak ditemukan",
        )
    
    VoucherService.delete(db, voucher)
    return {"message": "Voucher berhasil dihapus"}
