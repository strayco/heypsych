// src/app/tools/page.tsx
// Premium Tools Discovery Hub - /tools/
// Apple-inspired, audience-first experience

import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Search } from "lucide-react";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";
import { CampaignService, type SponsoredTool } from "@/lib/tools/campaign-service";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { siteConfig } from "@/lib/config/site";
import { ToolsHeroSearch } from "./_components/ToolsHeroSearch";
import { AudienceSelector } from "./_components/AudienceSelector";
import { CategoryGrid } from "./_components/CategoryGrid";
import { SponsoredSection } from "./_components/SponsoredSection";
import { TrustSignal } from "./_components/TrustSignal";
import { VendorCTA } from "./_components/VendorCTA";
import { FeaturedTools } from "./_components/FeaturedTools";

// Slashless canonical for consistency with sitemap
const canonicalUrl = `${siteConfig.url}/tools`;

export const metadata: Metadata = {
  title: "Mental Health Tools & Apps",
  description:
    "Discover evidence-based mental health apps and tools. Compare therapy platforms, AI scribes, mood trackers, and clinical software. For patients and clinicians.",
  keywords: [
    "mental health apps",
    "therapy apps",
    "mental health tools",
    "online therapy",
    "psychiatry tools",
    "clinical software",
    "mental health directory",
  ],
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "Mental Health Tools & Apps",
    description:
      "Discover evidence-based mental health apps and tools for patients and clinicians.",
    url: canonicalUrl,
    type: "website",
  },
};

export default async function ToolsDirectoryPage() {
  const patientHubs = TaxonomyService.getAllHubs();
  const allTools = await ToolService.getAll();
  const featuredTools = await ToolService.getFeatured(9);

  // Get V4 clinician tools count (for audience selector)
  const v4ClinicianTools = await ClinicianToolService.loadClinicianTools();

  // Get sponsored tools for landing page (if any active campaigns)
  const sponsoredTools = await CampaignService.getSponsoredTools(
    "tools-landing-featured",
    "all",
    undefined,
    3
  );

  const toolCount = allTools.length + v4ClinicianTools.length;
  const clinicianCount = v4ClinicianTools.length;
  const patientCount = allTools.filter((t) => !t.clinician?.is_clinician_relevant || t.primary_hubs.length > 0).length;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero Section */}
      <section className="border-b border-separator bg-surface px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-label-primary sm:text-4xl md:text-5xl">
            Mental Health Tools
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-label-secondary">
            {toolCount} apps and software for patients and clinicians.
          </p>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-lg">
            <Suspense fallback={<SearchFallback />}>
              <ToolsHeroSearch />
            </Suspense>
          </div>

          {/* Audience Selection */}
          <div className="mt-10">
            <AudienceSelector
              patientCount={patientCount}
              clinicianCount={clinicianCount}
            />
          </div>
        </div>
      </section>

      {/* Sponsored Section (if any active) */}
      {sponsoredTools.length > 0 && (
        <SponsoredSection sponsoredTools={sponsoredTools} />
      )}

      {/* Popular Patient Tools - Primary CTA */}
      {featuredTools.length > 0 && (
        <FeaturedTools tools={featuredTools} />
      )}

      {/* Browse by Category */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
                Browse by Category
              </p>
              <h2 className="mt-1 text-xl font-semibold text-label-primary">
                Find Tools for Your Needs
              </h2>
            </div>
            <Link
              href="/tools/for-patients/"
              className="group flex items-center gap-1 text-sm font-medium text-label-primary hover:text-accent"
            >
              All categories
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <CategoryGrid
            categories={patientHubs.slice(0, 8)}
            variant="patient"
            className="mt-6"
          />
        </div>
      </section>

      {/* Trust Signal */}
      <TrustSignal />

      {/* Vendor CTA */}
      <VendorCTA />
    </div>
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
