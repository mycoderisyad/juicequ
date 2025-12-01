"""
Permission decorators and utilities for role-based access control.
Provides clean, reusable permission checks for API endpoints.
"""
from functools import wraps
from typing import Callable, TypeVar

from fastapi import Depends

from app.core.dependencies import get_current_user
from app.core.exceptions import ForbiddenException
from app.models.user import User, UserRole


# Type variable for generic function decoration
F = TypeVar("F", bound=Callable)


def require_roles(*roles: UserRole):
    """
    Dependency factory that creates role requirement checks.
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(
            user: User = Depends(require_roles(UserRole.ADMIN))
        ):
            return {"message": "Admin access granted"}
    """
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            allowed_roles = ", ".join(role.value for role in roles)
            raise ForbiddenException(
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return user
    
    return role_checker


# Pre-configured role dependencies for common use cases
RequireAdmin = Depends(require_roles(UserRole.ADMIN))
RequireKasir = Depends(require_roles(UserRole.KASIR, UserRole.ADMIN))
RequireCustomer = Depends(require_roles(UserRole.PEMBELI, UserRole.KASIR, UserRole.ADMIN))


class Permissions:
    """
    Permission constants and utilities for the application.
    Centralizes all permission logic for easy maintenance.
    """
    
    # Role hierarchy (higher index = more permissions)
    ROLE_HIERARCHY = {
        UserRole.GUEST: 0,
        UserRole.PEMBELI: 1,
        UserRole.KASIR: 2,
        UserRole.ADMIN: 3,
    }
    
    @classmethod
    def can_access(cls, user_role: UserRole, required_role: UserRole) -> bool:
        """Check if user role can access resources requiring the specified role."""
        return cls.ROLE_HIERARCHY.get(user_role, 0) >= cls.ROLE_HIERARCHY.get(required_role, 0)
    
    @classmethod
    def is_admin(cls, user: User) -> bool:
        """Check if user has admin privileges."""
        return user.role == UserRole.ADMIN
    
    @classmethod
    def is_staff(cls, user: User) -> bool:
        """Check if user is staff (kasir or admin)."""
        return user.role in (UserRole.KASIR, UserRole.ADMIN)
    
    @classmethod
    def is_customer(cls, user: User) -> bool:
        """Check if user is a customer."""
        return user.role == UserRole.PEMBELI
    
    @classmethod
    def can_manage_users(cls, user: User) -> bool:
        """Check if user can manage other users."""
        return user.role == UserRole.ADMIN
    
    @classmethod
    def can_manage_products(cls, user: User) -> bool:
        """Check if user can manage products."""
        return user.role == UserRole.ADMIN
    
    @classmethod
    def can_process_orders(cls, user: User) -> bool:
        """Check if user can process orders."""
        return user.role in (UserRole.KASIR, UserRole.ADMIN)
    
    @classmethod
    def can_view_reports(cls, user: User) -> bool:
        """Check if user can view reports."""
        return user.role in (UserRole.KASIR, UserRole.ADMIN)
