"""
User plan, settings, history, and quota management.
"""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.crypto import decrypt, encrypt
from core.database import get_db
from core.deps import get_current_user
from models import GenerationHistory, User, UserPlan, UserSettings

router = APIRouter(prefix="/user", tags=["user"])

_MAX_CONTENT_PACK_BYTES = 500_000  # 500 KB


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
    plan = await _get_or_create_plan(current_user, db)

    now = datetime.now(timezone.utc)

    delta = now - plan.period_start.replace(tzinfo=timezone.utc)
    if delta.days >= 30:
        plan.gens_used = 0
        plan.period_start = now

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
    content_pack: dict | None = None
    title: str | None = None

    @field_validator("content_pack")
    @classmethod
    def limit_size(cls, v):
        if v and len(json.dumps(v)) > _MAX_CONTENT_PACK_BYTES:
            raise ValueError("Content pack too large (max 500 KB)")
        return v

    @field_validator("urls")
    @classmethod
    def limit_urls(cls, v):
        if len(v) > 5:
            raise ValueError("Maximum 5 URLs")
        return v


@router.post("/record-generation")
async def record_generation(
    body: RecordHistoryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    title = body.title or (body.urls[0] if body.urls else None)
    record = GenerationHistory(
        user_id=current_user.id,
        urls=body.urls,
        content_pack=body.content_pack,
        title=title,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return {"ok": True, "id": record.id}


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
    return [
        {
            "id": r.id,
            "title": r.title,
            "urls": r.urls,
            "created_at": r.created_at.isoformat(),
            "has_content": r.content_pack is not None,
        }
        for r in rows
    ]


@router.get("/history/{record_id}")
async def get_history_item(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GenerationHistory)
        .where(GenerationHistory.id == record_id)
        .where(GenerationHistory.user_id == current_user.id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": record.id,
        "title": record.title,
        "urls": record.urls,
        "content_pack": record.content_pack,
        "created_at": record.created_at.isoformat(),
    }


# ── Settings ──────────────────────────────────────────────────────────────────

class SaveSettingsRequest(BaseModel):
    groq_api_key: str | None = None
    openai_api_key: str | None = None
    preferred_provider: str = "groq"
    custom_prompt: str | None = None
    free_form_output: bool = False


@router.get("/settings")
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    s = result.scalar_one_or_none()
    if not s:
        return {"groq_api_key": None, "openai_api_key": None, "preferred_provider": "groq", "custom_prompt": None, "free_form_output": False}
    return {
        "groq_api_key": decrypt(s.groq_api_key),
        "openai_api_key": decrypt(s.openai_api_key),
        "preferred_provider": s.preferred_provider,
        "custom_prompt": s.custom_prompt,
        "free_form_output": s.free_form_output,
    }


@router.post("/settings")
async def save_settings(
    body: SaveSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    s = result.scalar_one_or_none()
    encrypted_groq = encrypt(body.groq_api_key)
    encrypted_openai = encrypt(body.openai_api_key)
    if s:
        s.groq_api_key = encrypted_groq
        s.openai_api_key = encrypted_openai
        s.preferred_provider = body.preferred_provider
        s.custom_prompt = body.custom_prompt
        s.free_form_output = body.free_form_output
    else:
        s = UserSettings(
            user_id=current_user.id,
            groq_api_key=encrypted_groq,
            openai_api_key=encrypted_openai,
            preferred_provider=body.preferred_provider,
            custom_prompt=body.custom_prompt,
            free_form_output=body.free_form_output,
        )
        db.add(s)
    await db.commit()
    return {"ok": True}
