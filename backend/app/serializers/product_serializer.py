"""Product model serialization."""
from typing import Any

from sqlalchemy.orm import Session

from app.models.product import Product
from app.utils.json_helpers import safe_json_loads


class ProductSerializer:
    """Handles Product model to dict conversion."""

    HERO_COLORS = [
        {
            "bg": "bg-red-500",
            "gradient_from": "from-red-400",
            "gradient_to": "to-red-600",
            "button_bg": "bg-red-600",
            "button_hover": "hover:bg-red-700",
            "shadow_color": "shadow-red-600/20",
            "accent": "text-red-600",
            "bg_accent": "bg-red-50/50",
        },
        {
            "bg": "bg-green-500",
            "gradient_from": "from-green-400",
            "gradient_to": "to-green-600",
            "button_bg": "bg-green-600",
            "button_hover": "hover:bg-green-700",
            "shadow_color": "shadow-green-600/20",
            "accent": "text-green-600",
            "bg_accent": "bg-green-50/50",
        },
        {
            "bg": "bg-yellow-500",
            "gradient_from": "from-yellow-400",
            "gradient_to": "to-orange-500",
            "button_bg": "bg-orange-500",
            "button_hover": "hover:bg-orange-600",
            "shadow_color": "shadow-orange-500/20",
            "accent": "text-orange-500",
            "bg_accent": "bg-orange-50/50",
        },
        {
            "bg": "bg-purple-500",
            "gradient_from": "from-purple-400",
            "gradient_to": "to-purple-600",
            "button_bg": "bg-purple-600",
            "button_hover": "hover:bg-purple-700",
            "shadow_color": "shadow-purple-600/20",
            "accent": "text-purple-600",
            "bg_accent": "bg-purple-50/50",
        },
        {
            "bg": "bg-blue-500",
            "gradient_from": "from-blue-400",
            "gradient_to": "to-blue-600",
            "button_bg": "bg-blue-600",
            "button_hover": "hover:bg-blue-700",
            "shadow_color": "shadow-blue-600/20",
            "accent": "text-blue-600",
            "bg_accent": "bg-blue-50/50",
        },
    ]

    @staticmethod
    def to_admin_dict(product: Product) -> dict[str, Any]:
        """Convert Product to admin response dict with full details."""
        ingredients = safe_json_loads(product.ingredients, [])
        size_prices = safe_json_loads(product.size_prices)
        size_volumes = safe_json_loads(product.size_volumes)
        size_calories = safe_json_loads(product.size_calories)

        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.base_price,
            "base_price": product.base_price,
            "category": product.category_id,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None,
            "image": product.image_url,
            "image_color": product.image_url,
            "hero_image": product.hero_image,
            "bottle_image": product.bottle_image,
            "thumbnail_image": product.thumbnail_image,
            "is_available": product.is_available,
            "stock": product.stock_quantity,
            "stock_quantity": product.stock_quantity,
            "ingredients": ingredients,
            "calories": product.calories,
            "size_calories": size_calories,
            "calories_by_size": product.get_all_calories(),
            "allergy_warning": product.allergy_warning,
            "rating": product.average_rating,
            "reviews": product.order_count,
            "order_count": product.order_count,
            "has_sizes": product.has_sizes,
            "size_prices": size_prices,
            "size_volumes": size_volumes,
            "volume_unit": product.volume_unit,
            "prices": product.get_all_prices(),
            "volumes": product.get_all_volumes(),
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None,
        }

    @staticmethod
    def to_customer_dict(
        product: Product,
        db: Session | None = None,
        include_promo: bool = True,
    ) -> dict[str, Any]:
        """Convert Product to customer response dict."""
        ingredients = safe_json_loads(product.ingredients, [])
        size_calories = safe_json_loads(product.size_calories)

        promo_info = None
        if include_promo and db:
            from app.services.promo_service import PromoService

            promo_data = PromoService.get_product_promo_info(db, product)
            if promo_data.has_promo:
                promo_info = {
                    "has_promo": True,
                    "promo_id": promo_data.promo_id,
                    "promo_name": promo_data.promo_name,
                    "promo_type": promo_data.promo_type,
                    "discount_value": promo_data.discount_value,
                    "discount_percentage": promo_data.discount_percentage,
                    "original_price": promo_data.original_price,
                    "discounted_price": promo_data.discounted_price,
                    "promo_end_date": (
                        promo_data.promo_end_date.isoformat()
                        if promo_data.promo_end_date
                        else None
                    ),
                }

        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "base_price": product.base_price,
            "price": product.base_price,
            "calories": product.calories,
            "size_calories": size_calories,
            "calories_by_size": product.get_all_calories(),
            "category": product.category_id,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None,
            "image": product.image_url,
            "image_url": product.image_url,
            "image_color": product.image_url,
            "thumbnail_image": product.thumbnail_image,
            "hero_image": product.hero_image,
            "bottle_image": product.bottle_image,
            "is_available": product.is_available,
            "stock": product.stock_quantity,
            "stock_quantity": product.stock_quantity,
            "ingredients": ingredients,
            "allergy_warning": getattr(product, "allergy_warning", None),
            "rating": product.average_rating or 0,
            "reviews": product.order_count or 0,
            "nutrition": {"calories": product.calories, "sugar": product.sugar_grams},
            "has_sizes": getattr(product, "has_sizes", True),
            "prices": product.get_all_prices(),
            "volumes": product.get_all_volumes(),
            "volume_unit": getattr(product, "volume_unit", "ml"),
            "promo": promo_info,
        }

    @staticmethod
    def to_detail_dict(product: Product, db: Session | None = None) -> dict[str, Any]:
        """Convert Product to detailed response dict for single product view."""
        base = ProductSerializer.to_customer_dict(product, db)
        base.update(
            {
                "sugar_grams": product.sugar_grams,
                "is_featured": product.is_featured,
                "health_benefits": product.health_benefits,
                "order_count": product.order_count,
                "average_rating": product.average_rating,
            }
        )
        return base

    @classmethod
    def to_hero_dict(cls, product: Product, index: int = 0) -> dict[str, Any]:
        """Convert Product to hero section response dict."""
        color = cls.HERO_COLORS[index % len(cls.HERO_COLORS)]

        if product.image_url and product.image_url.startswith("bg-"):
            for c in cls.HERO_COLORS:
                if c["bg"].split("-")[1] in product.image_url:
                    color = c
                    break

        slug = product.name.lower().replace(" ", "-")
        return {
            "id": str(product.id),
            "name": product.name,
            "price": str(product.base_price),
            "description": product.description,
            "rating": product.average_rating or 5,
            "order_count": product.order_count or 0,
            "prices": product.get_all_prices(),
            "color": color["bg"],
            "gradient_from": color["gradient_from"],
            "gradient_to": color["gradient_to"],
            "button_bg": color["button_bg"],
            "button_hover": color["button_hover"],
            "shadow_color": color["shadow_color"],
            "accent_color": color["accent"],
            "bg_accent": color["bg_accent"],
            "hero_image": product.hero_image or f"/images/products/hero/{slug}.webp",
            "bottle_image": product.bottle_image
            or f"/images/products/bottles/{slug}.webp",
            "thumbnail_image": product.thumbnail_image or product.image_url,
        }

