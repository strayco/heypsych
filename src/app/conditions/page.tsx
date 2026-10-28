import { Metadata } from "next";
import { getConditionsServer } from "@/lib/data/server-queries";
import { SITE_CONFIG } from "@/lib/seo/config";
import { CONDITION_CATEGORIES } from "@/lib/config/condition-categories";
import { PageIntro } from "@/components/brand/PageIntro";
import { HubBrowser } from "@/components/hubs/HubBrowser";
import { buildGroups, conditionOneLiner, type HubItem } from "@/domains/hubs/model";

/**
 * Conditions hub. Server-rendered: the browser receives one small item per
 * condition, not the full records. Every condition link is in the HTML.
 */

export const metadata: Metadata = {
  title: "Mental Health Conditions A-Z | Evidence-Based Information",
  description:
    "Comprehensive, evidence-based information on mental health conditions including symptoms, diagnosis, treatment options, and support resources. Browse conditions A-Z.",
  keywords:
    "mental health conditions, psychiatric disorders, mental illness, depression, anxiety, ADHD, bipolar disorder, PTSD, schizophrenia, mental health diagnosis",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions`,
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "Mental Health Conditions A-Z",
    description:
      "Comprehensive, evidence-based information on mental health conditions including symptoms, diagnosis, treatment, and support.",
    url: `${SITE_CONFIG.url}/conditions`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    images: ["/images/og/heypsych.png"],
    card: "summary_large_image",
    title: "Mental Health Conditions A-Z",
    description:
      "Evidence-based information on mental health conditions: symptoms, diagnosis, treatment, and support.",
  },
};

export default async function ConditionsPage() {
  const conditions = await getConditionsServer();

  // getConditionsServer() swallows database errors and returns []. Never let
  // that become a cached, empty hub: throwing here makes Next.js keep serving
  // the last good static page (ISR) or fail the build, instead of publishing
  // "0 conditions" to every visitor.
  if (conditions.length === 0) {
    throw new Error("Conditions hub: no conditions loaded from the database; refusing to render an empty page.");
  }

  const items: HubItem[] = conditions
    .filter((c) => c.slug && c.name)
    .map((c) => {
      const metadata = (c.metadata ?? {}) as Record<string, unknown>;
      const aliases = Array.isArray(metadata.aliases) ? (metadata.aliases as unknown[]).filter((a): a is string => typeof a === "string") : [];
      return {
        href: `/conditions/${c.slug}`,
        title: c.name,
        subtitle: conditionOneLiner(c.data),
        groups: typeof metadata.category === "string" ? [metadata.category] : [],
        facets: [],
        keywords: aliases,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  const groups = buildGroups(
    items,
    CONDITION_CATEGORIES.map((c) => ({ id: c.slug, label: c.displayTitle, description: c.subtitle, href: c.href }))
  );

  return (
    <div className="bg-canvas min-h-screen">
      <PageIntro
        title="Conditions"
        object="conditions"
        description={`Plain-language guides to ${items.length} mental health conditions: what they can feel like, how they're diagnosed, and how they're treated.`}
        footnote="Educational information, not a diagnosis."
      />
      <div className="pt-8">
        <HubBrowser
          items={items}
          groups={groups}
          groupsTitle="Browse by type"
          listTitle="All conditions, A–Z"
          searchLabel="Search conditions"
          searchPlaceholder="Search conditions, e.g. panic, ADHD, insomnia"
          noun="conditions"
        />
      </div>
    </div>
  );
}
