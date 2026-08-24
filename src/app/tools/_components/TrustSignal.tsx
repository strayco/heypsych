// Trust Signal Component
// Displays review methodology and trust indicators

import Link from "next/link";

export function TrustSignal() {
  return (
    <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
          Our Approach
        </p>
        <h2 className="mt-1 text-xl font-semibold text-label-primary">
          How We Review Tools
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-separator bg-surface p-5">
            <h3 className="font-medium text-label-primary">Evidence-Based</h3>
            <p className="mt-2 text-sm text-label-secondary">
              We note clinical evidence and research where available.
            </p>
          </div>

          <div className="rounded-xl border border-separator bg-surface p-5">
            <h3 className="font-medium text-label-primary">Privacy Reviewed</h3>
            <p className="mt-2 text-sm text-label-secondary">
              We assess privacy practices and HIPAA compliance.
            </p>
          </div>

          <div className="rounded-xl border border-separator bg-surface p-5">
            <h3 className="font-medium text-label-primary">Editorial Independence</h3>
            <p className="mt-2 text-sm text-label-secondary">
              Sponsors cannot purchase reviews or rankings.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/about/review-methodology"
            className="text-label-secondary hover:text-accent transition-colors"
          >
            Review methodology
          </Link>
          <span className="text-label-quaternary">·</span>
          <Link
            href="/about/sponsorship-policy"
            className="text-label-secondary hover:text-accent transition-colors"
          >
            Sponsorship policy
          </Link>
          <span className="text-label-quaternary">·</span>
          <Link
            href="/about/medical-review-board"
            className="text-label-secondary hover:text-accent transition-colors"
          >
            Medical review board
          </Link>
        </div>
      </div>
    </section>
  );
}
