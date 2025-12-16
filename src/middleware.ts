import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
