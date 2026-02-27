"use client";

import { useState } from "react";
import type { ContentPack, ShortsIdea } from "@/lib/api";

type SectionKey = "hooks" | "linkedin" | "twitter" | "ig" | "shorts";

const SECTIONS: { key: SectionKey; label: string; count: number }[] = [
  { key: "hooks",   label: "Hooks",      count: 10 },
  { key: "linkedin", label: "LinkedIn",  count: 5  },
  { key: "twitter", label: "Twitter/X",  count: 10 },
  { key: "ig",      label: "Instagram",  count: 5  },
  { key: "shorts",  label: "Shorts",     count: 10 },
];

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
      className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-700 hover:text-zinc-300"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function TextCard({ index, text }: { index: number; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <span className="mt-0.5 shrink-0 font-mono text-xs text-zinc-600">
        {String(index).padStart(2, "0")}
      </span>
      <p className="flex-1 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{text}</p>
      <CopyButton text={text} />
    </div>
  );
}

function ShortsCard({ index, idea }: { index: number; idea: ShortsIdea }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 font-mono text-xs text-zinc-600">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm text-zinc-100">{idea.title}</p>
            {idea.timestamp_start != null && idea.timestamp_end != null && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-violet-400">
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
  csv: string;
  json: Record<string, unknown>;
}

export default function ContentPackView({ pack, csv, json }: Props) {
  const [active, setActive] = useState<SectionKey>("hooks");

  const items: Record<SectionKey, { text: string }[] | ShortsIdea[]> = {
    hooks:    pack.hooks,
    linkedin: pack.linkedin_posts,
    twitter:  pack.twitter_posts,
    ig:       pack.ig_captions,
    shorts:   pack.shorts_ideas,
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
      {/* Header + export buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm font-medium text-zinc-300">Content Pack</p>
        <div className="flex gap-2">
          <button
            onClick={() => downloadBlob(csv, "content-pack.csv", "text/csv")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          >
            ↓ CSV
          </button>
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
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              active === s.key
                ? "bg-violet-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {s.label}
            <span className="ml-1 opacity-60">({s.count})</span>
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
        {active === "shorts"
          ? (items.shorts as ShortsIdea[]).map((idea, i) => (
              <ShortsCard key={i} index={i + 1} idea={idea} />
            ))
          : (items[active] as { text: string }[]).map((item, i) => (
              <TextCard key={i} index={i + 1} text={item.text} />
            ))}
      </div>
    </div>
  );
}
