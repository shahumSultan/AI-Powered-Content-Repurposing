"use client";

import { useState } from "react";
import { fetchYouTubeTranscript, type YouTubeResponse } from "@/lib/api";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function YouTubeForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YouTubeResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchYouTubeTranscript(url.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cf-violet focus:ring-2 focus:ring-cf-violet/20"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Fetching
            </span>
          ) : (
            "Extract →"
          )}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-cf-violet/14 bg-cf-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Video ID: <span className="font-mono text-cf-cyan">{result.video_id}</span>
            </p>
            <p className="text-xs text-zinc-500">
              {result.transcript.length} segments
            </p>
          </div>
          <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
            {result.transcript.map((seg, i) => (
              <div key={i} className="flex gap-3 rounded-md px-2 py-1.5 hover:bg-cf-panel-alt/50">
                <span className="mt-0.5 shrink-0 rounded bg-cf-panel-alt px-1.5 py-0.5 font-mono text-xs text-cf-violet">
                  {formatTime(seg.start)}
                </span>
                <p className="text-sm leading-relaxed text-zinc-300">{seg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
