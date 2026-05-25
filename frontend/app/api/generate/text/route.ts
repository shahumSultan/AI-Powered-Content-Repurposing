import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/config";
import { buildGenerateContext, recordGeneration } from "@/lib/generate-proxy";

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
  if (typeof bodyObj.text !== "string" || !bodyObj.text.trim()) {
    return NextResponse.json({ detail: "Invalid request: text must be a non-empty string" }, { status: 400 });
  }

  const result = await buildGenerateContext(token);
  if (!result.ok) return result.response;
  const { backendHeaders } = result.ctx;

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/generate/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...backendHeaders },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

  recordGeneration(token, {
    urls: [],
    title: `Text input — ${String(bodyObj.text).slice(0, 60)}…`,
    content_pack: data.raw_output ? { __raw_output__: data.raw_output } : data.export_json,
  });

  return NextResponse.json(data);
}
