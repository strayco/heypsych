// /tools/for-clinicians — practice software organised by the job it does.
// See src/domains/tools/clinician-hub/model.ts and
// docs/active/design/HOMEPAGE_WORLDS_ART_BIBLE.md §13.1.

import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";
import { ClinicianHub } from "@/components/tools/clinician/hub/ClinicianHub";
import { loadClinicianHub } from "@/lib/tools/clinician-hub-data";

const canonicalUrl = `${siteConfig.url}/tools/for-clinicians`;
const title = "Practice software for mental health clinicians";
const description =
  "EHRs, AI notes, billing, insurance networks, directories, telehealth and outcome measures, organised by the job each does. Reviewers' notes on which practices each suits, with prices and BAA status.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title,
    description,
    url: canonicalUrl,
    type: "website",
  },
};

export const revalidate = 86400;

export default async function ForCliniciansPage() {
  const { hub, comparisons, placement } = await loadClinicianHub();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: canonicalUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Practice software", item: canonicalUrl },
      ],
    },
    hasPart: hub.jobs.map((job) => ({
      "@type": "CollectionPage",
      name: job.kind,
      url: `${siteConfig.url}/tools/for-clinicians/${job.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <ClinicianHub hub={hub} comparisons={comparisons} placement={placement} />
    </>
  );
}
