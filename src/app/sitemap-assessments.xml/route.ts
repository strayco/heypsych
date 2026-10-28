/**
 * Assessments Sitemap Route
 *
 * Serves sitemap for all assessment/screening tool pages.
 * https://yourdomain.com/sitemap-assessments.xml
 */

import { NextResponse } from 'next/server';
import { compareTitles, getLocalRowsByType } from '@/lib/data/local-entities';
import type { Entity } from '@/lib/types/database';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    // Read from data/ files (src/lib/data/local-entities.ts), not Supabase.
    const assessments = [...getLocalRowsByType('resource')]
      .sort(compareTitles)
      .map((r) => ({
        slug: r.slug,
        type: r.type,
        created_at: r.created_at,
        updated_at: r.updated_at,
        category: (r.metadata?.category as string | undefined) ?? null,
        last_updated: (r.metadata?.last_updated as string | undefined) ?? null,
      }));

    // Filter for assessments category
    const filteredAssessments = ((assessments ?? []) as unknown as Array<Record<string, unknown> & { category?: string | null; last_updated?: string | null }>)
      .filter((a) => a.category === 'assessments-screeners')
      .map((a) => ({ ...a, metadata: { category: a.category, last_updated: a.last_updated ?? undefined } }));

    const generator = getSitemapGenerator();
    const xml = await generator.generateAssessmentsSitemap(filteredAssessments as unknown as Entity[]);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate assessments sitemap:', error);
    return new NextResponse('Failed to generate assessments sitemap', {
      status: 500,
    });
  }
}
