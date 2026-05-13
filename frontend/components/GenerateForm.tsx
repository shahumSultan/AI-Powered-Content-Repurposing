"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { GenerateResponse } from "@/lib/api";
import { GENERATE_PLACEHOLDER } from "@/lib/config";
import ContentPackView from "./ContentPackView";
import FreeFormView from "./FreeFormView";

type Tab = "urls" | "text" | "audio";

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: "urls", label: "URLs" },
  { id: "text", label: "Raw Text" },
  { id: "audio", label: "Audio" },
];

const ACCEPTED_AUDIO = ".mp3,.mp4,.m4a,.wav,.ogg,.webm";

export default function GenerateForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("urls");
  const [urlsText, setUrlsText] = useState("");
  const [rawText, setRawText] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  function handleFileSelect(file: File | null) {
    if (!file) return;
    const sizeLimit = 25 * 1024 * 1024;
    if (file.size > sizeLimit) {
      toast.error("File exceeds 25 MB limit");
      return;
    }
    setAudioFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0] ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let res: Response;

      if (tab === "urls") {
        const urls = urlsText
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean);
        if (urls.length === 0) { setLoading(false); return; }
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls }),
        });

      } else if (tab === "text") {
        if (!rawText.trim()) { setLoading(false); return; }
        res = await fetch("/api/generate/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: rawText }),
        });

      } else {
        if (!audioFile) { setLoading(false); return; }
        const formData = new FormData();
        formData.append("file", audioFile);
        res = await fetch("/api/generate/audio", {
          method: "POST",
          body: formData,
        });
      }

      if (res.status === 429) {
        router.refresh();
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        toast.error(err.detail ?? `Request failed: ${res.status}`);
        return;
      }

      const data: GenerateResponse = await res.json();
      if (data.errors.length > 0) {
        data.errors.forEach((e) => toast.warning(e));
      }
      setResult(data);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    (tab === "urls" && urlsText.trim().length > 0) ||
    (tab === "text" && rawText.trim().length >= 50) ||
    (tab === "audio" && audioFile !== null);

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex rounded-lg border border-cf-violet/20 bg-cf-panel-alt p-1 gap-1">
        {TAB_LABELS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setTab(id); setResult(null); }}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-cf-violet text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* URLs tab */}
        {tab === "urls" && (
          <textarea
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder={GENERATE_PLACEHOLDER}
            rows={4}
            className="w-full resize-none rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cf-violet focus:ring-2 focus:ring-cf-violet/20"
          />
        )}

        {/* Raw text tab */}
        {tab === "text" && (
          <div className="space-y-1">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste a transcript, article, or any text (at least 50 characters)…"
              rows={7}
              className="w-full resize-none rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cf-violet focus:ring-2 focus:ring-cf-violet/20"
            />
            <p className="text-right text-xs text-zinc-500">{rawText.length} chars</p>
          </div>
        )}

        {/* Audio tab */}
        {tab === "audio" && (
          <div className="space-y-2">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-colors ${
                isDragging
                  ? "border-cf-violet bg-cf-violet/10"
                  : "border-cf-violet/25 bg-cf-panel-alt hover:border-cf-violet/50"
              }`}
            >
              <svg className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
              {audioFile ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-200">{audioFile.name}</p>
                  <p className="text-xs text-zinc-500">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-zinc-400">Drop an audio file here or <span className="text-cf-violet">browse</span></p>
                  <p className="text-xs text-zinc-500 mt-1">MP3, MP4, M4A, WAV, OGG, WebM — max 25 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_AUDIO}
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-zinc-500">
              If you have an OpenAI key saved in Settings, it&apos;s used for transcription. Otherwise a free local model is used.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {tab === "audio" ? "Transcribing & processing…" : "Processing… this may take a moment"}
            </span>
          ) : (
            "Generate Content Pack →"
          )}
        </button>
      </form>

      {result && (
        result.raw_output
          ? <FreeFormView text={result.raw_output} />
          : <ContentPackView
              pack={result.content_pack}
              csv={result.export_csv}
              json={result.export_json}
            />
      )}
    </div>
  );
}
