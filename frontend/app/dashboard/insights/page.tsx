import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function InsightsPage() {
  const [meRes, historyRes] = await Promise.all([
    apiFetch("/auth/me"),
    apiFetch("/user/history"),
  ]);
  if (meRes.status === 401) redirect("/auth/login");

  const user: AuthUser = await meRes.json();
  const rows: Array<{ id: string; urls: string[]; created_at: string }> =
    historyRes.ok ? await historyRes.json() : [];

  const memberSince = formatDate(user.created_at);
  const totalPacks = rows.length;
  const allUrls = rows.flatMap((r) => r.urls);
  const youtubeCount = allUrls.filter((u) => u.includes("youtube.com") || u.includes("youtu.be")).length;
  const blogCount = allUrls.length - youtubeCount;

  const stats = [
    {
      value: String(totalPacks),
      label: "Content Packs",
      sublabel: "generated",
      color: "text-cf-violet",
      bg: "bg-cf-violet/10",
    },
    {
      value: String(allUrls.length),
      label: "URLs Processed",
      sublabel: "total",
      color: "text-cf-cyan",
      bg: "bg-cf-cyan/10",
    },
    {
      value: String(youtubeCount),
      label: "YouTube Videos",
      sublabel: "transcribed",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      value: String(blogCount),
      label: "Blog Articles",
      sublabel: "extracted",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 display-font text-2xl font-bold text-zinc-100">Insights</h1>
        <p className="text-sm text-zinc-500">Your account activity and usage statistics.</p>
      </div>

      {/* Account summary row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2 flex items-center gap-4 rounded-xl border border-cf-violet/14 bg-cf-panel p-5 lg:col-span-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cf-violet/15">
            <svg className="h-5 w-5 text-cf-violet" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Account</p>
            <p className="text-sm font-semibold text-zinc-100">{user.full_name || user.email}</p>
            <p className="text-xs text-zinc-500">Member since {memberSince}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cf-cyan/10">
            <svg className="h-5 w-5 text-cf-cyan" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total packs</p>
            <p className="text-2xl font-bold text-cf-cyan">{totalPacks}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-zinc-500">URLs processed</p>
            <p className="text-2xl font-bold text-emerald-400">{allUrls.length}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Breakdown</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
              <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              </div>
              <p className="text-xs font-medium text-zinc-300">{s.label}</p>
              <p className="text-xs text-zinc-600">{s.sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent generations */}
      {rows.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Recent generations</h2>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {rows.slice(0, 9).map((row, i) => (
              <div
                key={i}
                className="rounded-xl border border-cf-violet/14 bg-cf-panel p-4"
              >
                <p className="mb-2 text-xs font-medium text-zinc-400">{formatShort(row.created_at)}</p>
                <div className="space-y-1">
                  {row.urls.slice(0, 2).map((url, j) => (
                    <p key={j} className="truncate text-xs text-zinc-500">{url}</p>
                  ))}
                  {row.urls.length > 2 && (
                    <p className="text-xs text-zinc-600">+{row.urls.length - 2} more</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
