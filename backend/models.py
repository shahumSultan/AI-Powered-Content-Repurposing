import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    plan: Mapped["UserPlan | None"] = relationship("UserPlan", back_populates="user", uselist=False)
    stripe_customer: Mapped["StripeCustomer | None"] = relationship("StripeCustomer", back_populates="user", uselist=False)
    settings: Mapped["UserSettings | None"] = relationship("UserSettings", back_populates="user", uselist=False)
    history: Mapped[list["GenerationHistory"]] = relationship("GenerationHistory", back_populates="user")


class UserPlan(Base):
    __tablename__ = "user_plans"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    plan: Mapped[str] = mapped_column(String(20), default="free")
    gens_used: Mapped[int] = mapped_column(Integer, default=0)
    gens_limit: Mapped[int] = mapped_column(Integer, default=3)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subscription_status: Mapped[str | None] = mapped_column(String(30), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="plan")


class StripeCustomer(Base):
    __tablename__ = "stripe_customers"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    stripe_customer_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped["User"] = relationship("User", back_populates="stripe_customer")


class GenerationHistory(Base):
    __tablename__ = "generation_history"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    urls: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped["User"] = relationship("User", back_populates="history")


class TrialUsage(Base):
    __tablename__ = "trial_usage"

    ip_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    groq_api_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    openai_api_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_provider: Mapped[str] = mapped_column(String(20), default="groq")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped["User"] = relationship("User", back_populates="settings")
