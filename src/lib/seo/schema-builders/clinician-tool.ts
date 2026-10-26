/**
 * Structured data for a clinician product profile, limited to the record:
 * the product (with a starting price only when the record states one), its
 * breadcrumbs, the FAQs authored on the record, and the page with its real
 * review date. No ratings, reviews, HowTo or other synthesized content: an
 * internal data-quality score is not a rating, and none is published.
 *
 * Replaces the former "nuclear" builder, which turned `data_quality_score`
 * into an AggregateRating and a Review and auto-wrote FAQ answers.
 */

import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { siteConfig } from "@/lib/config/site";

export function buildClinicianToolSchemas(
  tool: ClinicianToolV4,
  categorySlug: string,
  categoryName: string | null
): Record<string, unknown>[] {
  const site = siteConfig.url;
  const hubUrl = `${site}/tools/for-clinicians`;
  const categoryUrl = `${hubUrl}/${categorySlug}`;
  const pageUrl = `${categoryUrl}/${tool.slug}`;
  const cents = tool.pricing?.starting_price_cents;
  const reviewed = tool.governance?.last_reviewed;

  const schemas: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${pageUrl}#software`,
      name: tool.name,
      ...(tool.one_liner ? { description: tool.one_liner } : {}),
      applicationCategory: "BusinessApplication",
      url: pageUrl,
      ...(tool.website_url ? { sameAs: [tool.website_url] } : {}),
      ...(tool.company_name ? { publisher: { "@type": "Organization", name: tool.company_name } } : {}),
      ...(typeof cents === "number" && cents > 0
        ? { offers: { "@type": "Offer", price: cents / 100, priceCurrency: "USD" } }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site },
        { "@type": "ListItem", position: 2, name: "Practice software", item: hubUrl },
        ...(categoryName ? [{ "@type": "ListItem", position: 3, name: categoryName, item: categoryUrl }] : []),
        { "@type": "ListItem", position: categoryName ? 4 : 3, name: tool.name, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: tool.name,
      ...(reviewed ? { dateModified: reviewed, lastReviewed: reviewed } : {}),
      mainEntity: { "@id": `${pageUrl}#software` },
    },
  ];

  const faqs = tool.seo?.faqs ?? [];
  if (faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return schemas;
}
