"""
Currency Exchange API.
Public and admin endpoints for currency exchange rates.
"""
from typing import Annotated, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.services.currency_service import CurrencyService
from app.services.settings_service import SettingsService

router = APIRouter()


class ConvertRequest(BaseModel):
    """Currency conversion request."""
    amount: float = Field(..., gt=0, description="Amount to convert")
    from_currency: str = Field(..., min_length=3, max_length=3, description="Source currency code")
    to_currency: str = Field(..., min_length=3, max_length=3, description="Target currency code")


class ConvertResponse(BaseModel):
    """Currency conversion response."""
    original_amount: float
    converted_amount: float
    from_currency: str
    to_currency: str
    rate: float
    is_fallback: bool = False


class ExchangeRatesResponse(BaseModel):
    """Exchange rates response."""
    base: str
    rates: Dict[str, float]
    time_last_update_utc: str
    is_fallback: bool = False
    is_cached: bool = False


class ApiKeyUpdate(BaseModel):
    """API key update request."""
    exchangerate_api_key: str = Field(..., min_length=1, description="ExchangeRate API key")


# ============== Public Endpoints ==============

@router.get(
    "/rates",
    response_model=ExchangeRatesResponse,
    summary="Get exchange rates",
    description="Get current exchange rates. Uses cached rates if available.",
)
async def get_exchange_rates(
    db: Annotated[Session, Depends(get_db)],
    base: str = Query(default="USD", description="Base currency code"),
) -> Dict[str, Any]:
    """Get exchange rates for display currency."""
    rates = await CurrencyService.fetch_exchange_rates(db, base.upper())
    
    # Check if using cached rates
    cached = CurrencyService.get_cached_rates(db)
    is_cached = cached is not None and cached.get("base") == base.upper()
    
    return {
        **rates,
        "is_cached": is_cached,
    }


@router.post(
    "/convert",
    response_model=ConvertResponse,
    summary="Convert currency",
    description="Convert an amount from one currency to another.",
)
async def convert_currency(
    request: ConvertRequest,
    db: Annotated[Session, Depends(get_db)],
) -> Dict[str, Any]:
    """Convert amount between currencies."""
    from_curr = request.from_currency.upper()
    to_curr = request.to_currency.upper()
    
    # Get rates (uses USD as base for consistency)
    rates = await CurrencyService.fetch_exchange_rates(db, "USD")
    
    # Get rate
    rate = CurrencyService.get_rate(from_curr, to_curr, rates)
    if rate is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot convert between {from_curr} and {to_curr}"
        )
    
    converted = CurrencyService.convert_amount(
        request.amount, from_curr, to_curr, rates
    )
    
    return {
        "original_amount": request.amount,
        "converted_amount": round(converted, 2),
        "from_currency": from_curr,
        "to_currency": to_curr,
        "rate": round(rate, 6),
        "is_fallback": rates.get("is_fallback", False),
    }


@router.get(
    "/rate",
    summary="Get single rate",
    description="Get exchange rate between two currencies.",
)
async def get_single_rate(
    db: Annotated[Session, Depends(get_db)],
    from_currency: str = Query(..., alias="from", description="Source currency"),
    to_currency: str = Query(..., alias="to", description="Target currency"),
) -> Dict[str, Any]:
    """Get single exchange rate."""
    from_curr = from_currency.upper()
    to_curr = to_currency.upper()
    
    rates = await CurrencyService.fetch_exchange_rates(db, "USD")
    rate = CurrencyService.get_rate(from_curr, to_curr, rates)
    
    if rate is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rate not available for {from_curr} to {to_curr}"
        )
    
    return {
        "from": from_curr,
        "to": to_curr,
        "rate": round(rate, 6),
        "is_fallback": rates.get("is_fallback", False),
    }


# ============== Admin Endpoints ==============

@router.post(
    "/refresh",
    summary="Refresh exchange rates",
    description="Force refresh exchange rates from API (admin only).",
)
async def refresh_rates(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Force refresh exchange rates."""
    rates = await CurrencyService.refresh_rates(db)
    
    return {
        "message": "Exchange rates refreshed",
        "base": rates.get("base"),
        "rates_count": len(rates.get("rates", {})),
        "is_fallback": rates.get("is_fallback", False),
        "success": True,
    }


@router.get(
    "/api-key-status",
    summary="Check API key status",
    description="Check if ExchangeRate API key is configured (admin only).",
)
async def get_api_key_status(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Check API key configuration status."""
    api_key = CurrencyService.get_api_key(db)
    
    # Get cached rates info
    cached = CurrencyService.get_cached_rates(db)
    last_update = SettingsService.get_setting(db, "exchange_rates_updated")
    
    return {
        "has_api_key": bool(api_key),
        "api_key_preview": f"{api_key[:8]}..." if api_key and len(api_key) > 8 else None,
        "has_cached_rates": cached is not None,
        "last_update": last_update,
        "base_currency": SettingsService.get_setting(db, "base_currency") or "USD",
    }


@router.put(
    "/api-key",
    summary="Update API key",
    description="Update ExchangeRate API key (admin only).",
)
async def update_api_key(
    request: ApiKeyUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    """Update ExchangeRate API key."""
    # Save API key
    SettingsService.update_setting(db, "exchangerate_api_key", request.exchangerate_api_key)
    
    # Try to fetch rates with new key
    try:
        rates = await CurrencyService.refresh_rates(db)
        is_valid = not rates.get("is_fallback", True)
    except Exception:
        is_valid = False
    
    return {
        "message": "API key updated" + (" and validated" if is_valid else " but validation failed"),
        "is_valid": is_valid,
        "success": True,
    }
