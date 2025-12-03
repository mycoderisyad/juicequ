"""
Public Store Info API.
Get public store information for customers (no auth required).
"""
from typing import Annotated, Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.settings_service import SettingsService

router = APIRouter()


@router.get(
    "",
    summary="Get public store info",
    description="Get public store information including location, hours, and contact.",
)
async def get_store_info(
    db: Annotated[Session, Depends(get_db)],
) -> Dict[str, Any]:
    """Get public store information."""
    # Ensure default settings exist
    SettingsService.seed_default_settings(db)
    
    return SettingsService.get_public_store_info(db)


@router.get(
    "/location",
    summary="Get store location",
    description="Get store location for map display.",
)
async def get_store_location(
    db: Annotated[Session, Depends(get_db)],
) -> Dict[str, Any]:
    """Get store location coordinates."""
    SettingsService.seed_default_settings(db)
    
    store = SettingsService.get_store_settings(db)
    
    return {
        "address": store["store_address"],
        "city": store["store_city"],
        "province": store["store_province"],
        "postal_code": store["store_postal_code"],
        "latitude": store["store_latitude"],
        "longitude": store["store_longitude"],
        "full_address": f"{store['store_address']}, {store['store_city']}, {store['store_province']} {store['store_postal_code']}",
    }


@router.get(
    "/hours",
    summary="Get store hours",
    description="Get store operating hours.",
)
async def get_store_hours(
    db: Annotated[Session, Depends(get_db)],
) -> Dict[str, Any]:
    """Get store operating hours."""
    SettingsService.seed_default_settings(db)
    
    ops = SettingsService.get_operations_settings(db)
    is_currently_open = SettingsService.is_store_currently_open(db)
    
    return {
        "opening_time": ops["opening_time"],
        "closing_time": ops["closing_time"],
        "days_open": ops["days_open"],
        "is_store_open": ops["is_store_open"],
        "is_currently_open": is_currently_open,
        "accept_orders": ops["accept_orders"],
    }


@router.get(
    "/currency",
    summary="Get currency settings",
    description="Get currency information for price display.",
)
async def get_currency_info(
    db: Annotated[Session, Depends(get_db)],
) -> Dict[str, str]:
    """Get currency information."""
    SettingsService.seed_default_settings(db)
    
    return SettingsService.get_currency_info(db)


@router.get(
    "/social",
    summary="Get social media links",
    description="Get store social media links.",
)
async def get_social_links(
    db: Annotated[Session, Depends(get_db)],
) -> Dict[str, Any]:
    """Get social media links."""
    SettingsService.seed_default_settings(db)
    
    social = SettingsService.get_social_settings(db)
    
    return {
        "instagram": social["social_instagram"],
        "facebook": social["social_facebook"],
        "twitter": social["social_twitter"],
        "whatsapp": social["social_whatsapp"],
    }


@router.get(
    "/payment-methods",
    summary="Get available payment methods",
    description="Get available payment methods for checkout.",
)
async def get_payment_methods(
    db: Annotated[Session, Depends(get_db)],
) -> Dict[str, Any]:
    """Get available payment methods."""
    SettingsService.seed_default_settings(db)
    
    payments = SettingsService.get_payment_settings(db)
    
    methods = []
    if payments["cash_enabled"]:
        methods.append({"id": "cash", "name": "Tunai", "icon": "banknote"})
    if payments["card_enabled"]:
        methods.append({"id": "card", "name": "Kartu Kredit/Debit", "icon": "credit-card"})
    if payments["digital_enabled"]:
        methods.append({"id": "ewallet", "name": "E-Wallet", "icon": "smartphone"})
    if payments["bank_transfer_enabled"]:
        methods.append({"id": "transfer", "name": "Transfer Bank", "icon": "building"})
    
    return {
        "methods": methods,
        "tax_rate": payments["tax_rate"],
        "service_charge": payments["service_charge"],
    }
