import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  free_form: boolean;
  is_default: boolean;
  created_at: string;
}

export interface BrandKit {
  brand_name: string | null;
  brand_voice: string | null;
  target_audience: string | null;
  niche: string | null;
  preferred_cta: string | null;
  default_hashtags: string | null;
}

export interface GenerateContext {
  isPro: boolean;
  backendHeaders: Record<string, string>;
  templates: PromptTemplate[];
  brandKit: BrandKit | null;
}

type GenerateContextResult =
  | { ok: true; ctx: GenerateContext }
  | { ok: false; response: NextResponse };

export async function buildGenerateContext(
  token: string,
  selectedTemplateId?: string | null,
  useBrandKit: boolean = false,
): Promise<GenerateContextResult> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/user/prepare-generation`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ detail: "Backend unreachable" }, { status: 502 }),
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      response: NextResponse.json({ detail: "Could not verify generation quota" }, { status: 500 }),
    };
  }

  const data = await res.json();

  if (data.quota_status === "limit_reached") {
    return {
      ok: false,
      response: NextResponse.json(
        { detail: "Monthly generation limit reached. Upgrade to Pro for unlimited generations." },
        { status: 429 }
      ),
    };
  }

  const settings = data.settings;
  const isPro: boolean = data.is_admin || data.plan === "pro";
  const templates: PromptTemplate[] = data.templates ?? [];
  const brandKit: BrandKit | null = (isPro && data.brand_kit) ? data.brand_kit : null;

  const usingOpenai = settings?.preferred_provider === "openai";
  const hasKey = usingOpenai ? !!settings?.openai_api_key : !!settings?.groq_api_key;
  if (!hasKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { detail: "No AI API key found. Please add your API key in Settings before generating content." },
        { status: 400 }
      ),
    };
  }

  const backendHeaders: Record<string, string> = {};
  if (usingOpenai && settings.openai_api_key) {
    backendHeaders["X-Openai-Api-Key"] = settings.openai_api_key;
  } else if (settings?.groq_api_key) {
    backendHeaders["X-Groq-Api-Key"] = settings.groq_api_key;
  }

  // Resolve prompt: selected template > default template > legacy custom_prompt
  let activePrompt: string | null = null;
  let activeFreeForm = false;

  if (selectedTemplateId) {
    const tpl = templates.find((t) => t.id === selectedTemplateId) ?? null;
    if (tpl) {
      activePrompt = tpl.prompt;
      activeFreeForm = tpl.free_form;
    }
  } else {
    const def = templates.find((t) => t.is_default) ?? null;
    if (def) {
      activePrompt = def.prompt;
      activeFreeForm = def.free_form;
    } else if (isPro && settings?.custom_prompt) {
      activePrompt = settings.custom_prompt;
      activeFreeForm = settings.free_form_output ?? false;
    }
  }

  if (isPro && activePrompt) {
    backendHeaders["X-Custom-Prompt"] = Buffer.from(activePrompt, "utf-8").toString("base64");
  }
  if (isPro && activeFreeForm) {
    backendHeaders["X-Free-Form"] = "true";
  }

  if (isPro && useBrandKit && brandKit) {
    const hasAnyField = Object.values(brandKit).some((v) => v && String(v).trim());
    if (hasAnyField) {
      backendHeaders["X-Brand-Kit"] = Buffer.from(JSON.stringify(brandKit), "utf-8").toString("base64");
    }
  }

  return { ok: true, ctx: { isPro, backendHeaders, templates, brandKit } };
}

export function recordGeneration(
  token: string,
  payload: { urls: string[]; title: string; content_pack: object | null }
) {
  fetch(`${BACKEND_URL}/user/record-generation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
