/**
 * Treatments Sitemap Route
 *
 * Serves sitemap for all treatment pages (medications, therapies, etc.).
 * https://yourdomain.com/sitemap-treatments.xml
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/config/database';
import type { Entity } from '@/lib/types/database';
import { getSitemapGenerator } from '@/lib/seo/sitemap-generator';
import { getAllTreatmentSlugs, loadTreatment } from '@/lib/comparison/treatment-loader';
import { treatmentV3ToEntity } from '@/lib/comparison/treatment-entity-adapter';
import {
  filterEntitiesForSitemapWithReport,
  logSitemapReport,
  resolveSitemapEntities,
  sitemapReportHeaders,
} from '@/lib/seo/sitemap-eligibility';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export async function GET() {
  try {
    // Fetch all treatment-related entities
    const { data: treatments } = await supabase
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
    // `/treatments/[slug]` renders exclusively from local JSON via the canonical
    // treatment loader, but this sitemap reads the database. The two disagree:
    // the database carries treatment rows that have no JSON file, so the sitemap
    // was submitting URLs that cannot render (measured 2026-08-25: 107 of 592).
    //
    // A sitemap is a set of index requests, so advertising a URL the app cannot
    // serve wastes crawl budget on soft 404s. Gate on the same slug list the
    // page itself uses, so the sitemap can only ever contain renderable URLs.
    const renderableSlugs = new Set(getAllTreatmentSlugs());
    const renderable = (treatments as unknown as Entity[]).filter((t) =>
      renderableSlugs.has(t.slug)
    );
    const unrenderable = treatments.length - renderable.length;

    if (unrenderable > 0) {
      console.warn(
        `[Sitemap] treatments: dropped ${unrenderable} database rows with no ` +
          `local JSON file (not renderable at /treatments/[slug]).`
      );
    }

    // JUDGE THE ENTITY THE PAGE ACTUALLY RENDERS
    //
    // Database rows for treatments carry only a shallow projection of the
    // content: scored directly, all 485 failed the clinical-completeness gate
    // and the sitemap fell back to emitting an unfiltered list. The page builds
    // its entity from local JSON, so that is the shape whose decision matches
    // the robots tag a crawler will actually see. Decide from local JSON, then
    // emit the database row, which carries real `updated_at` timestamps for
    // <lastmod>.
    const localEntities = new Map<string, Entity>();
    for (const slug of renderableSlugs) {
      const treatment = await loadTreatment(slug);
      if (treatment) localEntities.set(slug, treatmentV3ToEntity(treatment));
    }

    const report = filterEntitiesForSitemapWithReport(
      renderable,
      (t) => `/treatments/${t.slug}`,
      (t) => localEntities.get(t.slug) ?? t
    );
    logSitemapReport('treatments', report, 'local-json-decision');

    const generator = getSitemapGenerator();
    const xml = await generator.generateTreatmentsSitemap(
      resolveSitemapEntities('treatments', report, renderable)
    );

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        ...sitemapReportHeaders(report, 'database'),
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
