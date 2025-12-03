"""Add product hero and bottle images

Revision ID: 5c8f2e9a7b3d
Revises: 4a8c92d6f3e1
Create Date: 2025-12-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5c8f2e9a7b3d'
down_revision: Union[str, None] = '4a8c92d6f3e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add hero_image, bottle_image, thumbnail_image columns to products table."""
    # Add hero_image column
    op.add_column(
        'products',
        sa.Column('hero_image', sa.String(500), nullable=True, comment='Background image for hero section (WebP)')
    )
    
    # Add bottle_image column
    op.add_column(
        'products',
        sa.Column('bottle_image', sa.String(500), nullable=True, comment='Bottle/product image for hero section (WebP)')
    )
    
    # Add thumbnail_image column
    op.add_column(
        'products',
        sa.Column('thumbnail_image', sa.String(500), nullable=True, comment='Thumbnail image for catalog (WebP)')
    )


def downgrade() -> None:
    """Remove hero_image, bottle_image, thumbnail_image columns from products table."""
    op.drop_column('products', 'thumbnail_image')
    op.drop_column('products', 'bottle_image')
    op.drop_column('products', 'hero_image')
