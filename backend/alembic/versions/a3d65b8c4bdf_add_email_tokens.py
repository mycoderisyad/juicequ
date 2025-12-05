"""add email verification and reset tokens

Revision ID: a3d65b8c4bdf
Revises: 9d1a60f285c2
Create Date: 2025-12-05 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3d65b8c4bdf'
down_revision: Union[str, Sequence[str], None] = '9d1a60f285c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('verification_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('verification_token_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('reset_token_hash', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('reset_token_expires_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'reset_token_expires_at')
    op.drop_column('users', 'reset_token_hash')
    op.drop_column('users', 'verification_token_expires_at')
    op.drop_column('users', 'verification_token')

