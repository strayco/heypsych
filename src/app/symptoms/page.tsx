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
  Users,
  Search,
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
import { PageIntro } from "@/components/brand/PageIntro";
import { HubBrowser } from "@/components/hubs/HubBrowser";
import { NoticedSummary } from "@/components/hubs/NoticedSummary";
import { buildGroups, type HubItem } from "@/domains/hubs/model";

export const metadata = generateSymptomsHubMetadata();


export default async function SymptomsPage() {
  // Get all indexable symptoms for server rendering
  const symptoms = getIndexableSymptoms();
  const suggestedPrompts = getSuggestedPrompts();
  const searchIndex = getPrebuiltSearchIndex();

  // One small item per symptom; the browser shelves them by category.
  const hubItems: HubItem[] = [...symptoms]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((symptom) => ({
      href: `/symptoms/${symptom.slug}`,
      title: symptom.name,
      subtitle: symptom.shortDefinition,
      groups: [symptom.category],
      facets: [],
      keywords: symptom.aliases,
    }));
  const hubGroups = buildGroups(
    hubItems,
    SYMPTOM_CATEGORIES.map((c) => ({ id: c.id, label: c.name, description: c.description })),
    4
  );

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

      <div className="min-h-screen bg-canvas">
        <PageIntro
          title="Symptoms"
          object="notebook"
          description="Describe what you've been noticing, in your own words. See what different experiences can feel like and what they can relate to."
          footnote="This helps you explore and put words to experiences. It can't diagnose a condition or replace a professional evaluation."
        >
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
        </PageIntro>

        <NoticedSummary />

        <HubBrowser
          items={hubItems}
          groups={hubGroups}
          groupsTitle="Browse by kind of experience"
          listTitle="All symptoms, A–Z"
          searchLabel="Filter symptoms"
          searchPlaceholder="Filter symptoms"
          showSearch={false}
          noun="symptoms"
        />

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
                className="group flex items-start gap-4 rounded-xl border border-separator bg-surface p-5 transition-all hover:border-neutral-300 hover:shadow-soft"
              >
                <ClipboardList className="h-5 w-5 text-label-tertiary shrink-0" />
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
                className="group flex items-start gap-4 rounded-xl border border-separator bg-surface p-5 transition-all hover:border-neutral-300 hover:shadow-soft"
              >
                <Users className="h-5 w-5 text-label-tertiary shrink-0" />
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
                className="group flex items-start gap-4 rounded-xl border border-separator bg-surface p-5 transition-all hover:border-neutral-300 hover:shadow-soft"
              >
                <Phone className="h-5 w-5 text-label-tertiary shrink-0" />
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
      </div>
    </>
  );
}
