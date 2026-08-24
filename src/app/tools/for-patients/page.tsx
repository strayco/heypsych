// src/app/tools/for-patients/page.tsx
// Patient-focused tools landing page
// Filtered view of mental health tools for consumers

import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Search, Star, Smartphone } from "lucide-react";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";
import { CampaignService } from "@/lib/tools/campaign-service";
import { siteConfig } from "@/lib/config/site";
import { ToolsHeroSearch } from "../_components/ToolsHeroSearch";
import { SponsoredSection } from "../_components/SponsoredSection";
import { TrustSignal } from "../_components/TrustSignal";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
// Slashless canonical for consistency with sitemap
const canonicalUrl = `${siteConfig.url}/tools/for-patients`;

export const metadata: Metadata = {
  title: "Mental Health Apps for Patients | HeyPsych Tools",
  description:
    "Find the right mental health app for you. Compare therapy apps, mood trackers, sleep aids, anxiety tools, and more. Free and paid options reviewed.",
  keywords: [
    "mental health apps",
    "therapy apps",
    "anxiety apps",
    "depression apps",
    "mood tracker apps",
    "sleep apps",
    "meditation apps",
    "mental wellness apps",
  ],
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "Mental Health Apps for Patients | HeyPsych",
    description: "Find the right mental health app for your needs.",
    url: canonicalUrl,
    type: "website",
  },
};

export default async function ForPatientsPage() {
  const hubs = TaxonomyService.getAllHubs();
  const allTools = await ToolService.getAll();

  // Filter to patient-relevant tools
  const patientTools = allTools.filter(
    (t) => !t.clinician?.is_clinician_relevant || t.primary_hubs.length > 0
  );

  // Get sponsored tools for patients
  const sponsoredTools = await CampaignService.getSponsoredTools(
    "tools-landing-featured",
    "patient",
    undefined,
    2
  );

  // Get featured patient tools
  const featuredPatientTools = patientTools
    .filter((t) => t.app_rating && t.app_rating >= 4.0)
    .sort((a, b) => (b.app_rating || 0) - (a.app_rating || 0))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero Section */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm">
            <Link href="/tools/" className="text-label-secondary hover:text-accent transition-colors">
              Tools
            </Link>
            <span className="text-label-quaternary">/</span>
            <span className="text-label-primary font-medium">For Patients</span>
          </nav>

          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            For Patients & Families
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-label-primary sm:text-4xl">
            Mental Health Apps
          </h1>
          <p className="mt-3 max-w-xl text-lg text-label-secondary">
            {patientTools.length} tools across {hubs.length} categories
          </p>

          {/* Search */}
          <div className="mt-8 max-w-lg">
            <Suspense fallback={<SearchFallback />}>
              <ToolsHeroSearch />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Sponsored Section (if any active) */}
      {sponsoredTools.length > 0 && (
        <SponsoredSection sponsoredTools={sponsoredTools} />
      )}

      {/* Browse by Category */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Categories
          </p>
          <h2 className="mt-1 text-xl font-semibold text-label-primary">
            Browse by Need
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hubs.map((hub) => (
              <Link
                key={hub.slug}
                href={hub.url}
                className="group flex items-center justify-between rounded-xl border border-separator bg-surface p-4 transition-all hover:border-neutral-300 hover:shadow-soft"
              >
                <div>
                  <h3 className="font-medium text-label-primary group-hover:text-accent transition-colors">
                    {hub.display_name}
                  </h3>
                  {hub.intro && (
                    <p className="mt-1 text-sm text-label-tertiary line-clamp-1">
                      {hub.intro.slice(0, 50)}...
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Tools */}
      {featuredPatientTools.length > 0 && (
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
                  Featured
                </p>
                <h2 className="mt-1 text-xl font-semibold text-label-primary">
                  Top Rated Apps
                </h2>
              </div>
              <Link
                href="/tools/search/?audience=patient"
                className="group flex items-center gap-1 text-sm font-medium text-label-primary hover:text-accent"
              >
                View all
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPatientTools.map((tool) => (
                <PatientToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* What to Look For */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Guidance
          </p>
          <h2 className="mt-1 text-xl font-semibold text-label-primary">
            Choosing the Right App
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-separator bg-surface p-5">
              <h3 className="font-medium text-label-primary">Evidence-Based</h3>
              <p className="mt-2 text-sm text-label-secondary">
                Look for apps backed by clinical research or developed with mental health professionals.
              </p>
            </div>

            <div className="rounded-xl border border-separator bg-surface p-5">
              <h3 className="font-medium text-label-primary">Privacy First</h3>
              <p className="mt-2 text-sm text-label-secondary">
                Your mental health data is sensitive. Choose apps that protect your privacy.
              </p>
            </div>

            <div className="rounded-xl border border-separator bg-surface p-5">
              <h3 className="font-medium text-label-primary">Right Fit</h3>
              <p className="mt-2 text-sm text-label-secondary">
                The best app is one you&apos;ll actually use. Try free tiers to find what works.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signal */}
      <TrustSignal />

      {/* CTA for Clinicians */}
      <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Are you a clinician?
          </p>
          <h2 className="mt-2 text-xl font-semibold text-label-primary">
            Professional Tools for Practices
          </h2>
          <p className="mx-auto mt-2 max-w-md text-label-secondary">
            AI scribes, EHRs, billing tools, and more.
          </p>
          <Link
            href="/tools/for-clinicians/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            <span className="text-white">Browse Clinician Tools</span>
            <ArrowRight className="h-4 w-4 text-white" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function PatientToolCard({ tool }: { tool: DigitalToolV3 }) {
  return (
    <Link
      href={`/tools/${tool.slug}/`}
      className="group flex items-start gap-4 rounded-xl border border-separator bg-surface p-4 transition-all hover:border-accent/20 hover:shadow-soft"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/5">
        <Smartphone className="h-6 w-6 text-accent/70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-label-primary group-hover:text-accent transition-colors truncate">
            {tool.name}
          </h3>
          {tool.app_rating && (
            <div className="flex shrink-0 items-center gap-1 text-sm text-label-secondary">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{tool.app_rating}</span>
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-label-secondary line-clamp-2">
          {tool.short_description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tool.pricing.free_tier && (
            <span className="rounded bg-positive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-positive-700">
              Free tier
            </span>
          )}
          {tool.privacy.hipaa_compliant && (
            <span className="rounded bg-treatment/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-treatment-700">
              HIPAA
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SearchFallback() {
  return (
    <div className="flex h-12 items-center justify-center rounded-xl border border-separator bg-surface px-4">
      <Search className="h-5 w-5 text-label-tertiary" />
      <span className="ml-3 text-label-tertiary">Search tools...</span>
    </div>
  );
}

export const revalidate = 3600; // 1 hour
