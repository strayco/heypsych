// src/app/tools/[slug]/page.tsx
// Individual Tool Page

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, Scale } from "lucide-react";
import { ComparisonReferralTracker } from "./ComparisonReferralTracker";
import { ToolService } from "@/lib/tools/tool-service";
import { KEY_COMPARISONS, TOP_APPS } from "@/lib/seo/patient-programmatic-seo-engine";
import { DirectAnswerBlock } from "@/components/tools/DirectAnswerBlock";
import { DecisionContext } from "@/components/tools/DecisionContext";
import { BoardAttribution } from "@/components/tools/BoardAttribution";
import { ToolFAQ } from "@/components/tools/ToolFAQ";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { RelatedHubs } from "@/components/tools/RelatedHubs";
import { ClinicianModule } from "@/components/tools/ClinicianModule";
import { GetItLinks } from "@/components/commercial/GetItLinks";
import { resolveOutbound } from "@/lib/commercial/outbound";
import { ToolExperience } from "@/components/patient-tools/experience/ToolExperience";
import { buildToolExperience } from "@/domains/patient-tools/experience/model";
import { isListable } from "@/domains/patient-tools/finder/model";
import { getConditionNames } from "@/domains/patient-tools/experience/condition-names";
import type { GuideChapter } from "@/components/guide/GuideChapters";
import { readingMinutes, teaserFrom } from "@/components/guide/guide-text";
import { buildPatientAppSchemas } from "@/lib/seo/schema-builders/patient-app";
import {
  getToolCanonicalUrl,
  getToolRobotsMeta,
} from "@/lib/tools/tools-seo";
import { getComplianceDisplayText } from "@/lib/schemas/tool-editorial";
import { stripBrandTitleSuffix } from "@/lib/seo/title";

// Generate static params for all tools
export async function generateStaticParams() {
  try {
    const slugs = await ToolService.getAllSlugs();
    console.log(`📦 Generating ${slugs.length} static tool pages`);
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("Failed to generate static params for tools:", error);
    return [];
  }
}

