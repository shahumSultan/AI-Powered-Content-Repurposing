"""Add content_pack and title to generation_history

Revision ID: 003
Revises: 002
Create Date: 2026-04-21
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("generation_history", sa.Column("title", sa.String(500), nullable=True))
    op.add_column("generation_history", sa.Column("content_pack", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("generation_history", "content_pack")
    op.drop_column("generation_history", "title")
