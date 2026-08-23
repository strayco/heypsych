// src/app/tools/for-clinicians/page.tsx
// Clinician-focused tools landing page with V4 categories
// Professional software for mental health practices

import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Search,
  Stethoscope,
  Shield,
  CheckCircle,
  Clock,
  Receipt,
  Laptop,
  Mic,
  Video,
  LineChart,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ToolsHeroSearch } from "../_components/ToolsHeroSearch";
import { TrustSignal } from "../_components/TrustSignal";
import { VendorCTA } from "../_components/VendorCTA";
import { HubFAQ } from "@/components/tools/hubs";
import {
  CategoryGrid,
  BuyerIntentRouter,
  ClinicianToolCard,
} from "@/components/tools/clinician";
import {
  ClinicianToolService,
  type ClinicianToolV4,
} from "@/lib/tools/clinician-tool-service";
import clinicianCategoriesData from "../../../../data/tools-v4/taxonomies/clinician-categories.json";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// Slashless canonical for consistency with sitemap
const canonicalUrl = `${siteConfig.url}/tools/for-clinicians`;

export const metadata: Metadata = {
  title: clinicianCategoriesData.landing_page.seo_title,
  description: clinicianCategoriesData.landing_page.meta_description,
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
    description:
      "Professional tools for psychiatrists, therapists, and mental health practices.",
    url: canonicalUrl,
    type: "website",
  },
};

// V4 category icon mapping
const categoryIcons: Record<string, LucideIcon> = {
  "ehr-practice-management": Laptop,
  "ai-scribe-documentation": Mic,
  "billing-rcm": Receipt,
  "telehealth-communication": Video,
  "measurement-outcomes": LineChart,
};

// V4 category color mapping
const categoryColors: Record<string, string> = {
  "ehr-practice-management": "bg-blue-500/10 text-blue-600",
  "ai-scribe-documentation": "bg-purple-500/10 text-purple-600",
  "billing-rcm": "bg-emerald-500/10 text-emerald-600",
  "telehealth-communication": "bg-cyan-500/10 text-cyan-600",
  "measurement-outcomes": "bg-emerald-500/10 text-emerald-600",
};

