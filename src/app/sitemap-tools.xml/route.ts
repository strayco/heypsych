// src/app/sitemap-tools.xml/route.ts
// Sitemap for /tools/ section

/**
 * SITEMAP FRESHNESS POLICY:
 * Hub/landing pages do NOT get lastmod timestamps - these are navigation pages.
 * Tool detail pages use actual governance.last_reviewed dates when available.
 * Fabricating "today" dates destroys trust signals.
 *
 * SITEMAP ELIGIBILITY:
 * Uses central SEO control plane for inclusion decisions.
 * Draft, archived, retired, thin, or ineligible tools are excluded.
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#lastmod
 */

import { NextResponse } from "next/server";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";
import { filterToolsForSitemap } from "@/lib/tools/tools-seo";
import { siteConfig } from "@/lib/config/site";

export async function GET() {
  try {
    const urls: SitemapURL[] = [];

    // 1. Tools directory landing (no lastmod - static hub page)
    urls.push({
      loc: `${siteConfig.url}/tools/`,
      changefreq: "weekly",
      priority: 0.9,
    });

    // 2. Audience landing pages
    urls.push({
      loc: `${siteConfig.url}/tools/for-patients/`,
      changefreq: "weekly",
      priority: 0.85,
    });
    urls.push({
      loc: `${siteConfig.url}/tools/for-clinicians/`,
      changefreq: "weekly",
      priority: 0.85,
    });

    // 3. All patient hub pages (no lastmod - static hub pages)
    const hubs = TaxonomyService.getAllHubs();
    for (const hub of hubs) {
      urls.push({
        loc: `${siteConfig.url}${hub.url}`,
        changefreq: "weekly",
        priority: 0.8,
      });
    }

    // 4. All sub-hub pages (no lastmod - static hub pages)
    const subHubs = TaxonomyService.getAllSubHubs();
    for (const subHub of subHubs) {
      urls.push({
        loc: `${siteConfig.url}${subHub.url}`,
        changefreq: "weekly",
        priority: 0.7,
      });
    }

    // 5. All clinician hub pages (no lastmod - static hub pages)
    const clinicianHubs = TaxonomyService.getAllClinicianHubs();
    for (const clinicianHub of clinicianHubs) {
      urls.push({
        loc: `${siteConfig.url}${clinicianHub.url}`,
        changefreq: "weekly",
        priority: 0.7,
      });
    }

    // 6. All eligible tool pages (filtered by SEO control plane)
    const allTools = await ToolService.getAll();
    const eligibleTools = filterToolsForSitemap(allTools);

    for (const { tool, decision } of eligibleTools) {
      // Only include tools that pass sitemap eligibility
      if (!decision.sitemapEligible) continue;

      const entry: SitemapURL = {
        loc: `${siteConfig.url}/tools/${tool.slug}/`,
        changefreq: "monthly",
        priority: 0.6,
      };

      // Only add lastmod if we have actual review date (not fake "today")
      if (tool.governance?.last_reviewed) {
        entry.lastmod = tool.governance.last_reviewed;
      }

      urls.push(entry);
    }

    // Generate XML
    const xml = generateSitemapXML(urls);

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Error generating tools sitemap:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

interface SitemapURL {
  loc: string;
  lastmod?: string; // Optional - only include when we have real data
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

function generateSitemapXML(urls: SitemapURL[]): string {
  const urlElements = urls
    .map((url) => {
      let entry = `  <url>
    <loc>${escapeXml(url.loc)}</loc>`;
      // Only include lastmod if present
      if (url.lastmod) {
        entry += `
    <lastmod>${url.lastmod}</lastmod>`;
      }
      entry += `
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
      return entry;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
