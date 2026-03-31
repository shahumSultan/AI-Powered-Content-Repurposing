import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StripeButtons from "@/components/dashboard/StripeButtons";

const beginnerFeatures = [
  { label: "5 content packs / month", included: true },
  { label: "YouTube & blog URL support", included: true },
  { label: "LinkedIn, Instagram captions & Shorts ideas", included: true },
  { label: "YouTube Shorts ideas", included: true },
  { label: "CSV & JSON export", included: true },
  { label: "Unlimited content packs", included: false },
  { label: "Multiple URLs per generation", included: false },
  { label: "Priority processing", included: false },
];

const proFeatures = [
  { label: "Unlimited content packs", included: true },
  { label: "Multiple URLs per generation", included: true },
  { label: "YouTube & blog URL support", included: true },
  { label: "LinkedIn, Instagram captions & Shorts ideas", included: true },
  { label: "YouTube Shorts ideas", included: true },
  { label: "CSV & JSON export", included: true },
  { label: "Priority processing", included: true },
];

export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: plan } = await supabase
    .from("user_plans")
    .select("plan, gens_used, gens_limit, stripe_subscription_id")
    .eq("user_id", user.id)
    .single();

  const isPro = plan?.plan === "pro";
  const isBeginner = plan?.plan === "beginner";
  const isTrial = !isPro && !isBeginner;
  const hasSubscription = !!plan?.stripe_subscription_id;
  const gensUsed = plan?.gens_used ?? 0;
  const gensLimit = plan?.gens_limit ?? 3;
  const usagePct = isPro ? 0 : Math.min(100, (gensUsed / gensLimit) * 100);
  const features = isPro ? proFeatures : beginnerFeatures;

  const planName = isPro ? "Pro Plan" : isBeginner ? "Beginner Plan" : "Free Trial";
  const planPrice = isPro ? "$14" : isBeginner ? "$7" : "$0";
  const planSubtitle = isPro
    ? "Pro plan"
    : isBeginner
    ? "Beginner plan"
    : `Free trial — ${gensUsed} of ${gensLimit} generations used`;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 display-font text-2xl font-bold text-zinc-100">Your Plan</h1>
      <p className="mb-8 text-sm text-zinc-500">
        You are currently on the {planSubtitle}.
      </p>

      {/* Plan card */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              isPro || isBeginner ? "bg-orange-500/15 text-orange-400" : "bg-zinc-800 text-zinc-300"
            }`}>
              {planName}
            </span>
            <p className="mt-2 text-2xl font-bold text-zinc-100">
              {planPrice}
              <span className="text-sm font-normal text-zinc-500">
                {isTrial ? " today" : " / month"}
              </span>
            </p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isPro || isBeginner ? "bg-orange-500/15" : "bg-zinc-800"
          }`}>
            <svg className={`h-5 w-5 ${isPro || isBeginner ? "text-orange-400" : "text-zinc-400"}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
        </div>

        {/* Usage bar — for trial and beginner */}
        {!isPro && (
          <div className="mb-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
              <span>{isTrial ? "Trial generations used" : "Content packs used this month"}</span>
              <span>{gensUsed} / {gensLimit}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Feature list */}
        <ul className="space-y-2.5">
          {features.map((f) => (
            <li key={f.label} className="flex items-center gap-2.5 text-sm">
              {f.included ? (
                <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="h-4 w-4 shrink-0 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              )}
              <span className={f.included ? "text-zinc-300" : "text-zinc-600"}>
                {f.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Upgrade CTA — trial and beginner only */}
      {!isPro && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-950/20 p-6">
          <h2 className="mb-1 display-font text-lg font-semibold text-zinc-100">
            {isTrial ? "Subscribe to keep creating" : "Upgrade to Pro — $14/month"}
          </h2>
          <p className="mb-4 text-sm text-zinc-400">
            {isTrial
              ? "Choose a plan below to unlock more content packs."
              : "Unlimited content packs, multiple URL processing, and priority support."}
          </p>
          <StripeButtons isPro={isPro} hasSubscription={hasSubscription} />
        </div>
      )}
    </div>
  );
}
