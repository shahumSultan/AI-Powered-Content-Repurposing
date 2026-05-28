import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/auth";
import StripeButtons from "@/components/dashboard/StripeButtons";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const res = await apiFetch("/user/plan");
  if (res.status === 401) redirect("/auth/login");

  const plan = res.ok
    ? await res.json()
    : { plan: "free", gens_used: 0, gens_limit: 3, stripe_subscription_id: null, subscription_status: null };
  const params = await searchParams;
  const justPaid = params.success === "true";

  const isPro = plan.plan === "pro";
  const isBeginner = plan.plan === "beginner";
  const hasSubscription = !!plan.stripe_subscription_id;
  const subscriptionStatus = plan.subscription_status ?? null;
  const planLabel = isPro ? "Pro" : isBeginner ? "Beginner" : "Free Trial";
  const planPrice = isPro ? "$14" : isBeginner ? "$7" : "$0";

  const proFeatures = [
    "Unlimited content pack generations",
    "Multiple URLs per generation",
    "Custom prompt templates",
    "Brand Kit — persistent brand identity",
    "Priority support",
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 display-font text-2xl font-bold text-zinc-100">Billing</h1>
        <p className="text-sm text-zinc-500">Manage your subscription and payment method.</p>
      </div>

      {/* Success banner */}
      {justPaid && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-800/50 bg-emerald-950/40 px-5 py-4">
          <svg className="h-5 w-5 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <p className="text-sm font-medium text-emerald-300">Payment successful — your plan has been upgraded!</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left column: current plan + manage */}
        <div className="space-y-4 lg:col-span-2">
          {/* Current plan card */}
          <div className="flex items-center justify-between rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
            <div>
              <p className="text-xs font-medium text-zinc-500">Current plan</p>
              <p className="mt-0.5 text-lg font-semibold text-zinc-100">{planLabel}</p>
              {subscriptionStatus && subscriptionStatus !== "active" && (
                <p className="mt-0.5 text-xs text-cf-cyan capitalize">{subscriptionStatus}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isPro ? "bg-cf-violet/15 text-cf-violet" : "bg-cf-panel-alt text-zinc-400"}`}>
                {planPrice}<span className="text-xs font-normal opacity-70"> / mo</span>
              </span>
            </div>
          </div>

          {/* Manage / upgrade */}
          <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">
              {isPro ? "Manage your subscription" : "Upgrade your plan"}
            </h2>
            {!isPro && (
              <div className="mb-5 rounded-lg border border-cf-violet/20 bg-cf-violet/5 p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-zinc-100">$14</span>
                  <span className="text-sm text-zinc-500">/ month</span>
                </div>
                <p className="mt-1 text-sm font-medium text-zinc-200">Pro plan</p>
                <p className="mt-0.5 text-xs text-zinc-500">Everything you need to repurpose content at scale.</p>
              </div>
            )}
            <StripeButtons isPro={isPro} hasSubscription={hasSubscription} />
          </div>

          {/* Payment method */}
          <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
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

        {/* Right column: Pro features */}
        {!isPro && (
          <div className="rounded-xl border border-cf-violet/20 bg-gradient-to-br from-cf-violet/8 to-transparent p-5">
            <p className="mb-1 text-sm font-semibold text-zinc-100">What you get with Pro</p>
            <p className="mb-4 text-xs text-zinc-500">Unlock the full platform with one subscription.</p>
            <ul className="space-y-3">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-cf-violet" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-zinc-300">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
