"""
Admin Settings API.
Manage application settings - stored in database.
"""
from datetime import datetime
from typing import Annotated, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.services.settings_service import SettingsService

router = APIRouter()


# Request schemas
class StoreSettingsUpdate(BaseModel):
    """Store settings update request."""
    store_name: str | None = Field(None, min_length=2, max_length=100)
    store_tagline: str | None = Field(None, max_length=200)
    store_description: str | None = Field(None, max_length=1000)
    store_address: str | None = Field(None, max_length=500)
    store_phone: str | None = Field(None, max_length=20)
    store_email: str | None = None
    store_logo: str | None = None
    store_latitude: float | None = None
    store_longitude: float | None = None
    store_city: str | None = Field(None, max_length=100)
    store_province: str | None = Field(None, max_length=100)
    store_postal_code: str | None = Field(None, max_length=10)
    currency_code: str | None = Field(None, max_length=5)
    currency_symbol: str | None = Field(None, max_length=10)
    currency_locale: str | None = Field(None, max_length=10)


class OperationsSettingsUpdate(BaseModel):
    """Operations settings update request."""
    opening_time: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    closing_time: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    days_open: list[str] | None = None
    is_store_open: bool | None = None
    accept_orders: bool | None = None
    delivery_available: bool | None = None
    minimum_order: int | None = Field(None, ge=0)
    order_types: list[str] | None = None


class PaymentSettingsUpdate(BaseModel):
    """Payment settings update request."""
    cash_enabled: bool | None = None
    card_enabled: bool | None = None
    digital_enabled: bool | None = None
    bank_transfer_enabled: bool | None = None
    tax_rate: float | None = Field(None, ge=0, le=100)
    service_charge: float | None = Field(None, ge=0, le=100)


class NotificationSettingsUpdate(BaseModel):
    """Notification settings update request."""
    notify_new_order: bool | None = None
    notify_low_stock: bool | None = None
    notify_review: bool | None = None
    low_stock_threshold: int | None = Field(None, ge=0)


class SocialSettingsUpdate(BaseModel):
    """Social media settings update request."""
    social_instagram: str | None = None
    social_facebook: str | None = None
    social_twitter: str | None = None
    social_whatsapp: str | None = None


def _update_settings(db: Session, updates: BaseModel) -> int:
    """Helper to update settings from a pydantic model."""
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    return SettingsService.update_settings_bulk(db, update_dict)


@router.get(
    "",
    summary="Get all settings",
    description="Get all application settings grouped by category.",
)
async def get_all_settings(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Get all settings."""
    # Ensure default settings exist
    SettingsService.seed_default_settings(db)
    
    return {
        "store": SettingsService.get_store_settings(db),
        "operations": SettingsService.get_operations_settings(db),
        "payments": SettingsService.get_payment_settings(db),
        "notifications": SettingsService.get_notification_settings(db),
        "social": SettingsService.get_social_settings(db),
    }


@router.get(
    "/{category}",
    summary="Get settings category",
    description="Get settings for a specific category.",
)
async def get_settings_by_category(
    category: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Get settings by category."""
    # Ensure default settings exist
    SettingsService.seed_default_settings(db)
    
    category_map = {
        "store": SettingsService.get_store_settings,
        "operations": SettingsService.get_operations_settings,
        "payments": SettingsService.get_payment_settings,
        "notifications": SettingsService.get_notification_settings,
        "social": SettingsService.get_social_settings,
    }
    
    if category not in category_map:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Settings category '{category}' not found"
        )
    
    return {
        "category": category,
        "settings": category_map[category](db),
    }


@router.put(
    "/store",
    summary="Update store settings",
    description="Update store information settings including location and currency.",
)
async def update_store_settings(
    request: StoreSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Update store settings."""
    count = _update_settings(db, request)
    
    return {
        "message": "Store settings updated successfully",
        "settings": SettingsService.get_store_settings(db),
        "updated_count": count,
        "success": True,
    }


@router.put(
    "/operations",
    summary="Update operations settings",
    description="Update operational settings like hours and availability.",
)
async def update_operations_settings(
    request: OperationsSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Update operations settings."""
    count = _update_settings(db, request)
    
    return {
        "message": "Operations settings updated successfully",
        "settings": SettingsService.get_operations_settings(db),
        "updated_count": count,
        "success": True,
    }


@router.put(
    "/payments",
    summary="Update payment settings",
    description="Update payment method settings and tax/charges.",
)
async def update_payment_settings(
    request: PaymentSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Update payment settings."""
    count = _update_settings(db, request)
    
    return {
        "message": "Payment settings updated successfully",
        "settings": SettingsService.get_payment_settings(db),
        "updated_count": count,
        "success": True,
    }


@router.put(
    "/notifications",
    summary="Update notification settings",
    description="Update notification preferences.",
)
async def update_notification_settings(
    request: NotificationSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Update notification settings."""
    count = _update_settings(db, request)
    
    return {
        "message": "Notification settings updated successfully",
        "settings": SettingsService.get_notification_settings(db),
        "updated_count": count,
        "success": True,
    }


@router.put(
    "/social",
    summary="Update social media settings",
    description="Update social media links.",
)
async def update_social_settings(
    request: SocialSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Update social media settings."""
    count = _update_settings(db, request)
    
    return {
        "message": "Social settings updated successfully",
        "settings": SettingsService.get_social_settings(db),
        "updated_count": count,
        "success": True,
    }


@router.post(
    "/toggle-store",
    summary="Toggle store status",
    description="Quick toggle to open/close the store.",
)
async def toggle_store(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Toggle store open/closed status."""
    current = SettingsService.get_setting(db, "is_store_open")
    new_value = not current if current is not None else False
    
    SettingsService.update_setting(db, "is_store_open", new_value)
    
    status_text = "open" if new_value else "closed"
    
    return {
        "message": f"Store is now {status_text}",
        "is_open": new_value,
        "success": True,
    }


@router.post(
    "/seed",
    summary="Seed default settings",
    description="Initialize default settings if not exist.",
)
async def seed_settings(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Seed default settings."""
    count = SettingsService.seed_default_settings(db)
    
    return {
        "message": f"Seeded {count} new settings",
        "count": count,
        "success": True,
    }
