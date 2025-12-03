"""
Settings Service.
Business logic for store settings management.
"""
import json
import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.models.settings import StoreSetting, DEFAULT_SETTINGS

logger = logging.getLogger(__name__)


class SettingsService:
    """Service for managing store settings."""

    @staticmethod
    def get_setting(db: Session, key: str) -> Optional[Any]:
        """Get a single setting value by key."""
        setting = db.query(StoreSetting).filter(StoreSetting.key == key).first()
        if setting:
            return setting.get_typed_value()
        return None

    @staticmethod
    def get_settings_by_category(db: Session, category: str) -> Dict[str, Any]:
        """Get all settings in a category as a dictionary."""
        settings = db.query(StoreSetting).filter(StoreSetting.category == category).all()
        return {s.key: s.get_typed_value() for s in settings}

    @staticmethod
    def get_all_settings(db: Session) -> Dict[str, Dict[str, Any]]:
        """Get all settings grouped by category."""
        settings = db.query(StoreSetting).all()
        result: Dict[str, Dict[str, Any]] = {}
        
        for setting in settings:
            if setting.category not in result:
                result[setting.category] = {}
            result[setting.category][setting.key] = setting.get_typed_value()
        
        return result

    @staticmethod
    def update_setting(db: Session, key: str, value: Any) -> Optional[StoreSetting]:
        """Update a single setting."""
        setting = db.query(StoreSetting).filter(StoreSetting.key == key).first()
        if setting:
            setting.value = StoreSetting.set_typed_value(value, setting.value_type)
            db.commit()
            db.refresh(setting)
            logger.info(f"Updated setting: {key}")
        return setting

    @staticmethod
    def update_settings_bulk(db: Session, updates: Dict[str, Any]) -> int:
        """Update multiple settings at once."""
        count = 0
        for key, value in updates.items():
            setting = db.query(StoreSetting).filter(StoreSetting.key == key).first()
            if setting:
                setting.value = StoreSetting.set_typed_value(value, setting.value_type)
                count += 1
        
        if count > 0:
            db.commit()
            logger.info(f"Updated {count} settings")
        
        return count

    @staticmethod
    def get_store_settings(db: Session) -> Dict[str, Any]:
        """Get store settings formatted for response."""
        settings = SettingsService.get_settings_by_category(db, "store")
        return {
            "store_name": settings.get("store_name", "JuiceQu"),
            "store_tagline": settings.get("store_tagline", "Fresh & Healthy Juices"),
            "store_description": settings.get("store_description", ""),
            "store_address": settings.get("store_address", ""),
            "store_phone": settings.get("store_phone", ""),
            "store_email": settings.get("store_email", ""),
            "store_logo": settings.get("store_logo", ""),
            "store_latitude": settings.get("store_latitude", 0.0),
            "store_longitude": settings.get("store_longitude", 0.0),
            "store_city": settings.get("store_city", ""),
            "store_province": settings.get("store_province", ""),
            "store_postal_code": settings.get("store_postal_code", ""),
            "currency_code": settings.get("currency_code", "IDR"),
            "currency_symbol": settings.get("currency_symbol", "Rp"),
            "currency_locale": settings.get("currency_locale", "id-ID"),
        }

    @staticmethod
    def get_operations_settings(db: Session) -> Dict[str, Any]:
        """Get operations settings formatted for response."""
        settings = SettingsService.get_settings_by_category(db, "operations")
        return {
            "opening_time": settings.get("opening_time", "08:00"),
            "closing_time": settings.get("closing_time", "22:00"),
            "days_open": settings.get("days_open", []),
            "is_store_open": settings.get("is_store_open", True),
            "accept_orders": settings.get("accept_orders", True),
            "delivery_available": settings.get("delivery_available", True),
            "minimum_order": settings.get("minimum_order", 0),
            "order_types": settings.get("order_types", []),
        }

    @staticmethod
    def get_payment_settings(db: Session) -> Dict[str, Any]:
        """Get payment settings formatted for response."""
        settings = SettingsService.get_settings_by_category(db, "payments")
        return {
            "cash_enabled": settings.get("cash_enabled", True),
            "card_enabled": settings.get("card_enabled", True),
            "digital_enabled": settings.get("digital_enabled", True),
            "bank_transfer_enabled": settings.get("bank_transfer_enabled", True),
            "tax_rate": settings.get("tax_rate", 11.0),
            "service_charge": settings.get("service_charge", 0.0),
        }

    @staticmethod
    def get_notification_settings(db: Session) -> Dict[str, Any]:
        """Get notification settings formatted for response."""
        settings = SettingsService.get_settings_by_category(db, "notifications")
        return {
            "notify_new_order": settings.get("notify_new_order", True),
            "notify_low_stock": settings.get("notify_low_stock", True),
            "notify_review": settings.get("notify_review", True),
            "low_stock_threshold": settings.get("low_stock_threshold", 10),
        }

    @staticmethod
    def get_social_settings(db: Session) -> Dict[str, Any]:
        """Get social media settings formatted for response."""
        settings = SettingsService.get_settings_by_category(db, "social")
        return {
            "social_instagram": settings.get("social_instagram", ""),
            "social_facebook": settings.get("social_facebook", ""),
            "social_twitter": settings.get("social_twitter", ""),
            "social_whatsapp": settings.get("social_whatsapp", ""),
        }

    @staticmethod
    def get_api_keys_settings(db: Session) -> Dict[str, Any]:
        """Get API keys settings (masked for security)."""
        settings = SettingsService.get_settings_by_category(db, "api_keys")
        
        # Mask API key for security
        api_key = settings.get("exchangerate_api_key", "")
        masked_key = f"{api_key[:8]}..." if api_key and len(api_key) > 8 else ""
        
        return {
            "exchangerate_api_key_configured": bool(api_key),
            "exchangerate_api_key_preview": masked_key,
        }

    @staticmethod
    def get_currency_settings(db: Session) -> Dict[str, Any]:
        """Get currency and exchange rate settings."""
        settings = SettingsService.get_settings_by_category(db, "currency")
        store_settings = SettingsService.get_settings_by_category(db, "store")
        return {
            "base_currency": settings.get("base_currency", "USD"),
            "display_currency_code": store_settings.get("currency_code", "IDR"),
            "display_currency_symbol": store_settings.get("currency_symbol", "Rp"),
            "exchange_rates_updated": settings.get("exchange_rates_updated", ""),
            "has_cached_rates": bool(settings.get("exchange_rates")),
        }

    @staticmethod
    def get_public_store_info(db: Session) -> Dict[str, Any]:
        """Get public store information for customers."""
        store = SettingsService.get_store_settings(db)
        operations = SettingsService.get_operations_settings(db)
        social = SettingsService.get_social_settings(db)
        
        return {
            **store,
            "opening_time": operations["opening_time"],
            "closing_time": operations["closing_time"],
            "days_open": operations["days_open"],
            "is_store_open": operations["is_store_open"],
            "accept_orders": operations["accept_orders"],
            "delivery_available": operations["delivery_available"],
            "minimum_order": operations["minimum_order"],
            **social,
        }

    @staticmethod
    def seed_default_settings(db: Session) -> int:
        """Seed default settings if they don't exist."""
        count = 0
        for setting_data in DEFAULT_SETTINGS:
            existing = db.query(StoreSetting).filter(StoreSetting.key == setting_data["key"]).first()
            if not existing:
                setting = StoreSetting(**setting_data)
                db.add(setting)
                count += 1
        
        if count > 0:
            db.commit()
            logger.info(f"Seeded {count} default settings")
        
        return count

    @staticmethod
    def is_store_currently_open(db: Session) -> bool:
        """Check if store is currently open based on settings and time."""
        from datetime import datetime
        
        settings = SettingsService.get_operations_settings(db)
        
        if not settings["is_store_open"]:
            return False
        
        now = datetime.now()
        current_day = now.strftime("%A")
        current_time = now.strftime("%H:%M")
        
        # Check if today is an open day
        if current_day not in settings["days_open"]:
            return False
        
        # Check if current time is within opening hours
        opening = settings["opening_time"]
        closing = settings["closing_time"]
        
        return opening <= current_time <= closing

    @staticmethod
    def get_currency_info(db: Session) -> Dict[str, str]:
        """Get currency information for formatting."""
        settings = SettingsService.get_settings_by_category(db, "store")
        return {
            "code": settings.get("currency_code", "IDR"),
            "symbol": settings.get("currency_symbol", "Rp"),
            "locale": settings.get("currency_locale", "id-ID"),
        }
