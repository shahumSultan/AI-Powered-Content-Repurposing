"""Add prompt_templates table

Revision ID: 006
Revises: 005
Create Date: 2026-05-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "prompt_templates",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(60), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("free_form", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_prompt_templates_user_id", "prompt_templates", ["user_id"])
    op.create_index(
        "ix_prompt_templates_user_is_default",
        "prompt_templates",
        ["user_id", "is_default"],
    )


def downgrade() -> None:
    op.drop_index("ix_prompt_templates_user_is_default", table_name="prompt_templates")
    op.drop_index("ix_prompt_templates_user_id", table_name="prompt_templates")
    op.drop_table("prompt_templates")
