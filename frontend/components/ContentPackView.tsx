"use client";

import { useState, useEffect } from "react";
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
  hooks:   { label: "Hooks",     icon: "🪝", accent: { tab: "bg-cf-cyan",    border: "border-cf-cyan/40",    badge: "bg-cf-cyan/10 text-cf-cyan",    number: "text-cf-cyan"    } },
  linkedin:{ label: "LinkedIn",  icon: "in", accent: { tab: "bg-cf-violet",   border: "border-cf-violet/40",  badge: "bg-cf-violet/10 text-cf-violet", number: "text-cf-violet"  } },
  ig:      { label: "Instagram", icon: "IG", accent: { tab: "bg-cf-pink",     border: "border-cf-pink/40",    badge: "bg-cf-pink/10 text-cf-pink",     number: "text-cf-pink"    } },
  shorts:  { label: "Shorts",    icon: "▶",  accent: { tab: "bg-red-600",      border: "border-red-800/40",    badge: "bg-red-900/50 text-red-400",     number: "text-red-500"    } },
};

const SECTION_ORDER: SectionKey[] = ["hooks", "linkedin", "ig", "shorts"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function csvCell(s: string): string {
  return `"${String(s).replace(/"/g, '""')}"`;
}

function packToCsv(pack: ContentPack): string {
  const rows = ["type,index,text,timestamp_start,timestamp_end"];
  pack.hooks.forEach((h, i) => rows.push(`hook,${i + 1},${csvCell(h.text)},,`));
  pack.linkedin_posts.forEach((p, i) => rows.push(`linkedin_post,${i + 1},${csvCell(p.text)},,`));
  pack.ig_captions.forEach((c, i) => rows.push(`ig_caption,${i + 1},${csvCell(c.text)},,`));
  pack.shorts_ideas.forEach((s, i) =>
    rows.push(`shorts_idea,${i + 1},${csvCell(s.title + " | " + s.what_to_say)},${s.timestamp_start ?? ""},${s.timestamp_end ?? ""}`)
  );
  return rows.join("\n");
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
          ? "bg-cf-cyan/10 text-cf-cyan"
          : "text-zinc-500 hover:bg-cf-panel-alt hover:text-zinc-300"
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

function RegenerateButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title="Regenerate this item"
      className="shrink-0 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors text-zinc-500 hover:bg-cf-panel-alt hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg
        className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  );
}

function TextCard({
  index,
  text,
  sectionKey,
  onEdit,
  onRegenerate,
  isRegenerating,
  allowRegenerate,
}: {
  index: number;
  text: string;
  sectionKey: SectionKey;
  onEdit: (text: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  allowRegenerate: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const { accent } = SECTION_META[sectionKey];
  const padding = sectionKey === "linkedin" ? "p-5" : "p-4";

  useEffect(() => {
    if (!editing) setDraft(text);
  }, [text, editing]);

  function handleBlur() {
    setEditing(false);
    if (draft !== text) onEdit(draft);
  }

  return (
    <div className={`flex items-start gap-3 rounded-lg border ${accent.border} bg-cf-panel ${padding}`}>
      <span className={`mt-0.5 shrink-0 font-mono text-xs ${accent.number}`}>
        {String(index).padStart(2, "0")}
      </span>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          rows={sectionKey === "linkedin" ? 6 : 3}
          className="flex-1 resize-none rounded bg-cf-panel-alt px-2 py-1 text-sm leading-relaxed text-zinc-300 outline-none focus:ring-1 focus:ring-cf-violet/40"
        />
      ) : (
        <p
          className="flex-1 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap cursor-text"
          onClick={() => { setDraft(text); setEditing(true); }}
          title="Click to edit"
        >
          {text}
        </p>
      )}
      <div className="flex shrink-0 flex-col gap-1">
        <CopyButton text={editing ? draft : text} />
        {allowRegenerate && (
          <RegenerateButton onClick={onRegenerate} loading={isRegenerating} />
        )}
      </div>
    </div>
  );
}

