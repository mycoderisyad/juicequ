"""
Settings schemas for API validation.
"""
from typing import Optional, List, Any
from pydantic import BaseModel, Field


# Store Settings
class StoreSettingsUpdate(BaseModel):
    """Schema for updating store settings."""
    store_name: Optional[str] = Field(None, max_length=100)
    store_tagline: Optional[str] = Field(None, max_length=200)
    store_description: Optional[str] = Field(None, max_length=1000)
    store_address: Optional[str] = Field(None, max_length=500)
    store_phone: Optional[str] = Field(None, max_length=20)
    store_email: Optional[str] = Field(None, max_length=100)
    store_logo: Optional[str] = None
    store_latitude: Optional[float] = None
    store_longitude: Optional[float] = None
    store_city: Optional[str] = Field(None, max_length=100)
    store_province: Optional[str] = Field(None, max_length=100)
    store_district: Optional[str] = Field(None, max_length=100)
    store_village: Optional[str] = Field(None, max_length=100)
    store_postal_code: Optional[str] = Field(None, max_length=10)
    currency_code: Optional[str] = Field(None, max_length=5)
    currency_symbol: Optional[str] = Field(None, max_length=10)
    currency_locale: Optional[str] = Field(None, max_length=10)


class StoreSettingsResponse(BaseModel):
    """Schema for store settings response."""
    store_name: str
    store_tagline: str
    store_description: str
    store_address: str
    store_phone: str
    store_email: str
    store_logo: str
    store_latitude: float
    store_longitude: float
    store_city: str
    store_province: str
    store_district: str
    store_village: str
    store_postal_code: str
    currency_code: str
    currency_symbol: str
    currency_locale: str


# Operations Settings
class OperationsSettingsUpdate(BaseModel):
    """Schema for updating operations settings."""
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    days_open: Optional[List[str]] = None
    is_store_open: Optional[bool] = None
    accept_orders: Optional[bool] = None
    delivery_available: Optional[bool] = None
    minimum_order: Optional[int] = None
    order_types: Optional[List[str]] = None


class OperationsSettingsResponse(BaseModel):
    """Schema for operations settings response."""
    opening_time: str
    closing_time: str
    days_open: List[str]
    is_store_open: bool
    accept_orders: bool
    delivery_available: bool
    minimum_order: int
    order_types: List[str]


# Payment Settings
class PaymentSettingsUpdate(BaseModel):
    """Schema for updating payment settings."""
    cash_enabled: Optional[bool] = None
    card_enabled: Optional[bool] = None
    digital_enabled: Optional[bool] = None
    bank_transfer_enabled: Optional[bool] = None
    tax_rate: Optional[float] = Field(None, ge=0, le=100)
    service_charge: Optional[float] = Field(None, ge=0, le=100)


class PaymentSettingsResponse(BaseModel):
    """Schema for payment settings response."""
    cash_enabled: bool
    card_enabled: bool
    digital_enabled: bool
    bank_transfer_enabled: bool
    tax_rate: float
    service_charge: float


# Notification Settings
class NotificationSettingsUpdate(BaseModel):
    """Schema for updating notification settings."""
    notify_new_order: Optional[bool] = None
    notify_low_stock: Optional[bool] = None
    notify_review: Optional[bool] = None
    low_stock_threshold: Optional[int] = Field(None, ge=0)


class NotificationSettingsResponse(BaseModel):
    """Schema for notification settings response."""
    notify_new_order: bool
    notify_low_stock: bool
    notify_review: bool
    low_stock_threshold: int


# Social Settings
class SocialSettingsUpdate(BaseModel):
    """Schema for updating social media settings."""
    social_instagram: Optional[str] = None
    social_facebook: Optional[str] = None
    social_twitter: Optional[str] = None
    social_whatsapp: Optional[str] = None


class SocialSettingsResponse(BaseModel):
    """Schema for social media settings response."""
    social_instagram: str
    social_facebook: str
    social_twitter: str
    social_whatsapp: str


# Combined Settings
class AllSettingsResponse(BaseModel):
    """Schema for all settings response."""
    store: StoreSettingsResponse
    operations: OperationsSettingsResponse
    payments: PaymentSettingsResponse
    notifications: NotificationSettingsResponse
    social: SocialSettingsResponse


# Public settings (for customer/guest)
class PublicStoreInfo(BaseModel):
    """Public store information for customers."""
    store_name: str
    store_tagline: str
    store_description: str
    store_address: str
    store_phone: str
    store_email: str
    store_logo: str
    store_latitude: float
    store_longitude: float
    store_city: str
    store_province: str
    store_district: str
    store_village: str
    store_postal_code: str
    currency_code: str
    currency_symbol: str
    currency_locale: str
    opening_time: str
    closing_time: str
    days_open: List[str]
    is_store_open: bool
    accept_orders: bool
    delivery_available: bool
    minimum_order: int
    social_instagram: str
    social_facebook: str
    social_twitter: str
    social_whatsapp: str


class SettingUpdate(BaseModel):
    """Schema for updating a single setting."""
    key: str
    value: Any
