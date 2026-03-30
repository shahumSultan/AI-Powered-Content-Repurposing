import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Admin client bypasses RLS — only used server-side in this webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text(); // raw body required for signature verification
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ detail: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ detail: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const subscriptionId = session.subscription as string;
      if (!userId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const plan = (subscription.metadata.plan as string) ?? "beginner";

      await supabase.from("user_plans").upsert(
        {
          user_id: userId,
          plan,
          gens_limit: plan === "pro" ? 999999 : 5,
          stripe_subscription_id: subscriptionId,
          subscription_status: "active",
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.supabase_user_id;
      if (!userId) break;

      const isActive = sub.status === "active";
      const plan = (sub.metadata.plan as string) ?? "beginner";

      await supabase.from("user_plans").upsert(
        {
          user_id: userId,
          plan: isActive ? plan : "free",
          gens_limit: isActive && plan === "pro" ? 999999 : 5,
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.supabase_user_id;
      if (!userId) break;

      await supabase.from("user_plans").upsert(
        {
          user_id: userId,
          plan: "free",
          gens_limit: 5,
          stripe_subscription_id: null,
          subscription_status: "canceled",
        },
        { onConflict: "user_id" }
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
