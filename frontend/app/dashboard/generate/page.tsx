import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import GenerateForm from "@/components/GenerateForm";

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch or bootstrap the user's plan row
  let { data: plan } = await supabase
    .from("user_plans")
    .select("plan, gens_used, gens_limit, period_start")
    .eq("user_id", user.id)
    .single();

  if (!plan) {
    await supabase.from("user_plans").insert({ user_id: user.id });
    plan = { plan: "free", gens_used: 0, gens_limit: 5, period_start: new Date().toISOString() };
  }

  const isPro = plan.plan === "pro";
  const limitReached = !isPro && plan.gens_used >= plan.gens_limit;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-xl font-bold text-zinc-100">Generate Content</h1>
          <p className="text-sm text-zinc-500">
            Paste a YouTube or blog URL to generate your content pack.
          </p>
        </div>
        {!isPro && (
          <span className="mt-1 shrink-0 text-xs text-zinc-500">
            {plan.gens_used} / {plan.gens_limit} packs used
          </span>
        )}
      </div>

      {limitReached ? (
        <div className="rounded-xl border border-violet-500/20 bg-violet-950/30 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-900/50">
            <svg className="h-6 w-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <p className="mb-2 text-base font-semibold text-zinc-100">Monthly limit reached</p>
          <p className="mb-6 text-sm text-zinc-400">
            You have used all {plan.gens_limit} free content packs this month.
            Upgrade to Pro for unlimited generations.
          </p>
          <Link
            href="/#pricing"
            className="btn-gradient inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          >
            Upgrade to Pro →
          </Link>
        </div>
      ) : (
        <GenerateForm />
      )}
    </div>
  );
}
