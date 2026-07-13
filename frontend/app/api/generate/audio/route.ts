import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/config";
import { buildGenerateContext, packForHistory, recordGeneration } from "@/lib/generate-proxy";

const MAX_BYTES = 25 * 1024 * 1024;

export const maxDuration = 60;

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

  const templateId = (formData.get("template_id") as string | null) || null;
  const useBrandKit = formData.get("use_brand_kit") === "true";
  const result = await buildGenerateContext(token, templateId, useBrandKit);
  if (!result.ok) return result.response;
  const { backendHeaders } = result.ctx;

  const upstreamForm = new FormData();
  upstreamForm.append("file", file, file.name);

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/generate/audio`, {
      method: "POST",
      headers: backendHeaders,
      body: upstreamForm,
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

  recordGeneration(token, {
    urls: [],
    title: `Audio — ${file.name}`,
    content_pack: packForHistory(data),
  });

  return NextResponse.json(data);
}
