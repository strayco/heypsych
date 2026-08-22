// src/app/about/sponsorship-policy/page.tsx
// Sponsorship and Editorial Independence Policy

import { Metadata } from "next";
import Link from "next/link";
import { Shield, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

const canonicalUrl = `${siteConfig.url}/about/sponsorship-policy/`;

export const metadata: Metadata = {
  title: "Sponsorship & Editorial Independence Policy | HeyPsych",
  description:
    "Learn how HeyPsych maintains editorial independence from sponsorship. Our policy ensures sponsored content never influences clinical recommendations or tool evaluations.",
  alternates: {
    canonical: canonicalUrl,
  },
};

export default function SponsorshipPolicyPage() {
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
              <Shield className="h-6 w-6 text-treatment" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-label-primary">
              Sponsorship & Editorial Independence
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
          <h2 className="text-xl font-bold text-label-primary">Our Commitment</h2>
          <p className="text-label-secondary">
            HeyPsych accepts sponsorship and advertising from mental health technology
            companies. However, we maintain strict separation between commercial
            relationships and editorial content. This policy explains how we protect
            the integrity of our recommendations and evaluations.
          </p>

          <h2 className="mt-8 text-xl font-bold text-label-primary">
            What Sponsorship Cannot Influence
          </h2>
          <div className="mt-4 rounded-xl border border-negative/30 bg-negative/5 p-5">
            <ul className="space-y-3 text-label-primary">
              <li className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
                <span><strong>Listing approval or rejection.</strong> Tools are listed based on eligibility criteria, not payment.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
                <span><strong>Clinical review outcomes.</strong> Clinical assessments are conducted independently.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
                <span><strong>Privacy grades.</strong> Privacy assessments are based on objective criteria.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
                <span><strong>Evidence ratings.</strong> Evidence assessments reflect actual research, not sponsorship.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
                <span><strong>Organic search ranking.</strong> Non-sponsored tool order is based on relevance, not payment.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
                <span><strong>Editorial recommendations.</strong> Articles and guides reflect clinical judgment.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
                <span><strong>Search indexability.</strong> SEO decisions are based on content quality, not sponsorship.</span>
              </li>
            </ul>
          </div>

          <h2 className="mt-8 text-xl font-bold text-label-primary">
            What Sponsorship Provides
          </h2>
          <div className="mt-4 rounded-xl border border-positive/30 bg-positive/5 p-5">
            <ul className="space-y-3 text-label-primary">
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
                <span><strong>Labeled sponsored placements.</strong> Visibility in designated &ldquo;Sponsored&rdquo; sections.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
                <span><strong>Audience targeting.</strong> Reach clinicians, patients, or both.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
                <span><strong>Category targeting.</strong> Appear in relevant tool categories.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
                <span><strong>Performance reporting.</strong> Impression and click metrics.</span>
              </li>
            </ul>
          </div>

          <h2 className="mt-8 text-xl font-bold text-label-primary">
            Disclosure Standards
          </h2>
          <p className="text-label-secondary">
            All sponsored content is clearly labeled:
          </p>
          <ul className="mt-4 space-y-2 text-label-secondary">
            <li>- Sponsored placements display a &ldquo;Sponsored&rdquo; label</li>
            <li>- External links from sponsored content use <code>rel=&quot;sponsored&quot;</code></li>
            <li>- Sponsored sections are visually distinct from editorial content</li>
            <li>- Users can distinguish paid from organic recommendations</li>
          </ul>

          <h2 className="mt-8 text-xl font-bold text-label-primary">
            Editorial Review Process
          </h2>
          <p className="text-label-secondary">
            Our editorial team operates independently from business development:
          </p>
          <ul className="mt-4 space-y-2 text-label-secondary">
            <li>- Clinical reviewers do not know sponsorship status when evaluating tools</li>
            <li>- Editorial decisions are made before sponsorship is offered</li>
            <li>- Negative reviews cannot be removed through sponsorship</li>
            <li>- Tool rankings in organic results are algorithmically determined</li>
          </ul>

          <h2 className="mt-8 text-xl font-bold text-label-primary">
            Questions or Concerns
          </h2>
          <p className="text-label-secondary">
            If you have questions about our sponsorship practices or believe you have
            seen a violation of this policy, please contact us at{" "}
            <a href={`mailto:${siteConfig.email}`} className="text-accent hover:underline">
              {siteConfig.email}
            </a>.
          </p>
        </div>
      </section>
    </div>
  );
}
