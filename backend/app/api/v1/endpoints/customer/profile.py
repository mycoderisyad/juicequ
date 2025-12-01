"""
Customer Profile API.
Manage user profile and preferences.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import CurrentUser
from app.models.user import User

router = APIRouter()


class UpdateProfileRequest(BaseModel):
    """Request to update user profile."""
    full_name: str | None = Field(None, min_length=2, max_length=100)
    phone_number: str | None = Field(None, max_length=20)
    preferences: dict | None = Field(None, description="User preferences (dietary, allergies, etc.)")


class ProfileResponse(BaseModel):
    """User profile response."""
    id: str
    email: str
    full_name: str
    phone_number: str | None
    role: str
    is_verified: bool
    created_at: str


@router.get(
    "",
    summary="Get profile",
    description="Get current user's profile.",
)
async def get_profile(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Get the current user's profile."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "role": user.role.value,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.put(
    "",
    summary="Update profile",
    description="Update current user's profile.",
)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Update the current user's profile."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    # Update fields if provided
    if request.full_name is not None:
        user.full_name = request.full_name
    
    if request.phone_number is not None:
        user.phone_number = request.phone_number
    
    if request.preferences is not None:
        import json
        user.preferences = json.dumps(request.preferences)
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "role": user.role.value,
        },
        "success": True,
    }


@router.get(
    "/preferences",
    summary="Get preferences",
    description="Get user's preferences for AI recommendations.",
)
async def get_preferences(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Get user's preferences."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    preferences = {}
    if user.preferences:
        import json
        try:
            preferences = json.loads(user.preferences)
        except json.JSONDecodeError:
            preferences = {}
    
    return {"preferences": preferences}


@router.put(
    "/preferences",
    summary="Update preferences",
    description="Update user's preferences for AI recommendations.",
)
async def update_preferences(
    preferences: dict,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Update user's preferences."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    import json
    user.preferences = json.dumps(preferences)
    db.commit()
    
    return {
        "message": "Preferences updated successfully",
        "preferences": preferences,
        "success": True,
    }
