import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/config";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ detail: "Invalid multipart form" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ detail: "No audio file provided" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ detail: "Audio file exceeds 25 MB limit" }, { status: 413 });
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

  const backendHeaders: Record<string, string> = {};
  if (settings?.preferred_provider === "openai" && settings.openai_api_key) {
    backendHeaders["X-Openai-Api-Key"] = settings.openai_api_key;
  } else if (settings?.groq_api_key) {
    backendHeaders["X-Groq-Api-Key"] = settings.groq_api_key;
  }
  if (settings?.custom_prompt) {
    backendHeaders["X-Custom-Prompt"] = settings.custom_prompt;
  }

  // Re-stream as multipart to the FastAPI backend
  const upstream_form = new FormData();
  upstream_form.append("file", file, file.name);

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/generate/audio`, {
      method: "POST",
      headers: backendHeaders,
      body: upstream_form,
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
      title: `Audio — ${file.name}`,
      content_pack: data.export_json,
    }),
  }).catch(() => {});

  return NextResponse.json(data);
}
