import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Parse body first — request body can only be read once
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  // Build a Supabase client from the request cookies (reads the user's session)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {}, // read-only in route handlers
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  // Atomically check quota and increment — handled entirely in the DB to
  // prevent race conditions from concurrent requests.
  const { data: result, error: rpcError } = await supabase.rpc(
    "try_consume_generation",
    { p_user_id: user.id }
  );

  if (rpcError) {
    console.error("try_consume_generation RPC error:", rpcError);
    return NextResponse.json(
      { detail: "Could not verify generation quota" },
      { status: 500 }
    );
  }

  if (result === "limit_reached") {
    return NextResponse.json(
      { detail: "Monthly generation limit reached. Upgrade to Pro for unlimited generations." },
      { status: 429 }
    );
  }

  // Record this generation in history (best-effort; don't block on failure)
  await supabase
    .from("generation_history")
    .insert({ user_id: user.id, urls: (body as { urls: string[] }).urls })
    .then(({ error }) => {
      if (error) console.error("generation_history insert error:", error);
    });

  // Proxy the request to the FastAPI backend
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  let upstream: Response;
  try {
    upstream = await fetch(`${backendUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });
  return NextResponse.json(data);
}
