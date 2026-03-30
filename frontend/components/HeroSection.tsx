import AnimateOnScroll from "./AnimateOnScroll";

export default function HeroSection() {
  return (
    <section
      className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-20"
      style={{ background: "var(--background)" }}
    >
      {/* Subtle grid + noise texture */}
      <div className="hero-bg" aria-hidden="true" />

      {/* Warm ambient glow — single, restrained */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Content — left-aligned on desktop */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <div className="max-w-3xl">
          {/* Eyebrow — no animated dot, just a clean label */}
          <AnimateOnScroll delay="0ms">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              AI Content Repurposing Engine
            </p>
          </AnimateOnScroll>

          {/* Headline */}
          <AnimateOnScroll delay="80ms">
            <h1 className="display-font text-5xl font-extrabold leading-[1.05] tracking-tighter text-zinc-100 md:text-6xl lg:text-7xl">
              Stop Rewriting.
              <span className="hero-gradient-text mt-2 block">Start Repurposing.</span>
            </h1>
          </AnimateOnScroll>

          {/* Sub-headline */}
          <AnimateOnScroll delay="160ms">
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              You create great content but adapting it for every channel eats hours you don&apos;t have. Paste a link and get LinkedIn posts, Instagram captions and short-video ideas ready to publish in seconds.
            </p>
          </AnimateOnScroll>

          {/* CTA row */}
          <AnimateOnScroll delay="240ms" className="mt-10 flex flex-wrap gap-4">
            <a href="#try-it" className="btn-primary inline-block rounded-xl px-8 py-4 text-base font-semibold">
              Try Free →
            </a>
            <a
              href="#how-it-works"
              className="inline-block rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-zinc-300 transition hover:bg-white/10"
            >
              See How It Works
            </a>
          </AnimateOnScroll>

          {/* Mini stats strip */}
          <AnimateOnScroll delay="320ms">
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/5 pt-8">
              {[
                { value: "15", label: "posts per pack" },
                { value: "< 60s", label: "generation time" },
                { value: "Free", label: "to start" },
              ].map(({ value, label }) => (
                <div key={label} className="flex items-baseline gap-2">
                  <span className="display-font text-2xl font-bold text-orange-400">{value}</span>
                  <span className="text-sm text-zinc-500">{label}</span>
                </div>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
