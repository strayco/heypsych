// /tools/for-clinicians/<job> — one job of the clinician hub (a taxonomy
// category with published products). Categories with no products, and schema
// slugs, redirect; see next.config.ts.

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { siteConfig } from "@/lib/config/site";
import { categoryHubPath } from "@/lib/tools/category-hub-slug";
import { JobPage } from "@/components/tools/clinician/hub/JobPage";
import { liveJobSlugs, loadJobView } from "@/lib/tools/clinician-hub-data";
import { getJob } from "@/domains/tools/clinician-hub/model";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export const revalidate = 86400;

export async function generateStaticParams() {
  return (await liveJobSlugs()).map((category) => ({ category }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const data = await loadJobView(category);
  if (!data) return { title: "Not found", robots: { index: false, follow: true } };

  const { job } = data;
  const canonicalUrl = `${siteConfig.url}/tools/for-clinicians/${job.slug}`;
  const title = `${job.kind} for mental health practices`;
  const description = `${job.line} ${job.products.length} products, with our reviewers' notes on which practices each suits.`;

  return {
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
}

export default async function CategoryHubPage({ params }: CategoryPageProps) {
  const { category } = await params;

  const data = await loadJobView(category);
  if (!data) {
    // A schema slug (billing-rcm-insurance) → its taxonomy page; a known job
    // or category with nothing published → the hub; anything else 404s.
    const hubPath = categoryHubPath(category);
    if (hubPath && hubPath !== `/tools/for-clinicians/${category}`) permanentRedirect(hubPath);
    if (getJob(category) || hubPath) permanentRedirect("/tools/for-clinicians");
    notFound();
  }

  const { job, comparisons, otherJobs, placement } = data;
  const pageUrl = `${siteConfig.url}/tools/for-clinicians/${job.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${job.kind} for mental health practices`,
    url: pageUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Practice software", item: `${siteConfig.url}/tools/for-clinicians` },
        { "@type": "ListItem", position: 3, name: job.kind, item: pageUrl },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: job.products.length,
      itemListElement: job.products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: `${siteConfig.url}${p.href}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <JobPage job={job} otherJobs={otherJobs} comparisons={comparisons} placement={placement} />
    </>
  );
}
