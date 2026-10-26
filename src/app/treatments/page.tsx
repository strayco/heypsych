import { Metadata } from "next";
import Link from "next/link";
import { loadTreatmentHub } from "@/domains/hubs/treatment-hub";
import { PageIntro } from "@/components/brand/PageIntro";
import { HubBrowser } from "@/components/hubs/HubBrowser";
import { buildGroups, topFacets } from "@/domains/hubs/model";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Pre-fetches all treatments on the server for instant page load
 * Includes complete SEO metadata for treatments hub page
 */

// Generate SEO metadata for treatments hub page
export const metadata: Metadata = {
  title: "Mental Health Treatments | Medications, Therapy & Evidence-Based Options",
  description:
    "Explore evidence-based mental health treatments including medications, psychotherapy, interventional treatments, and alternative approaches. Find the right treatment option.",
  keywords:
    "mental health treatment, psychiatric medication, psychotherapy, therapy types, antidepressants, mood stabilizers, CBT, DBT, EMDR, TMS, ketamine therapy",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments`,
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "Mental Health Treatments",
    description:
      "Evidence-based mental health treatments: medications, psychotherapy, interventional options, and alternative approaches.",
    url: `${SITE_CONFIG.url}/treatments`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    images: ["/images/og/heypsych.png"],
    card: "summary_large_image",
    title: "Mental Health Treatments",
    description:
      "Explore evidence-based mental health treatments: medications, therapy, and interventional options.",
  },
};

/** Kinds of treatment, in reading order, each with its own hub page. */
const MODALITIES = [
  { id: "medication", label: "Medications", description: "Prescription medicines: antidepressants, mood stabilizers, stimulants and more.", href: "/treatments/medications" },
  { id: "therapy", label: "Therapies", description: "Talking and skills-based treatments such as CBT, DBT and EMDR.", href: "/treatments/therapy" },
  { id: "interventional", label: "Procedures & brain stimulation", description: "Treatments such as TMS, ECT and ketamine infusions.", href: "/treatments/interventional" },
  { id: "supplement", label: "Supplements", description: "Nutritional supplements, with what the evidence says.", href: "/treatments/supplements" },
  { id: "alternative", label: "Lifestyle & alternative", description: "Light therapy, exercise, mindfulness and other approaches.", href: "/treatments/alternative" },
  { id: "investigational", label: "Investigational", description: "Treatments still in clinical trials, such as psilocybin.", href: "/treatments/investigational" },
];

/**
 * Treatments hub. Built from the same local files as the treatment pages, so
 * every one of them is listed (the old database query stopped at 500).
 * Static: the files only change on deploy.
 */
export default async function TreatmentsPage() {
  const { items, conditionNames } = await loadTreatmentHub();
  const groups = buildGroups(items, MODALITIES);
  const facets = topFacets(items, conditionNames, 14);

  return (
    <div className="bg-canvas min-h-screen">
      <PageIntro
        title="Treatments"
        object="treatments"
        description="Therapy, medication, and other approaches, with what the evidence says about each and how they compare."
        footnote={`${items.length} treatments documented. Talk with a clinician before starting or changing any treatment.`}
      >
        <Link
          href="/treatments/compare"
          className="bg-label-primary hover:bg-accent focus-visible:ring-accent inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Compare two treatments <span aria-hidden="true">→</span>
        </Link>
        <p className="text-label-tertiary mt-3 text-[14px]">For example Lexapro vs Zoloft, or CBT vs DBT.</p>
      </PageIntro>
      <div className="pt-8">
        <HubBrowser
          items={items}
          groups={groups}
          facets={facets}
          groupsTitle="Kinds of treatment"
          facetsTitle="What it's for"
          listTitle="All treatments, A–Z"
          searchLabel="Search treatments"
          searchPlaceholder="Search by name or brand, e.g. Zoloft, CBT, TMS"
          noun="treatments"
        />
      </div>
    </div>
  );
}