// Generate metadata with SEO control plane integration
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await ToolService.getBySlug(slug);

  if (!tool) {
    return {
      title: "Tool Not Found",
      description: "This tool could not be found.",
      robots: "noindex, nofollow",
    };
  }

  // Get canonical and robots from central SEO control plane
  const canonicalUrl = getToolCanonicalUrl(slug);
  const robotsMeta = getToolRobotsMeta(tool);

  return {
    // Tool data authors titles with a trailing "| HeyPsych"; the root layout
    // template appends the brand too. Open Graph keeps the authored form since
    // Next.js renders it verbatim without the template.
    title: stripBrandTitleSuffix(tool.seo.title),
    description: tool.seo.meta_description,
    alternates: {
      canonical: canonicalUrl,
    },
    // Apply robots decision from central indexation firewall
    robots: robotsMeta,
    openGraph: {
      images: ["/images/og/heypsych.png"],
      title: tool.seo.title,
      description: tool.seo.meta_description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await ToolService.getBySlug(slug);

  if (!tool) {
    notFound();
  }

  const listable = new Set((await ToolService.getAll()).filter(isListable).map((t) => t.slug));
  const relatedTools = (await ToolService.getRelated(slug, 8)).filter((t) => listable.has(t.slug)).slice(0, 4);
  const discontinued = tool.availability?.state === "discontinued";


  // Generate structured data
  const structuredData = buildPatientAppSchemas(tool);

  const visit = resolveOutbound({
    slug: tool.slug,
    affiliateUrl: tool.app_metadata?.affiliate_url,
    websiteUrl: tool.app_metadata?.website,
    commercial: tool.app_metadata?.commercial,
  });
  const outbound = (
    <GetItLinks
      slug={tool.slug}
      name={tool.name}
      primary={visit}
      appStoreUrl={tool.app_metadata?.app_store_url}
      googlePlayUrl={tool.app_metadata?.google_play_url}
      source="profile"
    />
  );

  // Interactive page (art bible §13). If a record's shape ever defeats the
  // model, the original layout below renders instead.
  let experience: React.ReactNode = null;
  try {
    const model = buildToolExperience(tool, getConditionNames());
    experience = (
      <ToolExperience
        tool={model}
        reviewed={{
          label: tool.governance.reviewed_by_label,
          url: tool.governance.reviewed_by_url,
          date: tool.governance.last_reviewed ?? null,
        }}
        outbound={discontinued ? null : outbound}
        related={relatedTools.map((t) => ({ slug: t.slug, name: t.name, oneLiner: t.one_liner ?? null }))}
        compare={discontinued ? [] : buildCompareLinks(
          slug,
          relatedTools.map((t) => ({ slug: t.slug, name: t.name })),
          listable
        )}
        guide={buildToolGuide(tool)}
      />
    );
  } catch (error) {
    console.error("[ToolPage] Experience failed; using the original layout:", slug, error);
  }

  if (experience) {
    return (
      <>
        <Suspense fallback={null}>
          <ComparisonReferralTracker toolSlug={slug} />
        </Suspense>
        {structuredData.map((schema, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        ))}
        <div className="bg-canvas min-h-screen">{experience}</div>
      </>
    );
  }

  return (
    <>
      {/* Comparison referral tracking - fires event if arrived from comparison page */}
      <Suspense fallback={null}>
        <ComparisonReferralTracker toolSlug={slug} />
      </Suspense>

      {/* Structured Data */}
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-white">
        {/* Back Navigation */}
        <nav className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tools
            </Link>
          </div>
        </nav>

        {/* Direct Answer Block (AEO Hero) */}
        <DirectAnswerBlock tool={tool} />

        {/* Board Attribution - MANDATORY */}
        <div className="bg-neutral-50 border-b border-neutral-200">
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
            <BoardAttribution
              label={tool.governance.reviewed_by_label}
              url={tool.governance.reviewed_by_url}
              lastReviewed={tool.governance.last_reviewed}
            />
          </div>
        </div>

        {/* Decision Context - Phase 4: Evidence, tradeoffs, uncertainty */}
        <DecisionContext tool={tool} />

        {/* Main Content */}
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Long Description */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              About {tool.name}
            </h2>
            <div className="prose prose-neutral max-w-none">
              <p>{tool.long_description}</p>
            </div>
          </section>

          {/* Download Links - with analytics tracking */}
          {/* Priority: affiliate_url > app stores > website */}
          {/* Phase 6: Includes commercial disclosure when affiliate active */}
          {outbound}

          {/* Clinical Evidence */}
          {tool.clinical_metadata?.clinical_trials && tool.clinical_metadata.clinical_trials.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">
                Clinical Evidence
              </h2>
              <div className="space-y-4">
                {tool.clinical_metadata.clinical_trials.slice(0, 3).map((trial, i) => (
                  <div key={i} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="font-medium text-neutral-900">{trial.study}</p>
                    {trial.outcome && (
                      <p className="mt-2 text-sm text-neutral-600">{trial.outcome}</p>
                    )}
                    {trial.citation && (
                      <p className="mt-2 text-xs text-neutral-500">
                        {trial.citation.authors} ({trial.citation.year}). {trial.citation.journal}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Privacy Details */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Privacy & Security
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <dt className="text-sm text-neutral-500">Privacy Grade</dt>
                <dd className="mt-1 text-lg font-bold text-neutral-900">
                  {tool.privacy.grade !== "unknown" ? tool.privacy.grade : "Not rated"}
                </dd>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <dt className="text-sm text-neutral-500">HIPAA Compliant</dt>
                <dd className="mt-1 text-lg font-bold text-neutral-900">
                  {getComplianceDisplayText(tool.privacy.hipaa_compliant)}
                </dd>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <dt className="text-sm text-neutral-500">Data Sold</dt>
                <dd className="mt-1 text-lg font-bold text-neutral-900">
                  {tool.privacy.data_sold ? "Yes" : "No"}
                </dd>
              </div>
            </div>
            {tool.privacy.notes && (
              <p className="mt-4 text-sm text-neutral-600">{tool.privacy.notes}</p>
            )}
          </section>
        </div>

        {/* Clinician Module - conditional */}
        <ClinicianModule tool={tool} />

        {/* FAQ */}
        <ToolFAQ faqs={tool.seo.faqs} toolName={tool.name} />

        {/* Related Tools - SEO enhanced with alternatives text */}
        <RelatedTools
          tools={relatedTools}
          title={`Alternatives to ${tool.name}`}
          currentToolName={tool.name}
        />

        {/* Compare Section */}
        <PatientCompareSection
          currentSlug={slug}
          toolName={tool.name}
          relatedSlugs={relatedTools.map(t => t.slug)}
          allTools={relatedTools.map(t => ({ slug: t.slug, name: t.name }))}
        />

        {/* Related Hubs - SEO enhanced with keyword-rich linking */}
        <RelatedHubs
          hubSlugs={tool.primary_hubs}
          currentToolSlug={tool.slug}
          currentToolName={tool.name}
        />
      </div>
    </>
  );
}

/** The full guide for the interactive page: long text, FAQs, and the rest. */
function buildToolGuide(tool: any): GuideChapter[] {
  const chapters: GuideChapter[] = [];
  if (tool.long_description) {
    chapters.push({
      id: "about",
      title: `About ${tool.name}`,
      teaser: teaserFrom([tool.long_description]),
      group: "About it",
      minutes: readingMinutes(tool.long_description),
      content: (
        <div className="text-label-secondary max-w-3xl space-y-4 text-[17px] leading-relaxed">
          {String(tool.long_description)
            .split(/\n{2,}/)
            .map((paragraph: string, i: number) => (
              <p key={i}>{paragraph}</p>
            ))}
        </div>
      ),
    });
  }
  const trials = tool.clinical_metadata?.clinical_trials ?? [];
  if (trials.length > 0) {
    chapters.push({
      id: "evidence",
      title: "Clinical evidence",
      teaser: trials[0]?.study ?? null,
      group: "About it",
      minutes: readingMinutes(trials),
      content: (
        <div className="space-y-4">
          {trials.slice(0, 3).map((trial: any, i: number) => (
            <div key={i} className="border-separator rounded-2xl border p-4">
              <p className="text-label-primary font-medium">{trial.study}</p>
              {trial.outcome && <p className="text-label-secondary mt-2 text-sm">{trial.outcome}</p>}
              {trial.citation && (
                <p className="text-label-tertiary mt-2 text-xs">
                  {trial.citation.authors} ({trial.citation.year}). {trial.citation.journal}
                </p>
              )}
            </div>
          ))}
        </div>
      ),
    });
  }
  const faqs = tool.seo?.faqs ?? [];
  if (faqs.length > 0) {
    chapters.push({
      id: "faqs",
      title: "Questions people ask",
      teaser: faqs[0]?.q ?? null,
      group: "Questions",
      minutes: readingMinutes(faqs),
      content: (
        <div className="space-y-5">
          {faqs.map((faq: any, i: number) => (
            <div key={i}>
              <h4 className="text-label-primary font-semibold">{faq.q}</h4>
              <p className="text-label-secondary mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      ),
    });
  }
  if (tool.clinician?.is_clinician_relevant) {
    chapters.push({
      id: "for-clinicians",
      title: "For clinicians",
      teaser: `How clinicians use ${tool.name} with clients`,
      group: "Go further",
      minutes: 1,
      content: <ClinicianModule tool={tool} />,
    });
  }
  if (Array.isArray(tool.primary_hubs) && tool.primary_hubs.length > 0) {
    chapters.push({
      id: "related-topics",
      title: "Related topics",
      teaser: `More apps and guides like ${tool.name}`,
      group: "Go further",
      minutes: 1,
      content: <RelatedHubs hubSlugs={tool.primary_hubs} currentToolSlug={tool.slug} currentToolName={tool.name} />,
    });
  }
  return chapters;
}

/** Comparison links: curated pairs first, then related tools, up to four. */
function buildCompareLinks(currentSlug: string, related: { slug: string; name: string }[], active: Set<string>) {
  const links: { slug: string; name: string; href: string }[] = [];
  for (const comp of KEY_COMPARISONS.filter(
    (c: { a: string; b: string }) => (c.a === currentSlug || c.b === currentSlug) && active.has(c.a) && active.has(c.b)
  )) {
    const otherSlug = comp.a === currentSlug ? comp.b : comp.a;
    const other = TOP_APPS.find((app: { slug: string; name: string }) => app.slug === otherSlug);
    links.push({
      slug: otherSlug,
      name: other?.name || otherSlug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      href: `/tools/for-patients/compare/${comp.a}-vs-${comp.b}`,
    });
  }
  for (const r of related) {
    if (links.length >= 4) break;
    if (links.some((l) => l.slug === r.slug) || !active.has(r.slug)) continue;
    links.push({ slug: r.slug, name: r.name, href: `/tools/for-patients/compare/${currentSlug}-vs-${r.slug}` });
  }
  return links;
}

interface PatientCompareSectionProps {
  currentSlug: string;
  toolName: string;
  relatedSlugs?: string[];
  allTools?: { slug: string; name: string }[];
}

function PatientCompareSection({
  currentSlug,
  toolName,
  relatedSlugs = [],
  allTools = [],
}: PatientCompareSectionProps) {
  // Find pre-defined comparisons that include this tool
  const keyComparisons = KEY_COMPARISONS.filter(
    (comp: { a: string; b: string }) => comp.a === currentSlug || comp.b === currentSlug
  );

  // Build comparison links - prioritize KEY_COMPARISONS, then related tools
  const comparisonLinks: { slug: string; name: string; href: string }[] = [];

  // Add KEY_COMPARISONS first (these have optimized SEO)
  for (const comp of keyComparisons) {
    const otherSlug = comp.a === currentSlug ? comp.b : comp.a;
    const otherApp = TOP_APPS.find((app: { slug: string; name: string }) => app.slug === otherSlug);
    const otherName = otherApp?.name || otherSlug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    comparisonLinks.push({
      slug: otherSlug,
      name: otherName,
      href: `/tools/for-patients/compare/${comp.a}-vs-${comp.b}`,
    });
  }

  // Add related tools as comparison suggestions (up to 4 total)
  for (const relatedSlug of relatedSlugs) {
    if (comparisonLinks.length >= 4) break;
    if (comparisonLinks.some(c => c.slug === relatedSlug)) continue;

    const relatedTool = allTools.find(t => t.slug === relatedSlug);
    if (relatedTool) {
      comparisonLinks.push({
        slug: relatedSlug,
        name: relatedTool.name,
        href: `/tools/for-patients/compare/${currentSlug}-vs-${relatedSlug}`,
      });
    }
  }

  // If still no comparisons, don't show the section
  if (comparisonLinks.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-neutral-900">
            Compare {toolName}
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {comparisonLinks.map(({ slug, name, href }) => (
            <Link
              key={slug}
              href={href}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {toolName} vs {name}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
        <Link
          href="/tools/for-patients/compare"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all comparisons
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export const revalidate = 86400; // 24 hours
export const dynamicParams = true;
