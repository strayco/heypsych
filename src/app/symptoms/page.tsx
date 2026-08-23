/**
 * Symptoms Hub Page
 *
 * Server-rendered symptom exploration hub.
 * Main content is rendered server-side for SEO, with client-side
 * search enhancement.
 */

import { Suspense } from "react";
import Link from "next/link";
import {
  Heart,
  ShieldAlert,
  Moon,
  Brain,
  Eye,
  Shield,
  Utensils,
  Battery,
  Zap,
  Users,
  Search,
  ArrowRight,
  HelpCircle,
  Phone,
  ClipboardList,
} from "lucide-react";
import { generateSymptomsHubMetadata } from "@/lib/seo/metadata-generators/symptom";
import { buildSymptomsHubSchema } from "@/lib/seo/schema-builders/symptom";
import {
  getIndexableSymptoms,
  SYMPTOM_CATEGORIES,
  getSuggestedPrompts,
  getPrebuiltSearchIndex,
} from "@/domains/symptoms";
import { SymptomsSearchClient } from "./search-client";

export const metadata = generateSymptomsHubMetadata();

// Icon mapping for categories
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "mood-motivation": Heart,
  "worry-fear": ShieldAlert,
  sleep: Moon,
  "attention-memory": Brain,
  "thoughts-perceptions": Eye,
  "trauma-stress": Shield,
  "eating-body-image": Utensils,
  "energy-physical": Battery,
  "behavior-impulses": Zap,
  "relationships-social": Users,
};

