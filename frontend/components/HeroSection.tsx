import AnimateOnScroll from "./AnimateOnScroll";

export default function HeroSection() {
  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-24 pb-20"
      style={{ background: "#030307" }}
    >
      {/* Ambient orbs */}
      <div
        aria-hidden="true"
        className="hero-orb"
        style={{
          top: "15%",
          left: "8%",
          width: "480px",
          height: "480px",
          background: "rgba(124, 58, 237, 0.15)",
          animationDelay: "0s",
        }}
      />
      <div
        aria-hidden="true"
        className="hero-orb"
        style={{
          top: "5%",
          right: "6%",
          width: "380px",
          height: "380px",
          background: "rgba(217, 70, 239, 0.10)",
          animationDelay: "2.5s",
        }}
      />
      <div
        aria-hidden="true"
        className="hero-orb"
        style={{
          bottom: "8%",
          left: "38%",
          width: "320px",
          height: "320px",
          background: "rgba(236, 72, 153, 0.08)",
          animationDelay: "5s",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl space-y-8 px-6 text-center">
        {/* Eyebrow badge */}
        <AnimateOnScroll delay="0ms" className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
            AI-Powered Content Repurposing
          </span>
        </AnimateOnScroll>

        {/* Headline */}
        <AnimateOnScroll delay="100ms">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-100 md:text-7xl">
            Turn Any Content Into
            <span className="hero-gradient-text mt-1 block">A Full Content Pack</span>
          </h1>
        </AnimateOnScroll>

        {/* Sub-headline */}
        <AnimateOnScroll delay="200ms">
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            Paste a YouTube video or blog URL and get hooks, LinkedIn posts,
            Instagram captions, and Shorts ideas — in seconds.
          </p>
        </AnimateOnScroll>

        {/* CTA row */}
        <AnimateOnScroll delay="300ms" className="flex flex-wrap justify-center gap-4">
          <a href="#try-it" className="btn-gradient inline-block rounded-xl px-8 py-4 text-base font-semibold text-white">
            Start for Free →
          </a>
          <a
            href="#how-it-works"
            className="inline-block rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-zinc-300 transition hover:bg-white/10"
          >
            See How It Works
          </a>
        </AnimateOnScroll>

        {/* Social proof */}
        <AnimateOnScroll delay="400ms">
          <p className="text-sm text-zinc-600">
            No credit card required · YouTube &amp; blogs · Runs locally on your machine
          </p>
        </AnimateOnScroll>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-zinc-600">
        <span className="text-xs">Scroll to explore</span>
        <svg
          className="h-4 w-4 animate-bounce"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </section>
  );
}
