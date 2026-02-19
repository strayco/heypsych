// src/app/tools/for-clinicians/prescribing-medication-support/page.tsx
// Prescribing & Medication Support Hub

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";
import { ClinicianHubPageContent } from "../_components/ClinicianHubPageContent";

const HUB_SLUG = "prescribing-medication-support";

export async function generateMetadata(): Promise<Metadata> {
  const hub = TaxonomyService.getClinicianHub(HUB_SLUG);
  if (!hub) return {};

  return {
    title: hub.seo_title,
    description: hub.meta_description,
    alternates: {
      canonical: `https://heypsych.com${hub.url}`,
    },
  };
}

export default async function PrescribingMedicationSupportPage() {
  const hub = TaxonomyService.getClinicianHub(HUB_SLUG);
  if (!hub) {
    notFound();
  }

  const tools = await ToolService.getByClinicianHub(HUB_SLUG);
  const topPicks = await ToolService.getClinicianTopPicks(HUB_SLUG);

  return (
    <ClinicianHubPageContent
      hub={hub}
      tools={tools}
      topPicks={topPicks}
    />
  );
}

export const revalidate = 86400;
