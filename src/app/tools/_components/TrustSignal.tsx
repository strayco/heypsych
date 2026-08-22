// Trust Signal Component
// Displays review methodology and trust indicators

import Link from "next/link";
import { Shield, CheckCircle, Eye, Lock } from "lucide-react";

export function TrustSignal() {
  return (
    <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-positive/10 px-4 py-2">
          <Shield className="h-5 w-5 text-positive" />
          <span className="text-sm font-medium text-positive-700">
            Independent Reviews
          </span>
        </div>

        <h2 className="mt-4 text-xl font-semibold text-label-primary sm:text-2xl">
          How We Review Tools
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-label-secondary">
          Our directory is designed to help you make informed decisions. We evaluate
          tools across multiple dimensions without sponsor influence.
        </p>

        {/* Review pillars */}
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-separator bg-canvas p-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <CheckCircle className="h-5 w-5 text-accent" />
            </div>
            <h3 className="mt-3 font-medium text-label-primary">Evidence-Based</h3>
            <p className="mt-1 text-sm text-label-secondary">
              We note clinical evidence and research where available
            </p>
          </div>

          <div className="rounded-xl border border-separator bg-canvas p-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-treatment/10">
              <Lock className="h-5 w-5 text-treatment" />
            </div>
            <h3 className="mt-3 font-medium text-label-primary">Privacy Reviewed</h3>
            <p className="mt-1 text-sm text-label-secondary">
              We assess privacy practices and HIPAA compliance
            </p>
          </div>

          <div className="rounded-xl border border-separator bg-canvas p-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-caution/10">
              <Eye className="h-5 w-5 text-caution" />
            </div>
            <h3 className="mt-3 font-medium text-label-primary">Editorial Independence</h3>
            <p className="mt-1 text-sm text-label-secondary">
              Sponsors cannot purchase reviews or rankings
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/about/review-methodology"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Our review methodology
          </Link>
          <span className="text-label-quaternary">•</span>
          <Link
            href="/about/sponsorship-policy"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Sponsorship policy
          </Link>
          <span className="text-label-quaternary">•</span>
          <Link
            href="/about/medical-review-board"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Medical review board
          </Link>
        </div>
      </div>
    </section>
  );
}
