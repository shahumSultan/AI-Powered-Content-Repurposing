"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-20
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "user_plans",
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("plan", sa.String(20), nullable=False, server_default="free"),
        sa.Column("gens_used", sa.Integer, nullable=False, server_default="0"),
        sa.Column("gens_limit", sa.Integer, nullable=False, server_default="3"),
        sa.Column("period_start", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("stripe_subscription_id", sa.String(100), nullable=True),
        sa.Column("subscription_status", sa.String(30), nullable=True),
    )

    op.create_table(
        "stripe_customers",
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("stripe_customer_id", sa.String(100), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "generation_history",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("urls", JSONB, nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_generation_history_user_id", "generation_history", ["user_id"])

    op.create_table(
        "trial_usage",
        sa.Column("ip_hash", sa.String(64), primary_key=True),
        sa.Column("used_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "user_settings",
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("groq_api_key", sa.Text, nullable=True),
        sa.Column("openai_api_key", sa.Text, nullable=True),
        sa.Column("preferred_provider", sa.String(20), nullable=False, server_default="groq"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("user_settings")
    op.drop_table("trial_usage")
    op.drop_index("ix_generation_history_user_id", "generation_history")
    op.drop_table("generation_history")
    op.drop_table("stripe_customers")
    op.drop_table("user_plans")
    op.drop_index("ix_users_email", "users")
    op.drop_table("users")
