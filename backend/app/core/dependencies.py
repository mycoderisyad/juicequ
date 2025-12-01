"""
FastAPI dependencies for authentication and authorization.
"""
from typing import Annotated

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import CredentialsException, ForbiddenException
from app.core.security import verify_token
from app.db.session import get_db


# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ],
) -> str:
    """
    Dependency to get the current user ID from JWT token.
    
    Raises:
        CredentialsException: If token is missing or invalid
    
    Returns:
        User ID from the token
    """
    if credentials is None:
        raise CredentialsException(detail="Not authenticated")
    
    user_id = verify_token(credentials.credentials)
    if user_id is None:
        raise CredentialsException(detail="Invalid or expired token")
    
    return user_id


async def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    """
    Dependency to get the current user from the database.
    
    Raises:
        CredentialsException: If user not found
    
    Returns:
        User object from database
    """
    # Import here to avoid circular imports
    from app.models.user import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise CredentialsException(detail="User not found")
    
    if not user.is_active:
        raise CredentialsException(detail="Inactive user")
    
    return user


async def get_optional_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Dependency to optionally get the current user.
    Returns None if not authenticated.
    """
    if credentials is None:
        return None
    
    user_id = verify_token(credentials.credentials)
    if user_id is None:
        return None
    
    from app.models.user import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        return None
    
    return user


class RoleChecker:
    """
    Dependency class to check user roles.
    
    Usage:
        @router.get("/admin", dependencies=[Depends(RoleChecker(["admin"]))])
        def admin_only():
            ...
    """
    
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles
    
    async def __call__(
        self,
        user = Depends(get_current_user),
    ) -> bool:
        """Check if user has one of the allowed roles."""
        from app.models.user import User
        
        if not isinstance(user, User):
            raise CredentialsException()
        
        if user.role.value not in self.allowed_roles:
            raise ForbiddenException(
                detail=f"Role '{user.role.value}' is not allowed. Required: {self.allowed_roles}"
            )
        
        return True


# Pre-configured role checkers for convenience
require_admin = RoleChecker(["admin"])
require_kasir = RoleChecker(["kasir", "admin"])
require_pembeli = RoleChecker(["pembeli", "kasir", "admin"])


# Type aliases for cleaner code
CurrentUser = Annotated[object, Depends(get_current_user)]
OptionalUser = Annotated[object | None, Depends(get_optional_user)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]
