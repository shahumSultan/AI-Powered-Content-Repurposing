import asyncio
import hashlib
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone

import resend
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import FRONTEND_URL, FROM_EMAIL, RESEND_API_KEY, RESEND_TEMPLATE_ID
from core.database import get_db
from core.deps import get_current_user
from core.security import create_token, hash_password, verify_password
from core.limiter import limiter
from models import PasswordResetToken, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

_PASSWORD_RE = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$')


def _validate_password(password: str) -> None:
    if not _PASSWORD_RE.match(password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters and contain uppercase, lowercase, and a number",
        )


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    full_name: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at.isoformat(),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    _validate_password(body.password)

    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id, user.email, user.full_name)
    return TokenResponse(access_token=token, user=_user_dict(user))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # Always run verify_password to prevent timing-based user enumeration
    password_ok = verify_password(body.password, user.password_hash) if user else False
    if not user or not password_ok:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id, user.email, user.full_name)
    return TokenResponse(access_token=token, user=_user_dict(user))


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


@router.patch("/me")
async def update_me(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.full_name = body.full_name.strip()
    await db.commit()
    await db.refresh(current_user)
    return _user_dict(current_user)


async def _send_reset_email(to_email: str, reset_url: str, full_name: str | None = None) -> None:
    if not RESEND_API_KEY:
        logger.info("Password reset link (dev mode, no RESEND_API_KEY): %s", reset_url)
        return
    try:
        resend.api_key = RESEND_API_KEY
        payload: dict = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Reset your ContentCube password",
        }
        if RESEND_TEMPLATE_ID:
            first_name = (full_name or "").split()[0] if full_name else "there"
            payload["template"] = {
                "id": RESEND_TEMPLATE_ID,
                "variables": {
                    "first_name": first_name,
                    "reset_password_url": reset_url,
                },
            }
        else:
            payload["html"] = (
                f"<p>Hi,</p>"
                f"<p>Click the link below to reset your password. This link expires in 1 hour.</p>"
                f'<p><a href="{reset_url}">{reset_url}</a></p>'
                f"<p>If you didn't request this, you can ignore this email.</p>"
            )
        # resend SDK is sync — run in thread pool to avoid blocking the event loop
        email = await asyncio.to_thread(resend.Emails.send, payload)
        logger.info("Password reset email sent to %s (Resend id: %s)", to_email, email.get("id"))
    except Exception:
        logger.exception("Failed to send password reset email to %s", to_email)


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, body: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # Always return 200 to avoid email enumeration
    if not user:
        return {"ok": True}

    # Invalidate any existing unused tokens for this user
    await db.execute(
        delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
    )

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=1)

    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    ))
    await db.commit()

    reset_url = f"{FRONTEND_URL}/auth/reset-password?token={raw_token}"
    background_tasks.add_task(_send_reset_email, user.email, reset_url, user.full_name)

    return {"ok": True}


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    _validate_password(body.password)

    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,  # noqa: E712
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    if reset_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset link has expired")

    user_result = await db.execute(select(User).where(User.id == reset_token.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user.password_hash = hash_password(body.password)
    reset_token.used = True
    await db.commit()

    return {"ok": True}