export default async function SymptomsPage() {
  // Get all indexable symptoms for server rendering
  const symptoms = getIndexableSymptoms();
  const suggestedPrompts = getSuggestedPrompts();
  const searchIndex = getPrebuiltSearchIndex();

  // Group symptoms by category for browsing
  const symptomsByCategory = SYMPTOM_CATEGORIES.map((category) => ({
    ...category,
    symptoms: symptoms.filter((s) => s.category === category.id),
  })).filter((cat) => cat.symptoms.length > 0);

  // Get popular symptoms (those with most condition relationships)
  const popularSymptoms = [...symptoms]
    .sort(
      (a, b) =>
        b.conditionRelationships.length - a.conditionRelationships.length
    )
    .slice(0, 8);

  // Build structured data
  const schemas = buildSymptomsHubSchema();

  return (
    <>
      {/* Structured Data */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <main className="min-h-screen bg-canvas">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-surface to-canvas pb-12 pt-16 md:pb-16 md:pt-24">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-label-primary md:text-5xl">
              Explore Mental Health Symptoms
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-label-secondary md:text-xl">
              Describe what you&apos;ve been noticing in your own words. Learn what
              different experiences can feel like and what they might mean.
            </p>

            {/* Search - Client Enhanced */}
            <div className="mx-auto mt-8 max-w-xl">
              <Suspense
                fallback={
                  <div className="flex h-14 items-center rounded-2xl bg-surface px-4 shadow-subtle">
                    <Search className="mr-3 h-5 w-5 text-label-tertiary" />
                    <span className="text-label-tertiary">
                      Loading search...
                    </span>
                  </div>
                }
              >
                <SymptomsSearchClient
                  searchIndex={searchIndex}
                  suggestedPrompts={suggestedPrompts}
                />
              </Suspense>
            </div>

            {/* Disclaimer */}
            <p className="mx-auto mt-6 max-w-lg text-sm text-label-tertiary">
              This tool helps you explore and understand symptoms. It cannot
              diagnose conditions or replace professional evaluation.
            </p>
          </div>
        </section>

        {/* Popular Symptoms */}
        <section className="border-t border-separator bg-surface py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-xl font-semibold text-label-primary md:text-2xl">
              Common Experiences
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-label-secondary">
              Many people experience these. Select one to learn more about what
              it can mean.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularSymptoms.map((symptom) => (
                <Link
                  key={symptom.slug}
                  href={`/symptoms/${symptom.slug}`}
                  className="group rounded-xl border border-separator bg-surface p-5 transition-all hover:border-accent/30 hover:shadow-card-2"
                >
                  <h3 className="font-medium text-label-primary group-hover:text-accent">
                    {symptom.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-label-secondary">
                    {symptom.shortDefinition}
                  </p>
                  <div className="mt-3 flex items-center text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Learn more
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Browse by Category */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-xl font-semibold text-label-primary md:text-2xl">
              Browse by Category
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-label-secondary">
              Explore symptoms grouped by the type of experience
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {symptomsByCategory.map((category) => {
                const IconComponent =
                  categoryIcons[category.id] || HelpCircle;

                return (
                  <div
                    key={category.id}
                    className="rounded-xl border border-separator bg-surface p-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-tint">
                        <IconComponent className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-label-primary">
                          {category.name}
                        </h3>
                        <p className="text-sm text-label-tertiary">
                          {category.symptoms.length} symptom
                          {category.symptoms.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-label-secondary">
                      {category.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {category.symptoms.slice(0, 4).map((symptom) => (
                        <li key={symptom.slug}>
                          <Link
                            href={`/symptoms/${symptom.slug}`}
                            className="flex items-center text-sm text-label-primary hover:text-accent"
                          >
                            <span className="mr-2 h-1 w-1 rounded-full bg-accent" />
                            {symptom.name}
                          </Link>
                        </li>
                      ))}
                      {category.symptoms.length > 4 && (
                        <li className="text-sm text-label-tertiary">
                          +{category.symptoms.length - 4} more
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* All Symptoms A-Z (Crawlable Links) */}
        <section className="border-t border-separator bg-surface py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-xl font-semibold text-label-primary md:text-2xl">
              All Symptoms A-Z
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-label-secondary">
              Browse the complete list of symptom pages
            </p>

            <div className="mt-8 columns-2 gap-8 md:columns-3 lg:columns-4">
              {[...symptoms]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((symptom) => (
                  <Link
                    key={symptom.slug}
                    href={`/symptoms/${symptom.slug}`}
                    className="mb-2 block text-sm text-label-primary hover:text-accent hover:underline"
                  >
                    {symptom.name}
                  </Link>
                ))}
            </div>
          </div>
        </section>

        {/* What This Tool Can & Can't Do */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-xl font-semibold text-label-primary md:text-2xl">
              About This Explorer
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-separator bg-surface p-6">
                <h3 className="font-semibold text-positive">
                  What this tool can help with
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-label-secondary">
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                    Understanding what different symptoms can feel like
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                    Learning about conditions where symptoms may appear
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                    Finding words to describe your experience
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                    Knowing when it might be helpful to seek professional
                    support
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-6">
                <h3 className="font-semibold text-negative">
                  What this tool cannot do
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-label-secondary">
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-negative" />
                    Diagnose any mental health condition
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-negative" />
                    Tell you which condition you likely have
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-negative" />
                    Provide treatment recommendations
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-negative" />
                    Replace evaluation by a qualified professional
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="border-t border-separator bg-surface py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-xl font-semibold text-label-primary md:text-2xl">
              Next Steps
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-label-secondary">
              Continue your mental health journey
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/resources/assessments-screeners"
                className="group flex items-start gap-4 rounded-xl border border-separator p-5 transition-all hover:border-accent/30 hover:shadow-card-2"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-treatment-tint">
                  <ClipboardList className="h-5 w-5 text-treatment" />
                </div>
                <div>
                  <h3 className="font-medium text-label-primary group-hover:text-accent">
                    Take an Assessment
                  </h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Validated screening tools for common conditions
                  </p>
                </div>
              </Link>

              <Link
                href="/psychiatrists"
                className="group flex items-start gap-4 rounded-xl border border-separator p-5 transition-all hover:border-accent/30 hover:shadow-card-2"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-positive-tint">
                  <Users className="h-5 w-5 text-positive" />
                </div>
                <div>
                  <h3 className="font-medium text-label-primary group-hover:text-accent">
                    Find a Provider
                  </h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    Search for psychiatrists and mental health professionals
                  </p>
                </div>
              </Link>

              <Link
                href="/resources/support-community/immediate-crisis"
                className="group flex items-start gap-4 rounded-xl border border-separator p-5 transition-all hover:border-accent/30 hover:shadow-card-2"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caution-tint">
                  <Phone className="h-5 w-5 text-caution" />
                </div>
                <div>
                  <h3 className="font-medium text-label-primary group-hover:text-accent">
                    Crisis Support
                  </h3>
                  <p className="mt-1 text-sm text-label-secondary">
                    If you&apos;re in crisis, help is available now
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
