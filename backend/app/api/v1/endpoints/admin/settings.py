"""
Admin Settings API.
Manage application settings.
"""
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole

router = APIRouter()


# In-memory settings (replace with DB)
SETTINGS: dict[str, dict] = {
    "store": {
        "name": "JuiceQu",
        "tagline": "Fresh & Healthy Juice",
        "description": "Jus buah segar dan sehat untuk kesehatanmu",
        "logo": "/images/logo.png",
        "address": "Jl. Sehat No. 123, Jakarta",
        "phone": "+62 21 1234567",
        "email": "hello@juicequ.id",
        "updated_at": None,
    },
    "operations": {
        "opening_hours": "08:00",
        "closing_hours": "21:00",
        "is_open": True,
        "accept_orders": True,
        "delivery_available": False,
        "minimum_order": 0,
        "updated_at": None,
    },
    "payments": {
        "cash_enabled": True,
        "card_enabled": True,
        "digital_enabled": True,
        "tax_rate": 0.11,  # 11% PPN
        "service_charge": 0,
        "updated_at": None,
    },
    "notifications": {
        "order_notifications": True,
        "email_notifications": False,
        "sms_notifications": False,
        "updated_at": None,
    },
}


class StoreSettingsUpdate(BaseModel):
    """Store settings update request."""
    name: str | None = Field(None, min_length=2, max_length=100)
    tagline: str | None = Field(None, max_length=200)
    description: str | None = Field(None, max_length=500)
    logo: str | None = None
    address: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=20)
    email: str | None = None


class OperationsSettingsUpdate(BaseModel):
    """Operations settings update request."""
    opening_hours: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    closing_hours: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    is_open: bool | None = None
    accept_orders: bool | None = None
    delivery_available: bool | None = None
    minimum_order: float | None = Field(None, ge=0)


class PaymentSettingsUpdate(BaseModel):
    """Payment settings update request."""
    cash_enabled: bool | None = None
    card_enabled: bool | None = None
    digital_enabled: bool | None = None
    tax_rate: float | None = Field(None, ge=0, le=1)
    service_charge: float | None = Field(None, ge=0)


@router.get(
    "",
    summary="Get all settings",
    description="Get all application settings.",
)
async def get_all_settings(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get all settings."""
    return SETTINGS


@router.get(
    "/{category}",
    summary="Get settings category",
    description="Get settings for a specific category.",
)
async def get_settings(
    category: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get settings by category."""
    if category not in SETTINGS:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Settings category", category)
    
    return {
        "category": category,
        "settings": SETTINGS[category],
    }


@router.put(
    "/store",
    summary="Update store settings",
    description="Update store information settings.",
)
async def update_store_settings(
    request: StoreSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update store settings."""
    store = SETTINGS["store"]
    
    if request.name is not None:
        store["name"] = request.name
    if request.tagline is not None:
        store["tagline"] = request.tagline
    if request.description is not None:
        store["description"] = request.description
    if request.logo is not None:
        store["logo"] = request.logo
    if request.address is not None:
        store["address"] = request.address
    if request.phone is not None:
        store["phone"] = request.phone
    if request.email is not None:
        store["email"] = request.email
    
    store["updated_at"] = datetime.now().isoformat()
    store["updated_by"] = current_user.id
    
    return {
        "message": "Store settings updated successfully",
        "settings": store,
        "success": True,
    }


@router.put(
    "/operations",
    summary="Update operations settings",
    description="Update operational settings.",
)
async def update_operations_settings(
    request: OperationsSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update operations settings."""
    ops = SETTINGS["operations"]
    
    if request.opening_hours is not None:
        ops["opening_hours"] = request.opening_hours
    if request.closing_hours is not None:
        ops["closing_hours"] = request.closing_hours
    if request.is_open is not None:
        ops["is_open"] = request.is_open
    if request.accept_orders is not None:
        ops["accept_orders"] = request.accept_orders
    if request.delivery_available is not None:
        ops["delivery_available"] = request.delivery_available
    if request.minimum_order is not None:
        ops["minimum_order"] = request.minimum_order
    
    ops["updated_at"] = datetime.now().isoformat()
    ops["updated_by"] = current_user.id
    
    return {
        "message": "Operations settings updated successfully",
        "settings": ops,
        "success": True,
    }


@router.put(
    "/payments",
    summary="Update payment settings",
    description="Update payment settings.",
)
async def update_payment_settings(
    request: PaymentSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update payment settings."""
    pay = SETTINGS["payments"]
    
    if request.cash_enabled is not None:
        pay["cash_enabled"] = request.cash_enabled
    if request.card_enabled is not None:
        pay["card_enabled"] = request.card_enabled
    if request.digital_enabled is not None:
        pay["digital_enabled"] = request.digital_enabled
    if request.tax_rate is not None:
        pay["tax_rate"] = request.tax_rate
    if request.service_charge is not None:
        pay["service_charge"] = request.service_charge
    
    pay["updated_at"] = datetime.now().isoformat()
    pay["updated_by"] = current_user.id
    
    return {
        "message": "Payment settings updated successfully",
        "settings": pay,
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
):
    """Toggle store open/closed status."""
    ops = SETTINGS["operations"]
    ops["is_open"] = not ops["is_open"]
    ops["updated_at"] = datetime.now().isoformat()
    ops["updated_by"] = current_user.id
    
    status = "open" if ops["is_open"] else "closed"
    
    return {
        "message": f"Store is now {status}",
        "is_open": ops["is_open"],
        "success": True,
    }
