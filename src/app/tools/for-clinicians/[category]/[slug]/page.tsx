// src/app/tools/for-clinicians/[category]/[slug]/page.tsx
// Product detail page for V4 clinician tools, in the entity-page system
// (art bible §13). Metadata, structured data, the canonical-category redirect
// and the commercial kill switch are unchanged from the previous page.

import { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import retiredProducts from "../../../../../../data/tools-v4/retired-products.json";
import { siteConfig } from "@/lib/config/site";
import {
  ClinicianToolService,
  isToolPublishable,
  type ClinicianToolV4,
} from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import clinicianCategoriesData from "../../../../../../data/tools-v4/taxonomies/clinician-categories.json";
import { ClinicianDecisionContext } from "@/components/tools/clinician/ClinicianDecisionContext";
import { ToolMark } from "@/components/tools/ToolMark";
import { ClinicianToolExperience } from "@/components/tools/clinician/experience/ClinicianToolExperience";
import { buildClinicianToolExperience } from "@/domains/tools/clinician-experience/model";
import type { GuideChapter } from "@/components/guide/GuideChapters";
import { readingMinutes, teaserFrom } from "@/components/guide/guide-text";
import {
  getSpecializedRecommendations,
  isSensibleAlternative,
  rankAlternatives,
} from "@/lib/tools/alternatives";
import { buildClinicianToolSchemas } from "@/lib/seo/schema-builders/clinician-tool";
import { resolveOutbound } from "@/lib/commercial/outbound";
import { getJob } from "@/domains/tools/clinician-hub/model";
import { CLINICIAN_KEY_COMPARISONS } from "@/lib/seo/programmatic-seo-engine";

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

// Get category metadata
function getCategoryBySlug(slug: string) {
  return clinicianCategoriesData.categories.find((cat) => cat.slug === slug);
}

// Generate static params for all publishable tools
// Uses taxonomy slugs (e.g., "billing-rcm") not schema slugs (e.g., "billing-rcm-insurance")
export async function generateStaticParams() {
  const tools = await ClinicianToolService.loadClinicianTools();
  return tools.map((tool) => ({
    category: SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category,
    slug: tool.slug,
  }));
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool || !isToolPublishable(tool)) {
    return {
      title: "Tool Not Found",
      robots: { index: false, follow: false },
    };
  }

  // Use taxonomy slug for canonical URL
  const canonicalCategorySlug = SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category;
  const category = getCategoryBySlug(canonicalCategorySlug);
  // Slashless canonical for consistency with sitemap
  const canonicalUrl = `${siteConfig.url}/tools/for-clinicians/${canonicalCategorySlug}/${slug}`;

  // No year in the title: it changed every January whether or not the
  // record was reviewed.
  const priceDisplay = tool.pricing?.starting_price_display;
  const kind = getJob(canonicalCategorySlug)?.kind || category?.display_name || "Practice software";
  const title = `${tool.name}: ${kind}${priceDisplay ? `, ${priceDisplay}` : ""}`;
  const descCore = tool.one_liner || tool.short_description || `${tool.name} for mental health clinicians.`;
  const description = `${descCore}${priceDisplay ? ` Pricing from ${priceDisplay}.` : ""} Who it suits, plans, compliance and alternatives.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      images: ["/images/og/heypsych.png"],
      title: tool.name,
      description: tool.short_description || tool.one_liner,
      url: canonicalUrl,
      type: "website",
    },
    // Only index publishable tools with sufficient content
    robots: tool.short_description && tool.short_description.length > 50
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

function profileHref(tool: ClinicianToolV4): string {
  return `/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}`;
}

const RETIRED = new Set<string>(retiredProducts as string[]);

function titleCase(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { category: categorySlug, slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  // Products retired from the catalogue (2026-10-22) keep their search value:
  // send them to their category if it still lists tools, else the hub.
  if (!tool && RETIRED.has(slug)) {
    const counts = await ClinicianToolService.getToolCountsByTaxonomy();
    permanentRedirect(counts[categorySlug] ? `/tools/for-clinicians/${categorySlug}` : "/tools/for-clinicians");
  }

  // 404 if tool doesn't exist or isn't publishable
  if (!tool || !isToolPublishable(tool)) {
    notFound();
  }

  // Get canonical taxonomy slug for this tool's category
  const canonicalCategorySlug = SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category;

  // CANONICAL URL ENFORCEMENT: Redirect to taxonomy category if accessed via schema slug or secondary category
  // This prevents duplicate content from /billing-rcm-insurance/tool (schema) and /billing-rcm/tool (taxonomy)
  if (categorySlug !== canonicalCategorySlug) {
    redirect(`/tools/for-clinicians/${canonicalCategorySlug}/${slug}`);
  }

  const category = getCategoryBySlug(canonicalCategorySlug);
  const categoryLabel =
    getJob(canonicalCategorySlug)?.kind || category?.short_name || category?.display_name || categorySlug;
  const relatedTools = await ClinicianToolService.getRelated(slug, 4);


  const structuredData = buildClinicianToolSchemas(tool, canonicalCategorySlug, categoryLabel);
  const visit = resolveOutbound({
    slug: tool.slug,
    affiliateUrl: tool.affiliate_url,
    websiteUrl: tool.website_url,
    commercial: tool.commercial,
  });

  // Alternatives: the same ranking and filter as /tools/alternatives/[slug].
  const categoryTools = await ClinicianToolService.getByCategory(tool.primary_category);
  const ranked = rankAlternatives(tool, categoryTools).filter((t) => isSensibleAlternative(t, tool));
  const recommendations = getSpecializedRecommendations(tool, ranked, 2);
  const recommended = new Set(recommendations.map((r) => r.tool.slug));
  const alternatives = ranked
    .filter((t) => !recommended.has(t.slug))
    .slice(0, 5)
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      href: profileHref(t),
      oneLiner: t.one_liner || t.short_description || null,
      price: t.pricing?.starting_price_display ?? null,
    }));
  const comparisons = CLINICIAN_KEY_COMPARISONS.filter(({ a, b }) => a === slug || b === slug).map(({ a, b, slug: cmp }) => ({
    slug: cmp,
    label: `${tool.name} vs ${titleCase(a === slug ? b : a)}`,
  }));

  const x = buildClinicianToolExperience(tool, categoryLabel);
  const guide = buildGuide(tool, x.audience);

  // Related tools that are not already listed as alternatives.
  const listed = new Set([...recommended, ...alternatives.map((a) => a.slug)]);
  const related = relatedTools.filter((r) => !listed.has(r.slug));

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="bg-canvas min-h-screen">
        <ClinicianToolExperience
          tool={x}
          slug={slug}
          category={{ label: categoryLabel, href: `/tools/for-clinicians/${categorySlug}` }}
          visit={visit}
          alternatives={alternatives}
          recommendations={recommendations}
          recommendationHref={(s, primary) =>
            `/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[primary as ClinicianToolV4["primary_category"]] || primary}/${s}`
          }
          comparisons={comparisons}
          related={
            related.length > 0 ? (
              <div className="mt-10">
                <h3 data-heading="sans" className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">
                  Also in {categoryLabel}
                </h3>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link href={profileHref(r)} className="border-separator bg-surface hover:border-accent flex h-full items-center gap-3 rounded-2xl border p-4 transition-colors">
                        <ToolMark name={r.name} slug={r.slug} size="sm" />
                        <span className="min-w-0">
                          <span className="text-label-primary block truncate text-[15px] font-medium">{r.name}</span>
                          <span className="text-label-tertiary block truncate text-[13px]">{r.one_liner || r.short_description}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          }
          guide={guide}
        />

        {/* Back Link */}
        <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
          <Link href={`/tools/for-clinicians/${categorySlug}`} className="text-accent hover:text-accent-hover text-[15px] font-medium">
            <span aria-hidden="true">←</span> Back to {categoryLabel}
          </Link>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// The full guide: everything that is not an explorer above.
// ---------------------------------------------------------------------------

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="text-label-secondary max-w-3xl space-y-4 text-[16px] leading-relaxed">{children}</div>;
}

function buildGuide(
  tool: ClinicianToolV4,
  audience: { roles: string[]; settings: string[]; sizes: string[] }
): GuideChapter[] {
  const chapters: GuideChapter[] = [];
  const about = tool.long_description || tool.short_description;

  if (about) {
    chapters.push({
      id: "about",
      title: `About ${tool.name}`,
      teaser: teaserFrom([about]),
      group: "About",
      minutes: readingMinutes(about),
      content: (
        <Prose>
          {about.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </Prose>
      ),
    });
  }

  chapters.push({
    id: "decision",
    title: "Before you decide",
    teaser: "Practice fit, cost notes and what to check with the vendor.",
    group: "Buying",
    minutes: 1,
    content: <ClinicianDecisionContext tool={tool} />,
  });

  if (audience.roles.length > 0 || audience.settings.length > 0 || audience.sizes.length > 0) {
    const rows = [
      { label: "Roles", items: audience.roles },
      { label: "Settings", items: audience.settings },
      { label: "Practice size", items: audience.sizes },
    ].filter((r) => r.items.length > 0);
    chapters.push({
      id: "audience",
      title: "Who uses it",
      teaser: teaserFrom([[...audience.roles, ...audience.settings].join(", ")]),
      group: "About",
      minutes: 1,
      content: (
        <dl className="space-y-5">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">{row.label}</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {row.items.map((item) => (
                  <span key={item} className="bg-fill-quaternary text-label-primary rounded-full px-3 py-1 text-[14px]">
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      ),
    });
  }

  const company = tool.company;
  const companyRows = company
    ? [
        { label: "Founded", value: company.founded_year ? String(company.founded_year) : null },
        { label: "Headquarters", value: company.headquarters ?? null },
        { label: "Employees", value: company.employee_count ?? null },
        { label: "Funding", value: [company.funding_total, company.funding_stage].filter(Boolean).join(" · ") || null },
        { label: "Customers", value: company.customer_count ?? null },
        { label: "Investors", value: company.notable_investors?.join(", ") || null },
      ].filter((r): r is { label: string; value: string } => Boolean(r.value))
    : [];
  if (companyRows.length > 0) {
    chapters.push({
      id: "company",
      title: tool.company_name ? `The company: ${tool.company_name}` : "The company",
      teaser: companyRows.slice(0, 2).map((r) => `${r.label}: ${r.value}`).join(" · "),
      group: "About",
      minutes: 1,
      content: (
        <dl className="border-separator divide-y divide-[var(--color-separator)] border-y">
          {companyRows.map((r) => (
            <div key={r.label} className="flex justify-between gap-6 py-3 text-[15px]">
              <dt className="text-label-secondary">{r.label}</dt>
              <dd className="text-label-primary text-right">{r.value}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }

  const faqs = tool.seo?.faqs ?? [];
  if (faqs.length > 0) {
    chapters.push({
      id: "questions",
      title: "Questions clinicians ask",
      teaser: faqs.slice(0, 2).map((f) => f.q).join(" · "),
      group: "Questions",
      minutes: readingMinutes(faqs.map((f) => `${f.q} ${f.a}`).join(" ")),
      content: (
        <dl className="max-w-3xl space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="text-label-primary text-[17px] font-medium">{faq.q}</dt>
              <dd className="text-label-secondary mt-1.5 text-[16px] leading-relaxed">{faq.a}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }

  return chapters;
}

// Structured Data - Nuclear SEO Implementation
// Returns 8-12 schemas for maximum SERP feature coverage
// Daily: content comes from data/ files that only change on deploy (which
// rebuilds everything); daily keeps date-based copy current. Hourly cost 24x more.
export const revalidate = 86400;
