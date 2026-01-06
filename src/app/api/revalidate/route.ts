import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand revalidation endpoint
 *
 * Usage:
 *   POST /api/revalidate?secret=YOUR_SECRET&path=/treatments/happify
 *   POST /api/revalidate?secret=YOUR_SECRET&clearAll=true
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');
  const path = searchParams.get('path');
  const clearAll = searchParams.get('clearAll') === 'true';

  // Validate secret token
  const revalidateSecret = process.env.REVALIDATE_SECRET || 'dev-secret-change-in-production';

  if (secret !== revalidateSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    if (clearAll) {
      // Revalidate common resource paths
      const resourceSlugs = [
        'betterhelp', 'calm', 'cbt-i-coach', 'deepscribe', 'daylio', 'happify',
        'headspace', 'insight-timer', 'mindshift-cbt', 'moodfit',
        'ptsd-coach', 'rootd', 'talkspace', 'woebot', 'wysa'
      ];

      const paths = resourceSlugs.flatMap(slug => [
        `/treatments/${slug}`,
        `/conditions/${slug}`,
        `/resources/${slug}`,
      ]);

      for (const p of paths) {
        revalidatePath(p);
      }

      return NextResponse.json({
        revalidated: true,
        count: paths.length,
        message: `Revalidated ${paths.length} paths`
      });
    }

    if (!path) {
      return NextResponse.json({ error: 'Missing path or clearAll parameter' }, { status: 400 });
    }

    revalidatePath(path);

    return NextResponse.json({ revalidated: true, path });
  } catch (error) {
    return NextResponse.json({ error: 'Error revalidating', details: String(error) }, { status: 500 });
  }
}
