"""add_oauth_fields_to_user

Revision ID: 9d1a60f285c2
Revises: 8e2cd779862d
Create Date: 2025-12-05 10:36:03.510948

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d1a60f285c2'
down_revision: Union[str, Sequence[str], None] = '8e2cd779862d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add auth_provider with default value for existing rows (SQLite compatible)
    op.add_column('users', sa.Column('auth_provider', sa.String(length=10), nullable=False, server_default='local'))
    op.add_column('users', sa.Column('oauth_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(length=500), nullable=True))
    
    # SQLite doesn't support ALTER COLUMN, so we skip this for SQLite
    # For PostgreSQL/MySQL, you would use:
    # op.alter_column('users', 'hashed_password',
    #            existing_type=sa.VARCHAR(length=255),
    #            nullable=True)
    
    op.create_index(op.f('ix_users_oauth_id'), 'users', ['oauth_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_users_oauth_id'), table_name='users')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'oauth_id')
    op.drop_column('users', 'auth_provider')
