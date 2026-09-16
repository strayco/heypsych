/**
 * Programmatic VS Comparison Pages - REDIRECT LAYER
 *
 * CANNIBALIZATION FIX: All comparison traffic is canonicalized to /tools/compare/[slug]
 * where curated, high-quality comparison content lives.
 *
 * This route exists only to capture any legacy links and redirect them properly.
 * All new internal links should point to /tools/compare/ directly.
 */

import { redirect, notFound } from "next/navigation";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Comparisons dir for checking curated versions
const COMPARISONS_DIR = join(process.cwd(), "data/tools-v4/comparisons");

/**
 * Check if a curated comparison exists
 */
function hasCuratedComparison(slug: string): boolean {
  return existsSync(join(COMPARISONS_DIR, `${slug}.json`));
}

/**
 * Get all valid comparison slugs for static generation
 */
function getAllComparisonSlugs(): string[] {
  if (!existsSync(COMPARISONS_DIR)) return [];
  return readdirSync(COMPARISONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

// ============================================================================
// STATIC PARAMS - Generate for all curated comparisons so they can redirect
// ============================================================================

export function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({ slug }));
}

// Allow dynamic params for any comparison
export const dynamicParams = true;

// ============================================================================
// METADATA - Redirect before rendering, so minimal metadata
// ============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // This page redirects, so return minimal robots directive
  return {
    title: "Redirecting...",
    robots: { index: false, follow: true },
  };
}

// ============================================================================
// PAGE COMPONENT - Just redirect to canonical route
// ============================================================================

export default async function CompareRedirectPage({ params }: PageProps) {
  const { slug } = await params;

  // If curated comparison exists, redirect to canonical URL
  if (hasCuratedComparison(slug)) {
    redirect(`/tools/compare/${slug}/`);
  }

  // If no curated comparison exists, 404
  // Users should use the main comparison hub at /tools/compare/ to build ad-hoc comparisons
  notFound();
}
