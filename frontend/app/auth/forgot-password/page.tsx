"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, null);

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

        {state?.success ? (
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-bold text-zinc-100">Check your email</h1>
            <p className="mb-6 text-sm text-zinc-400">
              If an account exists for that email, we sent a password reset link. It expires in 1 hour.
            </p>
            <Link href="/auth/login" className="text-sm text-cf-violet hover:text-cf-violet/80">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-xl font-bold text-zinc-100">Reset your password</h1>
            <p className="mb-6 text-sm text-zinc-500">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form action={action} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-cf-violet focus:ring-2 focus:ring-cf-violet/20"
                />
              </div>

              {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Sending…" : "Send reset link →"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-zinc-500">
              <Link href="/auth/login" className="text-cf-violet hover:text-cf-violet/80">
                ← Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
