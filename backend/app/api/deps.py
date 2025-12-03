"""
API Dependencies module.
Common dependencies used across API endpoints.
Re-exports from core.dependencies for convenience.
"""
from app.core.dependencies import (
    get_current_user,
    get_optional_user,
    require_admin,
    require_kasir,
    require_pembeli,
    CurrentUser,
    OptionalUser,
)
from app.db.session import get_db

__all__ = [
    # Database
    "get_db",
    # Auth
    "get_current_user",
    "get_optional_user",
    "require_admin",
    "require_kasir",
    "require_pembeli",
    # Type aliases
    "CurrentUser",
    "OptionalUser",
]
