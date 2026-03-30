import AnimateOnScroll from "./AnimateOnScroll";

const STEPS = [
  {
    number: "01",
    title: "Paste Your Link",
    description:
      "Drop in a YouTube video or article URL. Mix and match — the engine handles both in a single run.",
    detail: "Works with YouTube videos and any blog or article.",
  },
  {
    number: "02",
    title: "The Engine Does the Work",
    description:
      "It reads your content, finds the strongest ideas and angles, then writes the posts for you — while you get on with your day.",
    detail: "Usually done in under a minute.",
  },
  {
    number: "03",
    title: "Publish Across Every Channel",
    description:
      "Your content pack lands ready to use: hooks that stop the scroll, LinkedIn posts that build authority, Instagram captions that drive engagement and Shorts ideas with exact timestamps.",
    detail: "Download everything in one click.",
  },
];

const DELAYS = ["0ms", "150ms", "300ms"];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-6 py-24">
      {/* Section header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <AnimateOnScroll delay="0ms">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            How It Works
          </p>
          <h2 className="display-font text-3xl font-extrabold tracking-tight text-zinc-100 md:text-4xl">
            From One Link to a Week of Content
          </h2>
          <p className="mt-4 text-zinc-400">Three steps. No setup required.</p>
        </AnimateOnScroll>
      </div>

      {/* Steps */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <AnimateOnScroll key={step.number} delay={DELAYS[i]}>
            <div className="flex flex-col items-start">
              {/* Number bubble */}
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/8 font-mono text-lg font-bold text-orange-400">
                {step.number}
              </div>
              <h3 className="display-font mb-3 text-lg font-bold text-zinc-100">{step.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{step.description}</p>
              <p className="mt-3 text-xs text-zinc-600">{step.detail}</p>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  );
}
