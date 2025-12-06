"""
Pytest fixtures and configuration for JuiceQu tests.
"""
import os
import sys
from datetime import datetime, timezone
from typing import Generator
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import Base
from app.models.user import User, UserRole
from app.models.product import Product, ProductCategory
from app.models.promo import ProductPromo, Voucher, PromoType, VoucherType
from app.models.order import Order, OrderItem, OrderStatus
from app.core.security import get_password_hash


# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_engine():
    """Create a test database engine."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db(db_engine) -> Generator[Session, None, None]:
    """Create a test database session."""
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=db_engine
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def test_category(db: Session) -> ProductCategory:
    """Create a test product category."""
    category = ProductCategory(
        id="test-category",
        name="Test Category",
        description="A test category for unit tests",
        icon="🧪",
        display_order=1,
        is_active=True,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def test_product(db: Session, test_category: ProductCategory) -> Product:
    """Create a test product."""
    product = Product(
        name="Test Juice",
        description="A delicious test juice for unit testing",
        base_price=15000,
        category_id=test_category.id,
        is_available=True,
        stock_quantity=100,
        has_sizes=True,
        volume_unit="ml",
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user = User(
        id=str(uuid4()),
        email="test@juicequ.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        role=UserRole.PEMBELI,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db: Session) -> User:
    """Create an admin user for testing."""
    user = User(
        id=str(uuid4()),
        email="admin@juicequ.com",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_promo(db: Session, test_product: Product) -> ProductPromo:
    """Create a test product promo."""
    now = datetime.now(timezone.utc)
    promo = ProductPromo(
        id=str(uuid4()),
        product_id=test_product.id,
        name="Test Promo",
        description="A test promotion",
        promo_type=PromoType.PERCENTAGE,
        discount_value=20,
        start_date=now,
        end_date=now.replace(year=now.year + 1),
        is_active=True,
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


@pytest.fixture
def test_voucher(db: Session) -> Voucher:
    """Create a test voucher."""
    now = datetime.now(timezone.utc)
    voucher = Voucher(
        id=str(uuid4()),
        code="TESTCODE",
        name="Test Voucher",
        description="A test voucher",
        voucher_type=VoucherType.PERCENTAGE,
        discount_value=10,
        min_order_amount=50000,
        max_discount=20000,
        usage_limit=100,
        per_user_limit=1,
        start_date=now,
        end_date=now.replace(year=now.year + 1),
        is_active=True,
    )
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return voucher


@pytest.fixture
def test_order(db: Session, test_user: User, test_product: Product) -> Order:
    """Create a test order."""
    order = Order(
        id=str(uuid4()),
        order_number="ORD-TEST-001",
        user_id=test_user.id,
        guest_name=test_user.full_name,
        subtotal=30000,
        discount=0,
        tax=3000,
        total=33000,
        status=OrderStatus.PENDING,
    )
    db.add(order)
    db.commit()
    
    # Add order item
    order_item = OrderItem(
        id=str(uuid4()),
        order_id=order.id,
        product_id=test_product.id,
        product_name=test_product.name,
        quantity=2,
        size="medium",
        unit_price=15000,
        subtotal=30000,
    )
    db.add(order_item)
    db.commit()
    db.refresh(order)
    return order
