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
import {
  ArrowRight,
  RefreshCw,
  Star,
  DollarSign,
  Users,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  FileDown,
  AlertTriangle,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { AlternativeArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import { ClinicianToolCard } from "@/components/tools/clinician";

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
  const alternativeCount = categoryTools.filter(t => t.slug !== slug).length;
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

// Score alternatives (simplified ranking)
function scoreAlternative(tool: ClinicianToolV4, originalTool: ClinicianToolV4): number {
  let score = 0;

  // Same category = highly relevant
  if (tool.primary_category === originalTool.primary_category) score += 50;

  // Featured products
  if (tool.featured) score += 20;

  // Has pricing info
  if (tool.pricing?.starting_price_cents) score += 10;

  // Data quality
  score += (tool.governance?.data_quality_score || 0) / 10;

  // Has capabilities overlap (rough estimate)
  const toolCaps = tool.capabilities || [];
  const origCaps = originalTool.capabilities || [];
  const overlap = toolCaps.filter(c => origCaps.includes(c)).length;
  score += overlap * 5;

  return score;
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

// Types for specialized recommendations
interface SpecializedRecommendation {
  label: string;
  description: string;
  tool: ClinicianToolV4 | null;
  reason: string;
}

// Find specialized alternatives with concrete reasons
function getSpecializedRecommendations(
  original: ClinicianToolV4,
  alternatives: ClinicianToolV4[]
): SpecializedRecommendation[] {
  const originalPrice = original.pricing?.starting_price_cents || 0;
  const recs: SpecializedRecommendation[] = [];

  // Best cheaper alternative
  const cheaperAlts = alternatives
    .filter(t => t.pricing?.starting_price_cents && t.pricing.starting_price_cents < originalPrice)
    .sort((a, b) => (a.pricing?.starting_price_cents || 0) - (b.pricing?.starting_price_cents || 0));

  if (cheaperAlts[0]) {
    const savings = originalPrice - (cheaperAlts[0].pricing?.starting_price_cents || 0);
    const savingsDisplay = `$${(savings / 100).toFixed(0)}/mo`;
    recs.push({
      label: "Best Budget Alternative",
      description: "Save money without sacrificing core features",
      tool: cheaperAlts[0],
      reason: `${cheaperAlts[0].name} starts at ${cheaperAlts[0].pricing?.starting_price_display}, saving you ${savingsDisplay} compared to ${original.name}.`,
    });
  }

  // Best for solo practices
  const soloAlts = alternatives.filter(t =>
    t.audiences?.organization_sizes?.includes("solo") ||
    t.audiences?.practice_settings?.includes("solo-practice")
  );
  if (soloAlts[0]) {
    recs.push({
      label: "Best for Solo Practice",
      description: "Optimized for individual practitioners",
      tool: soloAlts[0],
      reason: `${soloAlts[0].name} is designed specifically for solo practitioners with streamlined workflows and solo-friendly pricing.`,
    });
  }

  // Best for group practices
  const groupAlts = alternatives.filter(t =>
    t.audiences?.organization_sizes?.includes("medium-11-50") ||
    t.audiences?.organization_sizes?.includes("large-51-200") ||
    t.audiences?.practice_settings?.includes("group-practice")
  );
  if (groupAlts[0]) {
    recs.push({
      label: "Best for Group Practice",
      description: "Built for multi-provider workflows",
      tool: groupAlts[0],
      reason: `${groupAlts[0].name} includes group practice features like multi-provider scheduling, staff permissions, and consolidated billing.`,
    });
  }

  // Best for prescribers/psychiatrists
  const prescriberAlts = alternatives.filter(t =>
    t.feature_flags?.has_e_prescribing ||
    t.audiences?.clinician_roles?.includes("psychiatrist") ||
    t.audiences?.clinician_roles?.includes("psychiatric-np-pa")
  );
  if (prescriberAlts[0]) {
    recs.push({
      label: "Best for Prescribers",
      description: "e-Prescribing and EPCS support",
      tool: prescriberAlts[0],
      reason: `${prescriberAlts[0].name} includes ${prescriberAlts[0].feature_flags?.has_e_prescribing ? "native e-prescribing with EPCS" : "prescriber-focused workflows"} for psychiatrists and NPs.`,
    });
  }

  // Best with AI features
  const aiAlts = alternatives.filter(t => t.feature_flags?.has_ai);
  if (aiAlts[0] && !original.feature_flags?.has_ai) {
    recs.push({
      label: "Best with AI",
      description: "AI-powered documentation and automation",
      tool: aiAlts[0],
      reason: `${aiAlts[0].name} includes AI-powered features that ${original.name} lacks, reducing documentation time significantly.`,
    });
  }

  // Best for insurance billing
  const insuranceAlts = alternatives.filter(t =>
    t.feature_flags?.has_rcm ||
    t.capabilities?.includes("claims-submission") ||
    t.capabilities?.includes("billing-rcm")
  );
  if (insuranceAlts[0]) {
    recs.push({
      label: "Best for Insurance",
      description: "Robust claims and billing features",
      tool: insuranceAlts[0],
      reason: `${insuranceAlts[0].name} has integrated insurance billing with claims submission, ERA processing, and eligibility verification.`,
    });
  }

  return recs.filter(r => r.tool !== null).slice(0, 4);
}

export default async function AlternativesPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool) {
    notFound();
  }

  // Get all tools in the same category
  const categoryTools = await ClinicianToolService.getByCategory(tool.primary_category);

  // Filter out the original tool and sort by relevance score
  const alternatives = categoryTools
    .filter((t) => t.slug !== slug)
    .map((t) => ({ tool: t, score: scoreAlternative(t, tool) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.tool);

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-canvas">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm flex-wrap">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/for-clinicians/" className="text-label-secondary hover:text-treatment">
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Alternatives</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-treatment/10 text-treatment border-treatment/20">
                <RefreshCw className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  {tool.name} Alternatives
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {alternatives.length} alternatives in {categoryLabel}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                Looking for alternatives to {tool.name}? Here are the top {categoryLabel.toLowerCase()} options
                for mental health practices. Compare features, pricing, and find the best fit for your workflow.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#migration-guide"
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-primary hover:border-treatment/30 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Migration Guide
              </a>
              <Link
                href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${slug}/`}
                className="inline-flex items-center gap-2 text-sm text-treatment hover:underline"
              >
                View {tool.name} profile
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Top Alternatives */}
        {topAlternatives.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-warning" />
                Top {tool.name} Alternatives
              </h2>
              <p className="text-sm text-label-secondary mb-6">
                Most popular alternatives based on features, reviews, and practice fit
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {topAlternatives.map((alt, idx) => (
                  <div
                    key={alt.slug}
                    className="relative rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-treatment/30 hover:shadow-soft"
                  >
                    <div className="absolute -top-3 left-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-treatment px-2.5 py-0.5 text-xs font-medium text-white">
                        #{idx + 1} Alternative
                      </span>
                    </div>

                    <div className="mt-2">
                      {alt.logo_url ? (
                        <img
                          src={alt.logo_url}
                          alt={alt.name}
                          className="h-12 w-12 rounded-xl border border-separator object-contain bg-white"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-treatment/10 border border-treatment/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-treatment">{alt.name.charAt(0)}</span>
                        </div>
                      )}

                      <h3 className="mt-4 text-lg font-semibold text-label-primary">
                        {alt.name}
                      </h3>

                      <p className="mt-2 text-sm text-label-secondary line-clamp-2">
                        {alt.short_description || alt.one_liner}
                      </p>

                      {alt.pricing?.starting_price_display && (
                        <p className="mt-3 text-sm">
                          <span className="text-label-tertiary">Starting at </span>
                          <span className="font-semibold text-label-primary">
                            {alt.pricing.starting_price_display}
                          </span>
                        </p>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[alt.primary_category] || alt.primary_category}/${alt.slug}/`}
                          className="flex-1 rounded-lg bg-treatment px-3 py-2 text-center text-sm font-medium text-white hover:bg-treatment-600 transition-colors"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/tools/compare?tools=${slug},${alt.slug}`}
                          className="rounded-lg border border-separator px-3 py-2 text-sm font-medium text-label-primary hover:border-treatment/30 transition-colors"
                        >
                          Compare
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Specialized Recommendations - High-value decision support */}
        {specializedRecs.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary mb-2">
                Best {tool.name} Alternative For Your Needs
              </h2>
              <p className="text-sm text-label-secondary mb-6">
                Different practices have different needs. Here are our specific recommendations:
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {specializedRecs.map((rec) => (
                  <div
                    key={rec.label}
                    className="rounded-xl border border-separator bg-canvas p-5 hover:border-treatment/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-treatment">
                          {rec.label}
                        </span>
                        <h3 className="mt-1 text-lg font-semibold text-label-primary">
                          {rec.tool?.name}
                        </h3>
                        <p className="mt-1 text-xs text-label-tertiary">
                          {rec.description}
                        </p>
                      </div>
                      {rec.tool?.pricing?.starting_price_display && (
                        <div className="text-right shrink-0">
                          <span className="text-sm font-medium text-label-primary">
                            {rec.tool.pricing.starting_price_display}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-label-secondary">
                      {rec.reason}
                    </p>
                    <Link
                      href={`/tools/for-clinicians/${rec.tool?.primary_category ? (SCHEMA_TO_TAXONOMY_CATEGORY[rec.tool.primary_category] || rec.tool.primary_category) : ""}/${rec.tool?.slug}/`}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
                    >
                      View {rec.tool?.name}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Architect CTA */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <AlternativeArchitectCTA switchingFrom={slug} />
          </div>
        </section>

        {/* Migration Guide Section */}
        <section id="migration-guide" className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary flex items-center gap-2 mb-2">
              <FileDown className="h-5 w-5 text-treatment" />
              How to Switch from {tool.name}
            </h2>
            <p className="text-sm text-label-secondary mb-6">
              Migration guide with estimated timeline and key steps
            </p>

            {/* Complexity indicator */}
            <div className={`rounded-xl border p-5 mb-6 ${
              migrationComplexity.level === "easy" ? "bg-positive-tint/30 border-positive-border/30" :
              migrationComplexity.level === "moderate" ? "bg-warning/10 border-warning/20" :
              "bg-destructive/10 border-destructive/20"
            }`}>
              <div className="flex items-center gap-3">
                <Clock className={`h-5 w-5 ${
                  migrationComplexity.level === "easy" ? "text-positive-600" :
                  migrationComplexity.level === "moderate" ? "text-warning" :
                  "text-destructive"
                }`} />
                <div>
                  <span className="font-semibold text-label-primary">
                    Migration Complexity: <span className="capitalize">{migrationComplexity.level}</span>
                  </span>
                  <span className="text-label-secondary ml-2">
                    · Estimated time: {migrationComplexity.timeEstimate}
                  </span>
                </div>
              </div>
            </div>

            {/* Key migration steps */}
            <div className="rounded-xl border border-separator bg-canvas p-5">
              <h3 className="font-semibold text-label-primary mb-4">Key Migration Steps</h3>
              <ul className="space-y-3">
                {migrationComplexity.keySteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-treatment shrink-0 mt-0.5" />
                    <span className="text-label-secondary">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Important tips */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-xl border border-separator bg-canvas p-4">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-label-primary text-sm">Export First</h4>
                  <p className="text-xs text-label-tertiary mt-1">
                    Always export your data before canceling—you may lose access immediately.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-separator bg-canvas p-4">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-label-primary text-sm">Check Contract</h4>
                  <p className="text-xs text-label-tertiary mt-1">
                    Review cancellation terms and notice periods to avoid fees.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-separator bg-canvas p-4">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-label-primary text-sm">Notify Team</h4>
                  <p className="text-xs text-label-tertiary mt-1">
                    Ensure staff knows about the switch and schedule training time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Other Alternatives */}
        {otherAlternatives.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary mb-6">
                More {tool.name} Alternatives
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherAlternatives.map((alt) => (
                  <ClinicianToolCard key={alt.slug} tool={alt} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why Switch Section */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Why Look for {tool.name} Alternatives?
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <DollarSign className="h-6 w-6 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Better Pricing</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Find a solution that better fits your budget, especially as your practice grows.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-5">
                <Zap className="h-6 w-6 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Different Features</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Discover alternatives with features {tool.name} doesn't offer.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-5">
                <Users className="h-6 w-6 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Better Fit</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Find software designed specifically for your practice type and workflow.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-5">
                <CheckCircle2 className="h-6 w-6 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Better Integration</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Find an alternative that integrates better with your existing tools.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-6">
            <Link
              href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${slug}/`}
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              {tool.name} profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/tools/integrations/${slug}`}
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              {tool.name} integrations
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/tools/compare?tools=${slug}`}
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              Compare tools
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/`}
              className="flex items-center gap-1 text-sm font-medium text-label-secondary hover:text-treatment"
            >
              All {categoryLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;
