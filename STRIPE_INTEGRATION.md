# Stripe Integration Guide — ContentFlow

This guide walks through connecting Stripe to ContentFlow so users can purchase the **Beginner ($7/month)** and **Pro ($14/month)** plans.

---

## Overview

The integration uses **Stripe Checkout** (hosted payment page) and **Stripe Customer Portal** (hosted billing management). No custom payment UI is needed — Stripe handles card collection, invoices, and subscription management.

**Payment flow:**
```
User clicks "Upgrade"
  → POST /api/stripe/checkout
  → Redirect to Stripe-hosted checkout
  → User pays
  → Stripe redirects back to /dashboard/billing?success=true
  → Stripe fires webhook → POST /api/stripe/webhook
  → Webhook updates user_plans in Supabase
```

---

## Step 1: Stripe Dashboard Setup

### 1.1 Get your API keys

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Navigate to **Developers → API keys**
3. Copy:
   - **Publishable key** → `pk_live_...` (or `pk_test_...` for testing)
   - **Secret key** → `sk_live_...` (or `sk_test_...` for testing)

> **Start with test keys** until you're ready to go live. Test cards won't charge real money.

### 1.2 Create your products and prices

1. Stripe Dashboard → **Product catalog → Add product**
2. Create **Beginner** plan:
   - Name: `ContentFlow Beginner`
   - Pricing model: **Recurring**
   - Price: **$7.00 / month**
   - Click **Save product**
   - Copy the **Price ID**: `price_xxxxxxxxxxxxxxxxxx`
3. Create **Pro** plan:
   - Name: `ContentFlow Pro`
   - Pricing model: **Recurring**
   - Price: **$14.00 / month**
   - Click **Save product**
   - Copy the **Price ID**: `price_xxxxxxxxxxxxxxxxxx`

### 1.3 Enable Customer Portal

1. Stripe Dashboard → **Settings → Billing → Customer portal**
2. Enable it and configure:
   - Allow customers to cancel subscriptions: **Yes**
   - Allow customers to update payment methods: **Yes**
3. Click **Save**

### 1.4 Create a webhook endpoint

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - For local testing: use Stripe CLI (see Step 4)
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **Add endpoint**
5. Copy the **Signing secret**: `whsec_...`

---

## Step 2: Environment Variables

Add these to `frontend/.env.local` and your production deployment (Railway/Vercel):

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BEGINNER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase service role key (needed by webhook to bypass RLS)
# Found in: Supabase Dashboard → Project Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> **Never commit real keys to git.** Keep `.env.local` in `.gitignore` (it already is).

---

## Step 3: Supabase Schema

Run this migration in Supabase Dashboard → **SQL Editor**, or save it as `supabase/migrations/002_stripe.sql`:

```sql
-- Map Supabase users to Stripe customer IDs
CREATE TABLE IF NOT EXISTS stripe_customers (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_stripe_customer" ON stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

-- Add subscription fields to user_plans
ALTER TABLE user_plans
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status     TEXT;  -- active | canceled | past_due | trialing
```

---

## Step 4: Install the Stripe Package

```bash
cd frontend
npm install stripe
```

---

## Step 5: API Routes to Build

### 5.1 Checkout — `frontend/app/api/stripe/checkout/route.ts`

```typescript
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  // 1. Get authenticated user
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  // 2. Parse which plan they want
  const { plan } = await req.json(); // "beginner" | "pro"
  const priceId = plan === "pro"
    ? process.env.STRIPE_PRO_PRICE_ID!
    : process.env.STRIPE_BEGINNER_PRICE_ID!;

  // 3. Get or create Stripe customer
  const { data: existing } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    // Store mapping (use service role client for writes)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await adminSupabase.from("stripe_customers").insert({
      user_id: user.id,
      stripe_customer_id: customerId,
    });
  }

  // 4. Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: user.id,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`,
    subscription_data: {
      metadata: { supabase_user_id: user.id, plan },
    },
  });

  return NextResponse.json({ url: session.url });
}
```

### 5.2 Webhook — `frontend/app/api/stripe/webhook/route.ts`

```typescript
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Supabase admin client (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text(); // raw body needed for signature verification
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ detail: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id!;
      const subscriptionId = session.subscription as string;

      // Determine plan from subscription metadata
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const plan = subscription.metadata.plan ?? "beginner";

      await supabase.from("user_plans").upsert({
        user_id: userId,
        plan,
        gens_limit: plan === "pro" ? 999999 : 5,
        stripe_subscription_id: subscriptionId,
        subscription_status: "active",
      }, { onConflict: "user_id" });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.supabase_user_id;
      if (!userId) break;

      const isActive = sub.status === "active";
      const plan = sub.metadata.plan ?? "beginner";

      await supabase.from("user_plans").upsert({
        user_id: userId,
        plan: isActive ? plan : "free",
        gens_limit: isActive && plan === "pro" ? 999999 : 5,
        stripe_subscription_id: sub.id,
        subscription_status: sub.status,
      }, { onConflict: "user_id" });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.supabase_user_id;
      if (!userId) break;

      await supabase.from("user_plans").upsert({
        user_id: userId,
        plan: "free",
        gens_limit: 5,
        stripe_subscription_id: null,
        subscription_status: "canceled",
      }, { onConflict: "user_id" });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

### 5.3 Customer Portal — `frontend/app/api/stripe/portal/route.ts`

```typescript
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const { data: customer } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer?.stripe_customer_id) {
    return NextResponse.json({ detail: "No billing account found" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

---

## Step 6: Frontend — Upgrade & Manage Billing Buttons

Add `NEXT_PUBLIC_SITE_URL=https://your-domain.com` to env vars.

In your billing and plan pages, replace `href="/#pricing"` upgrade links with a button like:

```typescript
async function handleUpgrade(plan: "beginner" | "pro") {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  const { url } = await res.json();
  window.location.href = url;
}

async function handleManageBilling() {
  const res = await fetch("/api/stripe/portal", { method: "POST" });
  const { url } = await res.json();
  window.location.href = url;
}
```

Show "Manage Billing" only when `user_plans.plan !== 'free'` and `subscription_status === 'active'`.

---

## Step 7: Testing Locally

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from https://stripe.com/docs/stripe-cli
stripe login
```

### Forward webhooks to localhost

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# This prints a local webhook signing secret — use it as STRIPE_WEBHOOK_SECRET in .env.local
```

### Test checkout

Use these test card numbers (no real charges):
| Card number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0025 0000 3155` | Requires authentication |

Expiry: any future date. CVC: any 3 digits.

---

## Step 8: Go Live Checklist

- [ ] Replace test API keys with live keys in production env vars
- [ ] Create the webhook endpoint in Stripe dashboard pointing to your live domain
- [ ] Update `STRIPE_WEBHOOK_SECRET` with the live webhook signing secret
- [ ] Test one real purchase end-to-end
- [ ] Confirm `user_plans` table updates to `'beginner'` or `'pro'` after checkout
- [ ] Confirm Stripe Customer Portal opens from "Manage Billing"
- [ ] Cancel a subscription in the portal and confirm plan reverts to `'free'`

---

## Pricing Reference

| Plan | DB value | Price | `gens_limit` |
|---|---|---|---|
| Beginner | `'free'` | $7/month | 5 |
| Pro | `'pro'` | $14/month | 999999 (unlimited) |

> The DB column `plan` uses `'free'` for Beginner internally (existing schema). The UI label shows "Beginner" to users.
