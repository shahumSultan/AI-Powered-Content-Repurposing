import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      {/* Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(133,0,250,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-10 inline-flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#8500FA] to-[#DD578B]">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-zinc-100">ContentFlow</span>
        </Link>

        {/* 404 */}
        <p className="mb-2 text-8xl font-black tracking-tight text-zinc-800">404</p>
        <h1 className="mb-3 text-2xl font-bold text-zinc-100">Page not found</h1>
        <p className="mb-8 text-sm text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="btn-gradient rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
