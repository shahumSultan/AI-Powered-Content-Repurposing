"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { GenerateResponse } from "@/lib/api";
import { GENERATE_PLACEHOLDER } from "@/lib/config";
import ContentPackView from "./ContentPackView";

type Status = "idle" | "loading" | "done" | "limit_reached" | "error";

const SAMPLE_RESPONSE: GenerateResponse = {
  raw_output: null,
  errors: [],
  export_csv: "csv",
  export_json: {},
  content_pack: {
    hooks: [
      { text: "Most creators waste 6 hours repurposing one video. Here's how to do it in 30 seconds." },
      { text: "Stop spending your Sunday writing captions. Your content does it for you now." },
      { text: "The creator who posts consistently isn't working harder — they're working smarter." },
      { text: "One video. Five hooks. Two LinkedIn posts. Five captions. Three Shorts ideas. One click." },
      { text: "Your best ideas deserve to be seen on every platform — not just one." },
    ],
    linkedin_posts: [
      { text: "Content creation doesn't have to be exhausting.\n\nMost creators spend 80% of their time repurposing content and only 20% actually creating it. That's backwards.\n\nContentFlow flips the ratio. Paste a YouTube link or article URL, and in seconds you get hooks, LinkedIn posts, Instagram captions, and YouTube Shorts ideas — all ready to publish.\n\nYou made the content once. Now let AI do the heavy lifting.\n\nWhat would you do with 6 extra hours every week?" },
      { text: "Here's what separates creators who grow from those who plateau: consistency.\n\nNot talent. Not luck. Just showing up on every platform, every week.\n\nThe problem? Most creators don't have time to repurpose their content across LinkedIn, Instagram, and YouTube Shorts manually.\n\nThat's exactly why we built ContentFlow — to turn any video or article into a full content pack in seconds.\n\nGrowth becomes a system, not a struggle.\n\nTry it free today →" },
    ],
    ig_captions: [
      { text: "One video shouldn't live on just one platform. ContentFlow turns your best content into hooks, posts, and captions automatically. Work smarter. ✨ #contentcreator #socialmediatips #aitools" },
      { text: "Stop writing captions from scratch every day. Your content is already there — you just need the right tool to unlock it. 🚀 #creatoreconomy #contentmarketing #productivity" },
      { text: "The secret to posting consistently? Systems, not willpower. Let AI handle the repurposing so you can focus on creating. 💡 #contentflow #aicontentcreation #creatortools" },
      { text: "6 hours of repurposing → 30 seconds. That's not an exaggeration. That's ContentFlow. ⚡ #marketingtips #contentcreator #timemanagement" },
      { text: "Your audience is on YouTube, LinkedIn, AND Instagram. Your content should be too. 🎯 #omnichannelmarketing #socialmedia #contentcreation" },
    ],
    shorts_ideas: [
      {
        title: "Why most creators burn out (and how to fix it)",
        what_to_say: "Most creators burn out not from making content — but from repurposing it. Spending hours turning one video into captions and posts is exhausting. The fix? Automate the repurposing and spend your energy on what only you can do: creating.",
        timestamp_start: null,
        timestamp_end: null,
      },
      {
        title: "The 30-second content strategy that changes everything",
        what_to_say: "Here's the play: record or write your content once, then let ContentFlow turn it into a full week of posts across every platform. One input, unlimited output. That's how top creators stay consistent without burning out.",
        timestamp_start: null,
        timestamp_end: null,
      },
      {
        title: "Stop posting on just one platform",
        what_to_say: "Your YouTube audience and your LinkedIn audience are different people — and they both want your content. The problem is repurposing manually takes forever. ContentFlow does it for you in seconds. No excuses left.",
        timestamp_start: null,
        timestamp_end: null,
      },
    ],
    x_threads: [
      {
        tweets: [
          "Most creators spend 80% of their time repurposing content. That's backwards.",
          "Record or write once → ContentFlow turns it into hooks, LinkedIn posts, IG captions, and Shorts ideas in seconds.",
          "Your YouTube audience and LinkedIn audience are different people. Both want your content.",
          "The creators who grow consistently aren't working harder — they have better systems.",
          "Stop copy-pasting between platforms. Try ContentFlow free →",
        ],
      },
    ],
  },
};

export default function TryItForm() {
  const [urlsText, setUrlsText] = useState("");
  const [status, setStatus] = useState<Status>("done");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(SAMPLE_RESPONSE);
  const [isSample, setIsSample] = useState(true);
  const [previewSecret, setPreviewSecret] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const secret = params.get("preview");
    if (secret) setPreviewSecret(secret);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = urlsText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0) return;

    setStatus("loading");
    setError(null);
    setResult(null);
    setIsSample(false);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (previewSecret) headers["x-preview-secret"] = previewSecret;

      const res = await fetch("/api/trial-generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ urls }),
      });

      if (res.status === 429) {
        setStatus("limit_reached");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        setError(err.detail ?? `Request failed: ${res.status}`);
        setStatus("error");
        return;
      }

      const data: GenerateResponse = await res.json();
      setResult(data);
      setStatus("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "limit_reached") {
    return (
      <div className="rounded-xl border border-cf-violet/20 bg-cf-violet/8 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cf-violet/20">
          <svg className="h-6 w-6 text-cf-violet" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </div>
        <p className="mb-1 text-base font-semibold text-zinc-100">Your free trial is complete</p>
        <p className="mb-6 text-sm text-zinc-400">
          Create a free account to get 5 content packs every month — no credit card needed.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/signup"
            className="btn-primary rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          >
            Create free account →
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {status !== "done" || isSample ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder={GENERATE_PLACEHOLDER}
            rows={4}
            className="w-full resize-none rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cf-violet focus:ring-2 focus:ring-cf-violet/20"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing… this may take a moment
              </span>
            ) : (
              "Generate Content Pack →"
            )}
          </button>
        </form>
      ) : null}

      {status === "error" && error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {status === "done" && result && (
        <div className="space-y-4">
          {isSample ? (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-cf-panel-alt/60 px-4 py-2.5">
              <svg className="h-3.5 w-3.5 shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-zinc-500">Sample output — paste your own URL above to generate yours</p>
            </div>
          ) : (
            /* Soft signup banner */
            <div className="flex items-center justify-between rounded-lg border border-cf-violet/20 bg-cf-violet/8 px-4 py-3">
              <p className="text-sm text-zinc-300">
                Enjoying it? Sign up for <span className="font-semibold text-cf-cyan">5 free packs/month</span>
              </p>
              <Link
                href="/auth/signup"
                className="btn-primary ml-4 shrink-0 rounded-lg px-4 py-1.5 text-xs font-semibold text-white"
              >
                Sign up free →
              </Link>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="rounded-lg border border-yellow-800 bg-yellow-950/40 px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-yellow-400">Some URLs could not be processed:</p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-yellow-500">{err}</p>
              ))}
            </div>
          )}

          <ContentPackView
            pack={result.content_pack}
            csv={result.export_csv}
            json={result.export_json}
          />
        </div>
      )}
    </div>
  );
}
