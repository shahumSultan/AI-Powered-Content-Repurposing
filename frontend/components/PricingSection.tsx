import AnimateOnScroll from "./AnimateOnScroll";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  inheritsFrom?: string;
  features: string[];
  cta: string;
  ctaHref: string;
  popular: boolean;
}

const TIERS: PricingTier[] = [
  {
    name: "Beginner",
    price: "$7",
    period: "/month",
    description: "Everything you need to turn one video into a week of posts.",
    features: [
      "5 content packs per month",
      "YouTube, blog, pasted text & audio uploads",
      "All 6 formats: hooks, LinkedIn, Instagram, Meta, X threads & Shorts",
      "CSV & JSON export",
      "Full generation history",
      "Community support",
    ],
    cta: "Get Beginner →",
    ctaHref: "/auth/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$14",
    period: "/month",
    description: "For creators who publish constantly and want the output in their own voice.",
    inheritsFrom: "Beginner",
    features: [
      "Unlimited content packs",
      "Custom prompt templates",
      "Free-form output and the full content pack in a single run",
      "Brand kit — your voice, audience, CTA & hashtags applied to every pack",
      "Priority support",
    ],
    cta: "Get Pro →",
    ctaHref: "/auth/signup",
    popular: true,
  },
];

interface ComparisonRow {
  feature: string;
  beginner: string | boolean;
  pro: string | boolean;
}

const COMPARISON: ComparisonRow[] = [
  { feature: "Content packs per month", beginner: "5", pro: "Unlimited" },
  { feature: "Sources — YouTube, blog, text, audio", beginner: true, pro: true },
  { feature: "All 6 content formats", beginner: true, pro: true },
  { feature: "CSV & JSON export", beginner: true, pro: true },
  { feature: "Generation history", beginner: true, pro: true },
  { feature: "Custom prompt templates", beginner: false, pro: true },
  { feature: "Free-form output alongside your content pack", beginner: false, pro: true },
  { feature: "Brand kit (voice, audience, CTA, hashtags)", beginner: false, pro: true },
  { feature: "Support", beginner: "Community", pro: "Priority" },
];

const DELAYS = ["0ms", "100ms", "200ms"];

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <>
        <CheckIcon className="mx-auto h-4 w-4 text-cf-cyan" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <span aria-hidden="true" className="text-zinc-600">—</span>
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="text-sm text-zinc-300">{value}</span>;
}

export default function PricingSection() {
  return (
    <section id="pricing" className="bg-cf-bg px-6 py-24">
      {/* Section header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <AnimateOnScroll delay="0ms">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cf-violet">
            Pricing
          </p>
          <h2 className="display-font text-3xl font-extrabold tracking-tight text-zinc-100 md:text-4xl">
            Simple, Honest Pricing
          </h2>
          <p className="mt-4 text-zinc-400">Pick your pace. Upgrade when you need more.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Every account starts with 3 free generations — no card required.
          </p>
        </AnimateOnScroll>
      </div>

      {/* Pricing cards */}
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-10 md:grid-cols-2">
        {TIERS.map((tier, i) => (
          <AnimateOnScroll key={tier.name} delay={DELAYS[i]} className="flex flex-col">
            <div
              className={
                tier.popular
                  ? "card-glow pricing-popular flex flex-col rounded-2xl border p-8 bg-cf-panel flex-1"
                  : "card-glow flex flex-col rounded-2xl border border-cf-violet/14 bg-cf-panel/80 p-8 flex-1"
              }
            >
              {/* Popular badge */}
              {tier.popular && (
                <div className="mb-4 self-start rounded-full bg-cf-violet/15 px-3 py-1 text-xs font-semibold text-cf-violet">
                  Most Popular
                </div>
              )}

              <h3 className="display-font text-xl font-bold text-zinc-100">{tier.name}</h3>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-100">{tier.price}</span>
                {tier.period && (
                  <span className="text-sm text-zinc-500">{tier.period}</span>
                )}
              </div>

              <p className="mt-3 text-sm text-zinc-500">{tier.description}</p>

              {tier.inheritsFrom && (
                <p className="mt-6 text-sm font-semibold text-zinc-300">
                  Everything in {tier.inheritsFrom}, plus:
                </p>
              )}

              <ul className={`flex-1 space-y-3 ${tier.inheritsFrom ? "mt-3" : "mt-6"}`}>
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-400">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-cf-cyan" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={tier.ctaHref}
                className={
                  tier.popular
                    ? "btn-primary mt-8 block rounded-xl py-3 text-center text-sm font-semibold text-white"
                    : "mt-8 block rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
                }
              >
                {tier.cta}
              </a>
            </div>
          </AnimateOnScroll>
        ))}
      </div>

      {/* Plan comparison */}
      <AnimateOnScroll delay="200ms" className="mx-auto mt-20 max-w-3xl">
        <h3 className="display-font mb-6 text-center text-xl font-bold text-zinc-100">
          Compare plans
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-cf-violet/14 bg-cf-panel/80">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-cf-violet/14">
                <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Feature
                </th>
                <th scope="col" className="w-32 px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Beginner
                </th>
                <th scope="col" className="w-32 px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-cf-violet">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-cf-violet/8 last:border-b-0">
                  <th scope="row" className="px-5 py-3.5 text-sm font-normal text-zinc-400">
                    {row.feature}
                  </th>
                  <td className="px-5 py-3.5 text-center">
                    <Cell value={row.beginner} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Cell value={row.pro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimateOnScroll>
    </section>
  );
}
