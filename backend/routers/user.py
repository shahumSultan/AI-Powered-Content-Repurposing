"""
User plan, settings, history, and quota management.
"""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.crypto import decrypt, encrypt
from core.database import get_db
from core.deps import get_current_user
from models import BrandKit, GenerationHistory, PromptTemplate, User, UserPlan, UserSettings

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
            "has_content": bool(r.content_pack),
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

    @field_validator("custom_prompt")
    @classmethod
    def limit_custom_prompt(cls, v: str | None) -> str | None:
        if v and len(v) > 5000:
            raise ValueError("Custom prompt must be 5000 characters or fewer")
        return v


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
    if (body.custom_prompt or body.free_form_output) and not current_user.is_admin:
        plan = await _get_or_create_plan(current_user, db)
        if plan.plan != "pro":
            raise HTTPException(status_code=403, detail="Custom prompts require a Pro plan")

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


# ── Brand Kit ─────────────────────────────────────────────────────────────────

class BrandKitSave(BaseModel):
    brand_name: str | None = None
    brand_voice: str | None = None
    target_audience: str | None = None
    niche: str | None = None
    preferred_cta: str | None = None
    default_hashtags: str | None = None


def _serialize_brand_kit(bk: BrandKit | None) -> dict:
    fields = ["brand_name", "brand_voice", "target_audience", "niche", "preferred_cta", "default_hashtags"]
    if not bk:
        return {f: None for f in fields}
    return {f: getattr(bk, f) for f in fields}


@router.get("/brand-kit")
async def get_brand_kit(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BrandKit).where(BrandKit.user_id == current_user.id))
    return _serialize_brand_kit(result.scalar_one_or_none())


@router.post("/brand-kit")
async def save_brand_kit(
    body: BrandKitSave,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_pro(current_user, db)

    result = await db.execute(select(BrandKit).where(BrandKit.user_id == current_user.id))
    bk = result.scalar_one_or_none()
    if bk:
        bk.brand_name = body.brand_name
        bk.brand_voice = body.brand_voice
        bk.target_audience = body.target_audience
        bk.niche = body.niche
        bk.preferred_cta = body.preferred_cta
        bk.default_hashtags = body.default_hashtags
    else:
        bk = BrandKit(
            user_id=current_user.id,
            brand_name=body.brand_name,
            brand_voice=body.brand_voice,
            target_audience=body.target_audience,
            niche=body.niche,
            preferred_cta=body.preferred_cta,
            default_hashtags=body.default_hashtags,
        )
        db.add(bk)
    await db.commit()
    return {"ok": True}


# ── Prompt Templates ──────────────────────────────────────────────────────────

class TemplateCreate(BaseModel):
    name: str
    prompt: str
    free_form: bool = False
    is_default: bool = False

    @field_validator("name")
    @classmethod
    def name_length(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 60:
            raise ValueError("Name must be 1–60 characters")
        return v

    @field_validator("prompt")
    @classmethod
    def prompt_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Prompt cannot be empty")
        return v


class TemplateUpdate(BaseModel):
    name: str | None = None
    prompt: str | None = None
    free_form: bool | None = None
    is_default: bool | None = None


def _serialize_template(t: PromptTemplate) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "prompt": t.prompt,
        "free_form": t.free_form,
        "is_default": t.is_default,
        "created_at": t.created_at.isoformat(),
    }


async def _require_pro(user: User, db: AsyncSession) -> None:
    if not user.is_admin:
        plan = await _get_or_create_plan(user, db)
        if plan.plan != "pro":
            raise HTTPException(status_code=403, detail="Prompt templates require a Pro plan")


@router.get("/templates")
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PromptTemplate)
        .where(PromptTemplate.user_id == current_user.id)
        .order_by(PromptTemplate.created_at.asc())
    )
    return [_serialize_template(t) for t in result.scalars().all()]


@router.post("/templates")
async def create_template(
    body: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_pro(current_user, db)

    count = await db.scalar(
        select(func.count()).select_from(PromptTemplate).where(PromptTemplate.user_id == current_user.id)
    )
    if count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 templates allowed")

    if body.is_default:
        await db.execute(
            update(PromptTemplate)
            .where(PromptTemplate.user_id == current_user.id)
            .where(PromptTemplate.is_default == True)  # noqa: E712
            .values(is_default=False)
        )

    t = PromptTemplate(
        user_id=current_user.id,
        name=body.name,
        prompt=body.prompt,
        free_form=body.free_form,
        is_default=body.is_default,
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return _serialize_template(t)


@router.patch("/templates/{template_id}")
async def update_template(
    template_id: str,
    body: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_pro(current_user, db)

    result = await db.execute(
        select(PromptTemplate)
        .where(PromptTemplate.id == template_id)
        .where(PromptTemplate.user_id == current_user.id)
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    if body.is_default is True:
        await db.execute(
            update(PromptTemplate)
            .where(PromptTemplate.user_id == current_user.id)
            .where(PromptTemplate.is_default == True)  # noqa: E712
            .values(is_default=False)
        )

    if body.name is not None:
        t.name = body.name.strip()
    if body.prompt is not None:
        t.prompt = body.prompt
    if body.free_form is not None:
        t.free_form = body.free_form
    if body.is_default is not None:
        t.is_default = body.is_default

    await db.commit()
    await db.refresh(t)
    return _serialize_template(t)


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PromptTemplate)
        .where(PromptTemplate.id == template_id)
        .where(PromptTemplate.user_id == current_user.id)
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(t)
    await db.commit()
    return {"ok": True}


# ── Generation context (quota + settings + plan in one round-trip) ────────────

@router.post("/prepare-generation")
async def prepare_generation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Atomically consume one generation quota slot and return settings + plan."""
    # SELECT FOR UPDATE prevents concurrent requests from double-spending quota
    result = await db.execute(
        select(UserPlan).where(UserPlan.user_id == current_user.id).with_for_update()
    )
    plan = result.scalar_one_or_none()
    if not plan:
        plan = UserPlan(user_id=current_user.id)
        db.add(plan)
        await db.flush()

    now = datetime.now(timezone.utc)
    if (now - plan.period_start.replace(tzinfo=timezone.utc)).days >= 30:
        plan.gens_used = 0
        plan.period_start = now

    is_unlimited = current_user.is_admin or plan.plan == "pro"
    if not is_unlimited and plan.gens_used >= plan.gens_limit:
        return {"quota_status": "limit_reached"}

    plan.gens_used += 1
    await db.commit()

    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    s = result.scalar_one_or_none()

    tpl_result = await db.execute(
        select(PromptTemplate)
        .where(PromptTemplate.user_id == current_user.id)
        .order_by(PromptTemplate.created_at.asc())
    )
    templates = tpl_result.scalars().all()

    bk_result = await db.execute(select(BrandKit).where(BrandKit.user_id == current_user.id))
    bk = bk_result.scalar_one_or_none()

    is_pro = current_user.is_admin or plan.plan == "pro"

    return {
        "quota_status": "ok",
        "is_admin": current_user.is_admin,
        "plan": plan.plan,
        "settings": {
            "groq_api_key": decrypt(s.groq_api_key) if s else None,
            "openai_api_key": decrypt(s.openai_api_key) if s else None,
            "preferred_provider": s.preferred_provider if s else "groq",
            "custom_prompt": s.custom_prompt if s else None,
            "free_form_output": s.free_form_output if s else False,
        },
        "templates": [_serialize_template(t) for t in templates],
        "brand_kit": _serialize_brand_kit(bk) if is_pro else None,
    }
