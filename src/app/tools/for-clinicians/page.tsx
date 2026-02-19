// src/app/tools/for-clinicians/page.tsx
// Clinician Landing Page - /tools/for-clinicians/

import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield, Search, FileText, Receipt, Pill, Building2, Users, Stethoscope } from "lucide-react";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";
import { HubFAQ } from "@/components/tools/hubs";

export const metadata: Metadata = {
  title: "Best Digital Tools for Mental Health Clinicians 2026 | HeyPsych",
  description: "Evidence-based tools for mental health clinicians: AI scribes, clinical decision support, billing tools, EHRs, and patient engagement platforms reviewed by our medical board.",
  keywords: [
    "mental health clinician tools",
    "AI scribe for therapists",
    "clinical decision support",
    "EHR for mental health",
    "billing tools for therapists",
    "psychiatrist tools",
    "therapy practice management",
  ],
  alternates: {
    canonical: "https://heypsych.com/tools/for-clinicians/",
  },
};

// Hub icons mapping
const clinicianHubIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "clinical-answers-evidence": Search,
  "ai-scribes-documentation": FileText,
  "billing-coding": Receipt,
  "prescribing-medication-support": Pill,
  "practice-admin-operations": Building2,
  "patient-engagement-between-visits": Users,
};

// Hub colors
const clinicianHubColors: Record<string, string> = {
  "clinical-answers-evidence": "from-blue-500 to-indigo-600",
  "ai-scribes-documentation": "from-purple-500 to-violet-600",
  "billing-coding": "from-green-500 to-emerald-600",
  "prescribing-medication-support": "from-red-500 to-rose-600",
  "practice-admin-operations": "from-slate-500 to-gray-600",
  "patient-engagement-between-visits": "from-teal-500 to-cyan-600",
};

export default async function ClinicianLandingPage() {
  const landing = TaxonomyService.getClinicianLanding();
  const clinicianHubs = TaxonomyService.getAllClinicianHubs();
  const topPicks = await ToolService.getClinicianTopPicks("for-clinicians");

  // Generate structured data
  const structuredData = generateClinicianLandingStructuredData(landing, clinicianHubs);

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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Hero */}
        <section className="px-4 py-12 sm:px-6 lg:px-8 border-b border-neutral-200">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                For Clinicians
              </span>
            </div>

            <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {landing.display_name}
              </span>
            </h1>

            {/* Direct Answer */}
            <div className="mt-6 bg-white rounded-lg p-5 border border-blue-200 shadow-sm">
              <p className="text-lg text-neutral-700 leading-relaxed">
                {landing.direct_answer}
              </p>
            </div>

            {/* Intro */}
            <p className="mt-4 text-lg text-neutral-600">
              {landing.intro}
            </p>
          </div>
        </section>

        {/* Pick What You're Trying to Do */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              Pick what you&apos;re trying to do
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clinicianHubs.map((hub) => {
                const Icon = clinicianHubIcons[hub.slug] || Search;
                const gradient = clinicianHubColors[hub.slug] || "from-gray-500 to-gray-600";

                return (
                  <Link
                    key={hub.slug}
                    href={hub.url}
                    className="group relative overflow-hidden rounded-xl bg-white border border-neutral-200 p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${gradient} text-white mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                      {hub.display_name}
                    </h3>

                    <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                      {hub.intro.slice(0, 120)}...
                    </p>

                    <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium">
                      Browse tools
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top Picks for Clinicians */}
        {topPicks.length > 0 && (
          <section className="px-4 pb-12 sm:px-6 lg:px-8 bg-white border-y border-neutral-200">
            <div className="mx-auto max-w-6xl py-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                Top Picks for Clinicians
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topPicks.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}/`}
                    className="group flex flex-col p-5 rounded-lg border border-neutral-200 bg-white hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600 line-clamp-2 flex-1">
                      {tool.one_liner}
                    </p>

                    {/* Clinician workflows */}
                    {tool.clinician?.clinician_workflows && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tool.clinician.clinician_workflows.slice(0, 2).map((wf) => (
                          <span
                            key={wf}
                            className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded"
                          >
                            {wf.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 text-sm text-blue-600 font-medium">
                      View details →
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <HubFAQ faqs={landing.faqs} hubName="Tools for Clinicians" />

        {/* Trust Signal */}
        <section className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
              <Shield className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                All tools reviewed by the{" "}
                <Link href="/about/medical-review-board" className="underline hover:no-underline">
                  HeyPsych Medical Board
                </Link>
              </span>
            </div>
          </div>
        </section>

        {/* Back to Tools Directory */}
        <section className="px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Link
              href="/tools/"
              className="text-sm text-neutral-600 hover:text-blue-600 transition-colors"
            >
              ← Back to Tools Directory
            </Link>
          </div>
        </section>
      </div>
    </>
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
        item: "https://heypsych.com/tools/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "For Clinicians",
        item: "https://heypsych.com/tools/for-clinicians/",
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
      url: `https://heypsych.com${hub.url}`,
    })),
  });

  return schemas;
}

export const revalidate = 86400; // 24 hours
