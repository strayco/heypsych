// src/lib/tools/canonical.ts
// Canonical URL logic for tools directory

const BASE_URL = "https://heypsych.com";

/**
 * Get canonical URL for a tool page
 * Each tool has exactly one canonical: /tools/{slug} (no trailing slash)
 */
export function getToolCanonical(slug: string): string {
  return `${BASE_URL}/tools/${slug}`;
}

/**
 * Get canonical URL for a hub page
 */
export function getHubCanonical(hubSlug: string): string {
  return `${BASE_URL}/tools/${hubSlug}`;
}

/**
 * Get canonical URL for a sub-hub page
 */
export function getSubHubCanonical(parentSlug: string, subHubSlug: string): string {
  return `${BASE_URL}/tools/${parentSlug}/${subHubSlug}`;
}

/**
 * Get canonical for filter states
 * Filter states always canonical to base hub URL (noindex, not in sitemap)
 */
export function getFilterCanonical(hubSlug: string): string {
  return `${BASE_URL}/tools/${hubSlug}`;
}

/**
 * Get tools directory canonical
 */
export function getToolsDirectoryCanonical(): string {
  return `${BASE_URL}/tools`;
}

/**
 * Check if a URL should be noindex (filter states)
 * Filter states are client-side only, but if somehow accessed, should be noindex
 */
export function shouldNoIndex(pathname: string, searchParams?: URLSearchParams): boolean {
  // If there are filter query params, noindex
  if (searchParams) {
    const filterParams = ["type", "pricing", "privacy", "platform", "ai"];
    for (const param of filterParams) {
      if (searchParams.has(param)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Build canonical URL from pathname
 */
export function buildCanonicalFromPath(pathname: string): string {
  // Remove trailing slash for canonical consistency
  const cleanPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return `${BASE_URL}${cleanPath}`;
}

/**
 * Validate canonical URL format for tools
 */
export function isValidToolCanonical(url: string): boolean {
  // Accept both slashed and slashless for validation, canonical is slashless
  const pattern = /^https:\/\/heypsych\.com\/tools\/[\w-]+\/?$/;
  return pattern.test(url);
}

/**
 * Validate canonical URL format for hubs
 */
export function isValidHubCanonical(url: string): boolean {
  // Accept both slashed and slashless for validation, canonical is slashless
  const pattern = /^https:\/\/heypsych\.com\/tools\/[\w-]+\/?$/;
  return pattern.test(url);
}

/**
 * Extract slug from canonical URL
 */
export function extractSlugFromCanonical(url: string): string | null {
  const match = url.match(/\/tools\/([\w-]+)\/?$/);
  return match ? match[1] : null;
}
