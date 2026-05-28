import { redirect } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/auth";
import GenerateForm from "@/components/GenerateForm";

interface HistoryRow {
  id: string;
  title: string | null;
  urls: string[];
  created_at: string;
  has_content: boolean;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.slice(0, 30);
  }
}

export default async function GeneratePage() {
  const [planRes, historyRes] = await Promise.all([
    apiFetch("/user/plan"),
    apiFetch("/user/history"),
  ]);
  if (planRes.status === 401) redirect("/auth/login");

  const plan = planRes.ok
    ? await planRes.json()
    : { plan: "free", gens_used: 0, gens_limit: 3, is_admin: false };

  const recentRows: HistoryRow[] = historyRes.ok
    ? (await historyRes.json()).slice(0, 3)
    : [];

  const isPro = plan.plan === "pro" || plan.is_admin;
  const isTrial = plan.plan === "free";
  const limitReached = !isPro && plan.gens_used >= plan.gens_limit;

  const steps = [
    {
      n: "1",
      title: "Paste your source",
      desc: "Add YouTube URLs, blog links, or raw text. Multiple URLs supported.",
    },
    {
      n: "2",
      title: isPro ? "Pick a template" : "AI applies defaults",
      desc: isPro
        ? "Choose from your saved prompt templates or leave blank for the default pack."
        : "Upgrade to Pro to use custom prompt templates and Brand Kit.",
    },
    {
      n: "3",
      title: "Get your content pack",
      desc: "Hooks, LinkedIn posts, IG captions, and Shorts ideas — ready to copy.",
    },
  ];

  const proFeatures = [
    "Unlimited generations",
    "Custom prompt templates",
    "Brand Kit injection",
    "Multiple URLs per generation",
  ];

  return (
    <div className="flex flex-col gap-8 xl:flex-row xl:items-start">

      {/* ── Left: generate form ─────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-1 display-font text-2xl font-bold text-zinc-100">Generate Content</h1>
            <p className="text-sm text-zinc-500">Paste a YouTube or blog URL to generate your content pack.</p>
          </div>
          {isTrial && (
            <span className="text-xs text-zinc-500 sm:mt-1 sm:shrink-0">
              {plan.gens_used} / {plan.gens_limit} trial generations used
            </span>
          )}
          {!isPro && !isTrial && (
            <span className="text-xs text-zinc-500 sm:mt-1 sm:shrink-0">
              {plan.gens_used} / {plan.gens_limit} packs used
            </span>
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
            <Link
              href="/dashboard/billing"
              className="btn-gradient inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
            >
              View Plans →
            </Link>
          </div>
        ) : (
          <GenerateForm isPro={isPro} />
        )}
      </div>

      {/* ── Right: sidebar ──────────────────────────────────────────────── */}
      {!limitReached && (
        <aside className="space-y-4 xl:w-72 xl:shrink-0">

          {/* How it works */}
          <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
            <p className="mb-4 text-sm font-semibold text-zinc-100">How it works</p>
            <div className="space-y-4">
              {steps.map((s) => (
                <div key={s.n} className="flex gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cf-violet/15 text-[10px] font-bold text-cf-violet">
                    {s.n}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{s.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent generations */}
          <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-100">Recent</p>
              {recentRows.length > 0 && (
                <Link
                  href="/dashboard/history"
                  className="text-xs text-cf-violet transition hover:text-cf-violet/80"
                >
                  View all →
                </Link>
              )}
            </div>
            {recentRows.length === 0 ? (
              <p className="text-xs text-zinc-500">Your generations will appear here after your first run.</p>
            ) : (
              <div className="space-y-1">
                {recentRows.map((row) => (
                  <Link
                    key={row.id}
                    href={row.has_content ? `/dashboard/history/${row.id}` : "#"}
                    className={`flex items-start justify-between gap-2 rounded-lg px-2.5 py-2 transition-colors ${
                      row.has_content
                        ? "hover:bg-cf-panel-alt"
                        : "cursor-default opacity-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-200">
                        {row.title ?? row.urls[0] ?? "Untitled"}
                      </p>
                      <p className="truncate text-[10px] text-zinc-500">
                        {hostLabel(row.urls[0] ?? "")}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-zinc-600">{timeAgo(row.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pro upgrade nudge — free users only */}
          {!isPro && (
            <div className="rounded-xl border border-cf-violet/20 bg-gradient-to-br from-cf-violet/8 to-transparent p-4">
              <p className="text-xs font-semibold text-zinc-100">Unlock Pro features</p>
              <ul className="mt-2.5 space-y-1.5">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <svg className="h-3 w-3 shrink-0 text-cf-violet" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/billing"
                className="mt-4 flex w-full items-center justify-center rounded-lg bg-cf-violet px-3 py-2 text-xs font-semibold text-white transition hover:bg-cf-violet/80"
              >
                Upgrade to Pro →
              </Link>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
