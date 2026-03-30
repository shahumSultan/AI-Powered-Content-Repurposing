import AnimateOnScroll from "./AnimateOnScroll";

const FEATURES = [
  {
    number: "01",
    title: "Paste a Link. That's It.",
    description:
      "Drop in a YouTube video or blog post. The engine reads it, pulls out the key ideas and gets to work — no copy-pasting, no prep work on your end.",
    aside: "Works with YouTube and any article URL.",
  },
  {
    number: "02",
    title: "Surfaces What Actually Performs",
    description:
      "We identify the strongest insights, sharpest angles and most shareable moments in your content — so every post leads with something worth stopping for.",
    aside: "No more guessing which part to post.",
  },
  {
    number: "03",
    title: "A Full Content Pack, Ready to Go",
    description:
      "You get attention-grabbing hooks to open with, LinkedIn posts to build authority, Instagram captions to drive engagement and Shorts ideas to grow your video presence — all from one link.",
    aside: "5 hooks · 2 LinkedIn · 5 IG · 3 Shorts",
  },
];

const DELAYS = ["0ms", "120ms", "240ms"];

export default function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-24">
      {/* Section header */}
      <div className="mx-auto mb-16 max-w-6xl">
        <AnimateOnScroll delay="0ms">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            What It Does
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 className="display-font text-4xl font-extrabold tracking-tight text-zinc-100 md:text-5xl">
              One link in.<br />Every channel covered.
            </h2>
            <p className="max-w-xs text-sm text-zinc-500 md:text-right">
              Built for creators who publish daily and can&apos;t afford to spend hours reformatting.
            </p>
          </div>
        </AnimateOnScroll>
      </div>

      {/* Feature rows — alternating editorial layout */}
      <div className="mx-auto max-w-6xl divide-y divide-white/5">
        {FEATURES.map((feature, i) => (
          <AnimateOnScroll key={feature.number} delay={DELAYS[i]}>
            <div className="grid grid-cols-1 gap-6 py-12 md:grid-cols-[120px_1fr_240px]">
              {/* Large number */}
              <div className="display-font text-6xl font-extrabold leading-none text-orange-400/20 md:text-7xl">
                {feature.number}
              </div>

              {/* Title + description */}
              <div>
                <h3 className="display-font mb-4 text-xl font-bold text-zinc-100 md:text-2xl">
                  {feature.title}
                </h3>
                <p className="max-w-lg text-base leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </div>

              {/* Aside callout */}
              <div className="flex items-center md:justify-end">
                <p className="rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-zinc-500">
                  {feature.aside}
                </p>
              </div>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  );
}
