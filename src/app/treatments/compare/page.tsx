/**
 * Treatment Comparison Hub
 *
 * Unified comparison experience:
 * - No items: Shows selector/explorer with curated comparisons
 * - With items: Shows dynamic universal comparison
 *
 * URL format: /treatments/compare?items=slug1,slug2&condition=condition-slug
 */

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { SITE_CONFIG } from "@/lib/seo/config";
import { loadTreatments, parseComparisonUrl } from "@/lib/comparison/treatment-loader";
import {
  generateComparison,
  serializeComparisonResult,
  type ComparisonContext,
} from "@/lib/comparison/comparison-engine";
import { ComparePageClient } from "./compare-client";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface CuratedComparison {
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  drug_class?: string;
}

/**
 * Load curated editorial comparisons from data/treatments/compare/
 */
function getCuratedComparisons(): CuratedComparison[] {
  const comparePath = join(process.cwd(), "data/treatments/compare");

  if (!existsSync(comparePath)) {
    return [];
  }

  try {
    const files = readdirSync(comparePath);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const filePath = join(comparePath, f);
        const content = JSON.parse(readFileSync(filePath, "utf-8"));
        return {
          slug: content.slug,
          name: content.name,
          title: content.title,
          description: content.description,
          category: content.metadata?.category || "general",
          drug_class: content.metadata?.drug_class,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to read comparisons", error);
    return [];
  }
}

/**
 * Generate metadata based on query params
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const items = (typeof params.items === "string" ? params.items : "").split(",").filter(Boolean);

  // Base metadata for empty state (selector/explorer)
  if (items.length < 2) {
    return {
      title: "Compare Treatments | Side-by-Side Analysis",
      description:
        "Compare mental health medications and therapies side by side. See differences in effectiveness, side effects, and find which treatment might be right for you.",
      alternates: {
        canonical: `${SITE_CONFIG.url}/treatments/compare`,
      },
      openGraph: {
        title: "Treatment Comparisons",
        description: "Compare mental health medications and therapies side by side.",
      },
      // Prevent indexing of arbitrary query combinations
      robots: items.length === 1 ? { index: false, follow: true } : undefined,
    };
  }

  // Dynamic metadata for comparisons
  const treatments = await loadTreatments(items);
  const names = Array.from(treatments.values()).map((t) => t.identity.name);

  const title = `Compare ${names.join(" vs ")}`;
  const description = `Side-by-side comparison of ${names.join(", ")}. Compare effectiveness, side effects, dosing, and more.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    // Dynamic comparisons are noindex to prevent duplicate content
    // Curated comparisons at /compare/[slug] are the canonical indexed versions
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * Main comparison page component
 */
export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { items, condition } = parseComparisonUrl(
    new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => [k, v as string])
    )
  );

  // Load curated comparisons for the selector view
  const curatedComparisons = getCuratedComparisons();

  // If no items, show the selector/explorer
  if (items.length === 0) {
    return (
      <Suspense fallback={<ComparisonLoadingSkeleton />}>
        <ComparePageClient
          initialTreatments={[]}
          comparison={null}
          initialCondition={condition}
          curatedComparisons={curatedComparisons}
        />
      </Suspense>
    );
  }

  // Handle validation errors
  if (items.length === 1) {
    return (
      <Suspense fallback={<ComparisonLoadingSkeleton />}>
        <ComparePageClient
          initialTreatments={[]}
          comparison={null}
          error="Select at least 2 treatments to compare"
          initialCondition={condition}
          curatedComparisons={curatedComparisons}
        />
      </Suspense>
    );
  }

  if (items.length > 4) {
    return (
      <Suspense fallback={<ComparisonLoadingSkeleton />}>
        <ComparePageClient
          initialTreatments={[]}
          comparison={null}
          error="Maximum 4 treatments allowed"
          initialCondition={condition}
          curatedComparisons={curatedComparisons}
        />
      </Suspense>
    );
  }

  // Load treatments
  const treatments = await loadTreatments(items);

  // Check if all treatments were found
  const missing = items.filter((slug) => !treatments.has(slug));
  if (missing.length > 0) {
    return (
      <Suspense fallback={<ComparisonLoadingSkeleton />}>
        <ComparePageClient
          initialTreatments={Array.from(treatments.values())}
          comparison={null}
          error={`Could not find: ${missing.join(", ")}`}
          initialCondition={condition}
          curatedComparisons={curatedComparisons}
        />
      </Suspense>
    );
  }

  // Generate comparison
  const context: ComparisonContext = {
    conditionSlug: condition,
    depthLevel: "detailed",
  };

  const treatmentArray = Array.from(treatments.values());
  const comparison = generateComparison(treatmentArray, context);

  // Serialize for client component (removes functions)
  const serializedComparison = serializeComparisonResult(comparison);

  return (
    <Suspense fallback={<ComparisonLoadingSkeleton />}>
      <ComparePageClient
        initialTreatments={treatmentArray}
        comparison={serializedComparison}
        initialCondition={condition}
        curatedComparisons={curatedComparisons}
      />
    </Suspense>
  );
}

function ComparisonLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* Treatment cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 h-32"></div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Revalidate every 24 hours
export const revalidate = 86400;
