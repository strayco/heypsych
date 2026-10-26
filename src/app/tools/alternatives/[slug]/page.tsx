/**
 * Alternatives Page Template
 *
 * Comprehensive alternatives guide for switching from a specific product.
 * High buyer intent - user is actively looking for replacements.
 *
 * URL: /tools/alternatives/[product-slug]
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { AlternativeArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import { ClinicianToolCard } from "@/components/tools/clinician";
import { ToolMark } from "@/components/tools/ToolMark";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";
import {
  getSpecializedRecommendations,
  isSensibleAlternative,
  rankAlternatives,
} from "@/lib/tools/alternatives";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params
export async function generateStaticParams() {
  const tools = await ClinicianToolService.loadClinicianTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool) {
    return { title: "Alternatives" };
  }

  // Check if there are enough alternatives to be useful
  const categoryTools = await ClinicianToolService.getByCategory(tool.primary_category);
  // Same filter as the page body, so the title's count matches what is listed.
  const alternativeCount = categoryTools.filter((t) => isSensibleAlternative(t, tool)).length;
  const hasSubstantiveContent = alternativeCount >= 3;

  // CTR-optimized title: includes count and target audience
  const title = alternativeCount > 0
    ? `${alternativeCount} ${tool.name} Alternatives for Therapists & Practices (2026)`
    : `${tool.name} Alternatives (2026) | Top ${tool.name} Competitors`;
  const description = `Looking for ${tool.name} alternatives? Compare ${alternativeCount} top ${tool.name} competitors for mental health practices. See pricing, features, and find the best fit for your practice.`;

  return {
    title,
    description,
    keywords: [
      `${tool.name} alternatives`,
      `${tool.name} competitors`,
      `products like ${tool.name}`,
      `${tool.name} replacement`,
      `switch from ${tool.name}`,
      `better than ${tool.name}`,
    ],
    alternates: {
      canonical: `${siteConfig.url}/tools/alternatives/${slug}`,
    },
    openGraph: {
      images: ["/images/og/heypsych.png"],
      title,
      description,
      url: `${siteConfig.url}/tools/alternatives/${slug}`,
      type: "website",
    },
    // Noindex pages with fewer than 3 alternatives (thin content)
    robots: hasSubstantiveContent ? undefined : { index: false, follow: true },
  };
}

// Get category display name
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    "ehr-practice-management": "EHR & Practice Management",
    "ai-scribe-documentation": "AI Scribe & Documentation",
    "billing-rcm": "Billing & RCM",
    "telehealth-communication": "Telehealth",
    "provider-networks": "Provider Networks",
    "measurement-dtx": "Measurement & DTx",
  };
  return labels[category] || category.replace(/-/g, " ");
}

// Migration complexity estimate
function getMigrationComplexity(tool: ClinicianToolV4): {
  level: "easy" | "moderate" | "complex";
  timeEstimate: string;
  keySteps: string[];
} {
  if (tool.primary_category === "ehr-practice-management") {
    return {
      level: "complex",
      timeEstimate: "2-4 weeks",
      keySteps: [
        "Export all patient data (demographics, notes, documents)",
        "Set up new system and import data",
        "Run both systems in parallel for 1-2 weeks",
        "Train staff and notify patients of portal changes",
      ],
    };
  }

  if (tool.primary_category.includes("billing")) {
    return {
      level: "moderate",
      timeEstimate: "1-2 weeks",
      keySteps: [
        "Export claims history and outstanding AR",
        "Set up new billing system with fee schedules",
        "Configure clearinghouse connection",
        "Keep old system access for 90+ days for AR follow-up",
      ],
    };
  }

  if (tool.primary_category === "provider-network-virtual-care") {
    return {
      level: "moderate",
      timeEstimate: "2-4 months",
      keySteps: [
        "Review contract terms and notice period",
        "Begin direct insurance credentialing (60-120 days)",
        "Set up your own billing solution",
        "Transfer eligible patients to your practice",
      ],
    };
  }

  // AI scribes, telehealth, and other tools
  return {
    level: "easy",
    timeEstimate: "1-3 days",
    keySteps: [
      "Export any saved templates or settings",
      "Set up new tool and configure preferences",
      "Test with a few sessions before going fully live",
      "Cancel old subscription",
    ],
  };
}

export default async function AlternativesPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool) {
    notFound();
  }

  // Get all tools in the same category
  const categoryTools = await ClinicianToolService.getByCategory(tool.primary_category);

  // Ranked by fit with the tool being replaced. Specialist products (Osmind
  // for ketamine and TMS clinics) only appear for practices in their niche.
  const alternatives = rankAlternatives(tool, categoryTools).filter((t) =>
    isSensibleAlternative(t, tool)
  );

  const topAlternatives = alternatives.slice(0, 3);
  const otherAlternatives = alternatives.slice(3, 9);

  const categoryLabel = getCategoryLabel(tool.primary_category);

  // Get specialized recommendations with concrete reasons
  const specializedRecs = getSpecializedRecommendations(tool, alternatives);

  // Get migration complexity for the migration guide section
  const migrationComplexity = getMigrationComplexity(tool);

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tool.name} Alternatives`,
    description: `Top alternatives to ${tool.name} for mental health practices`,
    numberOfItems: alternatives.length,
    itemListElement: topAlternatives.map((alt, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "SoftwareApplication",
        name: alt.name,
        applicationCategory: "HealthApplication",
        url: `${siteConfig.url}/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[alt.primary_category] || alt.primary_category}/${alt.slug}/`,
      },
    })),
  };

  const toolHref = `/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${slug}`;
  const hrefFor = (alt: ClinicianToolV4) =>
    `/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[alt.primary_category] || alt.primary_category}/${alt.slug}`;
  const Workstation = DISCOVERY_OBJECTS.clinician;
  const nav = [
    topAlternatives.length > 0 ? { id: "top", label: "Top picks" } : null,
    specializedRecs.length > 0 ? { id: "by-need", label: "By need" } : null,
    { id: "migration-guide", label: "How to switch" },
    otherAlternatives.length > 0 ? { id: "more", label: "More options" } : null,
  ].filter((n): n is { id: string; label: string } => Boolean(n));
  const COMPLEXITY_TONE = {
    easy: "border-positive-200 bg-positive-50",
    moderate: "border-caution-200 bg-caution-50",
    complex: "border-negative-200 bg-negative-50",
  } as const;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="bg-canvas min-h-screen">
        {/* Opening */}
        <header className="pt-8 pb-10 sm:pt-12">
          <div className="mx-auto grid max-w-5xl items-end gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:px-8">
            <div className="min-w-0">
              <Link href={toolHref} className="text-label-secondary hover:text-label-primary text-[14px] font-medium">
                <span aria-hidden="true">←</span> {tool.name}
              </Link>
              <div className="mt-6 flex items-center gap-3">
                <ToolMark name={tool.name} slug={tool.slug} size="lg" />
                <p className="text-label-tertiary text-[14px] font-medium">{categoryLabel}</p>
              </div>
              <h1 className="font-display text-label-primary mt-4 text-[40px] leading-[1.04] font-normal tracking-[-0.025em] sm:text-[56px]">
                {tool.name} alternatives
              </h1>
              <p className="text-label-primary mt-4 max-w-2xl text-[19px] leading-snug sm:text-[21px]">
                {alternatives.length > 0
                  ? `${alternatives.length} ${alternatives.length === 1 ? "option" : "options"} for practices switching from ${tool.name}, ranked by how closely they fit what it's used for.`
                  : `We don't list a close alternative to ${tool.name} yet.`}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {tool.pricing?.starting_price_display && (
                  <li className="bg-fill-quaternary text-label-secondary rounded-full px-3 py-1 text-[13px]">
                    {tool.name} from {tool.pricing.starting_price_display}
                  </li>
                )}
                <li className="bg-fill-quaternary text-label-secondary rounded-full px-3 py-1 text-[13px]">
                  Switching: {migrationComplexity.level} · {migrationComplexity.timeEstimate}
                </li>
              </ul>
            </div>
            <div aria-hidden="true" className="hidden h-[190px] lg:block">
              <Workstation />
            </div>
          </div>
        </header>

        {nav.length > 1 && (
          <nav aria-label="On this page" className="border-separator bg-canvas/90 sticky top-16 z-20 border-y backdrop-blur">
            <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
              {nav.map((item) => (
                <li key={item.id} className="shrink-0">
                  <a href={`#${item.id}`} className="text-label-secondary hover:bg-fill-quaternary hover:text-label-primary block rounded-full px-3.5 py-1.5 text-[14px] font-medium">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Top Alternatives */}
          {topAlternatives.length > 0 && (
            <AltSection id="top" title={`Top ${tool.name} alternatives`} intro="The closest fits: same job, shared kinds of practice, and the most complete records.">
              <ol className="grid gap-4 md:grid-cols-3">
                {topAlternatives.map((alt, idx) => (
                  <li key={alt.slug} className="border-separator bg-surface flex flex-col rounded-2xl border p-6 shadow-card-1">
                    <div className="flex items-center justify-between">
                      <ToolMark name={alt.name} slug={alt.slug} size="md" />
                      <span className="text-label-tertiary text-[13px] font-medium tabular-nums">#{idx + 1}</span>
                    </div>
                    <h3 className="text-label-primary mt-4 text-[19px] font-semibold">{alt.name}</h3>
                    <p className="text-label-secondary mt-2 line-clamp-3 text-[15px] leading-snug">{alt.short_description || alt.one_liner}</p>
                    {alt.pricing?.starting_price_display && (
                      <p className="mt-3 text-[14px]">
                        <span className="text-label-tertiary">From </span>
                        <span className="text-label-primary font-semibold">{alt.pricing.starting_price_display}</span>
                      </p>
                    )}
                    <div className="mt-auto flex gap-2 pt-5">
                      <Link href={hrefFor(alt)} className="bg-accent hover:bg-accent-hover flex-1 rounded-full px-3 py-2 text-center text-[14px] font-medium text-white">
                        View profile
                      </Link>
                      <Link href={`/tools/compare?tools=${slug},${alt.slug}`} className="border-separator text-label-primary hover:border-label-tertiary rounded-full border px-4 py-2 text-[14px] font-medium">
                        Compare
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            </AltSection>
          )}

          {/* Specialized Recommendations */}
          {specializedRecs.length > 0 && (
            <AltSection id="by-need" title="The best alternative for your practice" intro="Different practices need different things. Our reviewers' picks for each:">
              <div className="grid gap-4 sm:grid-cols-2">
                {specializedRecs.map((rec) => (
                  <Link
                    key={rec.label}
                    href={hrefFor(rec.tool)}
                    className="border-separator bg-surface hover:border-accent group rounded-2xl border p-5 shadow-card-1 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-accent text-[12px] font-semibold tracking-[0.06em] uppercase">{rec.label}</p>
                        <p className="text-label-primary group-hover:text-accent mt-1 flex items-center gap-2 text-[18px] font-medium">
                          <ToolMark name={rec.tool.name} slug={rec.tool.slug} size="sm" />
                          {rec.tool.name}
                        </p>
                      </div>
                      {rec.tool.pricing?.starting_price_display && (
                        <span className="text-label-secondary shrink-0 text-[14px]">{rec.tool.pricing.starting_price_display}</span>
                      )}
                    </div>
                    <p className="text-label-secondary mt-3 text-[15px] leading-snug">{rec.reason}</p>
                    <p className="text-label-tertiary mt-2 text-[13px]">{rec.description}</p>
                  </Link>
                ))}
              </div>
            </AltSection>
          )}

          <div className="py-4">
            <AlternativeArchitectCTA switchingFrom={slug} />
          </div>

          {/* Migration Guide */}
          <AltSection id="migration-guide" title={`How to switch from ${tool.name}`} intro="A rough timeline and the steps that matter.">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className={`rounded-2xl border p-6 ${COMPLEXITY_TONE[migrationComplexity.level]}`}>
                <p className="text-label-tertiary text-[13px]">Switching effort</p>
                <p className="font-display text-label-primary mt-1 text-[32px] leading-tight capitalize">{migrationComplexity.level}</p>
                <p className="text-label-secondary mt-1 text-[15px]">About {migrationComplexity.timeEstimate}</p>
              </div>
              <ol className="border-separator bg-surface space-y-4 rounded-2xl border p-6 shadow-card-1">
                {migrationComplexity.keySteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="bg-accent-tint text-accent flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums">
                      {idx + 1}
                    </span>
                    <span className="text-label-primary text-[15px] leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { title: "Export first", body: "Export your data before canceling. You may lose access right away." },
                { title: "Check the contract", body: "Read the cancellation terms and notice period to avoid fees." },
                { title: "Tell your team", body: "Make sure staff know about the switch and have time to train." },
              ].map((tip) => (
                <li key={tip.title} className="bg-caution-50 rounded-2xl p-5">
                  <p className="text-label-primary text-[15px] font-semibold">{tip.title}</p>
                  <p className="text-label-secondary mt-1 text-[14px] leading-snug">{tip.body}</p>
                </li>
              ))}
            </ul>
          </AltSection>

          {/* Other Alternatives */}
          {otherAlternatives.length > 0 && (
            <AltSection id="more" title={`More ${tool.name} alternatives`}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherAlternatives.map((alt) => (
                  <ClinicianToolCard key={alt.slug} tool={alt} />
                ))}
              </div>
            </AltSection>
          )}

          {/* Why Switch */}
          <AltSection id="why" title={`Why practices look beyond ${tool.name}`}>
            <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {[
                { title: "Price", body: "A plan that fits your budget, especially as the practice grows." },
                { title: "Features", body: `Something ${tool.name} doesn't do, or doesn't do well for you.` },
                { title: "Fit", body: "Software built for your kind of practice and the way you work." },
                { title: "Integrations", body: "Better connections with the tools you already use." },
              ].map((r) => (
                <li key={r.title} className="border-separator border-t pt-4">
                  <p className="text-label-primary text-[16px] font-semibold">{r.title}</p>
                  <p className="text-label-secondary mt-1 text-[15px] leading-snug">{r.body}</p>
                </li>
              ))}
            </ul>
          </AltSection>

          {/* Related Links */}
          <nav aria-label="Related" className="border-separator mb-16 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-[15px]">
            <Link href={toolHref} className="text-accent hover:text-accent-hover font-medium">
              {tool.name} profile →
            </Link>
            <Link href={`/tools/compare?tools=${slug}`} className="text-label-secondary hover:text-label-primary">
              Compare tools
            </Link>
            <Link href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}`} className="text-label-secondary hover:text-label-primary">
              All {categoryLabel}
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}

function AltSection({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 py-12 sm:py-16">
      <h2 id={`${id}-title`} className="font-display text-label-primary text-[30px] leading-tight tracking-[-0.01em] sm:text-[36px]">
        {title}
      </h2>
      {intro && <p className="text-label-secondary mt-2 max-w-2xl text-[16px] leading-relaxed">{intro}</p>}
      <div className="mt-7">{children}</div>
    </section>
  );
}

// Daily: content comes from data/ files that only change on deploy (which
// rebuilds everything); daily keeps date-based copy current. Hourly cost 24x more.
export const revalidate = 86400;
