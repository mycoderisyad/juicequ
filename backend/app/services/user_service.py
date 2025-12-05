"""
User Service for business logic related to user management.
"""
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, DuplicateError
from app.core.security import get_password_hash
from app.models.user import User, UserRole


class UserService:
    """Service class for user operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[User], int]:
        """Get all users with filters and pagination."""
        query = self.db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (User.email.ilike(search_term)) |
                (User.full_name.ilike(search_term))
            )
        
        total = query.count()
        
        offset = (page - 1) * page_size
        users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()
        
        return users, total
    
    def get_by_id(self, user_id: str) -> Optional[User]:
        """Get a user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        return self.db.query(User).filter(
            func.lower(User.email) == email.lower()
        ).first()
    
    def create(
        self,
        email: str,
        password: str,
        full_name: str,
        phone_number: Optional[str] = None,
        role: UserRole = UserRole.PEMBELI,
    ) -> User:
        """Create a new user."""
        # Check for duplicate email
        if self.get_by_email(email):
            raise DuplicateError("User with this email already exists")
        
        user = User(
            email=email.lower(),
            hashed_password=get_password_hash(password),
            full_name=full_name,
            phone_number=phone_number,
            role=role,
            is_active=True,
            is_verified=False,
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def update(
        self,
        user_id: str,
        full_name: Optional[str] = None,
        phone_number: Optional[str] = None,
        preferences: Optional[str] = None,
    ) -> User:
        """Update user profile."""
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        if full_name:
            user.full_name = full_name
        if phone_number is not None:
            user.phone_number = phone_number
        if preferences is not None:
            user.preferences = preferences
        
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def update_role(self, user_id: str, role: UserRole) -> User:
        """Update user role."""
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        user.role = role
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def activate(self, user_id: str) -> User:
        """Activate a user account."""
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        user.is_active = True
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def deactivate(self, user_id: str) -> User:
        """Deactivate a user account."""
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        user.is_active = False
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def delete(self, user_id: str) -> bool:
        """Delete a user."""
        user = self.get_by_id(user_id)
        if not user:
            return False
        
        self.db.delete(user)
        self.db.commit()
        return True
    
    def get_stats(self) -> dict:
        """Get user statistics."""
        total = self.db.query(User).count()
        active = self.db.query(User).filter(User.is_active == True).count()
        
        by_role = {}
        for role in UserRole:
            count = self.db.query(User).filter(User.role == role).count()
            by_role[role.value] = count
        
        return {
            "total": total,
            "active": active,
            "inactive": total - active,
            "by_role": by_role,
        }
