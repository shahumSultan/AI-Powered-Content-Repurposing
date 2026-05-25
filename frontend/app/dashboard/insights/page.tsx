import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function InsightsPage() {
  const [meRes, historyRes] = await Promise.all([
    apiFetch("/auth/me"),
    apiFetch("/user/history"),
  ]);
  if (meRes.status === 401) redirect("/auth/login");

  const user: AuthUser = await meRes.json();
  const rows: Array<{ urls: string[]; created_at: string }> = historyRes.ok ? await historyRes.json() : [];

  const memberSince = formatDate(user.created_at);
  const totalPacks = rows.length;
  const allUrls = rows.flatMap((r) => r.urls);
  const youtubeCount = allUrls.filter((u) => u.includes("youtube.com") || u.includes("youtu.be")).length;
  const blogCount = allUrls.length - youtubeCount;

  const metricCards = [
    { label: "Content Packs Generated", value: String(totalPacks), unit: "packs" },
    { label: "YouTube Links Processed", value: String(youtubeCount), unit: "videos" },
    { label: "Blog Links Processed", value: String(blogCount), unit: "articles" },
    { label: "URLs Processed", value: String(allUrls.length), unit: "total" },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 display-font text-2xl font-bold text-zinc-100">Insights</h1>
      <p className="mb-8 text-sm text-zinc-500">Your account activity and usage statistics.</p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
          <p className="mb-1 text-xs font-medium text-zinc-500">Member since</p>
          <p className="text-sm font-semibold text-zinc-100">{memberSince}</p>
        </div>
        <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
          <p className="mb-1 text-xs font-medium text-zinc-500">Total generations</p>
          <p className="text-sm font-semibold text-zinc-100">{totalPacks}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 display-font text-sm font-semibold text-zinc-100">Usage metrics</h2>
        <div className="grid grid-cols-2 gap-3">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
              <p className="mb-2 display-font text-2xl font-bold text-cf-cyan">{card.value}</p>
              <p className="text-xs font-medium text-zinc-400">{card.label}</p>
              <p className="text-xs text-zinc-600">{card.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {rows.length > 0 && (
        <div>
          <h2 className="mb-3 display-font text-sm font-semibold text-zinc-100">Recent generations</h2>
          <div className="space-y-2">
            {rows.slice(0, 10).map((row, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-cf-violet/14 bg-cf-panel p-4">
                <p className="mb-1 text-xs text-zinc-500">{formatDate(row.created_at)}</p>
                {row.urls.map((url, j) => (
                  <p key={j} className="break-all text-xs text-zinc-400">{url}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
