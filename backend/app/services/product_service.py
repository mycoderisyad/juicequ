"""
Product service for business logic.
"""
from typing import Optional

from sqlalchemy import or_, func
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product, ProductCategory, ProductSize
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    CategoryCreate,
    CategoryUpdate,
    NutritionInfo,
)


class ProductService:
    """Service class for product operations."""
    
    # Size multipliers for pricing
    SIZE_MULTIPLIERS = {
        ProductSize.SMALL: 0.8,
        ProductSize.MEDIUM: 1.0,
        ProductSize.LARGE: 1.3,
    }
    
    # ==========================================================================
    # Category Operations
    # ==========================================================================
    
    @staticmethod
    def get_all_categories(
        db: Session,
        include_inactive: bool = False,
    ) -> list[ProductCategory]:
        """Get all categories."""
        query = db.query(ProductCategory)
        
        if not include_inactive:
            query = query.filter(ProductCategory.is_active == True)
        
        return query.order_by(ProductCategory.display_order).all()
    
    @staticmethod
    def get_category_by_id(
        db: Session,
        category_id: str,
    ) -> Optional[ProductCategory]:
        """Get a category by ID."""
        return db.query(ProductCategory).filter(
            ProductCategory.id == category_id
        ).first()
    
    @staticmethod
    def create_category(
        db: Session,
        category_data: CategoryCreate,
    ) -> ProductCategory:
        """Create a new category."""
        category = ProductCategory(**category_data.model_dump())
        db.add(category)
        db.commit()
        db.refresh(category)
        return category
    
    @staticmethod
    def update_category(
        db: Session,
        category_id: str,
        category_data: CategoryUpdate,
    ) -> Optional[ProductCategory]:
        """Update a category."""
        category = ProductService.get_category_by_id(db, category_id)
        if not category:
            return None
        
        update_data = category_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)
        
        db.commit()
        db.refresh(category)
        return category
    
    @staticmethod
    def delete_category(
        db: Session,
        category_id: str,
    ) -> bool:
        """Delete a category."""
        category = ProductService.get_category_by_id(db, category_id)
        if not category:
            return False
        
        db.delete(category)
        db.commit()
        return True
    
    # ==========================================================================
    # Product Operations
    # ==========================================================================
    
    @staticmethod
    def get_all(
        db: Session,
        category_id: Optional[str] = None,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        is_available: Optional[bool] = True,
        is_featured: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Product], int]:
        """Get all products with filters and pagination."""
        query = db.query(Product).options(joinedload(Product.category))
        
        # Exclude soft-deleted products
        query = query.filter(Product.is_deleted == False)
        
        # Apply filters
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.ingredients.ilike(search_term),
                )
            )
        
        if min_price is not None:
            query = query.filter(Product.base_price >= min_price)
        
        if max_price is not None:
            query = query.filter(Product.base_price <= max_price)
        
        if is_available is not None:
            query = query.filter(Product.is_available == is_available)
        
        if is_featured is not None:
            query = query.filter(Product.is_featured == is_featured)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        products = query.order_by(
            Product.display_order,
            Product.name
        ).offset(offset).limit(page_size).all()
        
        return products, total
    
    @staticmethod
    def get_by_id(
        db: Session,
        product_id: str,
    ) -> Optional[Product]:
        """Get a product by ID."""
        return db.query(Product).options(
            joinedload(Product.category)
        ).filter(
            Product.id == product_id,
            Product.is_deleted == False
        ).first()
    
    @staticmethod
    def get_by_slug(
        db: Session,
        slug: str,
    ) -> Optional[Product]:
        """Get a product by slug (name-based lookup)."""
        # For now, use name as slug
        return db.query(Product).options(
            joinedload(Product.category)
        ).filter(
            func.lower(Product.name) == slug.lower(),
            Product.is_deleted == False
        ).first()
    
    @staticmethod
    def create(
        db: Session,
        product_data: ProductCreate,
    ) -> Product:
        """Create a new product."""
        product = Product(**product_data.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
    
    @staticmethod
    def update(
        db: Session,
        product_id: str,
        product_data: ProductUpdate,
    ) -> Optional[Product]:
        """Update a product."""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            return None
        
        update_data = product_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)
        
        db.commit()
        db.refresh(product)
        return product
    
    @staticmethod
    def delete(
        db: Session,
        product_id: str,
    ) -> bool:
        """Soft delete a product."""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            return False
        
        # Soft delete - mark as deleted instead of actually deleting
        product.is_deleted = True
        product.is_available = False
        db.commit()
        return True
    
    @staticmethod
    def get_by_category(
        db: Session,
        category_id: str,
        is_available: bool = True,
    ) -> list[Product]:
        """Get all products in a category."""
        query = db.query(Product).filter(
            Product.category_id == category_id,
            Product.is_deleted == False
        )
        
        if is_available:
            query = query.filter(Product.is_available == True)
        
        return query.order_by(Product.display_order, Product.name).all()
    
    @staticmethod
    def search(
        db: Session,
        query: str,
        limit: int = 10,
    ) -> list[Product]:
        """Search products by name, description, or ingredients."""
        search_term = f"%{query}%"
        
        return db.query(Product).options(
            joinedload(Product.category)
        ).filter(
            Product.is_available == True,
            Product.is_deleted == False,
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.ingredients.ilike(search_term),
            )
        ).order_by(Product.order_count.desc()).limit(limit).all()
    
    @staticmethod
    def get_featured(
        db: Session,
        limit: int = 8,
    ) -> list[Product]:
        """Get featured products."""
        return db.query(Product).options(
            joinedload(Product.category)
        ).filter(
            Product.is_available == True,
            Product.is_featured == True,
            Product.is_deleted == False,
        ).order_by(Product.display_order).limit(limit).all()
    
    @staticmethod
    def get_popular(
        db: Session,
        limit: int = 8,
    ) -> list[Product]:
        """Get popular products by order count."""
        return db.query(Product).options(
            joinedload(Product.category)
        ).filter(
            Product.is_available == True,
            Product.is_deleted == False,
        ).order_by(Product.order_count.desc()).limit(limit).all()
    
    @staticmethod
    def get_bestsellers_for_hero(
        db: Session,
        limit: int = 3,
    ) -> list[Product]:
        """
        Get bestseller products for hero section.
        Sorted by order_count (most sold first).
        Only returns available products.
        """
        return db.query(Product).options(
            joinedload(Product.category)
        ).filter(
            Product.is_available == True,
            Product.is_deleted == False,
        ).order_by(
            Product.order_count.desc(),
            Product.average_rating.desc(),
            Product.created_at.desc(),
        ).limit(limit).all()
    
    # ==========================================================================
    # Price Calculations
    # ==========================================================================
    
    @staticmethod
    def get_price(
        product: Product,
        size: ProductSize = ProductSize.MEDIUM,
    ) -> float:
        """Get product price for a specific size."""
        multiplier = ProductService.SIZE_MULTIPLIERS.get(size, 1.0)
        return round(product.base_price * multiplier, 2)
    
    @staticmethod
    def get_all_prices(
        product: Product,
    ) -> dict[str, float]:
        """Get product prices for all sizes."""
        return {
            size.value: round(
                product.base_price * ProductService.SIZE_MULTIPLIERS[size], 2
            )
            for size in ProductSize
        }
    
    # ==========================================================================
    # Nutrition Info
    # ==========================================================================
    
    @staticmethod
    def get_nutrition_info(product: Product) -> NutritionInfo:
        """Get parsed nutrition info for a product."""
        return NutritionInfo(
            calories=product.calories,
            sugar=product.sugar_grams,
        )
    
    # ==========================================================================
    # Stock Management
    # ==========================================================================
    
    @staticmethod
    def check_stock(
        db: Session,
        product_id: str,
        quantity: int = 1,
    ) -> bool:
        """Check if product has enough stock."""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            return False
        return product.is_in_stock(quantity)
    
    @staticmethod
    def reduce_stock(
        db: Session,
        product_id: str,
        quantity: int,
    ) -> bool:
        """Reduce product stock after order."""
        product = ProductService.get_by_id(db, product_id)
        if not product or not product.is_in_stock(quantity):
            return False
        
        product.stock_quantity -= quantity
        product.order_count += quantity
        
        db.commit()
        return True
    
    @staticmethod
    def restore_stock(
        db: Session,
        product_id: str,
        quantity: int,
    ) -> bool:
        """Restore product stock (e.g., after order cancellation)."""
        product = ProductService.get_by_id(db, product_id)
        if not product:
            return False
        
        product.stock_quantity += quantity
        product.order_count = max(0, product.order_count - quantity)
        
        db.commit()
        return True
