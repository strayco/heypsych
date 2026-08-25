/**
 * Conditions Sitemap Route
 *
 * Serves sitemap for all condition pages.
 * https://yourdomain.com/sitemap-conditions.xml
 *
 * SITEMAP POLICY:
 * - Uses runtime database query with local fallback
 * - Includes ALL eligible conditions regardless of build-time generation
 * - Preserves sitemap completeness even when database is unavailable
 * - Does not remove pages just because they weren't pre-rendered
 *
 * @see src/lib/build/static-generation-policy.ts - Build-time decisions
 * @see src/lib/conditions/condition-loader.ts - Local data fallback
 */

import { NextResponse } from "next/server";
import { EntityService } from "@/lib/data/entity-service";
import { getSitemapGenerator, generateSitemapXml } from "@/lib/seo/sitemap-generator";
import {
  filterEntitiesForSitemapWithReport,
  logSitemapReport,
  resolveSitemapEntities,
  sitemapReportHeaders,
} from "@/lib/seo/sitemap-eligibility";
import { SITE_CONFIG } from "@/lib/seo/config";

// ISR with daily revalidation - sitemap is cached at edge for 24 hours
// Note: force-dynamic was removed as it conflicts with revalidate
export const revalidate = 86400;

export async function GET() {
  const generator = getSitemapGenerator();

  try {
    // Try database first for the most up-to-date data
    const conditions = await EntityService.getByType("condition");
    const activeConditions = conditions.filter((c) => c.status === "active");

    // Apply the central indexation firewall. Without this the database path
    // emitted every active condition, including ones whose pages render
    // `noindex` - asking Google to index URLs that refuse indexation.
    const report = filterEntitiesForSitemapWithReport(
      activeConditions,
      (c) => `/conditions/${c.slug}`
    );
    logSitemapReport("conditions", report, "database");

    const xml = await generator.generateConditionsSitemap(
      resolveSitemapEntities("conditions", report, activeConditions)
    );

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        ...sitemapReportHeaders(report, "database"),
      },
    });
  } catch (dbError) {
    console.warn(
      "[Sitemap] Database unavailable, falling back to local data:",
      dbError
    );

    // Fallback to local JSON files with SEO eligibility filtering
    // This ensures sitemap remains correct even during database outages
    // by applying the same SEO firewall as the database path
    try {
      const { getSitemapEligibleConditions } = await import(
        "@/lib/conditions/condition-loader"
      );
      const eligibleConditions = await getSitemapEligibleConditions();
      const baseUrl = SITE_CONFIG.url.trim().replace(/\/+$/, "");

      const urls = eligibleConditions.map((c) => ({
        loc: `${baseUrl}/conditions/${c.slug}`,
        lastmod: c.lastmod,
        changefreq: "monthly" as const,
        priority: 0.8,
      }));

      const xml = generateSitemapXml(urls);

      console.log(
        `[Sitemap] Generated conditions sitemap from local files: ${urls.length} eligible conditions`
      );

      return new NextResponse(xml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=3600, s-maxage=3600", // Shorter cache for fallback
          "X-Sitemap-Source": "local-fallback-filtered",
        },
      });
    } catch (localError) {
      console.error("[Sitemap] Failed to generate conditions sitemap:", localError);
      return new NextResponse("Failed to generate conditions sitemap", {
        status: 500,
      });
    }
  }
}
