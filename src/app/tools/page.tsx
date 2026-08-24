// src/app/tools/page.tsx
// Premium Tools Discovery Hub - /tools/
// Apple-inspired, audience-first experience

import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Search,
  Stethoscope,
  Users,
  Shield,
  Sparkles,
  ExternalLink,
} from "lucide-react";
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
  title: "Mental Health Tools & Apps | HeyPsych",
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
    title: "Mental Health Tools & Apps | HeyPsych",
    description:
      "Discover evidence-based mental health apps and tools for patients and clinicians.",
    url: canonicalUrl,
    type: "website",
  },
};

export default async function ToolsDirectoryPage() {
  const patientHubs = TaxonomyService.getAllHubs();
  const allTools = await ToolService.getAll();
  const featuredTools = await ToolService.getFeatured(6);

  // Get V4 clinician tools (publication-gated)
  const v4ClinicianTools = await ClinicianToolService.loadClinicianTools();
  const v4CategoryCounts = await ClinicianToolService.getCategoryCounts();

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
      <section className="relative overflow-hidden bg-surface border-b border-separator">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] via-transparent to-treatment/[0.02]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-label-primary sm:text-5xl lg:text-6xl">
              Mental Health Tools
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-label-secondary sm:text-xl">
              Discover the right tools for your mental health journey.
              Evidence-based apps and software for patients and clinicians.
            </p>
            <p className="mt-2 text-sm text-label-tertiary">
              {toolCount} tools reviewed across patient and clinician categories
            </p>
          </div>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-xl">
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

      {/* For Patients Section */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-label-primary sm:text-2xl">
                  For Patients
                </h2>
                <p className="text-sm text-label-secondary">
                  Apps and platforms for your mental health
                </p>
              </div>
            </div>
            <Link
              href="/tools/for-patients/"
              className="group flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
            >
              Browse all
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

      {/* For Clinicians Section - V4 Tools */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-treatment/10">
                <Stethoscope className="h-5 w-5 text-treatment" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-label-primary sm:text-2xl">
                  For Clinicians
                </h2>
                <p className="text-sm text-label-secondary">
                  {clinicianCount} professional tools for mental health practices
                </p>
              </div>
            </div>
            <Link
              href="/tools/for-clinicians/"
              className="group flex items-center gap-1 text-sm font-medium text-treatment hover:text-treatment-600"
            >
              Browse all
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* EHR Matcher CTA */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-treatment/20 bg-treatment/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-treatment/10">
                <Sparkles className="h-5 w-5 text-treatment" />
              </div>
              <div>
                <p className="font-medium text-label-primary">
                  Find Your EHR Match
                </p>
                <p className="text-sm text-label-secondary">
                  Answer 7 questions to find the best EHR for your practice
                </p>
              </div>
            </div>
            <Link
              href="/tools/for-clinicians/ehr-practice-management/match/"
              className="group flex items-center justify-center gap-2 rounded-lg bg-treatment px-4 py-2 text-sm font-medium text-white transition-all hover:bg-treatment-600"
            >
              Start Matching
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* V4 Category Cards (only categories with inventory) */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {v4CategoryCounts.filter(c => c.count > 0).map((category) => (
              <Link
                key={category.slug}
                href={`/tools/for-clinicians/${category.slug}/`}
                className="group rounded-xl border border-separator bg-surface p-4 transition-all hover:border-treatment/30 hover:shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-label-primary group-hover:text-treatment">
                    {category.display_name}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-label-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-treatment" />
                </div>
                <p className="mt-1 text-sm text-label-tertiary">
                  {category.count} tools
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tools (Editorial Picks) */}
      {featuredTools.length > 0 && (
        <FeaturedTools tools={featuredTools} />
      )}

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
