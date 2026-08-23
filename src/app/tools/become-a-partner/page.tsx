// src/app/tools/become-a-partner/page.tsx
// Partner/sponsorship page - explains sponsored placement options

import { Metadata } from "next";
import Link from "next/link";
import {
  Star,
  Users,
  Target,
  BarChart,
  Shield,
  Mail,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";

// Slashless canonical for consistency with sitemap
const canonicalUrl = `${siteConfig.url}/tools/become-a-partner`;

export const metadata: Metadata = {
  title: "Become a Partner | HeyPsych Tools Directory",
  description:
    "Partner with HeyPsych to reach mental health professionals and patients. Learn about sponsored placements, audience targeting, and our editorial independence commitment.",
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "Become a Partner | HeyPsych",
    description: "Partner with HeyPsych to reach mental health professionals and patients.",
    url: canonicalUrl,
    type: "website",
  },
};

export default function BecomeAPartnerPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-label-primary sm:text-4xl lg:text-5xl">
            Partner with HeyPsych
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-label-secondary">
            Reach mental health clinicians and patients through sponsored placements
            in our trusted tools directory.
          </p>
        </div>
      </section>

      {/* Why Partner */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-label-primary">Why Partner with HeyPsych</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-separator bg-surface p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-3 font-semibold text-label-primary">Targeted Audience</h3>
              <p className="mt-1 text-sm text-label-secondary">
                Reach psychiatrists, therapists, and individuals actively seeking mental health tools.
              </p>
            </div>

            <div className="rounded-xl border border-separator bg-surface p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-treatment/10">
                <Target className="h-5 w-5 text-treatment" />
              </div>
              <h3 className="mt-3 font-semibold text-label-primary">Intent-Based Discovery</h3>
              <p className="mt-1 text-sm text-label-secondary">
                Users arrive with specific needs, ready to evaluate and adopt solutions.
              </p>
            </div>

            <div className="rounded-xl border border-separator bg-surface p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10">
                <Shield className="h-5 w-5 text-positive" />
              </div>
              <h3 className="mt-3 font-semibold text-label-primary">Trusted Context</h3>
              <p className="mt-1 text-sm text-label-secondary">
                Your product appears alongside verified information in a clinical-grade directory.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Placement Options */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-label-primary">Sponsored Placement Options</h2>
          <p className="mt-2 text-label-secondary">
            All sponsored placements are clearly labeled as &ldquo;Sponsored&rdquo; for transparency.
          </p>

          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-separator bg-canvas p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <Star className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-label-primary">Featured Placement</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Prominent visibility on the tools landing page and relevant category pages.
                    Ideal for brand awareness and high-intent discovery.
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-label-tertiary">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-positive" />
                      <span>Tools directory homepage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-positive" />
                      <span>Audience landing pages (clinicians/patients)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-positive" />
                      <span>Category hub pages</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-separator bg-canvas p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-treatment/10">
                  <Target className="h-6 w-6 text-treatment" />
                </div>
                <div>
                  <h3 className="font-semibold text-label-primary">Category Sponsorship</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Targeted visibility within specific tool categories relevant to your product.
                    Best for reaching users with specific needs.
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-label-tertiary">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-positive" />
                      <span>Specific hub pages (e.g., AI Scribes, Sleep Apps)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-positive" />
                      <span>Targeted to patient or clinician audiences</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-separator bg-canvas p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-positive/10">
                  <BarChart className="h-6 w-6 text-positive" />
                </div>
                <div>
                  <h3 className="font-semibold text-label-primary">Search Results</h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Appear in sponsored positions within search results for relevant queries.
                    Connect with users actively searching for solutions.
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-label-tertiary">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-positive" />
                      <span>High-intent user traffic</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-positive" />
                      <span>Category and workflow targeting</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Targeting */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-label-primary">Audience Targeting</h2>
          <p className="mt-2 text-label-secondary">
            Reach the right users based on audience type and product category.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-separator bg-surface p-5">
              <h3 className="font-semibold text-label-primary">By Audience</h3>
              <ul className="mt-3 space-y-2 text-sm text-label-secondary">
                <li>- Clinicians (psychiatrists, therapists, counselors)</li>
                <li>- Patients and consumers</li>
                <li>- All audiences</li>
              </ul>
            </div>

            <div className="rounded-xl border border-separator bg-surface p-5">
              <h3 className="font-semibold text-label-primary">By Category</h3>
              <ul className="mt-3 space-y-2 text-sm text-label-secondary">
                <li>- Patient hubs (Sleep, Anxiety, Depression, etc.)</li>
                <li>- Clinician hubs (AI Scribes, Billing, EHR, etc.)</li>
                <li>- Specific tool types and workflows</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Independence */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-label-primary">Editorial Independence</h2>
          <div className="mt-4 rounded-xl border border-negative/30 bg-negative/5 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
              <div>
                <p className="font-medium text-label-primary">
                  Sponsorship Never Influences:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-label-secondary">
                  <li>- Editorial approval or listing decisions</li>
                  <li>- Clinical review outcomes or ratings</li>
                  <li>- Privacy grades or evidence assessments</li>
                  <li>- Organic search ranking or recommendations</li>
                  <li>- Tool comparisons or editorial content</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-positive/30 bg-positive/5 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
              <div>
                <p className="font-medium text-label-primary">
                  What Sponsorship Provides:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-label-secondary">
                  <li>- Clearly labeled sponsored visibility</li>
                  <li>- Placement in designated sponsored sections</li>
                  <li>- Audience and category targeting</li>
                  <li>- Impression and click reporting</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-label-tertiary">
            Read our complete{" "}
            <Link href="/about/sponsorship-policy/" className="text-accent hover:underline">
              sponsorship and editorial independence policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-treatment/5 to-accent/5 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-label-primary">Interested in Partnership?</h2>
          <p className="mt-2 text-label-secondary">
            Contact us to discuss sponsorship options and pricing.
          </p>
          <a
            href={`mailto:${siteConfig.email}?subject=Partnership%20Inquiry`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-treatment px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-treatment-hover"
          >
            <Mail className="h-5 w-5" />
            Contact for Partnership
          </a>
          <p className="mt-4 text-sm text-label-tertiary">
            Just want a basic listing?{" "}
            <Link href="/tools/list-your-tool/" className="text-accent hover:underline">
              Learn about free listings
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
