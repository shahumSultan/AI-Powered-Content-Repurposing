import AnimateOnScroll from "./AnimateOnScroll";

const ACCENT: Record<string, { bg: string; text: string }> = {
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-400"  },
  fuchsia: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400" },
  pink:    { bg: "bg-pink-500/10",    text: "text-pink-400"    },
};

const FEATURES = [
  {
    accent: "violet",
    title: "Instant Ingestion",
    description:
      "Paste any YouTube URL or blog link. Full transcripts with timestamps or clean article text — extracted automatically, no copy-pasting required.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
        />
      </svg>
    ),
  },
  {
    accent: "fuchsia",
    title: "Smart Chunking",
    description:
      "Content is split into 400–900 word chunks, embedded using MiniLM, and deduplicated — so the model only sees your most unique, signal-rich material.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
        />
      </svg>
    ),
  },
  {
    accent: "pink",
    title: "Multi-Format Output",
    description:
      "One run generates hooks, LinkedIn posts, Instagram captions, and YouTube Shorts ideas with precise timestamps — all export-ready as CSV or JSON.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
  },
];

const DELAYS = ["0ms", "100ms", "200ms"];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-zinc-950 px-6 py-24">
      {/* Section header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <AnimateOnScroll delay="0ms">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">
            Features
          </p>
          <h2 className="text-3xl font-bold text-zinc-100 md:text-4xl">What It Does</h2>
          <p className="mt-4 text-zinc-400">One tool. Every channel.</p>
        </AnimateOnScroll>
      </div>

      {/* Feature cards */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
        {FEATURES.map((feature, i) => {
          const accent = ACCENT[feature.accent];
          return (
            <AnimateOnScroll key={feature.title} delay={DELAYS[i]}>
              <div className="card-glow h-full rounded-2xl border border-white/5 bg-zinc-900/80 p-8 backdrop-blur-sm">
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${accent.bg} ${accent.text}`}
                >
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-lg font-semibold text-zinc-100">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{feature.description}</p>
              </div>
            </AnimateOnScroll>
          );
        })}
      </div>
    </section>
  );
}
