import Link from "next/link";

export default function BillingPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-zinc-100">Billing</h1>
      <p className="mb-8 text-sm text-zinc-500">Manage your subscription and payment methods.</p>

      {/* Current plan summary */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div>
          <p className="text-xs font-medium text-zinc-500">Current plan</p>
          <p className="mt-0.5 text-base font-semibold text-zinc-100">Beginner</p>
        </div>
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
          $7 / month
        </span>
      </div>

      {/* No billing history */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
          <svg className="h-6 w-6 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        </div>
        <p className="mb-1 text-sm font-medium text-zinc-300">No billing history</p>
        <p className="text-xs text-zinc-500">
          No payments recorded yet. Billing will appear here once Stripe is connected.
        </p>
      </div>

      {/* Payment method */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-100">Payment method</h2>
        <p className="text-sm text-zinc-500">
          No payment method on file. Upgrade to Pro to add one.
        </p>
      </div>

      {/* Upgrade CTA */}
      <div className="rounded-xl border border-orange-500/20 bg-orange-950/20 p-6">
        <h2 className="mb-1 text-base font-semibold text-zinc-100">Upgrade to Pro — $14/month</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Unlimited content packs, multiple URL processing, and priority support.
        </p>
        <Link
          href="/#pricing"
          className="btn-primary inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        >
          Upgrade to Pro →
        </Link>
      </div>
    </div>
  );
}
