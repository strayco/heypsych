/**
 * Symptom Detail Page
 *
 * Server-rendered detail page for individual symptoms.
 * SEO-first with comprehensive structured data.
 *
 * Structure:
 * - Breadcrumbs
 * - H1 with canonical name
 * - Direct answer block
 * - "What this can look like" examples
 * - Related experiences
 * - Conditions where this appears
 * - Non-psychiatric considerations
 * - When to seek help
 * - Next steps
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Lightbulb,
  Heart,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  FileText,
  Users,
  Stethoscope,
  Brain,
  Clock,
} from "lucide-react";
import {
  getSymptomBySlug,
  getCategoryMeta,
  getIndexableSymptoms,
  findSymptomBySlugOrAlias,
} from "@/domains/symptoms";
import type { SymptomEntity, SymptomExample } from "@/domains/symptoms/types";
import { generateSymptomMetadata } from "@/lib/seo/metadata-generators/symptom";
import { buildSymptomSchemas } from "@/lib/seo/schema-builders/symptom";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate static params for all indexable symptoms
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const symptoms = getIndexableSymptoms();
  return symptoms.map((s) => ({ slug: s.slug }));
}

/**
 * Generate metadata for this symptom page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const symptom = getSymptomBySlug(slug);

  if (!symptom) {
    return {
      title: "Symptom Not Found",
      robots: { index: false, follow: false },
    };
  }

  return generateSymptomMetadata(symptom);
}

/**
 * Symptom Detail Page Component
 */
