"use client";

import { useState } from "react";
import type { ContentPack, ShortsIdea } from "@/lib/api";

type SectionKey = "hooks" | "linkedin" | "ig" | "shorts";

const SECTION_META: Record<
  SectionKey,
  {
    label: string;
    icon: string;
    accent: { tab: string; border: string; badge: string; number: string };
  }
> = {
  hooks:   { label: "Hooks",     icon: "🪝", accent: { tab: "bg-amber-600",    border: "border-amber-800/40",    badge: "bg-amber-900/50 text-amber-400",    number: "text-amber-500"    } },
  linkedin:{ label: "LinkedIn",  icon: "in", accent: { tab: "bg-blue-600",      border: "border-blue-800/40",      badge: "bg-blue-900/50 text-blue-400",      number: "text-blue-500"     } },
  ig:      { label: "Instagram", icon: "IG", accent: { tab: "bg-fuchsia-600",   border: "border-fuchsia-800/40",   badge: "bg-fuchsia-900/50 text-fuchsia-400", number: "text-fuchsia-500"  } },
  shorts:  { label: "Shorts",    icon: "▶",  accent: { tab: "bg-red-600",        border: "border-red-800/40",       badge: "bg-red-900/50 text-red-400",        number: "text-red-500"      } },
};

const SECTION_ORDER: SectionKey[] = ["hooks", "linkedin", "ig", "shorts"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      className={`shrink-0 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
        copied
          ? "bg-emerald-900/50 text-emerald-400"
          : "text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
      }`}
    >
      {copied ? (
        <>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function TextCard({
  index,
  text,
  sectionKey,
}: {
  index: number;
  text: string;
  sectionKey: SectionKey;
}) {
  const { accent } = SECTION_META[sectionKey];
  const padding = sectionKey === "linkedin" ? "p-5" : "p-4";
  return (
    <div className={`flex items-start gap-3 rounded-lg border ${accent.border} bg-zinc-900 ${padding}`}>
      <span className={`mt-0.5 shrink-0 font-mono text-xs ${accent.number}`}>
        {String(index).padStart(2, "0")}
      </span>
      <p className="flex-1 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{text}</p>
      <CopyButton text={text} />
    </div>
  );
}

function ShortsCard({ index, idea }: { index: number; idea: ShortsIdea }) {
  const { accent } = SECTION_META.shorts;
  return (
    <div className={`rounded-lg border ${accent.border} bg-zinc-900 p-4 space-y-2`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 font-mono text-xs ${accent.number}`}>
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-zinc-100">{idea.title}</p>
            {idea.timestamp_start != null && idea.timestamp_end != null && (
              <span className={`rounded px-1.5 py-0.5 font-mono text-xs ${accent.badge}`}>
                {formatTime(idea.timestamp_start)} → {formatTime(idea.timestamp_end)}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap">
            {idea.what_to_say}
          </p>
        </div>
        <CopyButton text={`${idea.title}\n\n${idea.what_to_say}`} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-zinc-500">No items generated for this section.</p>
    </div>
  );
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  pack: ContentPack;
  csv: string | null;
  json: Record<string, unknown>;
}

export default function ContentPackView({ pack, csv, json }: Props) {
  const [active, setActive] = useState<SectionKey>("hooks");

  const visibleItems = {
    hooks:    pack.hooks.filter((i) => i.text !== ""),
    linkedin: pack.linkedin_posts.filter((i) => i.text !== ""),
    ig:       pack.ig_captions.filter((i) => i.text !== ""),
    shorts:   pack.shorts_ideas.filter((i) => i.title !== "" || i.what_to_say !== ""),
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
      {/* Header + export buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm font-medium text-zinc-300">Content Pack</p>
        <div className="flex gap-2">
          {csv !== null && (
          <button
            onClick={() => downloadBlob(csv!, "content-pack.csv", "text/csv")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          >
            ↓ CSV
          </button>
          )}
          <button
            onClick={() =>
              downloadBlob(JSON.stringify(json, null, 2), "content-pack.json", "application/json")
            }
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          >
            ↓ JSON
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-zinc-800/60 p-1">
        {SECTION_ORDER.map((key) => {
          const meta = SECTION_META[key];
          const count = visibleItems[key].length;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                active === key
                  ? `${meta.accent.tab} text-white shadow-sm`
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="mr-1">{meta.icon}</span>
              {meta.label}
              <span className="ml-1 opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Items */}
      <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
        {active === "shorts" ? (
          visibleItems.shorts.length === 0 ? (
            <EmptyState />
          ) : (
            (visibleItems.shorts as ShortsIdea[]).map((idea, i) => (
              <ShortsCard key={i} index={i + 1} idea={idea} />
            ))
          )
        ) : visibleItems[active].length === 0 ? (
          <EmptyState />
        ) : (
          (visibleItems[active] as { text: string }[]).map((item, i) => (
            <TextCard key={i} index={i + 1} text={item.text} sectionKey={active} />
          ))
        )}
      </div>
    </div>
  );
}
