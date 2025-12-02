"""
Master seed script to initialize all default data.
Run this script to set up the database with initial data.

Usage:
    cd backend
    python -m scripts.seed_all
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.seed_users import main as seed_users
from scripts.seed_products import main as seed_products


def main():
    """Run all seeders."""
    print("="*60)
    print("🌱 JuiceQu Database Seeder")
    print("="*60)
    print("\nThis will seed the database with default data.\n")
    
    # Seed users
    print("\n" + "="*60)
    print("👤 STEP 1: Seeding Users")
    print("="*60)
    seed_users()
    
    # Seed products
    print("\n" + "="*60)
    print("🍹 STEP 2: Seeding Products & Categories")
    print("="*60)
    seed_products()
    
    print("\n" + "="*60)
    print("✅ ALL SEEDING COMPLETED!")
    print("="*60)
    print("\nYou can now run the application with:")
    print("  uvicorn app.main:app --reload")
    print("\nAnd access the admin panel at:")
    print("  http://localhost:3000/admin")
    print("\nLogin credentials:")
    print("  Email: admin@juicequ.com")
    print("  Password: admin123")
    print("="*60)


if __name__ == "__main__":
    main()
