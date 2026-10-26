/**
 * Shared body of the patient need pages (/tools/anxiety-stress, …,
 * /tools/find-support). Each route file is a two-line wrapper.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/config/site";
import { getNeed, type NeedId } from "@/domains/patient-tools/finder/model";
import { loadPatientFinder } from "@/lib/tools/patient-finder-data";
import { PatientHub } from "@/components/patient-tools/finder/PatientHub";

export async function needMetadata(id: NeedId): Promise<Metadata> {
  const need = getNeed(id);
  if (!need) return {};
  const { apps } = await loadPatientFinder(null);
  const count = apps.filter((a) => a.needs.includes(id)).length;
  const url = `${siteConfig.url}${need.href}`;
  const description = `${need.line} ${count} options compared on cost, privacy and research.`;
  return {
    title: need.title,
    description,
    alternates: { canonical: url },
    openGraph: { images: ["/images/og/heypsych.png"], title: need.title, description, url, type: "website" },
  };
}

export async function NeedPage({ id }: { id: NeedId }) {
  const need = getNeed(id);
  if (!need) notFound();
  const data = await loadPatientFinder(id);
  const inScope = data.apps.filter((a) => a.needs.includes(id));
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: need.title,
    url: `${siteConfig.url}${need.href}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Apps and online care", item: `${siteConfig.url}/tools` },
        { "@type": "ListItem", position: 3, name: need.label, item: `${siteConfig.url}${need.href}` },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: inScope.length,
      itemListElement: inScope.slice(0, 30).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: a.name,
        url: `${siteConfig.url}${a.href}`,
      })),
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PatientHub data={data} need={need} />
    </>
  );
}
