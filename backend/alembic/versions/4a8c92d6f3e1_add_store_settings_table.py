"""Add store_settings table

Revision ID: 4a8c92d6f3e1
Revises: 3b7171453a2d
Create Date: 2024-01-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a8c92d6f3e1'
down_revision: Union[str, None] = '3b7171453a2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create store_settings table
    op.create_table(
        'store_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('value_type', sa.String(length=20), nullable=True, default='string'),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_store_settings_id'), 'store_settings', ['id'], unique=False)
    op.create_index(op.f('ix_store_settings_key'), 'store_settings', ['key'], unique=True)
    op.create_index(op.f('ix_store_settings_category'), 'store_settings', ['category'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_store_settings_category'), table_name='store_settings')
    op.drop_index(op.f('ix_store_settings_key'), table_name='store_settings')
    op.drop_index(op.f('ix_store_settings_id'), table_name='store_settings')
    op.drop_table('store_settings')
