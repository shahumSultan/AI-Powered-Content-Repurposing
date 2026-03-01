import AnimateOnScroll from "./AnimateOnScroll";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  popular: boolean;
}

const TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "$10",
    period: "",
    description: "Perfect for trying it out with your own content.",
    features: [
      "5 content pack generations / month",
      "YouTube & blog ingestion",
      "Hooks, LinkedIn, IG & Shorts",
      "CSV & JSON export",
      "Local model (you provide)",
      "Community support",
    ],
    cta: "Get Started Free →",
    ctaHref: "#try-it",
    popular: true,
  },
  {
    name: "Creator",
    price: "$20",
    period: "/month",
    description: "For content creators who publish consistently.",
    features: [
      "Unlimited generations",
      "All content formats",
      "Priority generation queue",
      "Bulk URL processing (up to 10)",
      "Batch CSV export",
      "Email support",
    ],
    cta: "Contact Sales →",
    ctaHref: "#try-it",
    popular: false,
  },
];

const DELAYS = ["0ms", "100ms", "200ms"];

export default function PricingSection() {
  return (
    <section id="pricing" className="bg-zinc-950 px-6 py-24">
      {/* Section header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <AnimateOnScroll delay="0ms">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">
            Pricing
          </p>
          <h2 className="text-3xl font-bold text-zinc-100 md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-zinc-400">Start free. Scale when you&apos;re ready.</p>
        </AnimateOnScroll>
      </div>

      {/* Pricing cards */}
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-10 md:grid-cols-2">
        {TIERS.map((tier, i) => (
          <AnimateOnScroll key={tier.name} delay={DELAYS[i]} className="flex flex-col">
            <div
              className={
                tier.popular
                  ? "card-glow pricing-popular flex flex-col rounded-2xl border p-8 bg-zinc-900 flex-1"
                  : "card-glow flex flex-col rounded-2xl border border-white/5 bg-zinc-900/80 p-8 flex-1"
              }
            >
              {/* Popular badge */}
              {tier.popular && (
                <div className="mb-4 self-start rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-400">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold text-zinc-100">{tier.name}</h3>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-100">{tier.price}</span>
                {tier.period && (
                  <span className="text-sm text-zinc-500">{tier.period}</span>
                )}
              </div>

              <p className="mt-3 text-sm text-zinc-500">{tier.description}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-400">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-violet-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={tier.ctaHref}
                className={
                  tier.popular
                    ? "btn-gradient mt-8 block rounded-xl py-3 text-center text-sm font-semibold text-white"
                    : "mt-8 block rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
                }
              >
                {tier.cta}
              </a>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  );
}
