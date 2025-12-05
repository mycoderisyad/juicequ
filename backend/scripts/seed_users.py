"""
Seed script to create default admin and kasir users.
Run this script to create initial users for the system.

Usage:
    cd backend
    python -m scripts.seed_users
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_default_users(db: Session) -> None:
    """Create default admin and kasir users if they don't exist."""
    
    default_users = [
        {
            "email": "admin@juicequ.com",
            "full_name": "Admin JuiceQu",
            "password": "admin123",
            "role": UserRole.ADMIN,
        },
        {
            "email": "kasir@juicequ.com",
            "full_name": "Kasir JuiceQu",
            "password": "kasir123",
            "role": UserRole.KASIR,
        },
        {
            "email": "pembeli@juicequ.com",
            "full_name": "Pembeli Test",
            "password": "pembeli123",
            "role": UserRole.PEMBELI,
        },
    ]
    
    for user_data in default_users:
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        
        if existing_user:
            print(f"User {user_data['email']} already exists, skipping...")
            continue
        
        new_user = User(
            email=user_data["email"],
            full_name=user_data["full_name"],
            hashed_password=get_password_hash(user_data["password"]),
            role=user_data["role"],
            is_active=True,
            is_verified=True,
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"Created user: {user_data['email']} (role: {user_data['role'].value})")
    
    print("\n" + "="*50)
    print("Default users created successfully!")
    print("="*50)
    print("\nLogin credentials:")
    print("-"*50)
    print("ADMIN:")
    print("  Email: admin@juicequ.com")
    print("  Password: admin123")
    print("-"*50)
    print("KASIR:")
    print("  Email: kasir@juicequ.com")
    print("  Password: kasir123")
    print("-"*50)
    print("PEMBELI:")
    print("  Email: pembeli@juicequ.com")
    print("  Password: pembeli123")
    print("-"*50)


def main():
    """Main function to run the seeder."""
    print("Starting user seeder...")
    print("="*50)
    
    db = SessionLocal()
    try:
        create_default_users(db)
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
