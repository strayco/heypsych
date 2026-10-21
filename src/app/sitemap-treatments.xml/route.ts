/**
 * Treatments Sitemap Route
 *
 * Serves sitemap for all treatment pages (medications, therapies, etc.).
 * https://yourdomain.com/sitemap-treatments.xml
 */

import { NextResponse } from 'next/server';
import { supabaseOptional } from '@/lib/config/database';
import type { Entity } from '@/lib/types/database';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';
// Use pre-generated slugs file for fast lookup (no file I/O at runtime)
import treatmentSlugsData from '@/lib/generated/treatment-slugs.json';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    const db = supabaseOptional();
    if (!db) {
      return new NextResponse('Database unavailable', { status: 503 });
    }

    // Fetch all treatment-related entities
    const { data: treatments } = await db
      .from('entities')
      .select('*')
      .in('type', [
        'medication',
        'therapy',
        'treatment',
        'interventional',
        'alternative',
        'supplement',
        'investigational',
      ])
      .eq('status', 'active')
      .order('title');

    if (!treatments) {
      return new NextResponse('No treatments found', { status: 404 });
    }

    // RENDERABILITY GATE
    //
    // Uses pre-generated slugs file (built at compile time) for O(1) lookup.
    // This avoids reading 600+ JSON files at runtime, reducing function
    // duration from ~1.5GB-hours to milliseconds.
    //
    // The slugs file is regenerated during build via `npm run generate:treatment-slugs`.
    const renderableSlugs = new Set(treatmentSlugsData.slugs);
    const renderable = (treatments as unknown as Entity[]).filter((t) =>
      renderableSlugs.has(t.slug)
    );
    const unrenderable = treatments.length - renderable.length;

    // Generate sitemap directly from renderable entities
    // Note: Previously loaded all 655 JSON files twice to run clinical-completeness
    // checks that 100% failed anyway. Now we just use the renderability gate.
    const generator = getSitemapGenerator();
    const xml = await generator.generateTreatmentsSitemap(renderable);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Sitemap-Total': String(renderable.length),
        'X-Sitemap-Unrenderable-Dropped': String(unrenderable),
      },
    });
  } catch (error) {
    console.error('Failed to generate treatments sitemap:', error);
    return new NextResponse('Failed to generate treatments sitemap', {
      status: 500,
    });
  }
}
