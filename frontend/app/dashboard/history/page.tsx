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
    return u.hostname.replace("www.", "") + u.pathname.slice(0, 30);
  } catch {
    return url.slice(0, 50);
  }
}

function sourceIcon(url: string) {
  const isYT = url.includes("youtube.com") || url.includes("youtu.be");
  return isYT ? (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-500/15">
      <svg className="h-3 w-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    </span>
  ) : (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cf-violet/10">
      <svg className="h-3 w-3 text-cf-violet" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    </span>
  );
}

export default async function HistoryPage() {
  const res = await apiFetch("/user/history");
  if (res.status === 401) redirect("/auth/login");

  const rows: HistoryItem[] = res.ok ? await res.json() : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 display-font text-2xl font-bold text-zinc-100">History</h1>
          <p className="text-sm text-zinc-500">
            {rows.length > 0
              ? `${rows.length} content pack${rows.length === 1 ? "" : "s"} generated — click one to view it again.`
              : "All your past content packs will appear here."}
          </p>
        </div>
        <Link
          href="/dashboard/generate"
          className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-cf-violet/25 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-cf-violet/50 hover:text-zinc-100 sm:flex"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New generation
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cf-panel-alt">
            <svg className="h-6 w-6 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="mb-1 text-sm font-medium text-zinc-300">No generations yet</p>
          <p className="mb-5 text-sm text-zinc-500">Head to Generate to create your first content pack.</p>
          <Link
            href="/dashboard/generate"
            className="btn-primary inline-block rounded-lg px-5 py-2 text-sm font-semibold text-white"
          >
            Generate →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={row.has_content ? `/dashboard/history/${row.id}` : "#"}
              className={`group flex flex-col rounded-xl border border-cf-violet/14 bg-cf-panel p-4 transition-colors ${
                row.has_content
                  ? "hover:border-cf-violet/25 hover:bg-cf-panel-alt/60"
                  : "cursor-default opacity-60"
              }`}
            >
              {/* Title row */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-100">
                  {row.title ?? row.urls[0] ?? "Untitled"}
                </p>
                <span className="shrink-0 text-xs text-zinc-500">{timeAgo(row.created_at)}</span>
              </div>

              {/* Source URLs */}
              <div className="flex-1 space-y-1">
                {row.urls.slice(0, 2).map((url, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {sourceIcon(url)}
                    <p className="truncate text-xs text-zinc-500">{urlLabel(url)}</p>
                  </div>
                ))}
                {row.urls.length > 2 && (
                  <p className="text-xs text-zinc-600">+{row.urls.length - 2} more</p>
                )}
              </div>

              {/* Footer badge */}
              <div className="mt-3 flex items-center justify-between">
                {row.has_content ? (
                  <span className="rounded-full bg-cf-violet/10 px-2.5 py-0.5 text-[10px] font-medium text-cf-violet group-hover:bg-cf-violet/15">
                    View pack →
                  </span>
                ) : (
                  <span className="rounded-full bg-cf-panel-alt px-2.5 py-0.5 text-[10px] text-zinc-600">
                    No content saved
                  </span>
                )}
                <span className="text-[10px] text-zinc-600">
                  {row.urls.length} URL{row.urls.length !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
