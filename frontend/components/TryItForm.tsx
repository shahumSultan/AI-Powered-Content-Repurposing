"use client";

import { useState } from "react";
import Link from "next/link";
import type { GenerateResponse } from "@/lib/api";
import { GENERATE_PLACEHOLDER } from "@/lib/config";
import ContentPackView from "./ContentPackView";

type Status = "idle" | "loading" | "done" | "limit_reached" | "error";

export default function TryItForm() {
  const [urlsText, setUrlsText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

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

    try {
      const res = await fetch("/api/trial-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <div className="rounded-xl border border-violet-500/20 bg-violet-950/30 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-900/50">
          <svg className="h-6 w-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
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
            className="btn-gradient rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
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
      {status !== "done" && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder={GENERATE_PLACEHOLDER}
            rows={4}
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
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
      )}

      {status === "error" && error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {status === "done" && result && (
        <div className="space-y-4">
          {/* Soft signup banner */}
          <div className="flex items-center justify-between rounded-lg border border-violet-500/20 bg-violet-950/30 px-4 py-3">
            <p className="text-sm text-zinc-300">
              Enjoying it? Sign up for <span className="font-semibold text-violet-300">5 free packs/month</span>
            </p>
            <Link
              href="/auth/signup"
              className="ml-4 shrink-0 rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500"
            >
              Sign up free →
            </Link>
          </div>

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
