import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StripeButtons from "@/components/dashboard/StripeButtons";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: plan } = await supabase
    .from("user_plans")
    .select("plan, gens_used, gens_limit, stripe_subscription_id, subscription_status")
    .eq("user_id", user.id)
    .single();

  const params = await searchParams;
  const justPaid = params.success === "true";

  const isPro = plan?.plan === "pro";
  const hasSubscription = !!(plan?.stripe_subscription_id);
  const subscriptionStatus = plan?.subscription_status ?? null;
  const planLabel = isPro ? "Pro" : "Beginner";
  const planPrice = isPro ? "$14" : "$7";

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-zinc-100">Billing</h1>
      <p className="mb-8 text-sm text-zinc-500">Manage your subscription and payment methods.</p>

      {/* Success banner */}
      {justPaid && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-800/50 bg-emerald-950/40 px-5 py-4">
          <svg className="h-5 w-5 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <p className="text-sm font-medium text-emerald-300">
            Payment successful — your plan has been upgraded!
          </p>
        </div>
      )}

      {/* Current plan */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div>
          <p className="text-xs font-medium text-zinc-500">Current plan</p>
          <p className="mt-0.5 text-base font-semibold text-zinc-100">{planLabel}</p>
          {subscriptionStatus && subscriptionStatus !== "active" && (
            <p className="mt-0.5 text-xs text-amber-400 capitalize">{subscriptionStatus}</p>
          )}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${isPro ? "bg-orange-900/40 text-orange-300" : "bg-zinc-800 text-zinc-400"}`}>
          {planPrice} / month
        </span>
      </div>

      {/* Stripe buttons */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">
          {isPro ? "Manage your subscription" : "Upgrade your plan"}
        </h2>
        {!isPro && (
          <div className="mb-5">
            <h3 className="text-sm font-medium text-zinc-200">Pro — $14/month</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Unlimited content packs, multiple URLs per generation, and priority support.
            </p>
          </div>
        )}
        <StripeButtons isPro={isPro} hasSubscription={hasSubscription} />
      </div>

      {/* Payment method note */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-2 text-sm font-semibold text-zinc-100">Payment method</h2>
        {hasSubscription ? (
          <p className="text-sm text-zinc-500">
            Managed by Stripe. Click &ldquo;Manage Billing&rdquo; above to update your card or view invoices.
          </p>
        ) : (
          <p className="text-sm text-zinc-500">
            No payment method on file. Subscribe to a plan above to add one.
          </p>
        )}
      </div>
    </div>
  );
}
