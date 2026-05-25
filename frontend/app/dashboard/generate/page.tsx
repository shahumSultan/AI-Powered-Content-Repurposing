import { redirect } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/auth";
import GenerateForm from "@/components/GenerateForm";

export default async function GeneratePage() {
  const res = await apiFetch("/user/plan");
  if (res.status === 401) redirect("/auth/login");

  const plan = res.ok ? await res.json() : { plan: "free", gens_used: 0, gens_limit: 3 };

  const isPro = plan.plan === "pro";
  const isTrial = plan.plan === "free";
  const limitReached = !isPro && !plan.is_admin && plan.gens_used >= plan.gens_limit;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1 display-font text-2xl font-bold text-zinc-100">Generate Content</h1>
          <p className="text-sm text-zinc-500">Paste a YouTube or blog URL to generate your content pack.</p>
        </div>
        {isTrial && (
          <span className="text-xs text-zinc-500 sm:mt-1 sm:shrink-0">{plan.gens_used} / {plan.gens_limit} trial generations used</span>
        )}
        {!isPro && !isTrial && (
          <span className="text-xs text-zinc-500 sm:mt-1 sm:shrink-0">{plan.gens_used} / {plan.gens_limit} packs used</span>
        )}
      </div>

      {limitReached ? (
        <div className="rounded-xl border border-cf-violet/20 bg-cf-violet/8 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cf-violet/20">
            <svg className="h-6 w-6 text-cf-violet" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <p className="mb-2 display-font text-base font-semibold text-zinc-100">
            {isTrial ? "Trial limit reached" : "Monthly limit reached"}
          </p>
          <p className="mb-6 text-sm text-zinc-400">
            {isTrial
              ? `You've used all ${plan.gens_limit} free trial generations. Subscribe to keep creating.`
              : `You have used all ${plan.gens_limit} content packs this month. Upgrade to Pro for unlimited generations.`}
          </p>
          <Link href="/dashboard/plan" className="btn-gradient inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white">
            View Plans →
          </Link>
        </div>
      ) : (
        <GenerateForm isPro={isPro || plan.is_admin} />
      )}
    </div>
  );
}
