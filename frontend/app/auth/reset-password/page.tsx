"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { resetPassword } from "../actions";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, action, pending] = useActionState(resetPassword, null);

  if (!token) {
    return (
      <div>
        <h1 className="mb-2 text-xl font-bold text-zinc-100">Invalid link</h1>
        <p className="mb-6 text-sm text-zinc-400">
          This reset link is missing or invalid. Please request a new one.
        </p>
        <Link href="/auth/forgot-password" className="text-sm text-cf-violet hover:text-cf-violet/80">
          Request new link →
        </Link>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold text-zinc-100">Password updated</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link
          href="/auth/login"
          className="btn-primary inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-zinc-100">Choose a new password</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Must be at least 8 characters with uppercase, lowercase, and a number.
      </p>

      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">New password</label>
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-cf-violet focus:ring-2 focus:ring-cf-violet/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Confirm password</label>
          <input
            type="password"
            name="confirm"
            required
            className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-cf-violet focus:ring-2 focus:ring-cf-violet/20"
          />
        </div>

        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Updating…" : "Update password →"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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

        <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
