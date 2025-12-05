"""Add promo voucher and preorder tables

Revision ID: c5d87f3e9a1b
Revises: b4e76c9d5f2a
Create Date: 2025-01-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5d87f3e9a1b'
down_revision: Union[str, None] = 'b4e76c9d5f2a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create product_promos table
    op.create_table(
        'product_promos',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('product_id', sa.Integer(), sa.ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('promo_type', sa.Enum('percentage', 'fixed', name='promotype'), nullable=False, default='percentage'),
        sa.Column('discount_value', sa.Float(), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # Create vouchers table
    op.create_table(
        'vouchers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('code', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('voucher_type', sa.Enum('percentage', 'fixed', 'free_shipping', name='vouchertype'), nullable=False, default='percentage'),
        sa.Column('discount_value', sa.Float(), nullable=False),
        sa.Column('min_order_amount', sa.Float(), nullable=False, default=0.0),
        sa.Column('max_discount', sa.Float(), nullable=True),
        sa.Column('usage_limit', sa.Integer(), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=False, default=0),
        sa.Column('per_user_limit', sa.Integer(), nullable=False, default=1),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # Create voucher_usages table
    op.create_table(
        'voucher_usages',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('voucher_id', sa.String(36), sa.ForeignKey('vouchers.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('order_id', sa.String(36), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('discount_amount', sa.Float(), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Add pre-order and voucher columns to orders table (without FK for SQLite compatibility)
    op.add_column('orders', sa.Column('is_preorder', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('orders', sa.Column('scheduled_pickup_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('scheduled_pickup_time', sa.String(10), nullable=True))
    op.add_column('orders', sa.Column('voucher_id', sa.String(36), nullable=True))
    op.add_column('orders', sa.Column('voucher_code', sa.String(50), nullable=True))
    op.add_column('orders', sa.Column('voucher_discount', sa.Float(), nullable=False, server_default='0'))


def downgrade() -> None:
    # Remove columns from orders
    op.drop_column('orders', 'voucher_discount')
    op.drop_column('orders', 'voucher_code')
    op.drop_column('orders', 'voucher_id')
    op.drop_column('orders', 'scheduled_pickup_time')
    op.drop_column('orders', 'scheduled_pickup_date')
    op.drop_column('orders', 'is_preorder')
    
    # Drop tables
    op.drop_table('voucher_usages')
    op.drop_table('vouchers')
    op.drop_table('product_promos')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS promotype")
    op.execute("DROP TYPE IF EXISTS vouchertype")
