import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

async function isValidToken(token: string): Promise<boolean> {
  const raw = process.env.JWT_SECRET;
  if (!raw) return false;
  try {
    const secret = new TextEncoder().encode(raw);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Maintenance mode ───────────────────────────────────────────────────────
  if (
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" &&
    pathname !== "/maintenance"
  ) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  // Enforce HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("x-forwarded-proto") === "http"
  ) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

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
    if (!token || !expected || token !== expected) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
