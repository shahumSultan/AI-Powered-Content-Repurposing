import { redirect } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/auth";

interface HistoryItem {
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
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function urlLabel(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "") + u.pathname.slice(0, 40);
  } catch {
    return url.slice(0, 60);
  }
}

export default async function HistoryPage() {
  const res = await apiFetch("/user/history");
  if (res.status === 401) redirect("/auth/login");

  const rows: HistoryItem[] = res.ok ? await res.json() : [];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="mb-1 display-font text-2xl font-bold text-zinc-100">History</h1>
        <p className="text-sm text-zinc-500">All your past content packs — click one to view it again.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-10 text-center">
          <p className="text-sm text-zinc-500">No generations yet. Head to Generate to create your first content pack.</p>
          <Link href="/dashboard/generate" className="btn-primary mt-4 inline-block rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors">
            Generate →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={row.has_content ? `/dashboard/history/${row.id}` : "#"}
              className={`block rounded-xl border border-cf-violet/14 bg-cf-panel p-4 transition-colors ${
                row.has_content ? "hover:border-cf-violet/25 hover:bg-cf-panel-alt/60" : "opacity-60 cursor-default"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 truncate text-sm font-medium text-zinc-100">
                    {row.title ?? row.urls[0] ?? "Untitled"}
                  </p>
                  <div className="min-w-0 space-y-0.5">
                    {row.urls.map((url, i) => (
                      <p key={i} className="truncate text-xs text-zinc-500">
                        {urlLabel(url)}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-xs text-zinc-500">{timeAgo(row.created_at)}</span>
                  {row.has_content ? (
                    <span className="rounded-full bg-cf-violet/10 px-2 py-0.5 text-[10px] font-medium text-cf-violet">
                      View pack →
                    </span>
                  ) : (
                    <span className="rounded-full bg-cf-panel-alt px-2 py-0.5 text-[10px] text-zinc-600">
                      No content saved
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
