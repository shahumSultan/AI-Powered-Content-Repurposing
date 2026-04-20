import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isValidToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-in-production");
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Dashboard protection ───────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    const authenticated = token ? await isValidToken(token) : false;
    if (!authenticated) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  // ── Admin protection ───────────────────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("admin_token")?.value;
    const expected = process.env.ADMIN_PASSWORD ?? "";
    const expectedHash = await sha256hex(expected);
    if (!token || token !== expectedHash) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
