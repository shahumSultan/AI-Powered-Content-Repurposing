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
  if (typeof bodyObj.text !== "string" || !bodyObj.text.trim()) {
    return NextResponse.json({ detail: "Invalid request: text must be a non-empty string" }, { status: 400 });
  }

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

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/generate/text`, {
      method: "POST",
      headers: backendHeaders,
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

  fetch(`${BACKEND_URL}/user/record-generation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      urls: [],
      title: `Text input — ${String(bodyObj.text).slice(0, 60)}…`,
      content_pack: data.export_json,
    }),
  }).catch(() => {});

  return NextResponse.json(data);
}
