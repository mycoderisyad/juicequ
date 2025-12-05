"""add product size pricing and volumes

Revision ID: b4e76c9d5f2a
Revises: a3d65b8c4bdf
Create Date: 2025-12-05 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4e76c9d5f2a'
down_revision: Union[str, Sequence[str], None] = 'a3d65b8c4bdf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add size_prices column (JSON: {"small": 10000, "medium": 15000, "large": 20000})
    op.add_column('products', sa.Column('size_prices', sa.Text(), nullable=True))
    
    # Add size_volumes column (JSON: {"small": 250, "medium": 350, "large": 500})
    op.add_column('products', sa.Column('size_volumes', sa.Text(), nullable=True))
    
    # Add volume_unit column (default: ml)
    op.add_column('products', sa.Column('volume_unit', sa.String(length=20), nullable=False, server_default='ml'))
    
    # Add has_sizes column (default: True - most products have sizes)
    op.add_column('products', sa.Column('has_sizes', sa.Boolean(), nullable=False, server_default='1'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('products', 'has_sizes')
    op.drop_column('products', 'volume_unit')
    op.drop_column('products', 'size_volumes')
    op.drop_column('products', 'size_prices')
