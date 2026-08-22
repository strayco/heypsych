// src/app/tools/for-clinicians/page.tsx
// Clinician-focused tools landing page
// Professional software for mental health practices

import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Search,
  Stethoscope,
  FileText,
  Receipt,
  Pill,
  Building2,
  MessageSquare,
  Star,
  Monitor,
  CheckCircle,
  Clock,
  Shield,
  Users,
} from "lucide-react";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";
import { CampaignService } from "@/lib/tools/campaign-service";
import { siteConfig } from "@/lib/config/site";
import { ToolsHeroSearch } from "../_components/ToolsHeroSearch";
import { SponsoredSection } from "../_components/SponsoredSection";
import { TrustSignal } from "../_components/TrustSignal";
import { VendorCTA } from "../_components/VendorCTA";
import { HubFAQ } from "@/components/tools/hubs";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const canonicalUrl = `${siteConfig.url}/tools/for-clinicians/`;

export const metadata: Metadata = {
  title: "Mental Health Software for Clinicians | HeyPsych Tools",
  description:
    "Professional tools for psychiatrists, therapists, and mental health practices. Compare AI scribes, EHR systems, billing software, clinical decision support, and more.",
  keywords: [
    "psychiatry software",
    "mental health EHR",
    "AI scribe psychiatry",
    "therapy practice software",
    "clinical decision support",
    "mental health billing",
    "teletherapy platforms",
    "practice management software",
  ],
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "Mental Health Software for Clinicians | HeyPsych",
    description: "Professional tools for psychiatrists, therapists, and mental health practices.",
    url: canonicalUrl,
    type: "website",
  },
};

// Hub icon mapping for clinician categories
const hubIcons: Record<string, LucideIcon> = {
  "clinical-answers-evidence": Search,
  "ai-scribes-documentation": FileText,
  "billing-coding": Receipt,
  "prescribing-medication-support": Pill,
  "practice-admin-operations": Building2,
  "patient-engagement-between-visits": MessageSquare,
};

// Accent colors for variety
const hubColors: Record<string, string> = {
  "clinical-answers-evidence": "bg-blue-500/10 text-blue-600",
  "ai-scribes-documentation": "bg-purple-500/10 text-purple-600",
  "billing-coding": "bg-emerald-500/10 text-emerald-600",
  "prescribing-medication-support": "bg-orange-500/10 text-orange-600",
  "practice-admin-operations": "bg-slate-500/10 text-slate-600",
  "patient-engagement-between-visits": "bg-cyan-500/10 text-cyan-600",
};

