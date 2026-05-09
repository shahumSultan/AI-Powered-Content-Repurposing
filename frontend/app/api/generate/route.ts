import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/config";

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

  // Check and consume generation quota
  const quotaRes = await fetch(`${BACKEND_URL}/user/consume-generation`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

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

  // Fetch user's API key settings
  const settingsRes = await fetch(`${BACKEND_URL}/user/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const settings = settingsRes.ok ? await settingsRes.json() : null;

  const backendHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (settings?.preferred_provider === "openai" && settings.openai_api_key) {
    backendHeaders["X-Openai-Api-Key"] = settings.openai_api_key;
  } else if (settings?.groq_api_key) {
    backendHeaders["X-Groq-Api-Key"] = settings.groq_api_key;
  }
  if (settings?.custom_prompt) {
    backendHeaders["X-Custom-Prompt"] = settings.custom_prompt;
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

  // Record generation history with full content pack (best-effort)
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
