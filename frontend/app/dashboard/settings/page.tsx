"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Provider = "groq" | "openai";

interface Settings {
  groq_api_key: string | null;
  openai_api_key: string | null;
  preferred_provider: Provider;
  custom_prompt: string | null;
  free_form_output: boolean;
}

interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  free_form: boolean;
  is_default: boolean;
  created_at: string;
}

interface BrandKit {
  brand_name: string | null;
  brand_voice: string | null;
  target_audience: string | null;
  niche: string | null;
  preferred_cta: string | null;
  default_hashtags: string | null;
}

const BLANK_BRAND_KIT: BrandKit = {
  brand_name: null,
  brand_voice: null,
  target_audience: null,
  niche: null,
  preferred_cta: null,
  default_hashtags: null,
};

interface TemplateFormValues {
  name: string;
  prompt: string;
  free_form: boolean;
  is_default: boolean;
}

const BLANK_FORM: TemplateFormValues = { name: "", prompt: "", free_form: false, is_default: false };

const PROMPT_PLACEHOLDER = `SOURCE MATERIAL:\n{source}\n\nGenerate exactly this JSON structure:\n{\n  "hooks": [{"text": "..."}, ...],\n  "linkedin_posts": [{"text": "..."}, ...],\n  "ig_captions": [{"text": "..."}, ...],\n  "shorts_ideas": [\n    {"title": "...", "what_to_say": "...", "timestamp_start": null, "timestamp_end": null},\n    ...\n  ]\n}\n\nRules:\n- hooks: exactly 5 items, max 140 chars each\n- linkedin_posts: exactly 2 items, 90-140 words, professional tone, end with a CTA\n- ig_captions: exactly 5 items, 30-60 words, include 3 hashtags\n- shorts_ideas: exactly 3 items; title ≤60 chars, what_to_say is 2-3 punchy sentences`;

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

function OutputModeToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-400">Output mode</p>
      <div className="flex gap-2">
        {([false, true] as const).map((val) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange(val)}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
              value === val
                ? "border-cf-violet/60 bg-cf-violet/10 text-cf-violet"
                : "border-cf-violet/25 bg-cf-panel-alt text-zinc-400 hover:border-cf-violet/40 hover:text-zinc-200"
            }`}
          >
            {val ? "Free-form" : "Structured"}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-zinc-500">
        {value
          ? "AI follows your prompt exactly — output is shown as plain text. Perfect for custom formats like podcast reels."
          : "AI uses your prompt for style but still outputs the standard hooks / LinkedIn / IG / Shorts pack."}
      </p>
    </div>
  );
}

function TemplateForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: TemplateFormValues;
  saving: boolean;
  onSave: (v: TemplateFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<TemplateFormValues>(initial);
  const set = (k: keyof TemplateFormValues, v: unknown) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4 rounded-lg border border-cf-violet/25 bg-cf-panel-alt p-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-300">Template name</label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={60}
          placeholder="e.g. Newsletter tone"
          className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cf-violet/60"
        />
        <p className="mt-1 text-right text-xs text-zinc-600">{values.name.length}/60</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-300">Prompt</label>
        <textarea
          value={values.prompt}
          onChange={(e) => set("prompt", e.target.value)}
          rows={10}
          placeholder={PROMPT_PLACEHOLDER}
          spellCheck={false}
          className="w-full resize-y rounded-lg border border-cf-violet/25 bg-cf-panel px-3 py-2.5 font-mono text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-cf-violet/60"
        />
        {values.prompt.trim() && !values.prompt.includes("{source}") && (
          <p className="mt-1 text-xs text-amber-400">
            Prompt doesn&apos;t include <code className="font-mono">{"{source}"}</code> — source content will be appended automatically.
          </p>
        )}
      </div>

      {values.prompt.trim() && (
        <OutputModeToggle value={values.free_form} onChange={(v) => set("free_form", v)} />
      )}

      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={values.is_default}
          onChange={(e) => set("is_default", e.target.checked)}
          className="h-4 w-4 rounded accent-cf-violet"
        />
        <span className="text-xs text-zinc-300">Set as default template</span>
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving || !values.name.trim() || !values.prompt.trim()}
          onClick={() => onSave(values)}
          className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save template"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 transition hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function TemplateManager({
  templates,
  onTemplatesChange,
}: {
  templates: PromptTemplate[];
  onTemplatesChange: (templates: PromptTemplate[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleSave(values: TemplateFormValues) {
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/templates/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.detail ?? "Failed to save template");
          return;
        }
        const updated: PromptTemplate = await res.json();
        onTemplatesChange(
          templates.map((t) => {
            if (values.is_default && t.id !== updated.id) return { ...t, is_default: false };
            return t.id === updated.id ? updated : t;
          })
        );
        toast.success("Template updated");
      } else {
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.detail ?? "Failed to create template");
          return;
        }
        const created: PromptTemplate = await res.json();
        const updated = values.is_default
          ? templates.map((t) => ({ ...t, is_default: false }))
          : [...templates];
        onTemplatesChange([...updated, created]);
        toast.success("Template created");
      }
      setShowForm(false);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete template");
      return;
    }
    onTemplatesChange(templates.filter((t) => t.id !== id));
    setConfirmDeleteId(null);
    toast.success("Template deleted");
  }

  const editingTemplate = editingId ? templates.find((t) => t.id === editingId) : null;
  const formInitial: TemplateFormValues = editingTemplate
    ? { name: editingTemplate.name, prompt: editingTemplate.prompt, free_form: editingTemplate.free_form, is_default: editingTemplate.is_default }
    : BLANK_FORM;

  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <div key={t.id}>
          {editingId === t.id ? (
            <TemplateForm
              initial={formInitial}
              saving={saving}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingId(null); }}
            />
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-cf-violet/14 bg-cf-panel-alt px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">{t.name}</span>
                  {t.is_default && (
                    <span className="rounded bg-cf-violet/20 px-1.5 py-0.5 text-xs font-medium text-cf-violet">Default</span>
                  )}
                  {t.free_form && (
                    <span className="rounded bg-zinc-700/60 px-1.5 py-0.5 text-xs text-zinc-400">Free-form</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{t.prompt.slice(0, 80)}{t.prompt.length > 80 ? "…" : ""}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setEditingId(t.id); setShowForm(false); }}
                  className="rounded p-1.5 text-zinc-500 transition hover:text-zinc-200"
                  title="Edit"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                </button>
                {confirmDeleteId === t.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-400 transition hover:text-red-300"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded px-2 py-1 text-xs text-zinc-500 transition hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(t.id)}
                    className="rounded p-1.5 text-zinc-500 transition hover:text-red-400"
                    title="Delete"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {showForm && !editingId && (
        <TemplateForm
          initial={BLANK_FORM}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!showForm && !editingId && (
        templates.length >= 10 ? (
          <p className="text-xs text-zinc-500">Maximum 10 templates reached. Delete one to add another.</p>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-cf-violet transition hover:text-cf-violet/80"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New template
          </button>
        )
      )}
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabId = "ai-setup" | "templates" | "brand-kit";

const SETTINGS_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "ai-setup",
    label: "AI Setup",
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
  {
    id: "templates",
    label: "Prompt Templates",
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    id: "brand-kit",
    label: "Brand Kit",
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [groqKey, setGroqKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [provider, setProvider] = useState<Provider>("groq");
  const [customPrompt, setCustomPrompt] = useState("");
  const [freeFormOutput, setFreeFormOutput] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [brandKit, setBrandKit] = useState<BrandKit>(BLANK_BRAND_KIT);
  const [savingBrandKit, setSavingBrandKit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("ai-setup");

  useEffect(() => {
    Promise.all([fetch("/api/settings"), fetch("/api/plan"), fetch("/api/templates"), fetch("/api/brand-kit")])
      .then(async ([settingsRes, planRes, tplRes, bkRes]) => {
        const d: Settings = await settingsRes.json();
        setGroqKey(d.groq_api_key ?? "");
        setOpenaiKey(d.openai_api_key ?? "");
        setProvider((d.preferred_provider as Provider) ?? "groq");
        setCustomPrompt(d.custom_prompt ?? "");
        setFreeFormOutput(d.free_form_output ?? false);

        let proUser = false;
        if (planRes.ok) {
          const p = await planRes.json();
          proUser = p.is_admin || p.plan === "pro";
          setIsPro(proUser);
        }

        const list: PromptTemplate[] = tplRes.ok ? await tplRes.json() : [];
        setTemplates(list);

        if (bkRes.ok) {
          const bk: BrandKit = await bkRes.json();
          setBrandKit(bk);
        }

        if (proUser && d.custom_prompt && list.length === 0) {
          fetch("/api/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "My Custom Prompt",
              prompt: d.custom_prompt,
              free_form: d.free_form_output ?? false,
              is_default: true,
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((t: PromptTemplate | null) => {
              if (t?.id) setTemplates([t]);
            })
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groq_api_key: groqKey.trim() || null,
          openai_api_key: openaiKey.trim() || null,
          preferred_provider: provider,
          custom_prompt: customPrompt.trim() || null,
          free_form_output: freeFormOutput,
        }),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings. Please try again.");
      }
    } catch {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBrandKit() {
    setSavingBrandKit(true);
    try {
      const res = await fetch("/api/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: brandKit.brand_name?.trim() || null,
          brand_voice: brandKit.brand_voice?.trim() || null,
          target_audience: brandKit.target_audience?.trim() || null,
          niche: brandKit.niche?.trim() || null,
          preferred_cta: brandKit.preferred_cta?.trim() || null,
          default_hashtags: brandKit.default_hashtags?.trim() || null,
        }),
      });
      if (res.ok) toast.success("Brand Kit saved");
      else toast.error("Failed to save Brand Kit");
    } catch {
      toast.error("Failed to save Brand Kit");
    } finally {
      setSavingBrandKit(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-7 w-28 animate-pulse rounded bg-cf-panel-alt" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-cf-panel-alt" />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <div className="flex gap-2 lg:w-52 lg:flex-col">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 flex-1 animate-pulse rounded-lg bg-cf-panel-alt lg:flex-none" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-cf-panel-alt" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure your AI provider, prompt templates, and brand identity.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Left nav — horizontal on mobile, vertical on desktop */}
        <nav className="flex shrink-0 gap-1 overflow-x-auto pb-1 lg:w-52 lg:flex-col lg:pb-0">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:w-full ${
                activeTab === tab.id
                  ? "bg-cf-violet/10 text-cf-violet"
                  : "text-zinc-400 hover:bg-cf-panel-alt hover:text-zinc-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content panel */}
        <div className="min-w-0 flex-1">

          {/* ── AI Setup tab ─────────────────────────────────────────────── */}
          {activeTab === "ai-setup" && (
            <form onSubmit={handleSave} className="space-y-4">
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

              <div className="space-y-5 rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
                <p className="text-sm font-semibold text-zinc-100">API keys</p>
                <ApiKeyInput
                  label="Groq API Key"
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={setGroqKey}
                  hint="Get a free key at console.groq.com. Required when Groq is your preferred provider."
                />
                <ApiKeyInput
                  label="OpenAI API Key"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={setOpenaiKey}
                  hint="Get a key at platform.openai.com. Required if OpenAI is your preferred provider."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
            </form>
          )}

          {/* ── Prompt Templates tab ─────────────────────────────────────── */}
          {activeTab === "templates" && (
            isPro ? (
              <div className="space-y-4 rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Prompt templates</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Save named prompt templates and pick one per generation from the generate form. Use{" "}
                    <code className="rounded bg-cf-panel-alt px-1 py-0.5 font-mono text-zinc-300">{"{source}"}</code>{" "}
                    where the extracted content should be injected.
                  </p>
                </div>

                <TemplateManager templates={templates} onTemplatesChange={setTemplates} />

                {templates.length === 0 && (
                  <div className="space-y-4 border-t border-cf-violet/10 pt-2">
                    <p className="text-xs text-zinc-500">Or use the one-off custom prompt below (legacy):</p>
                    {customPrompt.trim() && (
                      <OutputModeToggle value={freeFormOutput} onChange={setFreeFormOutput} />
                    )}
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={10}
                      placeholder={PROMPT_PLACEHOLDER}
                      spellCheck={false}
                      className="w-full resize-y rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-2.5 font-mono text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-cf-violet/60 focus:ring-1 focus:ring-cf-violet/20"
                    />
                    {customPrompt.trim() && !customPrompt.includes("{source}") && (
                      <p className="text-xs text-amber-400">
                        Your prompt doesn&apos;t include <code className="font-mono">{"{source}"}</code> — the source content will be appended automatically.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cf-violet/10 text-cf-violet">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-100">Prompt templates</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Save named prompt templates and pick one per generation. Available on the Pro plan.
                    </p>
                    <a
                      href="/dashboard/billing"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-cf-violet px-4 py-2 text-xs font-semibold text-white transition hover:bg-cf-violet/80"
                    >
                      Upgrade to Pro
                    </a>
                  </div>
                </div>
              </div>
            )
          )}

          {/* ── Brand Kit tab ────────────────────────────────────────────── */}
          {activeTab === "brand-kit" && (
            isPro ? (
              <div className="space-y-4 rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Brand Kit</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Set once, applied to every generation when you enable it. Defines your brand identity — voice, audience, and CTA injected into the AI prompt automatically.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">Brand name</label>
                      <input
                        type="text"
                        value={brandKit.brand_name ?? ""}
                        onChange={(e) => setBrandKit((b) => ({ ...b, brand_name: e.target.value }))}
                        maxLength={80}
                        placeholder="e.g. ContentFlow"
                        className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cf-violet/60"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">Niche / Industry</label>
                      <input
                        type="text"
                        value={brandKit.niche ?? ""}
                        onChange={(e) => setBrandKit((b) => ({ ...b, niche: e.target.value }))}
                        maxLength={100}
                        placeholder="e.g. AI productivity, content marketing"
                        className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cf-violet/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">Brand voice</label>
                    <textarea
                      value={brandKit.brand_voice ?? ""}
                      onChange={(e) => setBrandKit((b) => ({ ...b, brand_voice: e.target.value }))}
                      maxLength={300}
                      rows={2}
                      placeholder="e.g. Professional but approachable, data-driven, motivating for creators"
                      className="w-full resize-none rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cf-violet/60"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">Target audience</label>
                    <textarea
                      value={brandKit.target_audience ?? ""}
                      onChange={(e) => setBrandKit((b) => ({ ...b, target_audience: e.target.value }))}
                      maxLength={200}
                      rows={2}
                      placeholder="e.g. Solopreneurs, content creators, marketers"
                      className="w-full resize-none rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cf-violet/60"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">Preferred CTA</label>
                    <input
                      type="text"
                      value={brandKit.preferred_cta ?? ""}
                      onChange={(e) => setBrandKit((b) => ({ ...b, preferred_cta: e.target.value }))}
                      maxLength={150}
                      placeholder="e.g. Try ContentFlow free →"
                      className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cf-violet/60"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">Default hashtags</label>
                    <input
                      type="text"
                      value={brandKit.default_hashtags ?? ""}
                      onChange={(e) => setBrandKit((b) => ({ ...b, default_hashtags: e.target.value }))}
                      maxLength={300}
                      placeholder="#contentcreation #aitools #productivity"
                      className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cf-violet/60"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={savingBrandKit}
                  onClick={handleSaveBrandKit}
                  className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {savingBrandKit ? "Saving…" : "Save Brand Kit"}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cf-violet/10 text-cf-violet">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-100">Brand Kit</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Set your brand voice, audience, and CTA once — applied to every generation automatically. Available on the Pro plan.
                    </p>
                    <a
                      href="/dashboard/billing"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-cf-violet px-4 py-2 text-xs font-semibold text-white transition hover:bg-cf-violet/80"
                    >
                      Upgrade to Pro
                    </a>
                  </div>
                </div>
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}
