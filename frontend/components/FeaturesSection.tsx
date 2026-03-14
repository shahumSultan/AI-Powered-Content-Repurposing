import AnimateOnScroll from "./AnimateOnScroll";

const ACCENT: Record<string, { bg: string; text: string }> = {
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-400"  },
  fuchsia: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400" },
  pink:    { bg: "bg-pink-500/10",    text: "text-pink-400"    },
};

const FEATURES = [
  {
    accent: "violet",
    title: "Paste a Link. That's It",
    description:
      "Drop in a YouTube video or blog pos. We automatically extract everything needed - no copy-pasting, no formatting, no manual prep.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M10 14a5 5 0 007.07 0l2.83-2.83a5 5 0 10-7.07-7.07L11 5m3 5a5 5 0 00-7.07 0L4.1 12.93a5 5 0 107.07 7.07L13 19"
        />
      </svg>
    ),
  },
  {
    accent: "fuchsia",
    title: "Finds the Best Moments",
    description:
      "We idenitfy the most valuable insights, strongest hooks and key talking points - so your social posts are clear, sharp and relevant.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
  },
  {
    accent: "pink",
    title: "Creates Ready-to-Post Content",
    description:
      "In one run, you get: scroll-stopping hooks, LinkedIn posts, Instagram captions, Short-form video ideas.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M7 7h10M7 11h10M7 15h6M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"
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
      <div className="mx-auto mb-16 max-w-4xl text-center">
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
