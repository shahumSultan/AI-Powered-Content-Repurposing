import logging

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import (
    FRONTEND_URL,
    STRIPE_BEGINNER_PRICE_ID,
    STRIPE_PRO_PRICE_ID,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
)
from core.database import get_db
from core.deps import get_current_user
from models import StripeCustomer, User, UserPlan

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])

stripe.api_key = STRIPE_SECRET_KEY


def _plan_to_price(plan: str) -> str | None:
    return {"beginner": STRIPE_BEGINNER_PRICE_ID, "pro": STRIPE_PRO_PRICE_ID}.get(plan)


# ── Checkout ──────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    plan: str


@router.post("/checkout")
async def create_checkout(
    body: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    price_id = _plan_to_price(body.plan)
    if not price_id:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")

    # Get or create Stripe customer
    result = await db.execute(select(StripeCustomer).where(StripeCustomer.user_id == current_user.id))
    sc = result.scalar_one_or_none()
    customer_id = sc.stripe_customer_id if sc else None

    if not customer_id:
        customer = stripe.customers.create(
            email=current_user.email,
            metadata={"user_id": current_user.id},
        )
        customer_id = customer.id
        db.add(StripeCustomer(user_id=current_user.id, stripe_customer_id=customer_id))
        await db.commit()

    session = stripe.checkout.sessions.create(
        customer=customer_id,
        client_reference_id=current_user.id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{FRONTEND_URL}/dashboard/billing?success=true",
        cancel_url=f"{FRONTEND_URL}/dashboard/billing",
        subscription_data={"metadata": {"user_id": current_user.id, "plan": body.plan}},
    )
    return {"url": session.url}


# ── Webhook ───────────────────────────────────────────────────────────────────

async def _upsert_plan(db: AsyncSession, user_id: str, **kwargs):
    result = await db.execute(select(UserPlan).where(UserPlan.user_id == user_id))
    plan = result.scalar_one_or_none()
    if plan:
        for k, v in kwargs.items():
            setattr(plan, k, v)
    else:
        plan = UserPlan(user_id=user_id, **kwargs)
        db.add(plan)
    await db.commit()


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("stripe-signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        event = stripe.Webhook.construct_event(body, signature, STRIPE_WEBHOOK_SECRET)
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type: str = event["type"]
    obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        user_id = obj.get("client_reference_id")
        sub_id = obj.get("subscription")
        if user_id and sub_id:
            sub = stripe.subscriptions.retrieve(sub_id)
            plan = sub.metadata.get("plan", "beginner")
            await _upsert_plan(db, user_id,
                plan=plan,
                gens_limit=999999 if plan == "pro" else 5,
                stripe_subscription_id=sub_id,
                subscription_status="active",
            )

    elif event_type == "customer.subscription.updated":
        user_id = obj.get("metadata", {}).get("user_id")
        if user_id:
            is_active = obj["status"] == "active"
            plan = obj.get("metadata", {}).get("plan", "beginner")
            await _upsert_plan(db, user_id,
                plan=plan if is_active else "free",
                gens_limit=(999999 if plan == "pro" else 5) if is_active else 3,
                stripe_subscription_id=obj["id"],
                subscription_status=obj["status"],
            )

    elif event_type == "customer.subscription.deleted":
        user_id = obj.get("metadata", {}).get("user_id")
        if user_id:
            await _upsert_plan(db, user_id,
                plan="free",
                gens_limit=3,
                stripe_subscription_id=None,
                subscription_status="canceled",
            )

    return {"received": True}


# ── Portal ────────────────────────────────────────────────────────────────────

@router.post("/portal")
async def billing_portal(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(StripeCustomer).where(StripeCustomer.user_id == current_user.id))
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="No billing account found")

    portal = stripe.billing_portal.sessions.create(
        customer=sc.stripe_customer_id,
        return_url=f"{FRONTEND_URL}/dashboard/billing",
    )
    return {"url": portal.url}
