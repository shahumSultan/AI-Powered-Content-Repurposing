"use client";

import { useEffect, useState } from "react";

type Provider = "groq" | "openai";

interface Settings {
  groq_api_key: string | null;
  openai_api_key: string | null;
  preferred_provider: Provider;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function ApiKeyInput({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-2 focus-within:border-cf-violet/60 focus-within:ring-1 focus-within:ring-cf-violet/20">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-zinc-500 transition hover:text-zinc-300"
        >
          <EyeIcon open={show} />
        </button>
      </div>
      <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

export default function SettingsPage() {
  const [groqKey, setGroqKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [provider, setProvider] = useState<Provider>("groq");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: Settings) => {
        setGroqKey(d.groq_api_key ?? "");
        setOpenaiKey(d.openai_api_key ?? "");
        setProvider((d.preferred_provider as Provider) ?? "groq");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groq_api_key: groqKey.trim() || null,
          openai_api_key: openaiKey.trim() || null,
          preferred_provider: provider,
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl">
        <div className="h-6 w-32 animate-pulse rounded bg-cf-panel-alt" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-cf-panel-alt" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-1 text-2xl font-bold text-zinc-100">Settings</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Save your own API key to use for content generation. Your key is stored securely and never shared.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Provider preference */}
        <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
          <p className="mb-3 text-sm font-semibold text-zinc-100">Preferred provider</p>
          <div className="flex gap-3">
            {(["groq", "openai"] as Provider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium capitalize transition ${
                  provider === p
                    ? "border-cf-violet/60 bg-cf-violet/10 text-cf-violet"
                    : "border-cf-violet/25 bg-cf-panel-alt text-zinc-400 hover:border-cf-violet/40 hover:text-zinc-200"
                }`}
              >
                {p === "groq" ? "Groq" : "OpenAI"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {provider === "groq"
              ? "Uses llama-3.3-70b-versatile via Groq. Fast and free."
              : "Uses gpt-4o-mini via OpenAI. Requires an OpenAI API key."}
          </p>
        </div>

        {/* API Keys */}
        <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5 space-y-5">
          <p className="text-sm font-semibold text-zinc-100">API keys</p>

          <ApiKeyInput
            label="Groq API Key"
            placeholder="gsk_..."
            value={groqKey}
            onChange={setGroqKey}
            hint="Get a free key at console.groq.com. Leave blank to use the platform default."
          />

          <ApiKeyInput
            label="OpenAI API Key"
            placeholder="sk-..."
            value={openaiKey}
            onChange={setOpenaiKey}
            hint="Get a key at platform.openai.com. Required if OpenAI is your preferred provider."
          />
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>

          {status === "saved" && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Saved
            </span>
          )}
          {status === "error" && (
            <span className="text-sm text-red-400">Failed to save. Please try again.</span>
          )}
        </div>
      </form>
    </div>
  );
}
