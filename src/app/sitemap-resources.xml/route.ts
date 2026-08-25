/**
 * Resources Sitemap Route
 *
 * Serves sitemap for all resource pages (excluding assessments).
 * https://yourdomain.com/sitemap-resources.xml
 *
 * SITEMAP POLICY:
 * - Uses runtime database query with local fallback
 * - Includes ALL eligible resources regardless of build-time generation
 * - Preserves sitemap completeness even when database is unavailable
 *
 * @see src/lib/build/static-generation-policy.ts - Build-time decisions
 * @see src/lib/resources/resource-loader.ts - Local data fallback
 */

import { NextResponse } from "next/server";
import { EntityService } from "@/lib/data/entity-service";
import type { Entity } from "@/lib/types/database";
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
    // Read through EntityService rather than querying rows directly. Raw
    // `entities` rows are not the shape the indexation firewall judges: fields
    // like `visibility` and the nested content are normalized during mapping,
    // so passing raw rows failed every gate and excluded 100% of resources.
    // The safety valve then republished the unfiltered list, meaning this
    // sitemap advertised pages whose own markup says `noindex`.
    const resources = await EntityService.getByType("resource");

    if (resources.length === 0) {
      throw new Error("No resources returned");
    }

    // Assessments are submitted by their own sitemap.
    const filteredResources = resources.filter((r) => {
      const metadataCategory = (r.metadata as Record<string, unknown> | undefined)
        ?.category;
      return metadataCategory !== "assessments-screeners";
    });

    // Apply the central indexation firewall so the database path cannot submit
    // resources whose pages render `noindex`.
    const report = filterEntitiesForSitemapWithReport(
      filteredResources as unknown as Entity[],
      (r) => `/resources/${r.slug}`
    );
    logSitemapReport("resources", report, "database");

    const xml = await generator.generateResourcesSitemap(
      resolveSitemapEntities(
        "resources",
        report,
        filteredResources as unknown as Entity[]
      )
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
      const { getSitemapEligibleResources } = await import(
        "@/lib/resources/resource-loader"
      );
      // Get eligible resources, excluding assessments-screeners category
      const eligibleResources = await getSitemapEligibleResources("assessments-screeners");
      const baseUrl = SITE_CONFIG.url.trim().replace(/\/+$/, "");

      const urls = eligibleResources.map((r) => ({
        loc: `${baseUrl}/resources/${r.slug}`,
        lastmod: r.lastmod,
        changefreq: "monthly" as const,
        priority: 0.7,
      }));

      const xml = generateSitemapXml(urls);

      console.log(
        `[Sitemap] Generated resources sitemap from local files: ${urls.length} eligible resources`
      );

      return new NextResponse(xml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
          "X-Sitemap-Source": "local-fallback-filtered",
        },
      });
    } catch (localError) {
      console.error("[Sitemap] Failed to generate resources sitemap:", localError);
      return new NextResponse("Failed to generate resources sitemap", {
        status: 500,
      });
    }
  }
}
