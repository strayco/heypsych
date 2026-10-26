// /tools — the patient app finder. Clinicians: /tools/for-clinicians.
// See src/domains/patient-tools/finder/model.ts.

import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";
import { loadPatientFinder } from "@/lib/tools/patient-finder-data";
import { PatientHub } from "@/components/patient-tools/finder/PatientHub";

const canonicalUrl = `${siteConfig.url}/tools`;
const title = "Mental health apps and online care, compared";
const description =
  "Find online therapy, psychiatry and self-help apps that fit what's going on, the help you want and how you'd pay. Costs, privacy grades and research for each.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl },
  openGraph: { images: ["/images/og/heypsych.png"], title, description, url: canonicalUrl, type: "website" },
};

export const revalidate = 86400;

export default async function ToolsPage() {
  const data = await loadPatientFinder(null);
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
        { "@type": "ListItem", position: 2, name: "Apps and online care", item: canonicalUrl },
      ],
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PatientHub data={data} need={null} />
    </>
  );
}
