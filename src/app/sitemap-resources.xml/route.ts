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
import { supabaseOptional } from "@/lib/config/database";
import type { Entity } from "@/lib/types/database";
import { getSitemapGenerator, generateSitemapXml } from "@/lib/seo/sitemap-generator";
import { SITE_CONFIG } from "@/lib/seo/config";

// ISR with daily revalidation - sitemap is cached at edge for 24 hours
// Note: force-dynamic was removed as it conflicts with revalidate
export const revalidate = 86400;

export async function GET() {
  const generator = getSitemapGenerator();

  try {
    const supabase = supabaseOptional();
    if (!supabase) {
      throw new Error("Supabase client unavailable");
    }

    // Fetch all resource entities (excluding assessments)
    const { data: resources, error } = await supabase
      .from("entities")
      .select("*")
      .eq("type", "resource")
      .eq("status", "active")
      .order("title");

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    // Filter out assessments
    const filteredResources =
      resources?.filter((r) => {
        const metadataCategory = (r.metadata as any)?.category;
        return metadataCategory !== "assessments-screeners";
      }) || [];

    console.log(
      `[Sitemap] Generated resources sitemap from database: ${filteredResources.length} resources`
    );

    const xml = await generator.generateResourcesSitemap(
      filteredResources as unknown as Entity[]
    );

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "X-Sitemap-Source": "database",
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
