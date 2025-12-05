"""
Admin Promo API endpoints.
Manage product promotions.
"""
from typing import Annotated, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.services.promo_service import PromoService
from app.services.product_service import ProductService
from app.schemas.promo import (
    ProductPromoCreate,
    ProductPromoUpdate,
    ProductPromoResponse,
    ProductPromoListResponse,
)

router = APIRouter()


def promo_to_response(promo) -> dict:
    """Convert promo model to response dict."""
    now = datetime.now(timezone.utc)
    is_valid = promo.is_active and promo.start_date <= now <= promo.end_date
    
    discount_display = f"{int(promo.discount_value)}%" if promo.promo_type.value == "percentage" else f"Rp {promo.discount_value:,.0f}"
    
    return {
        "id": promo.id,
        "product_id": promo.product_id,
        "name": promo.name,
        "description": promo.description,
        "promo_type": promo.promo_type.value,
        "discount_value": promo.discount_value,
        "start_date": promo.start_date.isoformat(),
        "end_date": promo.end_date.isoformat(),
        "is_active": promo.is_active,
        "created_at": promo.created_at.isoformat(),
        "updated_at": promo.updated_at.isoformat(),
        "is_valid": is_valid,
        "discount_display": discount_display,
    }


@router.get("", summary="Get all product promos")
async def get_promos(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get all product promos with optional filtering."""
    promos, total = PromoService.get_all(
        db,
        product_id=product_id,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )
    
    return {
        "items": [promo_to_response(p) for p in promos],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{promo_id}", summary="Get promo by ID")
async def get_promo(
    promo_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get a specific promo by ID."""
    promo = PromoService.get_by_id(db, promo_id)
    if not promo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo tidak ditemukan",
        )
    return promo_to_response(promo)


@router.post("", summary="Create product promo", status_code=status.HTTP_201_CREATED)
async def create_promo(
    data: ProductPromoCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Create a new product promo."""
    # Verify product exists
    product = ProductService.get_by_id(db, data.product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produk tidak ditemukan",
        )
    
    # Check for existing active promo
    existing = PromoService.get_active_promo_for_product(db, data.product_id)
    if existing and data.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Produk sudah memiliki promo aktif. Nonaktifkan promo yang ada terlebih dahulu.",
        )
    
    promo = PromoService.create(db, data)
    return promo_to_response(promo)


@router.put("/{promo_id}", summary="Update product promo")
async def update_promo(
    promo_id: str,
    data: ProductPromoUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update an existing product promo."""
    promo = PromoService.get_by_id(db, promo_id)
    if not promo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo tidak ditemukan",
        )
    
    # If activating, check for existing active promo
    if data.is_active and not promo.is_active:
        existing = PromoService.get_active_promo_for_product(db, promo.product_id)
        if existing and existing.id != promo_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Produk sudah memiliki promo aktif lainnya.",
            )
    
    promo = PromoService.update(db, promo, data)
    return promo_to_response(promo)


@router.delete("/{promo_id}", summary="Delete product promo")
async def delete_promo(
    promo_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Delete a product promo."""
    promo = PromoService.get_by_id(db, promo_id)
    if not promo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promo tidak ditemukan",
        )
    
    PromoService.delete(db, promo)
    return {"message": "Promo berhasil dihapus"}
