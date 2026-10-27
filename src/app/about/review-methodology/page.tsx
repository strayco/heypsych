// src/app/about/review-methodology/page.tsx
// Review Methodology Page

import { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/brand/PageIntro";
import { CheckCircle } from "lucide-react";
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
      <PageIntro
        title="Review methodology"
        object="doorway"
        width="reading"
        parent={{ label: "About", href: "/about" }}
        footnote="Last updated: August 2026"
      />

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

          <h2 id="privacy" className="mt-8 scroll-mt-28 text-xl font-bold text-label-primary">
            How we grade privacy
          </h2>
          <p className="mt-3 text-label-secondary">
            We read each app&apos;s privacy policy and check the public regulatory record (FTC, HHS, DOJ, state
            attorneys general). We record a few facts, then apply a fixed rule, so the same facts always give
            the same grade. Each profile shows the facts and links the policy we read.
          </p>
          <dl className="mt-4 space-y-2 text-label-secondary">
            <div><dt className="inline font-semibold text-label-primary">A+</dt> <dd className="inline">Data stays on your device, no account is needed, and it doesn&apos;t sell or share data for advertising.</dd></div>
            <div><dt className="inline font-semibold text-label-primary">A</dt> <dd className="inline">No sale or ad sharing, you can have your data deleted, and your health information is protected by HIPAA (or kept only on your device).</dd></div>
            <div><dt className="inline font-semibold text-label-primary">B+</dt> <dd className="inline">No sale or ad sharing, and you can have your data deleted.</dd></div>
            <div><dt className="inline font-semibold text-label-primary">B</dt> <dd className="inline">No sale or ad sharing, but no clear way to delete your data.</dd></div>
            <div><dt className="inline font-semibold text-label-primary">C</dt> <dd className="inline">It sells data or shares it for advertising (including tracking pixels and &quot;sharing&quot; under state privacy laws), or a regulator found a problem with its handling of health data in the last five years.</dd></div>
            <div><dt className="inline font-semibold text-label-primary">D</dt> <dd className="inline">Both of the above.</dd></div>
            <div><dt className="inline font-semibold text-label-primary">Not yet rated</dt> <dd className="inline">The policy doesn&apos;t say whether it sells or shares data for ads.</dd></div>
          </dl>

          <h2 id="research" className="mt-8 scroll-mt-28 text-xl font-bold text-label-primary">
            How we rate research
          </h2>
          <p className="mt-3 text-label-secondary">
            The research level is about studies of that specific app or service, not the method it uses in
            general. Many services deliver well-proven therapy but have never been studied themselves; we say so.
            Every study we list has been checked, with a link.
          </p>
          <dl className="mt-4 space-y-2 text-label-secondary">
            <div><dt className="inline font-semibold text-label-primary">Strong research support</dt> <dd className="inline">At least two randomized controlled trials of the product, or FDA clearance based on trial data.</dd></div>
            <div><dt className="inline font-semibold text-label-primary">Some research support</dt> <dd className="inline">At least one randomized or controlled study of the product.</dd></div>
            <div><dt className="inline font-semibold text-label-primary">Limited research</dt> <dd className="inline">Published studies without a control group (before-and-after, real-world data).</dd></div>
            <div><dt className="inline font-semibold text-label-primary">Early research</dt> <dd className="inline">Built on an established method (such as CBT, licensed therapy or medication treatment), but no published study of the product itself.</dd></div>
            <div><dt className="inline font-semibold text-label-primary">Not independently studied</dt> <dd className="inline">Neither of the above.</dd></div>
          </dl>
          <p className="mt-3 text-label-secondary">
            Prices, availability and store ratings are read from the vendor&apos;s own pages and the App Store or
            Google Play, each with the date we checked. Studies funded or written by the company are noted.
          </p>

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
