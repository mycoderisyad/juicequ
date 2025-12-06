"""
User model for authentication and authorization.
Supports 4 roles: guest, pembeli, kasir, admin.
"""
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.cart import Cart
    from app.models.ai_interaction import AIInteraction


class UserRole(str, enum.Enum):
    """User roles in the system."""
    GUEST = "guest"
    PEMBELI = "pembeli"
    KASIR = "kasir"
    ADMIN = "admin"


class AuthProvider(str, enum.Enum):
    """Authentication providers."""
    LOCAL = "local"
    GOOGLE = "google"


class User(Base):
    """User model for authentication and profile management."""
    
    __tablename__ = "users"
    
    # Primary key (using String(36) for SQLite/PostgreSQL compatibility)
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    # Authentication fields
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,  # Nullable for OAuth users
    )
    
    # OAuth fields
    auth_provider: Mapped[str] = mapped_column(
        String(10),
        default="local",
        nullable=False,
    )
    oauth_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Profile fields
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    phone_number: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    
    # Role and status
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        default=UserRole.PEMBELI,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    verification_token: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    verification_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    reset_token_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    reset_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Preferences (for AI personalization)
    preferences: Mapped[str | None] = mapped_column(
        Text,  # JSON string for dietary preferences, allergies, etc.
        nullable=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # AI Photobooth usage count (limit 3 for regular users)
    ai_photobooth_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    # Relationships
    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    cart: Mapped["Cart | None"] = relationship(
        "Cart",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    ai_interactions: Mapped[list["AIInteraction"]] = relationship(
        "AIInteraction",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"
    
    def has_role(self, *roles: UserRole) -> bool:
        """Check if user has one of the specified roles."""
        return self.role in roles
    
    def is_admin(self) -> bool:
        """Check if user is admin."""
        return self.role == UserRole.ADMIN
    
    def is_kasir(self) -> bool:
        """Check if user is kasir or admin."""
        return self.role in (UserRole.KASIR, UserRole.ADMIN)
