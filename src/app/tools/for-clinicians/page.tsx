// src/app/tools/for-clinicians/page.tsx
// Clinician-focused tools landing page with V4 categories
// Professional software for mental health practices

import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/config/site";
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
import { stripBrandTitleSuffix } from "@/lib/seo/title";

// Slashless canonical for consistency with sitemap
const canonicalUrl = `${siteConfig.url}/tools/for-clinicians`;

export const metadata: Metadata = {
  // Authored with a trailing "| HeyPsych"; the layout template appends it too.
  title: stripBrandTitleSuffix(clinicianCategoriesData.landing_page.seo_title),
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
    title: "Mental Health Software for Clinicians",
    description:
      "Professional tools for psychiatrists, therapists, and mental health practices.",
    url: canonicalUrl,
    type: "website",
  },
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
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link
                href="/tools/"
                className="text-label-secondary hover:text-accent transition-colors"
              >
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">
                For Clinicians
              </span>
            </nav>

            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              For Mental Health Clinicians
            </p>

            {/* Title row with Architect CTA */}
            <div className="mt-2 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-label-primary sm:text-4xl">
                  Practice Software
                </h1>
                <p className="mt-1 text-label-tertiary">
                  {allV4Tools.length} tools across {categoriesWithCounts.length} categories
                </p>
              </div>

              <Link
                href="/architect?source=for-clinicians"
                className="group flex flex-col items-start rounded-xl border-2 border-treatment bg-treatment px-5 py-4 shadow-md transition-all hover:bg-treatment-600 hover:shadow-lg sm:items-end"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-white">Practice Architect™</span>
                  <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-1" />
                </div>
                <span className="mt-1 text-sm text-neutral-300">Build your ideal tech stack</span>
              </Link>
            </div>

            <p className="mt-4 max-w-2xl text-lg text-label-secondary">
              Compare EHRs, AI scribes, billing platforms, and telehealth tools with transparent pricing and fit scores for your practice.
            </p>
          </div>
        </section>

        {/* Buyer Intent Router */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              Get Started
            </p>
            <h2 className="mt-1 text-xl font-semibold text-label-primary">
              Find the Right Tools
            </h2>

            <div className="mt-6">
              <Suspense fallback={<div className="h-48 animate-pulse bg-surface rounded-xl" />}>
                <BuyerIntentRouter />
              </Suspense>
            </div>

            {/* EHR Matcher CTA */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-separator bg-surface p-5">
              <div>
                <p className="font-medium text-label-primary">Looking for an EHR?</p>
                <p className="text-sm text-label-secondary">
                  Answer 7 questions to find your perfect match
                </p>
              </div>
              <Link
                href="/tools/for-clinicians/ehr-practice-management/match/"
                className="group flex items-center justify-center gap-2 rounded-lg bg-treatment px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-treatment-600"
              >
                <span className="text-white">Find My EHR</span>
                <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Browse by Category */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              Categories
            </p>
            <h2 className="mt-1 text-xl font-semibold text-label-primary">
              Browse by Type
            </h2>

            <div className="mt-6">
              <CategoryGrid categories={categoriesWithCounts} />
            </div>
          </div>
        </section>

        {/* Featured / Top Picks */}
        {featuredTools.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
                Featured
              </p>
              <h2 className="mt-1 text-xl font-semibold text-label-primary">
                Popular Tools
              </h2>

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

        {/* What Clinicians Look For */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              Guidance
            </p>
            <h2 className="mt-1 text-xl font-semibold text-label-primary">
              Evaluating Software
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-separator bg-surface p-5">
                <h3 className="font-medium text-label-primary">HIPAA Compliance</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Required for patient data handling in clinical settings.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <h3 className="font-medium text-label-primary">EHR Integration</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Seamless workflow with your existing systems.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <h3 className="font-medium text-label-primary">Time Savings</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Reduces administrative burden so you can focus on patients.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <h3 className="font-medium text-label-primary">ROI & Pricing</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Clear pricing and demonstrable return on investment.
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
        <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              Looking for patient-facing tools?
            </p>
            <h2 className="mt-2 text-xl font-semibold text-label-primary">
              Apps for Your Patients
            </h2>
            <p className="mx-auto mt-2 max-w-md text-label-secondary">
              Recommend evidence-based apps to supplement treatment.
            </p>
            <Link
              href="/tools/for-patients/"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-treatment px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-treatment-600"
            >
              <span className="text-white">Browse Patient Apps</span>
              <ArrowRight className="h-4 w-4 text-white" />
            </Link>
          </div>
        </section>

        {/* Vendor CTA */}
        <VendorCTA />
      </div>
    </>
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
