export const metadata = {
  title: "Under Maintenance — ContentCube",
  description: "We're working on something. Back shortly.",
};

export default function MaintenancePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center bg-cf-bg">
      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(169,46,46,0.4) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle, rgba(255,179,179,0.35) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-8 rounded-2xl border border-white/5 bg-cf-panel p-10 shadow-2xl sm:p-14 max-w-lg w-full">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cf-violet to-cf-pink">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-zinc-100">ContentCube</span>
        </div>

        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cf-violet/30 bg-cf-violet/10">
          <svg
            className="h-8 w-8 text-cf-violet"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-3">
          <h1 className="display-font text-3xl font-extrabold tracking-tight text-zinc-100 sm:text-4xl">
            Under Maintenance
          </h1>
          <p className="text-base leading-relaxed text-zinc-400">
            We&apos;re making improvements to ContentCube. We&apos;ll be back up
            shortly — thanks for your patience.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-cf-violet/20 to-transparent" />

        {/* Status pill */}
        <div className="flex items-center gap-2 rounded-full border border-cf-violet/20 bg-cf-violet/10 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cf-violet opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cf-violet" />
          </span>
          <span className="text-sm font-medium text-cf-violet">
            Maintenance in progress
          </span>
        </div>
      </div>

      {/* Footer note */}
      <p className="relative z-10 mt-8 text-sm text-zinc-600">
        © 2026 ContentCube — Product of Enigma-Cube
      </p>
    </div>
  );
}
