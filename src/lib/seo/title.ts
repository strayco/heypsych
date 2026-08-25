/**
 * TITLE BRAND NORMALIZATION
 *
 * The root layout declares `title.template = "%s | HeyPsych"`, so Next.js
 * appends the brand to every page-level title automatically. Any title that
 * already ends in the brand therefore renders twice:
 *
 *   "Generalized Anxiety Disorder | HeyPsych | HeyPsych"
 *
 * Duplicated brand tokens waste pixels in the SERP snippet and push the
 * distinguishing part of the title past Google's truncation point. This module
 * strips a trailing brand segment so the template can add exactly one.
 *
 * Only a *trailing* segment that is exactly the brand is removed. A title like
 * "Mental Health Apps | HeyPsych Tools Directory" keeps its wording, because
 * there the brand is part of a longer descriptive phrase rather than a suffix.
 */

import { SITE_CONFIG } from './config';

/** Brand tokens that should never appear as a trailing title segment. */
const BRAND_TOKENS = [SITE_CONFIG.name, 'HeyPsych'].map((b) => b.trim().toLowerCase());

/** Separators Next.js title templates and hand-written titles commonly use. */
const SEPARATOR = /\s+[|\-–—]\s+$/;

/**
 * Remove any trailing brand segments from a title.
 *
 * Repeats until no brand suffix remains, so an already-doubled title collapses
 * back to a single clean stem.
 */
export function stripBrandTitleSuffix(title: string): string {
  let result = title.trim();

  // Bound the loop; a title cannot meaningfully have many brand suffixes.
  for (let i = 0; i < 5; i++) {
    const separatorIndex = Math.max(
      result.lastIndexOf(' | '),
      result.lastIndexOf(' - '),
      result.lastIndexOf(' – '),
      result.lastIndexOf(' — ')
    );

    if (separatorIndex === -1) break;

    const lastSegment = result.slice(separatorIndex + 3).trim();
    if (!BRAND_TOKENS.includes(lastSegment.toLowerCase())) break;

    const stem = result.slice(0, separatorIndex).trim().replace(SEPARATOR, '');
    // Never strip down to nothing - a bare brand title is better than empty.
    if (stem.length === 0) break;

    result = stem;
  }

  return result;
}

/**
 * The suffix the root layout's title template appends, e.g. " | HeyPsych".
 * Generators build the unbranded stem, so any length budget must add this back
 * to reason about what Google actually renders.
 */
export const BRAND_TITLE_SUFFIX = ` | ${SITE_CONFIG.name}`;

/**
 * Length of a title stem as it will finally be rendered, including the brand
 * suffix the layout template adds.
 */
export function renderedTitleLength(stem: string): number {
  return stem.length + BRAND_TITLE_SUFFIX.length;
}

/**
 * True when a title would render the brand more than once after the root
 * layout template appends it. Used by validators and regression tests.
 */
export function hasDuplicateBrand(renderedTitle: string): boolean {
  const matches = renderedTitle.match(new RegExp(SITE_CONFIG.name, 'gi'));
  return (matches?.length ?? 0) > 1;
}
