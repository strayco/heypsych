import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { maybeTrackAIBot } from '@/lib/analytics/ai-telemetry';

/**
 * Middleware to enforce canonical host (www.heypsych.com)
 *
 * Redirects:
 * - https://heypsych.com/* → https://www.heypsych.com/* (301 permanent)
 *
 * Skips:
 * - localhost (development)
 * - *.vercel.app (preview deployments)
 * - API routes, static files, images
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Skip localhost and Vercel preview deployments
  if (hostname.includes('localhost') || hostname.includes('.vercel.app')) {
    return NextResponse.next();
  }

  // Redirect non-www to www (301 permanent)
  // Only redirect heypsych.com domain (not other domains)
  if (!hostname.startsWith('www.') && hostname.includes('heypsych.com')) {
    const url = request.nextUrl.clone();
    url.host = `www.${hostname}`;

    // 301 Moved Permanently - tells search engines this is the canonical URL
    return NextResponse.redirect(url, {
      status: 301,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

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
