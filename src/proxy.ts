import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { maybeTrackAIBot } from '@/lib/analytics/ai-telemetry';
import { resolveTreatmentAlias } from '@/lib/treatments/treatment-aliases.generated';
import { entitySlugExists, isResourceToolStub } from '@/lib/entities/entity-slugs.generated';

/**
 * Proxy (Next.js 16's name for middleware) for request handling.
 *
 * Runs only on the paths listed in `config.matcher` below. Every page view that
 * reaches it is a billed invocation on Vercel, so do not widen the matcher
 * without a reason; prefer `redirects()` / `headers()` in next.config.ts,
 * which are served from the edge config at no per-request cost.
 *
 * Domain redirects (www → non-www) are handled at Vercel DNS level, and the
 * noindex header for *.vercel.app previews is set in next.config.ts.
 */
export function proxy(request: NextRequest) {
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
  // TOOL STUBS UNDER /resources → /tools
  // ==========================================================================

  // Most patient tools also have a `resource` row in the database, so search
  // and the resource hubs linked to `/resources/talkspace`, which renders an
  // empty card. The review lives at `/tools/talkspace`. See
  // RESOURCE_TOOL_STUB_SLUGS in scripts/generate-entity-slugs.ts.
  if (pathname.startsWith('/resources/')) {
    const slug = pathname.slice('/resources/'.length).replace(/\/$/, '');
    if (slug && !slug.includes('/') && isResourceToolStub(slug)) {
      return redirectWithUtms(`/tools/${slug}`, 301);
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

  // Legacy V3 clinician hub names are 301s in next.config.ts
  // (src/lib/tools/clinician-redirects.ts).

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

  // Domain redirects (www ↔ non-www) are handled at Vercel DNS level
  // Production domain: heypsych.com
  // www.heypsych.com redirects to heypsych.com via Vercel

  // Social images are static files (public/images/og/*), which the matcher
  // below excludes from middleware, so no special cross-origin handling is
  // needed for social platforms.

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
 * Where the proxy runs. Everything else (home, learn, about, symptoms, API,
 * static files) skips it entirely.
 *
 *   /treatments/*, /conditions/*, /resources/*  alias redirects, tool-stub
 *                                               redirects, true 404s
 *   /tools, /tools/search, /tools/for-clinicians/*, /tools/doximity,
 *   /tools/openevidence                         legacy clinician redirects
 *   /llms.txt                                   CORS for AI agents
 */
export const config = {
  matcher: [
    '/treatments/:path+',
    '/conditions/:path+',
    '/resources/:path+',
    '/tools',
    '/tools/search',
    '/tools/doximity',
    '/tools/openevidence',
    '/tools/for-clinicians/:path+',
    '/llms.txt',
  ],
};