export default async function ForCliniciansPage() {
  const landing = TaxonomyService.getClinicianLanding();
  const hubs = TaxonomyService.getAllClinicianHubs();
  const allTools = await ToolService.getAll();

  // Filter to clinician-relevant tools
  const clinicianTools = allTools.filter((t) => t.clinician?.is_clinician_relevant);

  // Get sponsored tools for clinicians
  const sponsoredTools = await CampaignService.getSponsoredTools(
    "tools-landing-featured",
    "clinician",
    undefined,
    2
  );

  // Get featured clinician tools (by rating or relevance)
  const topPicks = await ToolService.getClinicianTopPicks("for-clinicians");
  const featuredClinicianTools = topPicks.length > 0 ? topPicks : clinicianTools
    .filter((t) => t.app_rating && t.app_rating >= 4.0)
    .sort((a, b) => (b.app_rating || 0) - (a.app_rating || 0))
    .slice(0, 6);

  // Generate structured data
  const structuredData = generateClinicianLandingStructuredData(landing, hubs);

  return (
    <>
      {/* Structured Data */}
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-canvas">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-surface border-b border-separator">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment transition-colors">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">For Clinicians</span>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-treatment/10">
                <Stethoscope className="h-6 w-6 text-treatment" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-label-primary sm:text-4xl lg:text-5xl">
                  Tools for Clinicians
                </h1>
              </div>
            </div>

            {/* Direct Answer Block */}
            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                {landing.direct_answer}
              </p>
            </div>

            <p className="mt-4 max-w-2xl text-lg text-label-secondary">
              {landing.intro}
            </p>

            <p className="mt-2 text-sm text-label-tertiary">
              {clinicianTools.length} tools across {hubs.length} categories
            </p>

            {/* Search */}
            <div className="mt-8 max-w-xl">
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
            <h2 className="text-xl font-semibold text-label-primary sm:text-2xl">
              Pick what you&apos;re trying to do
            </h2>
            <p className="mt-1 text-sm text-label-secondary">
              Professional tools organized by function
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hubs.map((hub) => {
                const Icon = hubIcons[hub.slug] || Building2;
                const colorClass = hubColors[hub.slug] || "bg-gray-500/10 text-gray-600";

                return (
                  <Link
                    key={hub.slug}
                    href={hub.url}
                    className="group relative flex flex-col rounded-xl border border-separator bg-surface p-5 transition-all hover:border-treatment/30 hover:shadow-soft"
                  >
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", colorClass)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 font-semibold text-label-primary group-hover:text-treatment transition-colors">
                      {hub.display_name}
                    </h3>
                    {hub.intro && (
                      <p className="mt-1 text-sm text-label-tertiary line-clamp-2">
                        {hub.intro.slice(0, 80)}...
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-1 text-sm font-medium text-treatment opacity-0 group-hover:opacity-100 transition-opacity">
                      Browse tools
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top Picks */}
        {featuredClinicianTools.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-label-primary sm:text-2xl">
                    Top Picks for Clinicians
                  </h2>
                  <p className="mt-1 text-sm text-label-secondary">
                    Highest rated by mental health professionals
                  </p>
                </div>
                <Link
                  href="/tools/search/?audience=clinician"
                  className="group flex items-center gap-1 text-sm font-medium text-treatment hover:text-treatment-600"
                >
                  View all
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredClinicianTools.map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* What Clinicians Look For */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-xl font-semibold text-label-primary sm:text-2xl">
              Evaluating Clinical Software
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-label-secondary">
              Key considerations for mental health professionals
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-treatment/10">
                  <Shield className="h-5 w-5 text-treatment" />
                </div>
                <h3 className="mt-3 font-medium text-label-primary">HIPAA Compliance</h3>
                <p className="mt-1 text-sm text-label-secondary">
                  Required for patient data handling in clinical settings.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10">
                  <CheckCircle className="h-5 w-5 text-positive" />
                </div>
                <h3 className="mt-3 font-medium text-label-primary">EHR Integration</h3>
                <p className="mt-1 text-sm text-label-secondary">
                  Seamless workflow with your existing systems.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-3 font-medium text-label-primary">Time Savings</h3>
                <p className="mt-1 text-sm text-label-secondary">
                  Reduces administrative burden so you can focus on patients.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-caution/10">
                  <Receipt className="h-5 w-5 text-caution" />
                </div>
                <h3 className="mt-3 font-medium text-label-primary">ROI & Pricing</h3>
                <p className="mt-1 text-sm text-label-secondary">
                  Clear pricing models and demonstrable return on investment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        {landing.faqs && landing.faqs.length > 0 && (
          <HubFAQ faqs={landing.faqs} hubName="Tools for Clinicians" />
        )}

        {/* Trust Signal */}
        <TrustSignal />

        {/* CTA for Patients */}
        <section className="bg-gradient-to-br from-accent/5 to-positive/5 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-label-tertiary">
              Looking for patient-facing tools?
            </p>
            <h2 className="mt-2 text-2xl font-bold text-label-primary">
              Apps for Your Patients
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-label-secondary">
              Recommend evidence-based apps to supplement treatment.
            </p>
            <Link
              href="/tools/for-patients/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-accent-hover"
            >
              Browse Patient Apps
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Vendor CTA */}
        <VendorCTA />
      </div>
    </>
  );
}

function ClinicianToolCard({ tool }: { tool: DigitalToolV3 }) {
  return (
    <Link
      href={`/tools/${tool.slug}/`}
      className="group flex items-start gap-4 rounded-xl border border-separator bg-surface p-4 transition-all hover:border-treatment/20 hover:shadow-soft"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-treatment/5">
        <Monitor className="h-6 w-6 text-treatment/70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-label-primary group-hover:text-treatment transition-colors truncate">
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
          {tool.one_liner || tool.short_description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tool.privacy.hipaa_compliant && (
            <span className="rounded bg-treatment/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-treatment-700">
              HIPAA
            </span>
          )}
          {tool.clinician?.integrations?.includes("ehr") && (
            <span className="rounded bg-positive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-positive-700">
              EHR Integration
            </span>
          )}
          {tool.clinician?.clinician_workflows && tool.clinician.clinician_workflows.slice(0, 1).map((wf) => (
            <span
              key={wf}
              className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent"
            >
              {wf.replace(/_/g, " ")}
            </span>
          ))}
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

// Generate structured data for clinician landing
function generateClinicianLandingStructuredData(
  landing: ReturnType<typeof TaxonomyService.getClinicianLanding>,
  hubs: ReturnType<typeof TaxonomyService.getAllClinicianHubs>
): object[] {
  const schemas: object[] = [];

  // BreadcrumbList
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Tools",
        item: `${siteConfig.url}/tools/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "For Clinicians",
        item: `${siteConfig.url}/tools/for-clinicians/`,
      },
    ],
  });

  // FAQPage
  if (landing.faqs && landing.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: landing.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    });
  }

  // ItemList for hubs
  schemas.push({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Clinician Tool Categories",
    numberOfItems: hubs.length,
    itemListElement: hubs.map((hub, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: hub.display_name,
      url: `${siteConfig.url}${hub.url}`,
    })),
  });

  return schemas;
}

export const revalidate = 3600; // 1 hour
