/**
 * Curated Tool Comparison Page
 *
 * Renders pre-authored head-to-head comparisons from data/tools-v4/comparisons/
 * These are the canonical, indexed versions of tool comparisons.
 *
 * URL format: /tools/compare/[slug] (e.g., /tools/compare/simplepractice-vs-therapynotes)
 *
 * SECURITY:
 * - Slug validation prevents path traversal attacks
 * - Only statically generated paths are allowed (dynamicParams = false)
 * - Comparison JSON is validated with Zod schema
 */

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";
import { clinicianToolPath } from "@/lib/tools/category-hub-slug";
import { resolveOutbound } from "@/lib/commercial/outbound";
import { getJob, jobSlugFor, toHubProduct } from "@/domains/tools/clinician-hub/model";
import { ClinicianCompare, type CompareProduct } from "@/components/tools/clinician/compare/ClinicianCompare";
import {
  ClinicianToolService,
  type ClinicianToolV4,
} from "@/lib/tools/clinician-tool-service";
import {
  getAllPublishableCurated,
  getPublishableComparison,
  type CuratedComparison,
} from "@/lib/tools/curated-comparisons";


// Prevent dynamic routes - only statically generated slugs are allowed
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// =============================================================================
// STATIC PATHS
// =============================================================================

export async function generateStaticParams() {
  const publishable = await getAllPublishableCurated();
  return publishable.map((c) => ({ slug: c.slug }));
}

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishableComparison(slug);

  if (!result) {
    return {
      title: "Comparison Not Found",
      robots: { index: false, follow: false },
    };
  }

  const { comparison, tools } = result;
  const toolNames = comparison.tools.map((s) => tools.get(s)?.name || s);
  const vsTitle = toolNames.join(" vs ");
  // Plain titles: the stored SEO titles ("… | Winner?") were written as bait.
  const title = `${vsTitle}: how they compare`;
  const description = comparison.description;
  const pageUrl = `${SITE_CONFIG.url}/tools/compare/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      type: "article",
      url: pageUrl,
      ...(comparison.metadata.last_updated ? { modifiedTime: comparison.metadata.last_updated } : {}),
      images: ["/images/og/heypsych.png"],
    },
    twitter: {
      images: ["/images/og/heypsych.png"],
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// =============================================================================
// STRUCTURED DATA
// =============================================================================

/**
 * Structured data for a head-to-head comparison, limited to what the record
 * states: breadcrumbs, its own FAQs, and the products compared. No review,
 * rating, HowTo or guessed third-party profile links, and a date only when
 * the comparison carries one.
 */
function generateComparisonStructuredData(
  comparison: CuratedComparison,
  tools: Map<string, ClinicianToolV4>
): object[] {
  const schemas: object[] = [];
  const pageUrl = `${SITE_CONFIG.url}/tools/compare/${comparison.slug}`;
  const toolList = comparison.tools
    .map((slug) => tools.get(slug))
    .filter((tool): tool is ClinicianToolV4 => Boolean(tool));
  const vsTitle = toolList.map((t) => t.name).join(" vs ");

  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_CONFIG.url },
      { "@type": "ListItem", position: 2, name: "Practice software", item: `${SITE_CONFIG.url}/tools/for-clinicians` },
      { "@type": "ListItem", position: 3, name: vsTitle, item: pageUrl },
    ],
  });

  if (comparison.faqs && comparison.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: comparison.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    });
  }

  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    name: `${vsTitle}: how they compare`,
    description: comparison.description,
    url: pageUrl,
    ...(comparison.metadata.last_updated ? { dateModified: comparison.metadata.last_updated } : {}),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: toolList.length,
      itemListElement: toolList.map((tool, index) => {
        const path = clinicianToolPath(tool);
        const cents = tool.pricing?.starting_price_cents;
        return {
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "SoftwareApplication",
            name: tool.name,
            applicationCategory: "BusinessApplication",
            ...(path ? { url: `${SITE_CONFIG.url}${path}` } : {}),
            ...(tool.company_name ? { publisher: { "@type": "Organization", name: tool.company_name } } : {}),
            ...(typeof cents === "number" && cents > 0
              ? { offers: { "@type": "Offer", price: cents / 100, priceCurrency: "USD" } }
              : {}),
          },
        };
      }),
    },
  });

  return schemas;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function CuratedComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPublishableComparison(slug);
  if (!result) notFound();

  const { comparison, tools } = result;
  const toolList = comparison.tools
    .map((s) => tools.get(s))
    .filter((t): t is ClinicianToolV4 => Boolean(t));

  const products: CompareProduct[] = toolList.map((t) => {
    const hp = toHubProduct(t);
    return {
      slug: t.slug,
      name: t.name,
      profileHref: clinicianToolPath(t),
      price: hp.price,
      baa: hp.baa,
      suits: hp.fit[0] ? { label: hp.fit[0].label, note: hp.fit[0].note } : null,
      visit: resolveOutbound({
        slug: t.slug,
        affiliateUrl: t.affiliate_url,
        websiteUrl: t.website_url,
        commercial: t.commercial,
      }),
    };
  });

  const jobSlug = toolList[0] ? jobSlugFor(toolList[0]) : null;
  const job = jobSlug && toolList.every((t) => jobSlugFor(t) === jobSlug) ? getJob(jobSlug) : null;
  const back = job
    ? { label: job.kind, href: `/tools/for-clinicians/${job.slug}#compare` }
    : { label: "Practice software", href: "/tools/for-clinicians#compare" };

  const all = await getAllPublishableCurated();
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  const allTools = await ClinicianToolService.loadClinicianTools();
  const names = new Map(allTools.map((t) => [t.slug, t.name]));
  const label = (c: { tools: string[] }) => c.tools.map((s) => names.get(s) ?? s).join(" vs ");
  const relatedSlugs = new Set(comparison.related_comparisons ?? []);
  const related = [
    ...all.filter((c) => relatedSlugs.has(c.slug)),
    ...all.filter((c) => !relatedSlugs.has(c.slug) && c.slug !== slug && c.tools.some((t) => comparison.tools.includes(t))),
  ]
    .filter((c, i, arr) => c.slug !== slug && arr.findIndex((x) => x.slug === c.slug) === i && bySlug.has(c.slug))
    .slice(0, 6)
    .map((c) => ({ slug: c.slug, label: label(c) }));

  const schemas = generateComparisonStructuredData(comparison, tools);

  return (
    <>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <ClinicianCompare comparison={comparison} products={products} back={back} related={related} />
    </>
  );
}

export const revalidate = 86400;