export default async function SymptomDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Check for alias redirect
  const resolved = findSymptomBySlugOrAlias(slug);
  if (resolved && resolved.slug !== slug) {
    // This is an alias - redirect to canonical
    const { redirect } = await import("next/navigation");
    redirect(`/symptoms/${resolved.slug}`);
  }

  // Get symptom data
  const symptom = getSymptomBySlug(slug);

  if (!symptom) {
    notFound();
  }

  // Get category metadata
  const categoryMeta = getCategoryMeta(symptom.category);

  // Build schemas
  const schemas = buildSymptomSchemas(symptom);

  return (
    <>
      {/* Schema.org JSON-LD */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <main className="min-h-screen bg-background pb-20">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="border-b border-separator bg-surface"
        >
          <div className="mx-auto max-w-4xl px-4 py-3">
            <ol className="flex flex-wrap items-center gap-1 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-label-tertiary hover:text-label-secondary"
                >
                  Home
                </Link>
              </li>
              <ChevronRight className="h-4 w-4 text-label-quaternary" />
              <li>
                <Link
                  href="/symptoms"
                  className="text-label-tertiary hover:text-label-secondary"
                >
                  Symptoms
                </Link>
              </li>
              {categoryMeta && (
                <>
                  <ChevronRight className="h-4 w-4 text-label-quaternary" />
                  <li>
                    <Link
                      href={`/symptoms?category=${symptom.category}`}
                      className="text-label-tertiary hover:text-label-secondary"
                    >
                      {categoryMeta.name}
                    </Link>
                  </li>
                </>
              )}
              <ChevronRight className="h-4 w-4 text-label-quaternary" />
              <li>
                <span className="font-medium text-label-primary">
                  {symptom.name}
                </span>
              </li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="border-b border-separator bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
            {/* Category badge */}
            {categoryMeta && (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 text-sm font-medium text-accent">
                {categoryMeta.icon && (
                  <span aria-hidden="true">{categoryMeta.icon}</span>
                )}
                {categoryMeta.name}
              </span>
            )}

            {/* H1 - SEO critical */}
            <h1 className="text-3xl font-bold tracking-tight text-label-primary md:text-4xl">
              {symptom.name}
            </h1>

            {/* Direct answer - Featured snippet target */}
            <p className="mt-4 text-lg leading-relaxed text-label-secondary md:text-xl">
              {symptom.shortDefinition}
            </p>

            {/* Aliases as semantic context */}
            {symptom.aliases.length > 0 && (
              <p className="mt-3 text-sm text-label-tertiary">
                Also known as: {symptom.aliases.join(", ")}
              </p>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* What This Can Look Like Section */}
          <section className="mb-12" aria-labelledby="examples-heading">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-accent" />
              <h2
                id="examples-heading"
                className="text-xl font-semibold text-label-primary"
              >
                What This Can Look Like
              </h2>
            </div>

            <p className="mb-6 text-label-secondary">
              {symptom.name} can show up differently in different situations.
              Here are some common experiences:
            </p>

            <div className="space-y-4">
              {symptom.examples.map((example, index) => (
                <ExampleCard key={index} example={example} />
              ))}
            </div>
          </section>

          {/* Related Experiences Section */}
          {symptom.relatedSymptoms.length > 0 && (
            <section className="mb-12" aria-labelledby="related-heading">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="h-5 w-5 text-accent" />
                <h2
                  id="related-heading"
                  className="text-xl font-semibold text-label-primary"
                >
                  Related Experiences
                </h2>
              </div>

              <p className="mb-6 text-label-secondary">
                People who notice {symptom.name.toLowerCase()} sometimes also
                experience:
              </p>

              <div className="flex flex-wrap gap-2">
                {symptom.relatedSymptoms.map((relatedSlug) => {
                  const related = getSymptomBySlug(relatedSlug);
                  if (!related) return null;

                  return (
                    <Link
                      key={relatedSlug}
                      href={`/symptoms/${relatedSlug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-separator bg-surface px-4 py-2 text-sm text-label-secondary transition-all hover:border-accent/30 hover:bg-accent-tint hover:text-accent"
                    >
                      {related.name}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Conditions Where This Appears Section */}
          {symptom.conditionRelationships.length > 0 && (
            <section className="mb-12" aria-labelledby="conditions-heading">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-accent" />
                <h2
                  id="conditions-heading"
                  className="text-xl font-semibold text-label-primary"
                >
                  Conditions Where This Can Appear
                </h2>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-4 mb-6">
                <p className="text-sm text-label-secondary">
                  <strong className="text-label-primary">Important:</strong>{" "}
                  Experiencing {symptom.name.toLowerCase()} does not mean you
                  have any particular diagnosis. Many people experience this
                  without having a diagnosable condition. Only a qualified
                  professional can determine if symptoms meet criteria for a
                  specific diagnosis.
                </p>
              </div>

              <div className="space-y-4">
                {symptom.conditionRelationships.map((rel) => (
                  <Link
                    key={rel.conditionSlug}
                    href={`/conditions/${rel.conditionSlug}`}
                    className="flex items-start gap-4 rounded-xl border border-separator bg-surface p-4 transition-all hover:border-accent/30 hover:shadow-card-2"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-label-primary">
                        {rel.conditionName}
                      </h3>
                      <p className="mt-1 text-sm text-label-secondary line-clamp-2">
                        {rel.context}
                      </p>
                      {rel.prevalence && (
                        <span className="mt-2 inline-block text-xs text-label-tertiary">
                          {rel.prevalence}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-label-quaternary" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Non-Psychiatric Considerations Section */}
          {symptom.nonPsychiatricConsiderations &&
            symptom.nonPsychiatricConsiderations.length > 0 && (
              <section className="mb-12" aria-labelledby="other-causes-heading">
                <div className="flex items-center gap-2 mb-6">
                  <Stethoscope className="h-5 w-5 text-accent" />
                  <h2
                    id="other-causes-heading"
                    className="text-xl font-semibold text-label-primary"
                  >
                    Other Possible Causes
                  </h2>
                </div>

                <p className="mb-6 text-label-secondary">
                  {symptom.name} can sometimes have non-psychological causes
                  that are worth considering:
                </p>

                <ul className="space-y-3">
                  {symptom.nonPsychiatricConsiderations.map(
                    (consideration, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-label-secondary"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-label-quaternary" />
                        <span>{consideration}</span>
                      </li>
                    )
                  )}
                </ul>

                <p className="mt-4 text-sm text-label-tertiary">
                  If you&apos;re experiencing persistent or concerning symptoms,
                  it&apos;s always a good idea to talk with a healthcare
                  provider who can help rule out medical causes.
                </p>
              </section>
            )}

          {/* When to Seek Help Section */}
          {symptom.whenToSeekHelp && symptom.whenToSeekHelp.length > 0 && (
            <section className="mb-12" aria-labelledby="seek-help-heading">
              <div className="flex items-center gap-2 mb-6">
                <Heart className="h-5 w-5 text-accent" />
                <h2
                  id="seek-help-heading"
                  className="text-xl font-semibold text-label-primary"
                >
                  When to Consider Getting Support
                </h2>
              </div>

              <p className="mb-6 text-label-secondary">
                While experiencing {symptom.name.toLowerCase()} doesn&apos;t
                automatically mean you need professional help, there are times
                when reaching out can be beneficial:
              </p>

              <ul className="space-y-3">
                {symptom.whenToSeekHelp.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-label-secondary"
                  >
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Next Steps Section */}
          <section aria-labelledby="next-steps-heading">
            <div className="flex items-center gap-2 mb-6">
              <ArrowRight className="h-5 w-5 text-accent" />
              <h2
                id="next-steps-heading"
                className="text-xl font-semibold text-label-primary"
              >
                Next Steps
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Assessment Links */}
              {symptom.assessmentLinks && symptom.assessmentLinks.length > 0 && (
                <div className="rounded-xl border border-separator bg-surface p-5">
                  <h3 className="font-medium text-label-primary mb-3">
                    Self-Assessment Tools
                  </h3>
                  <ul className="space-y-2">
                    {symptom.assessmentLinks.map((assessment) => (
                      <li key={assessment.href}>
                        <Link
                          href={assessment.href}
                          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                        >
                          {assessment.label}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Find Care */}
              <Link
                href="/psychiatrists"
                className="flex items-start gap-4 rounded-xl border border-separator bg-surface p-5 transition-all hover:border-accent/30 hover:shadow-card-2"
              >
                <Users className="h-6 w-6 shrink-0 text-accent" />
                <div>
                  <h3 className="font-medium text-label-primary">
                    Find a Psychiatrist
                  </h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Connect with a mental health professional who can help.
                  </p>
                </div>
              </Link>

              {/* Explore More Symptoms */}
              <Link
                href="/symptoms"
                className="flex items-start gap-4 rounded-xl border border-separator bg-surface p-5 transition-all hover:border-accent/30 hover:shadow-card-2"
              >
                <Brain className="h-6 w-6 shrink-0 text-accent" />
                <div>
                  <h3 className="font-medium text-label-primary">
                    Explore More Symptoms
                  </h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Learn about other experiences and what they might mean.
                  </p>
                </div>
              </Link>

              {/* Crisis Resources (always visible) */}
              <Link
                href="/resources/support-community/immediate-crisis"
                className="flex items-start gap-4 rounded-xl border border-caution/30 bg-caution-tint p-5 transition-all hover:border-caution/50"
              >
                <AlertCircle className="h-6 w-6 shrink-0 text-caution" />
                <div>
                  <h3 className="font-medium text-label-primary">
                    Need Immediate Support?
                  </h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Crisis resources are available 24/7 if you need help now.
                  </p>
                </div>
              </Link>
            </div>
          </section>

          {/* Disclaimer */}
          <footer className="mt-12 rounded-xl bg-fill-quaternary p-6">
            <p className="text-sm text-label-tertiary">
              <strong className="text-label-secondary">
                Educational Content Only:
              </strong>{" "}
              This page provides general information about common experiences
              and is not intended to diagnose, treat, or provide medical advice.
              Everyone&apos;s situation is different, and what you&apos;re
              experiencing may have many possible explanations. If you have
              concerns about your mental health, please consult with a qualified
              healthcare professional.
            </p>
            {symptom.lastReviewed && (
              <p className="mt-3 text-xs text-label-quaternary">
                Last reviewed: {symptom.lastReviewed}
              </p>
            )}
          </footer>
        </div>
      </main>
    </>
  );
}

/**
 * Example Card Component
 */
function ExampleCard({ example }: { example: SymptomExample }) {
  const contextLabels: Record<string, { label: string; icon: string }> = {
    everyday: { label: "Everyday Life", icon: "🏠" },
    "work-school": { label: "Work or School", icon: "💼" },
    relationships: { label: "Relationships", icon: "👥" },
    internal: { label: "Internal Experience", icon: "🧠" },
    physical: { label: "Physical Sensations", icon: "🫀" },
    social: { label: "Social Situations", icon: "🗣️" },
    sleep: { label: "Sleep & Rest", icon: "😴" },
    motivation: { label: "Motivation", icon: "⚡" },
    general: { label: "General", icon: "✨" },
  };

  const contextInfo = example.context
    ? contextLabels[example.context] ?? { label: "General", icon: "✨" }
    : { label: "General", icon: "✨" };

  return (
    <div className="rounded-xl border border-separator bg-surface p-4">
      <div className="flex items-center gap-2 mb-2">
        <span aria-hidden="true">{contextInfo.icon}</span>
        <span className="text-sm font-medium text-label-tertiary">
          {contextInfo.label}
        </span>
      </div>
      <p className="text-label-secondary leading-relaxed">
        &ldquo;{example.text}&rdquo;
      </p>
    </div>
  );
}
