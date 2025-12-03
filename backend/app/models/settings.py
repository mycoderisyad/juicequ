"""
Store Settings Model.
Stores all configurable settings for the store.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, JSON
from sqlalchemy.sql import func

from app.db.database import Base


class StoreSetting(Base):
    """Store settings table - key-value store for all settings."""
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    value_type = Column(String(20), default="string")  # string, int, float, bool, json
    category = Column(String(50), nullable=False, index=True)  # store, operations, payments, notifications
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def get_typed_value(self):
        """Get value with proper type conversion."""
        if self.value is None:
            return None
        
        if self.value_type == "int":
            return int(self.value)
        elif self.value_type == "float":
            return float(self.value)
        elif self.value_type == "bool":
            return self.value.lower() in ("true", "1", "yes")
        elif self.value_type == "json":
            import json
            return json.loads(self.value)
        return self.value

    @staticmethod
    def set_typed_value(value, value_type: str) -> str:
        """Convert value to string for storage."""
        if value is None:
            return None
        
        if value_type == "json":
            import json
            return json.dumps(value)
        elif value_type == "bool":
            return "true" if value else "false"
        return str(value)


# Default settings to seed
DEFAULT_SETTINGS = [
    # Store Info
    {"key": "store_name", "value": "JuiceQu", "value_type": "string", "category": "store", "description": "Store name"},
    {"key": "store_tagline", "value": "Fresh & Healthy Juices", "value_type": "string", "category": "store", "description": "Store tagline"},
    {"key": "store_description", "value": "Your destination for fresh, healthy, and delicious juices made from premium ingredients.", "value_type": "string", "category": "store", "description": "Store description"},
    {"key": "store_address", "value": "Jl. Sudirman No. 123, Jakarta Pusat", "value_type": "string", "category": "store", "description": "Store address"},
    {"key": "store_phone", "value": "+62 21 1234 5678", "value_type": "string", "category": "store", "description": "Store phone number"},
    {"key": "store_email", "value": "hello@juicequ.com", "value_type": "string", "category": "store", "description": "Store email"},
    {"key": "store_logo", "value": "/images/logo.png", "value_type": "string", "category": "store", "description": "Store logo URL"},
    
    # Location
    {"key": "store_latitude", "value": "-6.2088", "value_type": "float", "category": "store", "description": "Store latitude for map"},
    {"key": "store_longitude", "value": "106.8456", "value_type": "float", "category": "store", "description": "Store longitude for map"},
    {"key": "store_city", "value": "Jakarta Pusat", "value_type": "string", "category": "store", "description": "Store city/regency"},
    {"key": "store_province", "value": "DKI Jakarta", "value_type": "string", "category": "store", "description": "Store province"},
    {"key": "store_district", "value": "Menteng", "value_type": "string", "category": "store", "description": "Store district (kecamatan)"},
    {"key": "store_village", "value": "Menteng", "value_type": "string", "category": "store", "description": "Store village (kelurahan/desa)"},
    {"key": "store_postal_code", "value": "10310", "value_type": "string", "category": "store", "description": "Store postal code"},
    
    # Currency & Regional
    {"key": "currency_code", "value": "IDR", "value_type": "string", "category": "store", "description": "Currency code (IDR, USD, etc)"},
    {"key": "currency_symbol", "value": "Rp", "value_type": "string", "category": "store", "description": "Currency symbol"},
    {"key": "currency_locale", "value": "id-ID", "value_type": "string", "category": "store", "description": "Locale for number formatting"},
    
    # Operations
    {"key": "opening_time", "value": "08:00", "value_type": "string", "category": "operations", "description": "Store opening time"},
    {"key": "closing_time", "value": "22:00", "value_type": "string", "category": "operations", "description": "Store closing time"},
    {"key": "days_open", "value": '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]', "value_type": "json", "category": "operations", "description": "Days the store is open"},
    {"key": "is_store_open", "value": "true", "value_type": "bool", "category": "operations", "description": "Whether store is currently open"},
    {"key": "accept_orders", "value": "true", "value_type": "bool", "category": "operations", "description": "Whether store accepts online orders"},
    {"key": "delivery_available", "value": "true", "value_type": "bool", "category": "operations", "description": "Whether delivery is available"},
    {"key": "minimum_order", "value": "25000", "value_type": "int", "category": "operations", "description": "Minimum order amount"},
    {"key": "order_types", "value": '["dine_in","takeaway","delivery"]', "value_type": "json", "category": "operations", "description": "Available order types"},
    
    # Payments
    {"key": "cash_enabled", "value": "true", "value_type": "bool", "category": "payments", "description": "Accept cash payments"},
    {"key": "card_enabled", "value": "true", "value_type": "bool", "category": "payments", "description": "Accept card payments"},
    {"key": "digital_enabled", "value": "true", "value_type": "bool", "category": "payments", "description": "Accept digital wallet payments"},
    {"key": "bank_transfer_enabled", "value": "true", "value_type": "bool", "category": "payments", "description": "Accept bank transfer"},
    {"key": "tax_rate", "value": "11", "value_type": "float", "category": "payments", "description": "Tax rate percentage"},
    {"key": "service_charge", "value": "0", "value_type": "float", "category": "payments", "description": "Service charge percentage"},
    
    # Notifications
    {"key": "notify_new_order", "value": "true", "value_type": "bool", "category": "notifications", "description": "Notify on new order"},
    {"key": "notify_low_stock", "value": "true", "value_type": "bool", "category": "notifications", "description": "Notify on low stock"},
    {"key": "notify_review", "value": "true", "value_type": "bool", "category": "notifications", "description": "Notify on new review"},
    {"key": "low_stock_threshold", "value": "10", "value_type": "int", "category": "notifications", "description": "Low stock warning threshold"},
    
    # Social Media
    {"key": "social_instagram", "value": "https://instagram.com/juicequ", "value_type": "string", "category": "social", "description": "Instagram URL"},
    {"key": "social_facebook", "value": "https://facebook.com/juicequ", "value_type": "string", "category": "social", "description": "Facebook URL"},
    {"key": "social_twitter", "value": "https://twitter.com/juicequ", "value_type": "string", "category": "social", "description": "Twitter URL"},
    {"key": "social_whatsapp", "value": "+6281234567890", "value_type": "string", "category": "social", "description": "WhatsApp number"},
    
    # API Keys
    {"key": "exchangerate_api_key", "value": "", "value_type": "string", "category": "api_keys", "description": "ExchangeRate API Key from exchangerate-api.com"},
    
    # Exchange Rates (cached)
    {"key": "exchange_rates", "value": "{}", "value_type": "json", "category": "currency", "description": "Cached exchange rates"},
    {"key": "exchange_rates_updated", "value": "", "value_type": "string", "category": "currency", "description": "Last update time for exchange rates"},
    {"key": "base_currency", "value": "USD", "value_type": "string", "category": "currency", "description": "Base currency for price storage"},
]
