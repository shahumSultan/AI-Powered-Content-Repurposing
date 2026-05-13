import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/config";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const bodyObj = body as Record<string, unknown>;
  if (!Array.isArray(bodyObj.urls)) {
    return NextResponse.json({ detail: "Invalid request: urls must be an array" }, { status: 400 });
  }

  // Fetch quota and settings in parallel
  const [quotaRes, settingsRes] = await Promise.all([
    fetch(`${BACKEND_URL}/user/consume-generation`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${BACKEND_URL}/user/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  if (!quotaRes.ok) {
    return NextResponse.json({ detail: "Could not verify generation quota" }, { status: 500 });
  }

  const { status: quotaStatus } = await quotaRes.json();
  if (quotaStatus === "limit_reached") {
    return NextResponse.json(
      { detail: "Monthly generation limit reached. Upgrade to Pro for unlimited generations." },
      { status: 429 }
    );
  }

  const settings = settingsRes.ok ? await settingsRes.json() : null;

  const usingOpenai = settings?.preferred_provider === "openai";
  const hasKey = usingOpenai ? !!settings?.openai_api_key : !!settings?.groq_api_key;
  if (!hasKey) {
    return NextResponse.json(
      { detail: "No AI API key found. Please add your API key in Settings before generating content." },
      { status: 400 }
    );
  }

  const backendHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (usingOpenai && settings.openai_api_key) {
    backendHeaders["X-Openai-Api-Key"] = settings.openai_api_key;
  } else if (settings?.groq_api_key) {
    backendHeaders["X-Groq-Api-Key"] = settings.groq_api_key;
  }
  if (settings?.custom_prompt) {
    backendHeaders["X-Custom-Prompt"] = Buffer.from(settings.custom_prompt, "utf-8").toString("base64");
  }
  if (settings?.free_form_output) {
    backendHeaders["X-Free-Form"] = "true";
  }

  // Proxy to FastAPI generate
  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: backendHeaders,
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

  // Derive a readable title from the first URL
  const firstUrl = String((bodyObj.urls as string[])[0] ?? "");
  const title = firstUrl.includes("youtube.com") || firstUrl.includes("youtu.be")
    ? `YouTube — ${firstUrl}`
    : firstUrl;

  // Record generation history (best-effort)
  fetch(`${BACKEND_URL}/user/record-generation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      urls: bodyObj.urls,
      title,
      content_pack: data.export_json,
    }),
  }).catch(() => {});

  return NextResponse.json(data);
}
