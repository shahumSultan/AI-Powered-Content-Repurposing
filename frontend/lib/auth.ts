/**
 * Auth token helpers.
 * The JWT is stored in an httpOnly cookie named "auth_token" — set server-side
 * by Next.js server actions so it's never accessible to client JS.
 */

export const AUTH_COOKIE = "auth_token";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

/** Read the token from server-side cookies (use in server components / actions). */
export async function getServerToken(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  return (await cookies()).get(AUTH_COOKIE)?.value ?? null;
}

/**
 * Fetch the backend with the stored auth token.
 * Use this in server components/actions to call FastAPI endpoints.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getServerToken();
  const BACKEND_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}
