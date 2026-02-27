"use client";

import { useState } from "react";
import { generateContentPack, type GenerateResponse } from "@/lib/api";
import ContentPackView from "./ContentPackView";

export default function GenerateForm() {
  const [urlsText, setUrlsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = urlsText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateContentPack(urls);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          placeholder={"Paste one URL per line — YouTube or blog\nhttps://youtube.com/watch?v=...\nhttps://example.com/article"}
          rows={4}
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
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

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {result.errors.length > 0 && (
            <div className="rounded-lg border border-yellow-800 bg-yellow-950/40 px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-yellow-400">
                Some URLs could not be processed:
              </p>
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
