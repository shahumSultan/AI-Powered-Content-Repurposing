"""Add free_form_output to user_settings

Revision ID: 005
Revises: 004
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_settings",
        sa.Column("free_form_output", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("user_settings", "free_form_output")
