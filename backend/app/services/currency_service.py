"""
Currency Exchange Service.
Handles fetching and caching exchange rates from ExchangeRate API.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session

from app.config import settings as app_settings
from app.services.settings_service import SettingsService

logger = logging.getLogger(__name__)

# Cache duration: 6 hours
CACHE_DURATION_HOURS = 6

# ExchangeRate API base URL
EXCHANGERATE_API_BASE = "https://v6.exchangerate-api.com/v6"


class CurrencyService:
    """Service for managing currency exchange rates."""

    @staticmethod
    def get_api_key(db: Session) -> Optional[str]:
        api_key = SettingsService.get_setting(db, "exchangerate_api_key")
        if api_key:
            return api_key
        
        # Fallback to environment variable
        if app_settings.exchangerate_api_key:
            return app_settings.exchangerate_api_key
        
        return None

    @staticmethod
    def get_cached_rates(db: Session) -> Optional[Dict[str, Any]]:
        """Get cached exchange rates if still valid."""
        rates = SettingsService.get_setting(db, "exchange_rates")
        updated_str = SettingsService.get_setting(db, "exchange_rates_updated")
        
        if not rates or not updated_str:
            return None
        
        try:
            updated_time = datetime.fromisoformat(updated_str)
            if datetime.now() - updated_time < timedelta(hours=CACHE_DURATION_HOURS):
                return rates
        except (ValueError, TypeError):
            pass
        
        return None

    @staticmethod
    async def fetch_exchange_rates(db: Session, base_currency: str = "USD") -> Dict[str, Any]:
        """
        Fetch exchange rates from ExchangeRate API.
        Returns cached rates if available and not expired.
        """
        # Check cache first
        cached = CurrencyService.get_cached_rates(db)
        if cached and cached.get("base") == base_currency:
            logger.info("Using cached exchange rates")
            return cached

        # Get API key
        api_key = CurrencyService.get_api_key(db)
        if not api_key:
            logger.warning("No ExchangeRate API key configured")
            return CurrencyService._get_fallback_rates(base_currency)

        # Fetch from API
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{EXCHANGERATE_API_BASE}/{api_key}/latest/{base_currency}"
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()

            if data.get("result") == "success":
                rates_data = {
                    "base": base_currency,
                    "rates": data.get("conversion_rates", {}),
                    "time_last_update_utc": data.get("time_last_update_utc", ""),
                }
                
                # Cache the rates
                CurrencyService._cache_rates(db, rates_data)
                logger.info(f"Fetched and cached exchange rates for {base_currency}")
                return rates_data
            else:
                logger.error(f"ExchangeRate API error: {data.get('error-type', 'unknown')}")
                return CurrencyService._get_fallback_rates(base_currency)

        except httpx.RequestError as e:
            logger.error(f"Failed to fetch exchange rates: {e}")
            # Return cached rates even if expired, or fallback
            cached = SettingsService.get_setting(db, "exchange_rates")
            if cached:
                return cached
            return CurrencyService._get_fallback_rates(base_currency)

    @staticmethod
    def _cache_rates(db: Session, rates_data: Dict[str, Any]) -> None:
        """Cache exchange rates in database."""
        SettingsService.update_setting(db, "exchange_rates", rates_data)
        SettingsService.update_setting(db, "exchange_rates_updated", datetime.now().isoformat())
        SettingsService.update_setting(db, "base_currency", rates_data.get("base", "USD"))

    @staticmethod
    def _get_fallback_rates(base_currency: str) -> Dict[str, Any]:
        """Return fallback rates when API is unavailable."""
        # Approximate rates as of 2025 (for fallback)
        fallback_rates = {
            "USD": {
                "IDR": 16700,
                "EUR": 0.86,
                "GBP": 0.73,
                "SGD": 1.30,
                "MYR": 4.20,
                "JPY": 155.0,
                "AUD": 1.50,
                "CNY": 7.25,
                "THB": 32.5,
                "PHP": 56.0,
                "VND": 24000,
                "KRW": 1420,
                "INR": 90.0
            }
        }
        
        if base_currency == "USD":
            rates = {"USD": 1.0, **fallback_rates["USD"]}
        elif base_currency in fallback_rates["USD"]:
            # Convert from USD-based rates
            usd_to_base = fallback_rates["USD"][base_currency]
            rates = {
                currency: rate / usd_to_base 
                for currency, rate in fallback_rates["USD"].items()
            }
            rates["USD"] = 1 / usd_to_base
            rates[base_currency] = 1.0
        else:
            rates = {"USD": 1.0}
        
        return {
            "base": base_currency,
            "rates": rates,
            "time_last_update_utc": "fallback rates",
            "is_fallback": True,
        }

    @staticmethod
    def convert_amount(
        amount: float,
        from_currency: str,
        to_currency: str,
        rates: Dict[str, Any]
    ) -> float:
        """
        Convert amount between currencies using provided rates.
        Rates should be based on the 'base' currency.
        """
        if from_currency == to_currency:
            return amount
        
        base = rates.get("base", "USD")
        rate_dict = rates.get("rates", {})
        
        # Convert from_currency to base first
        if from_currency == base:
            amount_in_base = amount
        elif from_currency in rate_dict:
            amount_in_base = amount / rate_dict[from_currency]
        else:
            logger.warning(f"Currency {from_currency} not found in rates")
            return amount
        
        # Convert from base to to_currency
        if to_currency == base:
            return amount_in_base
        elif to_currency in rate_dict:
            return amount_in_base * rate_dict[to_currency]
        else:
            logger.warning(f"Currency {to_currency} not found in rates")
            return amount

    @staticmethod
    def get_rate(
        from_currency: str,
        to_currency: str,
        rates: Dict[str, Any]
    ) -> Optional[float]:
        """Get exchange rate between two currencies."""
        if from_currency == to_currency:
            return 1.0
        
        base = rates.get("base", "USD")
        rate_dict = rates.get("rates", {})
        
        # Calculate rate
        if from_currency == base and to_currency in rate_dict:
            return rate_dict[to_currency]
        elif to_currency == base and from_currency in rate_dict:
            return 1 / rate_dict[from_currency]
        elif from_currency in rate_dict and to_currency in rate_dict:
            # Cross rate calculation
            return rate_dict[to_currency] / rate_dict[from_currency]
        
        return None

    @staticmethod
    async def refresh_rates(db: Session) -> Dict[str, Any]:
        """Force refresh exchange rates from API."""
        # Clear cache first
        SettingsService.update_setting(db, "exchange_rates_updated", "")
        
        # Get base currency from settings
        base_currency = SettingsService.get_setting(db, "base_currency") or "USD"
        
        return await CurrencyService.fetch_exchange_rates(db, base_currency)
