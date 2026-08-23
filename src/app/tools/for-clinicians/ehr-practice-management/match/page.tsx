// src/app/tools/for-clinicians/ehr-practice-management/match/page.tsx
// EHR Matcher - Help clinicians find the right EHR for their practice

import type { Metadata } from "next";
import { EHRMatcherClient } from "@/components/tools/clinician/EHRMatcherClient";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { siteConfig } from "@/lib/config/site";

const canonicalUrl = `${siteConfig.url}/tools/for-clinicians/ehr-practice-management/match/`;

export const metadata: Metadata = {
  title: "EHR Finder for Mental Health Practices | HeyPsych",
  description:
    "Answer a few questions to find EHR and practice management software options for your mental health practice. Compare features, pricing, and compliance.",
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "EHR Finder for Mental Health Practices",
    description:
      "Answer a few questions to find EHR options for your mental health practice.",
    type: "website",
    url: canonicalUrl,
  },
};

export default async function EHRMatcherPage() {
  // Load publishable EHR tools
  const tools = await ClinicianToolService.getByCategory("ehr-practice-management");

  // Serialize for client component
  const serializedTools = tools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    short_description: tool.short_description || "",
    one_liner: tool.one_liner || "",
    website_url: tool.website_url || "",
    logo_url: tool.logo_url || "",
    primary_category: tool.primary_category,
    audiences: tool.audiences,
    feature_flags: tool.feature_flags,
    capabilities: tool.capabilities,
    pricing: tool.pricing || null,
    compliance: tool.compliance,
    company_info: tool.company_name ? { company_name: tool.company_name } : undefined,
  }));

  return (
    <div className="min-h-screen bg-canvas">
      <EHRMatcherClient tools={serializedTools} />
    </div>
  );
}
