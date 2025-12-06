"""add size_calories and allergy_warning to products

Revision ID: e3c0b4c7d8ab
Revises: c5d87f3e9a1b
Create Date: 2025-12-06
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "e3c0b4c7d8ab"
down_revision = "c5d87f3e9a1b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("products", sa.Column("size_calories", sa.Text(), nullable=True))
    op.add_column("products", sa.Column("allergy_warning", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("products", "allergy_warning")
    op.drop_column("products", "size_calories")

