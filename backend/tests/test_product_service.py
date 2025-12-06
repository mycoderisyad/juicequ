"""
Unit tests for Product Service.
Tests for product and category CRUD operations.
"""
import pytest
from sqlalchemy.orm import Session

from app.models.product import Product, ProductCategory
from app.services.product_service import ProductService
from app.schemas.product import CategoryCreate, CategoryUpdate


class TestProductService:
    """Tests for ProductService class."""

    # ==========================================================================
    # Category Tests
    # ==========================================================================
    
    def test_get_all_categories(self, db: Session, test_category: ProductCategory):
        """Test getting all active categories."""
        categories = ProductService.get_all_categories(db)
        assert len(categories) >= 1
        assert any(c.id == test_category.id for c in categories)
    
    def test_get_all_categories_include_inactive(self, db: Session):
        """Test getting all categories including inactive ones."""
        # Create inactive category
        inactive_cat = ProductCategory(
            id="inactive-cat",
            name="Inactive Category",
            is_active=False,
        )
        db.add(inactive_cat)
        db.commit()
        
        # Without inactive
        active_only = ProductService.get_all_categories(db, include_inactive=False)
        assert not any(c.id == "inactive-cat" for c in active_only)
        
        # With inactive
        all_cats = ProductService.get_all_categories(db, include_inactive=True)
        assert any(c.id == "inactive-cat" for c in all_cats)
    
    def test_get_category_by_id(self, db: Session, test_category: ProductCategory):
        """Test getting a category by ID."""
        category = ProductService.get_category_by_id(db, test_category.id)
        assert category is not None
        assert category.id == test_category.id
        assert category.name == test_category.name
    
    def test_get_category_by_id_not_found(self, db: Session):
        """Test getting a non-existent category."""
        category = ProductService.get_category_by_id(db, "non-existent-id")
        assert category is None
    
    def test_create_category(self, db: Session):
        """Test creating a new category."""
        category_data = CategoryCreate(
            name="New Category",
            description="A newly created category",
            icon="🆕",
        )
        category = ProductService.create_category(db, category_data)
        
        assert category is not None
        assert category.id is not None  # ID is auto-generated
        assert category.name == "New Category"
        assert category.is_active == True
    
    def test_update_category(self, db: Session, test_category: ProductCategory):
        """Test updating a category."""
        update_data = CategoryUpdate(
            name="Updated Category Name",
            description="Updated description",
        )
        updated = ProductService.update_category(db, test_category.id, update_data)
        
        assert updated is not None
        assert updated.name == "Updated Category Name"
        assert updated.description == "Updated description"
    
    def test_update_category_not_found(self, db: Session):
        """Test updating a non-existent category."""
        update_data = CategoryUpdate(name="New Name")
        result = ProductService.update_category(db, "non-existent", update_data)
        assert result is None
    
    def test_delete_category(self, db: Session):
        """Test deleting a category."""
        # Create category to delete
        cat = ProductCategory(id="to-delete", name="To Delete")
        db.add(cat)
        db.commit()
        
        result = ProductService.delete_category(db, "to-delete")
        assert result == True
        
        # Verify it's deleted
        deleted = ProductService.get_category_by_id(db, "to-delete")
        assert deleted is None
    
    def test_delete_category_not_found(self, db: Session):
        """Test deleting a non-existent category."""
        result = ProductService.delete_category(db, "non-existent")
        assert result == False

    # ==========================================================================
    # Product Tests
    # ==========================================================================
    
    def test_get_product_by_id(self, db: Session, test_product: Product):
        """Test getting a product by ID."""
        product = ProductService.get_by_id(db, test_product.id)
        assert product is not None
        assert product.id == test_product.id
        assert product.name == test_product.name
    
    def test_get_product_by_id_not_found(self, db: Session):
        """Test getting a non-existent product."""
        product = ProductService.get_by_id(db, 99999)
        assert product is None
    
    def test_get_all_products(self, db: Session, test_product: Product):
        """Test getting all products."""
        products, total = ProductService.get_all(db)
        assert total >= 1
        assert any(p.id == test_product.id for p in products)
    
    def test_get_products_by_category(
        self, db: Session, test_product: Product, test_category: ProductCategory
    ):
        """Test filtering products by category."""
        products, total = ProductService.get_all(
            db, category_id=test_category.id
        )
        assert total >= 1
        assert all(p.category_id == test_category.id for p in products)
    
    def test_get_available_products_only(self, db: Session, test_product: Product, test_category: ProductCategory):
        """Test filtering only available products."""
        # Create unavailable product (requires category_id)
        unavailable = Product(
            name="Unavailable Product",
            description="This product is not available",
            base_price=10000,
            category_id=test_category.id,
            is_available=False,
        )
        db.add(unavailable)
        db.commit()
        
        products, _ = ProductService.get_all(db, is_available=True)
        assert not any(p.name == "Unavailable Product" for p in products)
    
    def test_search_products(self, db: Session, test_product: Product):
        """Test searching products by name."""
        products, total = ProductService.get_all(db, search="Test Juice")
        assert total >= 1
        assert any(p.id == test_product.id for p in products)
    
    def test_search_products_no_results(self, db: Session):
        """Test searching products with no matching results."""
        products, total = ProductService.get_all(db, search="nonexistent product xyz")
        assert total == 0
        assert len(products) == 0
    
    def test_get_product_price_by_size(self, db: Session, test_product: Product):
        """Test getting product price by size."""
        from app.models.product import ProductSize
        
        # Test default pricing calculation using get_price method
        small_price = ProductService.get_price(test_product, ProductSize.SMALL)
        medium_price = ProductService.get_price(test_product, ProductSize.MEDIUM)
        large_price = ProductService.get_price(test_product, ProductSize.LARGE)
        
        # Small should be cheaper than medium, medium cheaper than large
        assert small_price < medium_price < large_price
    
    def test_update_product_stock(self, db: Session, test_product: Product):
        """Test updating product stock via reduce_stock."""
        original_stock = test_product.stock_quantity
        
        # Reduce stock by 10
        result = ProductService.reduce_stock(db, test_product.id, 10)
        
        db.refresh(test_product)
        assert result == True
        assert test_product.stock_quantity == original_stock - 10


class TestProductValidation:
    """Tests for product validation logic."""
    
    def test_product_price_must_be_positive(self, db: Session, test_category: ProductCategory):
        """Test that product price must be positive via schema validation."""
        from app.schemas.product import ProductCreate
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            # ProductCreate schema enforces base_price > 0
            ProductCreate(
                name="Invalid Product",
                description="This should fail",
                base_price=-1000,  # Invalid negative price
                category_id=test_category.id,
            )
    
    def test_product_name_required(self, db: Session):
        """Test that product name is required."""
        with pytest.raises(Exception):
            product = Product(
                name=None,  # Required field
                description="No name product",
                base_price=10000,
            )
            db.add(product)
            db.commit()