function ShortsCard({
  index,
  idea,
  onEditWhatToSay,
  onRegenerate,
  isRegenerating,
  allowRegenerate,
}: {
  index: number;
  idea: ShortsIdea;
  onEditWhatToSay: (text: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  allowRegenerate: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(idea.what_to_say);
  const { accent } = SECTION_META.shorts;

  useEffect(() => {
    if (!editing) setDraft(idea.what_to_say);
  }, [idea.what_to_say, editing]);

  function handleBlur() {
    setEditing(false);
    if (draft !== idea.what_to_say) onEditWhatToSay(draft);
  }

  return (
    <div className={`rounded-lg border ${accent.border} bg-cf-panel p-4 space-y-2`}>
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
          {editing ? (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleBlur}
              rows={3}
              className="mt-1.5 w-full resize-none rounded bg-cf-panel-alt px-2 py-1 text-sm leading-relaxed text-zinc-400 outline-none focus:ring-1 focus:ring-cf-violet/40"
            />
          ) : (
            <p
              className="mt-1.5 text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap cursor-text"
              onClick={() => { setDraft(idea.what_to_say); setEditing(true); }}
              title="Click to edit"
            >
              {idea.what_to_say}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <CopyButton text={`${idea.title}\n\n${editing ? draft : idea.what_to_say}`} />
          {allowRegenerate && (
            <RegenerateButton onClick={onRegenerate} loading={isRegenerating} />
          )}
        </div>
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
  allowRegenerate?: boolean;
}

export default function ContentPackView({ pack, csv, json, allowRegenerate = false }: Props) {
  const [active, setActive] = useState<SectionKey>("hooks");
  const [editedPack, setEditedPack] = useState<ContentPack>(() => JSON.parse(JSON.stringify(pack)));
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);

  // Reset when a new pack is passed in (new generation)
  useEffect(() => {
    setEditedPack(JSON.parse(JSON.stringify(pack)));
  }, [pack]);

  const visibleItems = {
    hooks:    editedPack.hooks.map((h, i) => ({ ...h, _idx: i })).filter((h) => h.text !== ""),
    linkedin: editedPack.linkedin_posts.map((h, i) => ({ ...h, _idx: i })).filter((h) => h.text !== ""),
    ig:       editedPack.ig_captions.map((h, i) => ({ ...h, _idx: i })).filter((h) => h.text !== ""),
    shorts:   editedPack.shorts_ideas.map((h, i) => ({ ...h, _idx: i })).filter((h) => h.title !== "" || h.what_to_say !== ""),
  };

  function updateItem(sectionKey: SectionKey, originalIdx: number, text: string) {
    setEditedPack((prev) => {
      if (sectionKey === "hooks") {
        return { ...prev, hooks: prev.hooks.map((h, i) => i === originalIdx ? { ...h, text } : h) };
      }
      if (sectionKey === "linkedin") {
        return { ...prev, linkedin_posts: prev.linkedin_posts.map((h, i) => i === originalIdx ? { ...h, text } : h) };
      }
      if (sectionKey === "ig") {
        return { ...prev, ig_captions: prev.ig_captions.map((h, i) => i === originalIdx ? { ...h, text } : h) };
      }
      return prev;
    });
  }

  function updateShortsWhatToSay(originalIdx: number, what_to_say: string) {
    setEditedPack((prev) => ({
      ...prev,
      shorts_ideas: prev.shorts_ideas.map((s, i) => i === originalIdx ? { ...s, what_to_say } : s),
    }));
  }

  async function regenerateItem(sectionKey: SectionKey, originalIdx: number, context: string) {
    const key = `${sectionKey}-${originalIdx}`;
    setRegeneratingKey(key);
    const itemTypeMap: Record<SectionKey, string> = {
      hooks: "hook",
      linkedin: "linkedin",
      ig: "ig_caption",
      shorts: "shorts_idea",
    };
    try {
      const res = await fetch("/api/generate/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type: itemTypeMap[sectionKey], context }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.item) return;
      if (sectionKey === "shorts") {
        setEditedPack((prev) => ({
          ...prev,
          shorts_ideas: prev.shorts_ideas.map((s, i) =>
            i === originalIdx
              ? {
                  ...s,
                  title: data.item.title ?? s.title,
                  what_to_say: data.item.what_to_say ?? data.item.text ?? s.what_to_say,
                }
              : s
          ),
        }));
      } else {
        updateItem(sectionKey, originalIdx, data.item.text ?? context);
      }
    } catch {
      // silent fail — original text remains
    } finally {
      setRegeneratingKey(null);
    }
  }

  return (
    <div className="rounded-xl border border-cf-violet/14 bg-cf-panel/50 p-6 space-y-5">
      {/* Header + export buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm font-medium text-zinc-300">Content Pack</p>
        <div className="flex gap-2">
          {csv !== null && (
            <button
              onClick={() => downloadBlob(packToCsv(editedPack), "content-pack.csv", "text/csv")}
              className="rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-cf-panel-alt/80 hover:text-white"
            >
              ↓ CSV
            </button>
          )}
          <button
            onClick={() =>
              downloadBlob(JSON.stringify(editedPack, null, 2), "content-pack.json", "application/json")
            }
            className="rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-cf-panel-alt/80 hover:text-white"
          >
            ↓ JSON
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-cf-panel-alt/60 p-1">
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
            visibleItems.shorts.map((idea, i) => (
              <ShortsCard
                key={idea._idx}
                index={i + 1}
                idea={idea}
                onEditWhatToSay={(text) => updateShortsWhatToSay(idea._idx, text)}
                onRegenerate={() =>
                  regenerateItem("shorts", idea._idx, `${idea.title}\n\n${idea.what_to_say}`)
                }
                isRegenerating={regeneratingKey === `shorts-${idea._idx}`}
                allowRegenerate={allowRegenerate}
              />
            ))
          )
        ) : visibleItems[active].length === 0 ? (
          <EmptyState />
        ) : (
          visibleItems[active].map((item, i) => (
            <TextCard
              key={item._idx}
              index={i + 1}
              text={(item as { text: string; _idx: number }).text}
              sectionKey={active}
              onEdit={(text) => updateItem(active, item._idx, text)}
              onRegenerate={() =>
                regenerateItem(active, item._idx, (item as { text: string }).text)
              }
              isRegenerating={regeneratingKey === `${active}-${item._idx}`}
              allowRegenerate={allowRegenerate}
            />
          ))
        )}
      </div>

      {allowRegenerate && (
        <p className="text-center text-xs text-zinc-600">Click any item to edit · ↻ to regenerate a single piece</p>
      )}
    </div>
  );
}
