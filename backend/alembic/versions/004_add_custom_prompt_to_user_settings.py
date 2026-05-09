"""Add custom_prompt to user_settings

Revision ID: 004
Revises: 003
Create Date: 2026-05-09
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_settings", sa.Column("custom_prompt", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("user_settings", "custom_prompt")
