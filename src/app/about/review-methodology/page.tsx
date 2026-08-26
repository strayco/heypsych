// src/app/about/review-methodology/page.tsx
// Review Methodology Page

import { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, CheckCircle, ArrowLeft } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

// Slashless canonical for consistency with sitemap
const canonicalUrl = `${siteConfig.url}/about/review-methodology`;

export const metadata: Metadata = {
  title: "Review Methodology",
  description:
    "Learn how HeyPsych evaluates and reviews mental health tools. Our methodology covers clinical evidence, privacy practices, pricing transparency, and user experience.",
  alternates: {
    canonical: canonicalUrl,
  },
};

export default function ReviewMethodologyPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/tools/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-label-secondary hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-treatment/10">
              <ClipboardCheck className="h-6 w-6 text-treatment" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-label-primary">
              Review Methodology
            </h1>
          </div>
          <p className="text-label-secondary">
            Last updated: August 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl prose prose-slate">
          <h2 className="text-xl font-bold text-label-primary">How We Evaluate Tools</h2>
          <p className="text-label-secondary">
            HeyPsych reviews mental health tools using a structured methodology
            designed for both clinicians and patients. Our evaluations are
            conducted by our medical review board and editorial team, with input
            from practicing mental health professionals.
          </p>

          <h2 className="mt-8 text-xl font-bold text-label-primary">
            Evaluation Criteria
          </h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-separator bg-surface p-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
                <div>
                  <h3 className="font-semibold text-label-primary">Clinical Evidence</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    We note whether tools have peer-reviewed research, clinical
                    trials, or are based on evidence-based practices. We distinguish
                    between FDA-cleared devices, research-backed approaches, and
                    tools without published evidence.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-separator bg-surface p-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
                <div>
                  <h3 className="font-semibold text-label-primary">Privacy & Compliance</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    We assess HIPAA compliance, availability of Business Associate
                    Agreements (BAAs), data handling practices, and privacy policies.
                    Tools that collect sensitive health information receive additional
                    scrutiny.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-separator bg-surface p-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
                <div>
                  <h3 className="font-semibold text-label-primary">Pricing Transparency</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    We document pricing models, free tiers, and total cost of
                    ownership where available. We verify pricing information
                    directly from vendor websites and update regularly.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-separator bg-surface p-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
                <div>
                  <h3 className="font-semibold text-label-primary">Feature Assessment</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    We evaluate core features, integrations, platform availability,
                    and how well tools serve their intended use cases. For clinician
                    tools, we assess workflow fit and practice management capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-xl font-bold text-label-primary">
            Review Process
          </h2>
          <ol className="mt-4 list-decimal list-inside space-y-2 text-label-secondary">
            <li>Initial screening against eligibility criteria</li>
            <li>Data collection from public sources and vendor documentation</li>
            <li>Clinical review by our medical advisory board when applicable</li>
            <li>Editorial review for accuracy and completeness</li>
            <li>Regular updates to reflect changes in features, pricing, or evidence</li>
          </ol>

          <h2 className="mt-8 text-xl font-bold text-label-primary">
            What We Don&apos;t Do
          </h2>
          <ul className="mt-4 list-disc list-inside space-y-2 text-label-secondary">
            <li>We don&apos;t accept payment to influence review outcomes</li>
            <li>We don&apos;t guarantee favorable coverage in exchange for sponsorship</li>
            <li>We don&apos;t provide medical advice or treatment recommendations</li>
            <li>We don&apos;t endorse specific tools as &quot;the best&quot; for all users</li>
          </ul>

          <h2 className="mt-8 text-xl font-bold text-label-primary">
            Corrections & Updates
          </h2>
          <p className="text-label-secondary">
            If you notice an error in our reviews or have updated information about
            a tool, please contact us. We strive to maintain accurate, current
            information and will update reviews promptly when provided with
            verifiable corrections.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/about/medical-review-board"
              className="text-sm text-accent hover:underline"
            >
              Meet our Medical Review Board
            </Link>
            <span className="text-label-quaternary">·</span>
            <Link
              href="/about/sponsorship-policy"
              className="text-sm text-accent hover:underline"
            >
              Sponsorship Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
