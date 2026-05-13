import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/auth";
import type { ContentPack } from "@/lib/api";
import ContentPackView from "@/components/ContentPackView";
import FreeFormView from "@/components/FreeFormView";

interface HistoryDetail {
  id: string;
  title: string | null;
  urls: string[];
  content_pack: (ContentPack & { __raw_output__?: string }) | null;
  created_at: string;
}

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await apiFetch(`/user/history/${id}`);
  if (res.status === 401) redirect("/auth/login");
  if (res.status === 404) notFound();

  const record: HistoryDetail = await res.json();

  const date = new Date(record.created_at).toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/history" className="mb-3 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to History
        </Link>
        <h1 className="mb-1 display-font text-2xl font-bold text-zinc-100 break-words">
          {record.title ?? record.urls[0] ?? "Content Pack"}
        </h1>
        <div className="mt-1 flex flex-col gap-1">
          <span className="text-xs text-zinc-500">{date}</span>
          {record.urls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-xs text-cf-violet/80 hover:text-cf-violet transition-colors"
            >
              {url}
            </a>
          ))}
        </div>
      </div>

      {record.content_pack?.__raw_output__ ? (
        <FreeFormView text={record.content_pack.__raw_output__} />
      ) : record.content_pack ? (
        <ContentPackView
          pack={record.content_pack}
          csv={null}
          json={record.content_pack as unknown as Record<string, unknown>}
        />
      ) : (
        <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-8 text-center">
          <p className="text-sm text-zinc-500">Content pack data was not saved for this generation.</p>
        </div>
      )}
    </div>
  );
}
