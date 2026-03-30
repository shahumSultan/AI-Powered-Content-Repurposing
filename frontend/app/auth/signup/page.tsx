"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUp } from "../actions";

function SignUpContent() {
  const [state, action, pending] = useActionState(signUp, null);
  const params = useSearchParams();
  const success = params.get("success") === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-amber-400">
            <svg viewBox="0 0 20 20" fill="white" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-100">ContentFlow</span>
        </div>

        {success ? (
          <>
            <h1 className="mb-2 text-xl font-bold text-zinc-100">
              Check your email
            </h1>
            <p className="text-sm text-zinc-400">
              We sent a confirmation link to your inbox. Click it to activate
              your account.
            </p>
            <Link
              href="/"
              className="mt-6 block text-center text-sm text-orange-400 hover:text-orange-300"
            >
              Back to ContentFlow →
            </Link>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-xl font-bold text-zinc-100">
              Create account
            </h1>
            <p className="mb-6 text-sm text-zinc-500">
              Already have one?{" "}
              <Link
                href="/auth/login"
                className="text-orange-400 hover:text-orange-300"
              >
                Sign in
              </Link>
            </p>

            <form action={action} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
                  minLength={8}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
                {pending ? "Creating account…" : "Create account →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div />}>
      <SignUpContent />
    </Suspense>
  );
}