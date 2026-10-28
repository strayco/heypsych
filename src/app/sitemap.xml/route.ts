/**
 * Legacy sitemap.xml Compatibility Redirect
 *
 * Redirects /sitemap.xml to /sitemap-index.xml for backward compatibility.
 * The canonical sitemap is sitemap-index.xml (multi-sitemap architecture).
 *
 * This redirect exists because:
 * 1. Some crawlers/tools may request /sitemap.xml by convention
 * 2. External services may have cached /sitemap.xml references
 * 3. Documentation may reference the old path
 *
 * The redirect is permanent (301) to update caches and pass link equity.
 */

import { NextResponse } from 'next/server';

// Without this the route is prerendered at build, and the redirect is baked
// into an empty static file served as a 200 (no sitemap at /sitemap.xml).
export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://heypsych.com').trim().replace(/\/+$/, '');

  return NextResponse.redirect(`${baseUrl}/sitemap-index.xml`, {
    status: 301, // Permanent redirect
    headers: {
      // A day, not a year-long "immutable": cheap either way, and it means a
      // change to where /sitemap.xml points reaches crawlers within a day.
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