export default async function ForCliniciansPage() {
  // Load V4 tools
  const allV4Tools = await ClinicianToolService.loadClinicianTools();
  const categoryCounts = await ClinicianToolService.getCategoryCounts();
  const featuredTools = await ClinicianToolService.getFeatured(6);

  // Get landing page content from V4 taxonomy
  const landingPage = clinicianCategoriesData.landing_page;
  const v4Categories = clinicianCategoriesData.categories;

  // Map categories with counts - only include categories with tools (Mission 3: truthful directory)
  const categoriesWithCounts = v4Categories
    .map((cat) => {
      const countData = categoryCounts.find((c) => c.slug === cat.slug);
      return {
        slug: cat.slug,
        display_name: cat.display_name,
        short_name: cat.short_name,
        url: cat.url,
        count: countData?.count || 0,
        intro: cat.intro,
      };
    })
    .filter((cat) => cat.count > 0); // Only show categories with inventory

  // Generate structured data
  const structuredData = generateClinicianLandingStructuredData(
    landingPage,
    v4Categories
  );

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
              <Link
                href="/tools/"
                className="text-label-secondary hover:text-treatment transition-colors"
              >
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">
                For Clinicians
              </span>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-treatment/10">
                <Stethoscope className="h-6 w-6 text-treatment" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-label-primary sm:text-4xl lg:text-5xl">
                  {landingPage.display_name}
                </h1>
              </div>
            </div>

            {/* Direct Answer Block */}
            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                {landingPage.direct_answer}
              </p>
            </div>

            <p className="mt-4 max-w-2xl text-lg text-label-secondary">
              {landingPage.intro}
            </p>

            <p className="mt-2 text-sm text-label-tertiary">
              {allV4Tools.length} tools across {categoriesWithCounts.length} categories
            </p>

            {/* Search */}
            <div className="mt-8 max-w-xl">
              <Suspense fallback={<SearchFallback />}>
                <ToolsHeroSearch />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Buyer Intent Router */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary sm:text-2xl">
              Find the right tools for you
            </h2>
            <p className="mt-1 text-sm text-label-secondary">
              Tell us about your practice and needs
            </p>

            <div className="mt-6">
              <Suspense fallback={<div className="h-48 animate-pulse bg-surface rounded-xl" />}>
                <BuyerIntentRouter />
              </Suspense>
            </div>

            {/* EHR Matcher CTA */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-treatment/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-label-primary">
                    Looking for an EHR?
                  </p>
                  <p className="text-sm text-label-secondary">
                    Answer 7 questions to find your perfect match
                  </p>
                </div>
              </div>
              <Link
                href="/tools/for-clinicians/ehr-practice-management/match/"
                className="group flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover"
              >
                Find My EHR
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Browse by Category */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-label-primary sm:text-2xl">
                  Browse by Category
                </h2>
                <p className="mt-1 text-sm text-label-secondary">
                  {categoriesWithCounts.length} categories of professional tools
                </p>
              </div>
              <Link
                href="/tools/search/?audience=clinician"
                className="group flex items-center gap-1 text-sm font-medium text-treatment hover:text-treatment-600"
              >
                View all tools
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-6">
              <CategoryGrid categories={categoriesWithCounts} />
            </div>
          </div>
        </section>

        {/* Featured / Top Picks */}
        {featuredTools.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-label-primary sm:text-2xl">
                    Featured Tools
                  </h2>
                  <p className="mt-1 text-sm text-label-secondary">
                    {/* P0 FIX: Removed "highly rated" claim - no ratings data exists */}
                    Popular tools for mental health practices
                  </p>
                </div>
                <Link
                  href="/tools/search/?audience=clinician&featured=true"
                  className="group flex items-center gap-1 text-sm font-medium text-treatment hover:text-treatment-600"
                >
                  View all
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredTools.map((tool) => (
                  <ClinicianToolCard
                    key={tool.slug}
                    tool={tool}
                    showCategory
                    variant="featured"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Popular Categories with Tools - only show categories that have tools */}
        {categoriesWithCounts.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary sm:text-2xl">
                Popular Categories
              </h2>
              <p className="mt-1 text-sm text-label-secondary">
                Browse tools by category
              </p>

              <div className="mt-6 space-y-10">
                {/* Only show categories with tools (up to 3) */}
                {categoriesWithCounts.slice(0, 3).map((cat) => {
                  const categoryData = v4Categories.find((c) => c.slug === cat.slug);
                  if (!categoryData) return null;
                  return (
                    <CategoryPreview
                      key={cat.slug}
                      category={categoryData}
                      tools={allV4Tools.filter(
                        (t) => t.primary_category === cat.slug
                      )}
                    />
                  );
                })}
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
                <h3 className="mt-3 font-medium text-label-primary">
                  HIPAA Compliance
                </h3>
                <p className="mt-1 text-sm text-label-secondary">
                  Required for patient data handling in clinical settings.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10">
                  <CheckCircle className="h-5 w-5 text-positive" />
                </div>
                <h3 className="mt-3 font-medium text-label-primary">
                  EHR Integration
                </h3>
                <p className="mt-1 text-sm text-label-secondary">
                  Seamless workflow with your existing systems.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-3 font-medium text-label-primary">
                  Time Savings
                </h3>
                <p className="mt-1 text-sm text-label-secondary">
                  Reduces administrative burden so you can focus on patients.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-caution/10">
                  <Receipt className="h-5 w-5 text-caution" />
                </div>
                <h3 className="mt-3 font-medium text-label-primary">
                  ROI & Pricing
                </h3>
                <p className="mt-1 text-sm text-label-secondary">
                  Clear pricing models and demonstrable return on investment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <HubFAQ
          faqs={[
            {
              q: "What tools do solo therapists need most?",
              a: "Solo therapists typically benefit most from an integrated EHR/practice management platform like SimplePractice or TherapyNotes, which handles scheduling, notes, billing, and telehealth in one system. AI scribes are increasingly popular for reducing documentation time. The key is avoiding tool sprawl by choosing platforms that handle multiple functions.",
            },
            {
              q: "How do AI scribes work for therapy sessions?",
              a: "AI scribes use ambient listening (with patient consent) to record and transcribe your sessions. The AI then analyzes the conversation, identifies clinically relevant information, and generates a structured note in your preferred format (SOAP, DAP, etc.). Most clinicians report saving 1-2 hours daily on documentation.",
            },
            {
              q: "Are these tools HIPAA compliant?",
              a: "Many tools in our directory claim HIPAA compliance, but we do not independently verify these claims. Compliance status varies: some tools have confirmed HIPAA support, others are unknown. Always verify directly with vendors, obtain a signed BAA, and conduct your own security review before implementing any tool with patient data. Look for the HIPAA badge on tool listings to identify confirmed compliant options.",
            },
            {
              q: "How should I evaluate tools for my practice?",
              a: "Start with your biggest pain point (documentation, billing, scheduling). Research 3-4 options in that category, request demos, and trial each with real workflows. Consider: total cost of ownership, integration with existing tools, learning curve, and vendor stability. Ask colleagues what they use and read recent reviews.",
            },
            {
              q: "What's the difference between practice management and EHR?",
              a: "Practice management handles administrative functions: scheduling, billing, payments, and patient communication. EHR (Electronic Health Record) focuses on clinical documentation: notes, treatment plans, and medical history. Many mental health platforms combine both, but some clinicians use separate specialized tools for each function.",
            },
            {
              q: "Do I need separate telehealth software?",
              a: "Most modern EHR platforms include HIPAA-compliant telehealth. Standalone telehealth (like Doxy.me or Zoom for Healthcare) is useful if your EHR's video quality is poor, you need specific features like virtual waiting rooms, or you want to keep telehealth separate from your main system.",
            },
          ]}
          hubName="Clinician Tools"
        />

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

// Category preview component
function CategoryPreview({
  category,
  tools,
}: {
  category: (typeof clinicianCategoriesData.categories)[0];
  tools: ClinicianToolV4[];
}) {
  const Icon = categoryIcons[category.slug] || Laptop;
  const colorClass = categoryColors[category.slug] || "bg-gray-500/10 text-gray-600";
  const displayTools = tools.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              colorClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-label-primary">
              {category.display_name}
            </h3>
            <p className="text-sm text-label-tertiary">
              {tools.length} tools
            </p>
          </div>
        </div>
        <Link
          href={category.url}
          className="group flex items-center gap-1 text-sm font-medium text-treatment hover:text-treatment-600"
        >
          View all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {displayTools.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {displayTools.map((tool) => (
            <ClinicianToolCard key={tool.slug} tool={tool} variant="compact" />
          ))}
        </div>
      ) : (
        <p className="text-sm text-label-tertiary italic">
          No tools in this category yet
        </p>
      )}
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

// Generate structured data for clinician landing
function generateClinicianLandingStructuredData(
  landing: typeof clinicianCategoriesData.landing_page,
  categories: typeof clinicianCategoriesData.categories
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

  // ItemList for categories
  schemas.push({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Clinician Tool Categories",
    numberOfItems: categories.length,
    itemListElement: categories.map((cat, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: cat.display_name,
      url: `${siteConfig.url}${cat.url}`,
    })),
  });

  // WebPage
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: landing.seo_title,
    description: landing.meta_description,
    url: `${siteConfig.url}/tools/for-clinicians/`,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    about: {
      "@type": "Thing",
      name: "Mental Health Software",
      description: "Professional tools for mental health clinicians",
    },
  });

  return schemas;
}

export const revalidate = 3600; // 1 hour
