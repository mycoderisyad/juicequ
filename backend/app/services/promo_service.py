"""
Promo and Voucher Service.
Business logic for managing promotions and vouchers.
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session, joinedload

from app.models.promo import ProductPromo, Voucher, VoucherUsage, PromoType, VoucherType
from app.models.product import Product
from app.schemas.promo import (
    ProductPromoCreate,
    ProductPromoUpdate,
    VoucherCreate,
    VoucherUpdate,
    ProductPromoInfo,
)


class PromoService:
    """Service for managing product promotions."""
    
    @staticmethod
    def get_all(
        db: Session,
        product_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ProductPromo], int]:
        """Get all product promos with optional filtering."""
        query = db.query(ProductPromo)
        
        if product_id:
            query = query.filter(ProductPromo.product_id == product_id)
        
        if is_active is not None:
            query = query.filter(ProductPromo.is_active == is_active)
        
        total = query.count()
        
        promos = query.order_by(ProductPromo.created_at.desc())\
            .offset((page - 1) * page_size)\
            .limit(page_size)\
            .all()
        
        return promos, total
    
    @staticmethod
    def get_by_id(db: Session, promo_id: str) -> Optional[ProductPromo]:
        """Get a promo by ID."""
        return db.query(ProductPromo).filter(ProductPromo.id == promo_id).first()
    
    @staticmethod
    def get_active_promo_for_product(db: Session, product_id: str) -> Optional[ProductPromo]:
        """Get the currently active promo for a product."""
        now = datetime.now(timezone.utc)
        return db.query(ProductPromo).filter(
            and_(
                ProductPromo.product_id == product_id,
                ProductPromo.is_active == True,
                ProductPromo.start_date <= now,
                ProductPromo.end_date >= now,
            )
        ).first()
    
    @staticmethod
    def get_product_promo_info(db: Session, product: Product) -> ProductPromoInfo:
        """Get promo info for a product (for display purposes)."""
        promo = PromoService.get_active_promo_for_product(db, product.id)
        
        if not promo:
            return ProductPromoInfo(has_promo=False)
        
        # Calculate discount percentage for badge
        if promo.promo_type == PromoType.PERCENTAGE:
            discount_percentage = int(promo.discount_value)
        else:
            # Calculate percentage from fixed discount
            discount_percentage = int((promo.discount_value / product.base_price) * 100)
        
        # Calculate discounted price
        if promo.promo_type == PromoType.PERCENTAGE:
            discount_amount = product.base_price * (promo.discount_value / 100)
        else:
            discount_amount = min(promo.discount_value, product.base_price)
        
        discounted_price = round(product.base_price - discount_amount, 2)
        
        return ProductPromoInfo(
            has_promo=True,
            promo_id=promo.id,
            promo_name=promo.name,
            promo_type=promo.promo_type.value,
            discount_value=promo.discount_value,
            discount_percentage=discount_percentage,
            original_price=product.base_price,
            discounted_price=discounted_price,
            promo_end_date=promo.end_date,
        )
    
    @staticmethod
    def create(db: Session, data: ProductPromoCreate) -> ProductPromo:
        """Create a new product promo."""
        promo = ProductPromo(
            id=str(uuid4()),
            product_id=data.product_id,
            name=data.name,
            description=data.description,
            promo_type=PromoType(data.promo_type),
            discount_value=data.discount_value,
            start_date=data.start_date,
            end_date=data.end_date,
            is_active=data.is_active,
        )
        db.add(promo)
        db.commit()
        db.refresh(promo)
        return promo
    
    @staticmethod
    def update(db: Session, promo: ProductPromo, data: ProductPromoUpdate) -> ProductPromo:
        """Update an existing product promo."""
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == 'promo_type' and value:
                value = PromoType(value)
            setattr(promo, field, value)
        
        db.commit()
        db.refresh(promo)
        return promo
    
    @staticmethod
    def delete(db: Session, promo: ProductPromo) -> None:
        """Delete a product promo."""
        db.delete(promo)
        db.commit()


class VoucherService:
    """Service for managing vouchers."""
    
    @staticmethod
    def get_all(
        db: Session,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Voucher], int]:
        """Get all vouchers with optional filtering."""
        query = db.query(Voucher)
        
        if is_active is not None:
            query = query.filter(Voucher.is_active == is_active)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Voucher.code.ilike(search_pattern),
                    Voucher.name.ilike(search_pattern),
                )
            )
        
        total = query.count()
        
        vouchers = query.order_by(Voucher.created_at.desc())\
            .offset((page - 1) * page_size)\
            .limit(page_size)\
            .all()
        
        return vouchers, total
    
    @staticmethod
    def get_by_id(db: Session, voucher_id: str) -> Optional[Voucher]:
        """Get a voucher by ID."""
        return db.query(Voucher).filter(Voucher.id == voucher_id).first()
    
    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Voucher]:
        """Get a voucher by code."""
        return db.query(Voucher).filter(
            Voucher.code == code.upper()
        ).first()
    
    @staticmethod
    def validate_voucher(
        db: Session,
        code: str,
        order_amount: float,
        user_id: Optional[str] = None,
    ) -> tuple[bool, str, Optional[Voucher], float]:
        """
        Validate a voucher for use.
        Returns: (is_valid, message, voucher, discount_amount)
        """
        voucher = VoucherService.get_by_code(db, code)
        
        if not voucher:
            return False, "Kode voucher tidak ditemukan", None, 0.0
        
        # Check user usage if user is logged in
        user_usage_count = 0
        if user_id:
            user_usage_count = db.query(VoucherUsage).filter(
                and_(
                    VoucherUsage.voucher_id == voucher.id,
                    VoucherUsage.user_id == user_id,
                )
            ).count()
        
        can_use, message = voucher.can_use(order_amount, user_usage_count)
        
        if not can_use:
            return False, message, voucher, 0.0
        
        discount_amount = voucher.calculate_discount(order_amount)
        
        return True, "Voucher valid", voucher, discount_amount
    
    @staticmethod
    def create(db: Session, data: VoucherCreate) -> Voucher:
        """Create a new voucher."""
        # Check if code already exists
        existing = VoucherService.get_by_code(db, data.code)
        if existing:
            raise ValueError(f"Kode voucher '{data.code.upper()}' sudah ada")
        
        voucher = Voucher(
            id=str(uuid4()),
            code=data.code.upper(),
            name=data.name,
            description=data.description,
            voucher_type=VoucherType(data.voucher_type),
            discount_value=data.discount_value,
            min_order_amount=data.min_order_amount,
            max_discount=data.max_discount,
            usage_limit=data.usage_limit,
            per_user_limit=data.per_user_limit,
            start_date=data.start_date,
            end_date=data.end_date,
            is_active=data.is_active,
        )
        db.add(voucher)
        db.commit()
        db.refresh(voucher)
        return voucher
    
    @staticmethod
    def update(db: Session, voucher: Voucher, data: VoucherUpdate) -> Voucher:
        """Update an existing voucher."""
        update_data = data.model_dump(exclude_unset=True)
        
        # Check if new code conflicts with existing
        if 'code' in update_data and update_data['code']:
            new_code = update_data['code'].upper()
            existing = VoucherService.get_by_code(db, new_code)
            if existing and existing.id != voucher.id:
                raise ValueError(f"Kode voucher '{new_code}' sudah ada")
            update_data['code'] = new_code
        
        for field, value in update_data.items():
            if field == 'voucher_type' and value:
                value = VoucherType(value)
            setattr(voucher, field, value)
        
        db.commit()
        db.refresh(voucher)
        return voucher
    
    @staticmethod
    def delete(db: Session, voucher: Voucher) -> None:
        """Delete a voucher."""
        db.delete(voucher)
        db.commit()
    
    @staticmethod
    def record_usage(
        db: Session,
        voucher: Voucher,
        order_id: str,
        user_id: Optional[str],
        discount_amount: float,
    ) -> VoucherUsage:
        """Record voucher usage for an order."""
        usage = VoucherUsage(
            id=str(uuid4()),
            voucher_id=voucher.id,
            user_id=user_id,
            order_id=order_id,
            discount_amount=discount_amount,
        )
        db.add(usage)
        
        # Increment usage count
        voucher.usage_count += 1
        
        db.commit()
        db.refresh(usage)
        return usage
    
    @staticmethod
    def get_user_usage_count(db: Session, voucher_id: str, user_id: str) -> int:
        """Get how many times a user has used a specific voucher."""
        return db.query(VoucherUsage).filter(
            and_(
                VoucherUsage.voucher_id == voucher_id,
                VoucherUsage.user_id == user_id,
            )
        ).count()
