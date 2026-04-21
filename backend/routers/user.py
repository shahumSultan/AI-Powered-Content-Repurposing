"""
User plan, settings, history, and quota management.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models import GenerationHistory, User, UserPlan, UserSettings

router = APIRouter(prefix="/user", tags=["user"])


# ── Plan ──────────────────────────────────────────────────────────────────────

async def _get_or_create_plan(user: User, db: AsyncSession) -> UserPlan:
    result = await db.execute(select(UserPlan).where(UserPlan.user_id == user.id))
    plan = result.scalar_one_or_none()
    if not plan:
        plan = UserPlan(user_id=user.id)
        db.add(plan)
        await db.commit()
        await db.refresh(plan)
    return plan


@router.get("/plan")
async def get_plan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plan = await _get_or_create_plan(current_user, db)
    stripe_res = await db.execute(
        select(UserPlan.stripe_subscription_id).where(UserPlan.user_id == current_user.id)
    )
    return {
        "plan": plan.plan,
        "gens_used": plan.gens_used,
        "gens_limit": plan.gens_limit,
        "period_start": plan.period_start.isoformat(),
        "stripe_subscription_id": plan.stripe_subscription_id,
        "subscription_status": plan.subscription_status,
        "is_admin": current_user.is_admin,
    }


# ── Quota ─────────────────────────────────────────────────────────────────────

@router.post("/consume-generation")
async def consume_generation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Atomically check and increment generation quota. Returns {"status": "ok"} or 429."""
    plan = await _get_or_create_plan(current_user, db)

    now = datetime.now(timezone.utc)

    # Reset monthly window if 30 days have passed
    delta = now - plan.period_start.replace(tzinfo=timezone.utc)
    if delta.days >= 30:
        plan.gens_used = 0
        plan.period_start = now

    # Admins and pro users are unlimited
    if current_user.is_admin or plan.plan == "pro":
        plan.gens_used += 1
        await db.commit()
        return {"status": "ok"}

    if plan.gens_used >= plan.gens_limit:
        return {"status": "limit_reached"}

    plan.gens_used += 1
    await db.commit()
    return {"status": "ok"}


# ── History ───────────────────────────────────────────────────────────────────

class RecordHistoryRequest(BaseModel):
    urls: list[str]


@router.post("/record-generation")
async def record_generation(
    body: RecordHistoryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = GenerationHistory(user_id=current_user.id, urls=body.urls)
    db.add(record)
    await db.commit()
    return {"ok": True}


@router.get("/history")
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GenerationHistory)
        .where(GenerationHistory.user_id == current_user.id)
        .order_by(GenerationHistory.created_at.desc())
    )
    rows = result.scalars().all()
    return [{"urls": r.urls, "created_at": r.created_at.isoformat()} for r in rows]


# ── Settings ──────────────────────────────────────────────────────────────────

class SaveSettingsRequest(BaseModel):
    groq_api_key: str | None = None
    openai_api_key: str | None = None
    preferred_provider: str = "groq"


@router.get("/settings")
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    s = result.scalar_one_or_none()
    if not s:
        return {"groq_api_key": None, "openai_api_key": None, "preferred_provider": "groq"}
    return {
        "groq_api_key": s.groq_api_key,
        "openai_api_key": s.openai_api_key,
        "preferred_provider": s.preferred_provider,
    }


@router.post("/settings")
async def save_settings(
    body: SaveSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    s = result.scalar_one_or_none()
    if s:
        s.groq_api_key = body.groq_api_key
        s.openai_api_key = body.openai_api_key
        s.preferred_provider = body.preferred_provider
    else:
        s = UserSettings(
            user_id=current_user.id,
            groq_api_key=body.groq_api_key,
            openai_api_key=body.openai_api_key,
            preferred_provider=body.preferred_provider,
        )
        db.add(s)
    await db.commit()
    return {"ok": True}
