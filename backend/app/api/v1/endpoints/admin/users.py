"""
Admin Users API.
Manage users and roles.
"""
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole

router = APIRouter()


class CreateUserRequest(BaseModel):
    """Request to create a new user."""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6)
    role: str = Field(default="pembeli", description="User role")


class UpdateUserRequest(BaseModel):
    """Request to update a user."""
    email: EmailStr | None = None
    full_name: str | None = Field(None, min_length=2, max_length=100)
    role: str | None = None
    is_active: bool | None = None


@router.get(
    "",
    summary="Get all users",
    description="Get list of all users (admin only).",
)
async def get_users(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    role: str | None = Query(None, description="Filter by role"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    search: str | None = Query(None, description="Search by name or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all users with filters."""
    query = db.query(User)
    
    # Apply filters
    if role:
        try:
            role_enum = UserRole(role)
            query = query.filter(User.role == role_enum)
        except ValueError:
            pass
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_pattern)) | 
            (User.email.ilike(search_pattern))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    users = query.offset(skip).limit(limit).all()
    
    # Convert to response format
    users_data = [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if user.role else "pembeli",
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        for user in users
    ]
    
    return {
        "users": users_data,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get(
    "/{user_id}",
    summary="Get user details",
    description="Get detailed information about a user.",
)
async def get_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get user details by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("User", user_id)
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value if user.role else "pembeli",
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post(
    "",
    summary="Create user",
    description="Create a new user (admin only).",
)
async def create_user(
    request: CreateUserRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Create a new user."""
    from app.core.security import get_password_hash
    from app.core.exceptions import BadRequestException
    
    # Check if email exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise BadRequestException("Email already registered")
    
    # Validate role
    try:
        role_enum = UserRole(request.role)
    except ValueError:
        raise BadRequestException(
            f"Invalid role. Must be one of: {[r.value for r in UserRole]}"
        )
    
    # Create user
    new_user = User(
        email=request.email,
        full_name=request.full_name,
        hashed_password=get_password_hash(request.password),
        role=role_enum,
        is_active=True,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.value,
        },
        "success": True,
    }


@router.put(
    "/{user_id}",
    summary="Update user",
    description="Update user information.",
)
async def update_user(
    user_id: int,
    request: UpdateUserRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update user information."""
    from app.core.exceptions import NotFoundException, BadRequestException
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    
    # Prevent admin from demoting themselves
    if user.id == current_user.id and request.role and request.role != "admin":
        raise BadRequestException("Cannot change your own admin role")
    
    # Update fields
    if request.email:
        # Check if email is taken by another user
        existing = db.query(User).filter(
            User.email == request.email,
            User.id != user_id
        ).first()
        if existing:
            raise BadRequestException("Email already in use")
        user.email = request.email
    
    if request.full_name:
        user.full_name = request.full_name
    
    if request.role:
        try:
            user.role = UserRole(request.role)
        except ValueError:
            raise BadRequestException(
                f"Invalid role. Must be one of: {[r.value for r in UserRole]}"
            )
    
    if request.is_active is not None:
        # Prevent admin from deactivating themselves
        if user.id == current_user.id and not request.is_active:
            raise BadRequestException("Cannot deactivate your own account")
        user.is_active = request.is_active
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "is_active": user.is_active,
        },
        "success": True,
    }


@router.delete(
    "/{user_id}",
    summary="Delete user",
    description="Delete a user (soft delete).",
)
async def delete_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Delete a user (soft delete by deactivating)."""
    from app.core.exceptions import NotFoundException, BadRequestException
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise BadRequestException("Cannot delete your own account")
    
    # Soft delete
    user.is_active = False
    db.commit()
    
    return {
        "message": "User deleted successfully",
        "success": True,
    }


@router.get(
    "/stats/overview",
    summary="User statistics",
    description="Get user statistics overview.",
)
async def get_user_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get user statistics."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Count by role
    role_counts = {}
    for role in UserRole:
        count = db.query(User).filter(User.role == role).count()
        role_counts[role.value] = count
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "by_role": role_counts,
    }
