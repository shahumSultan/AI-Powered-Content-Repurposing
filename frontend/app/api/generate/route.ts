import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/config";
import { buildGenerateContext, packForHistory, recordGeneration } from "@/lib/generate-proxy";

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

  const templateId = (bodyObj.template_id as string | undefined) ?? null;
  const useBrandKit = (bodyObj.use_brand_kit as boolean | undefined) === true;
  const result = await buildGenerateContext(token, templateId, useBrandKit);
  if (!result.ok) return result.response;
  const { backendHeaders } = result.ctx;

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...backendHeaders },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

  const firstUrl = String((bodyObj.urls as string[])[0] ?? "");
  const title =
    firstUrl.includes("youtube.com") || firstUrl.includes("youtu.be")
      ? `YouTube — ${firstUrl}`
      : firstUrl;

  recordGeneration(token, {
    urls: bodyObj.urls as string[],
    title,
    content_pack: packForHistory(data),
  });

  return NextResponse.json(data);
}
