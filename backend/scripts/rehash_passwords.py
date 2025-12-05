"""
Script to rehash all user passwords with the new SHA256+bcrypt method.
This is needed after changing the password hashing algorithm.

Usage:
    cd backend
    python -m scripts.rehash_passwords
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash


DEFAULT_USER_PASSWORDS = {
    "admin@juicequ.com": "admin123",
    "kasir@juicequ.com": "kasir123",
    "pembeli@juicequ.com": "pembeli123",
}


def rehash_default_users(db: Session) -> None:
    """Rehash passwords for default users with known passwords."""
    
    print("Rehashing passwords for default users...")
    print("="*50)
    
    for email, password in DEFAULT_USER_PASSWORDS.items():
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            user.hashed_password = get_password_hash(password)
            db.commit()
            print(f"Rehashed password for: {email}")
        else:
            print(f"User not found: {email}")
    
    print("="*50)
    print("Password rehashing complete!")
    print("\nDefault users can now login with their original passwords:")
    for email, password in DEFAULT_USER_PASSWORDS.items():
        print(f"  {email}: {password}")


def main():
    """Main function to run the password rehash."""
    print("Password Rehash Script")
    print("This script updates passwords to use the new SHA256+bcrypt algorithm")
    print("="*50)
    
    db = SessionLocal()
    try:
        rehash_default_users(db)
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
