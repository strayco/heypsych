import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { maybeTrackAIBot } from '@/lib/analytics/ai-telemetry';
import { resolveTreatmentAlias } from '@/lib/treatments/treatment-aliases.generated';
import { entitySlugExists } from '@/lib/entities/entity-slugs.generated';

/**
 * Middleware for request handling
 *
 * Domain redirects (www → non-www) are handled at Vercel DNS level.
 * Production domain: heypsych.com
 *
 * Skips:
 * - localhost (development)
 * - *.vercel.app (preview deployments)
 * - API routes, static files, images
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  // ==========================================================================
  // LEGACY CLINICIAN REDIRECTS (V3 → V4 Migration)
  // ==========================================================================

  // Helper to preserve UTM params during redirects
  const redirectWithUtms = (destination: string, status: 301 | 302 = 301) => {
    const url = new URL(destination, request.url);
    // Preserve UTM parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const value = searchParams.get(param);
      if (value) url.searchParams.set(param, value);
    });
    return NextResponse.redirect(url, status);
  };

  // ==========================================================================
  // TREATMENT SLUG ALIASES (generic + brand names → canonical page)
  // ==========================================================================

  // Treatment pages live at compound slugs like `/treatments/sertraline-zoloft`,
  // but search demand is for the parts: "sertraline", "zoloft". Those bare URLs
  // matched no page, and because the route streams a prerendered shell the
  // resulting `notFound()` could not set a status - they answered HTTP 200 with
  // an empty skeleton, which Google reads as a soft 404.
  //
  // Redirecting here resolves the alias before rendering begins, so the response
  // is a real 301 that consolidates any accumulated signals onto the canonical
  // page. The alias table is generated from data/treatments at build time; see
  // scripts/generate-treatment-aliases.ts.
  if (pathname.startsWith('/treatments/')) {
    const slug = pathname.slice('/treatments/'.length);

    // Only single-segment slugs are treatment detail pages.
    if (slug && !slug.includes('/')) {
      const canonical = resolveTreatmentAlias(slug);
      if (canonical) {
        return redirectWithUtms(`/treatments/${canonical}`, 301);
      }
    }
  }

  // ==========================================================================
  // UNKNOWN DATABASE-BACKED ENTITY URLS → TRUE 404
  // ==========================================================================

  // `/conditions/[slug]` and `/resources/[slug]` are database-backed, so the
  // static generation policy renders them on demand: `generateStaticParams`
  // returns nothing and `dynamicParams` stays true. An unknown slug therefore
  // reaches the page, which streams a shell before `notFound()` resolves - the
  // response is HTTP 200 with no content, which Google reads as a soft 404.
  //
  // `dynamicParams = false` (the fix used for /treatments) is not available
  // here: with no pre-rendered params it would 404 the entire section. So the
  // set of real slugs is snapshotted at build time and checked before rendering
  // begins, which leaves on-demand rendering of real pages untouched.
  //
  // See scripts/generate-entity-slugs.ts.
  const entityRoute = pathname.startsWith('/conditions/')
    ? ('conditions' as const)
    : pathname.startsWith('/resources/')
      ? ('resources' as const)
      : null;

  if (entityRoute) {
    const slug = pathname.slice(`/${entityRoute}/`.length).replace(/\/$/, '');

    // Only single-segment paths are entity detail pages; nested paths belong to
    // their own route files.
    if (slug && !slug.includes('/') && !entitySlugExists(entityRoute, slug)) {
      return NextResponse.rewrite(new URL('/_not-found', request.url), {
        status: 404,
      });
    }
  }

  // Redirect /tools?audience=clinician → /tools/for-clinicians
  if (pathname === '/tools' && searchParams.get('audience') === 'clinician') {
    return redirectWithUtms('/tools/for-clinicians');
  }

  // Redirect /tools/search?audience=clinician → /tools/for-clinicians
  if (pathname === '/tools/search' && searchParams.get('audience') === 'clinician') {
    return redirectWithUtms('/tools/for-clinicians');
  }

  // V3 clinician hub → V4 redirects
  // practice-admin-operations → ehr-practice-management is a true equivalent (301)
  // Others redirect temporarily to landing until V4 equivalents have inventory (302)
  // Using 302 for non-equivalent redirects prevents soft-404 treatment by Google
  const v3EquivalentRedirects: Record<string, string> = {
    '/tools/for-clinicians/practice-admin-operations': '/tools/for-clinicians/ehr-practice-management',
  };

  if (v3EquivalentRedirects[pathname]) {
    return redirectWithUtms(v3EquivalentRedirects[pathname], 301);
  }

  // Temporary redirects to landing (302) - not true equivalents
  const v3TemporaryRedirects: string[] = [
    '/tools/for-clinicians/clinical-answers-evidence',
    '/tools/for-clinicians/ai-scribes-documentation',
    '/tools/for-clinicians/billing-coding',
    '/tools/for-clinicians/prescribing-medication-support',
    '/tools/for-clinicians/patient-engagement-between-visits',
  ];

  if (v3TemporaryRedirects.includes(pathname)) {
    return redirectWithUtms('/tools/for-clinicians', 302);
  }

  // Redirect retired V3 clinician tools temporarily to landing (302)
  // Use 302 since these aren't true equivalents
  const v3RetiredTools: string[] = [
    // NOTE: /tools/practiceq removed - intakeq-practiceq not yet publishable
    '/tools/doximity',
    '/tools/openevidence',
  ];

  if (v3RetiredTools.includes(pathname)) {
    return redirectWithUtms('/tools/for-clinicians', 302);
  }

  // Skip localhost and Vercel preview deployments
  if (hostname.includes('localhost') || hostname.includes('.vercel.app')) {
    const response = NextResponse.next();

    // Block Vercel preview deployments from Google indexing
    // This prevents Google from showing Vercel's favicon for preview URLs
    if (hostname.includes('.vercel.app')) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }

    return response;
  }

  // Domain redirects (www ↔ non-www) are handled at Vercel DNS level
  // Production domain: heypsych.com
  // www.heypsych.com redirects to heypsych.com via Vercel

  // Special handling for OG images - allow cross-origin access for social platforms
  if (pathname === '/opengraph-image' || pathname.startsWith('/opengraph-image?')) {
    const response = NextResponse.next();

    // Explicitly set permissive CORS headers to ensure LinkedIn/Facebook/Twitter can load OG images
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

    return response;
  }

  // AI Agent CORS - allow cross-origin access for LLM crawlers
  // Enables browser-based AI sidekicks (Perplexity, Claude-Web, custom medical GPTs)
  // to fetch llms.txt without being blocked by browser CORS policies
  if (pathname === '/llms.txt') {
    // Track AI bot access for telemetry
    maybeTrackAIBot(request, 'llms.txt');

    const response = NextResponse.next();

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

    return response;
  }

  return NextResponse.next();
}

/**
 * Middleware matcher configuration
 *
 * Runs on all routes except:
 * - API routes (/api/*)
 * - Next.js internals (_next/static, _next/image)
 * - Static files (favicon, images, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - Static assets (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|eot)).*)',
  ],
};
