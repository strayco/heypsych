/**
 * Mental Health Treatment Evidence Matrix
 *
 * QUARANTINE STATUS: ACTIVE (2026-08-21)
 *
 * This page contains 45+ unverified quantitative claims (effect sizes, NNT,
 * response rates, grades, ranking colors). Until row-level claim verification
 * is complete, quantitative presentation is SUPPRESSED.
 *
 * Users can still access:
 * - Methodology explanation
 * - Links to individual treatment pages (which have their own verification)
 * - References and sources
 *
 * Quantitative matrix tables are replaced with verification notice.
 *
 * @see Wave 4 of SEO directive
 * @see /src/lib/seo/answer-kings.ts - quarantine registration
 */

import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "fs";
import path from "path";

// Load evidence matrix data at build time
function loadEvidenceMatrix() {
  try {
    const filePath = path.join(
      process.cwd(),
      "data/resources/knowledge-hub/research-and-science/evidence-matrix.json"
    );
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = loadEvidenceMatrix();

  return {
    title:
      data?.seo?.title ||
      "Mental Health Treatment Evidence Matrix | HeyPsych",
    description:
      data?.seo?.meta_description ||
      "Compare mental health treatments with evidence levels from systematic reviews.",
    keywords: data?.seo?.keywords || [],
    // QUARANTINED: Unverified quantitative claims
    robots: {
      index: false, // HARD NOINDEX - do not rely on data flag
      follow: true,
    },
    // Explicit canonical to prevent any alternate URLs
    alternates: {
      canonical: "https://heypsych.com/evidence-matrix",
    },
    openGraph: {
      title: data?.seo?.title || "Mental Health Treatment Evidence Matrix",
      description: data?.seo?.meta_description,
      type: "article",
    },
  };
}

// Quarantine notice component
function QuarantineNotice() {
  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-amber-800 mb-2">
            Quantitative Data Under Review
          </h2>
          <p className="text-amber-700 mb-3">
            The treatment comparison tables on this page contain effect sizes, NNT values,
            and response rates that are pending row-level verification against primary sources.
            To ensure accuracy, these values have been temporarily hidden.
          </p>
          <p className="text-amber-700 text-sm">
            You can still explore individual treatment pages, which contain verified information
            with source citations.
          </p>
        </div>
      </div>
    </div>
  );
}

// Treatment list (without quantitative data)
function TreatmentListSafe({
  conditionData,
}: {
  conditionData: any;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {conditionData.treatments.map((treatment: any) => (
        <Link
          key={treatment.treatment_slug}
          href={`/treatments/${treatment.treatment_slug}`}
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm font-medium">
              {treatment.treatment_name.charAt(0)}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900">
              {treatment.treatment_name}
            </span>
            <span className="block text-xs text-gray-500 capitalize">
              {treatment.treatment_type}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Condition section (safe version without quantitative claims)
function ConditionSectionSafe({
  conditionKey,
  conditionData,
}: {
  conditionKey: string;
  conditionData: any;
}) {
  return (
    <section
      id={conditionKey}
      className="mb-10 scroll-mt-20"
      aria-labelledby={`heading-${conditionKey}`}
    >
      <h2
        id={`heading-${conditionKey}`}
        className="text-xl font-bold text-gray-900 mb-4"
      >
        <Link
          href={`/conditions/${conditionData.condition_slug}`}
          className="hover:text-blue-600"
        >
          {conditionData.condition_name}
        </Link>
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({conditionData.treatments.length} treatments)
        </span>
      </h2>

      <TreatmentListSafe conditionData={conditionData} />
    </section>
  );
}

export default function EvidenceMatrixPage() {
  const data = loadEvidenceMatrix();

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <p>Evidence matrix data not available.</p>
      </div>
    );
  }

  const conditions = Object.entries(data.evidence_matrix || {});
  const methodology = data.methodology;

  // Simplified structured data - no quantitative claims
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: data.name,
    description: "A directory of mental health treatments organized by condition. Quantitative comparison data is under review.",
    url: "https://heypsych.com/evidence-matrix",
    dateModified: data.metadata?.last_updated,
    author: {
      "@type": "Organization",
      name: "HeyPsych",
    },
  };

  return (
    <>
      {/* Structured Data - simplified */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Mental Health Treatment Directory
          </h1>

          <p className="text-lg text-gray-600 max-w-3xl mb-6">
            Explore evidence-based treatments for mental health conditions.
            Click any treatment to view detailed information with verified sources.
          </p>

          {/* QUARANTINE NOTICE - Prominent */}
          <QuarantineNotice />

          {/* Medical Disclaimer */}
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-sm text-gray-700">
            <strong>Medical Disclaimer:</strong> {data.content?.disclaimer}
          </div>
        </header>

        {/* Quick Navigation */}
        <nav className="mb-10 p-4 bg-gray-50 rounded-lg" aria-label="Jump to condition">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Conditions Covered
          </h2>
          <ul className="flex flex-wrap gap-2">
            {conditions.map(([key, conditionData]: [string, any]) => (
              <li key={key}>
                <a
                  href={`#${key}`}
                  className="inline-block px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {conditionData.condition_name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Methodology Section - without quantitative definitions */}
        <section className="mb-10 p-6 bg-gray-50 rounded-lg" aria-labelledby="methodology-heading">
          <h2 id="methodology-heading" className="text-xl font-bold text-gray-900 mb-4">
            Understanding Treatment Evidence
          </h2>

          <div className="prose prose-sm max-w-none text-gray-600">
            <p>
              The treatments listed below have evidence from clinical trials and systematic reviews.
              Each individual treatment page contains detailed information about:
            </p>
            <ul className="mt-3 space-y-1">
              <li>How the treatment works (mechanism of action)</li>
              <li>What conditions it's approved for</li>
              <li>Potential side effects and interactions</li>
              <li>Dosage information (for medications)</li>
              <li>References to clinical research</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              Quantitative comparisons (effect sizes, NNT, response rates) are being verified
              against primary sources and will be restored after review.
            </p>
          </div>
        </section>

        {/* Treatment Directory by Condition - SAFE VERSION */}
        <div className="space-y-6">
          {conditions.map(([key, conditionData]: [string, any]) => (
            <ConditionSectionSafe
              key={key}
              conditionKey={key}
              conditionData={conditionData}
            />
          ))}
        </div>

        {/* References - these are safe to show */}
        <section className="mt-12 pt-8 border-t border-gray-200" aria-labelledby="references-heading">
          <h2 id="references-heading" className="text-xl font-bold text-gray-900 mb-4">
            Sources and References
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Evidence summaries are compiled from the following systematic reviews and meta-analyses.
            Specific claims on individual treatment pages cite their sources directly.
          </p>
          <ul className="space-y-3 text-sm text-gray-600">
            {data.metadata?.references?.map((ref: any, i: number) => (
              <li key={i} className="pl-4 border-l-2 border-gray-300">
                <span className="font-medium">{ref.authors}</span> ({ref.year}).{" "}
                {ref.title}. <em>{ref.journal}</em>.
                {ref.doi && (
                  <a
                    href={`https://doi.org/${ref.doi}`}
                    className="ml-1 text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    DOI
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
          <p>
            Directory last updated: {data.metadata?.last_updated}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Note: Quantitative comparison tables are under review and have been temporarily removed.
          </p>
        </footer>
      </main>
    </>
  );
}
