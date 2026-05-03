"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cf-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-cf-violet/14 bg-cf-panel p-8 shadow-xl">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cf-violet to-cf-pink">
            <svg viewBox="0 0 20 20" fill="white" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-100">ContentCube</span>
        </div>

        <h1 className="mb-1 text-xl font-bold text-zinc-100">Welcome back</h1>
        <p className="mb-6 text-sm text-zinc-500">
          No account?{" "}
          <Link
            href="/auth/signup"
            className="text-cf-violet hover:text-cf-violet/80"
          >
            Sign up free
          </Link>
        </p>

        <form action={action} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              autoFocus
              className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-cf-violet focus:ring-2 focus:ring-cf-violet/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-cf-violet focus:ring-2 focus:ring-cf-violet/20"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </div>
    </div>
  );
}
