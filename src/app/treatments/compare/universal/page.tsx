/**
 * Universal Comparison Route - Permanent Redirect
 *
 * This route is deprecated. All comparison functionality has been merged into
 * /treatments/compare with query params.
 *
 * Redirects:
 * /treatments/compare/universal?items=a,b,c&condition=x
 * → /treatments/compare?items=a,b,c&condition=x
 */

import { redirect, permanentRedirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UniversalCompareRedirect({ searchParams }: PageProps) {
  const params = await searchParams;

  // Build the redirect URL preserving all query parameters
  const queryParts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    } else if (Array.isArray(value)) {
      // Handle array params (shouldn't happen but be safe)
      for (const v of value) {
        if (v?.trim()) {
          queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
        }
      }
    }
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const redirectUrl = `/treatments/compare${queryString}`;

  // Use permanentRedirect for SEO - tells search engines this is a permanent move
  permanentRedirect(redirectUrl);
}

// Metadata for the redirect page (shouldn't be indexed)
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
