/**
 * Structured data for a patient app profile (/tools/<slug>), limited to the
 * record. No ratings (app-store star counts on the record are unsourced and
 * are not HeyPsych reviews), no price unless the record states one, and the
 * real review date rather than "now".
 */

import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { siteConfig } from "@/lib/config/site";

function priceOf(pricing: DigitalToolV3["pricing"]): number | null {
  if (pricing.model === "free") return 0;
  const m = pricing.starting_price?.match(/\$\s?(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function operatingSystems(p: DigitalToolV3["platforms"]): string | undefined {
  const os = [p.ios && "iOS", p.android && "Android", p.web && "Web browser"].filter(Boolean);
  return os.length ? os.join(", ") : undefined;
}

export function buildPatientAppSchemas(tool: DigitalToolV3): Record<string, unknown>[] {
  const site = siteConfig.url;
  const url = `${site}/tools/${tool.slug}`;
  const price = priceOf(tool.pricing);
  const reviewed = tool.governance?.last_reviewed;

  const schemas: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${url}#app`,
      name: tool.name,
      description: tool.one_liner,
      applicationCategory: "HealthApplication",
      url,
      ...(operatingSystems(tool.platforms) ? { operatingSystem: operatingSystems(tool.platforms) } : {}),
      ...(tool.app_metadata?.website ? { sameAs: [tool.app_metadata.website] } : {}),
      ...(tool.app_metadata?.publisher ? { publisher: { "@type": "Organization", name: tool.app_metadata.publisher } } : {}),
      // No offer for an app nobody can get any more.
      ...(price !== null && tool.availability?.state !== "discontinued"
        ? { offers: { "@type": "Offer", price, priceCurrency: "USD" } }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site },
        { "@type": "ListItem", position: 2, name: "Apps and online care", item: `${site}/tools` },
        { "@type": "ListItem", position: 3, name: tool.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: tool.name,
      ...(reviewed ? { dateModified: reviewed, lastReviewed: reviewed } : {}),
      mainEntity: { "@id": `${url}#app` },
    },
  ];

  const faqs = tool.seo?.faqs ?? [];
  if (faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return schemas;
}
