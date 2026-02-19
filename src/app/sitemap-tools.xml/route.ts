// src/app/sitemap-tools.xml/route.ts
// Sitemap for /tools/ section

import { NextResponse } from "next/server";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";

const BASE_URL = "https://heypsych.com";

export async function GET() {
  try {
    const urls: SitemapURL[] = [];

    // 1. Tools directory landing
    urls.push({
      loc: `${BASE_URL}/tools/`,
      lastmod: new Date().toISOString().split("T")[0],
      changefreq: "weekly",
      priority: 0.9,
    });

    // 2. All hub pages
    const hubs = TaxonomyService.getAllHubs();
    for (const hub of hubs) {
      urls.push({
        loc: `${BASE_URL}${hub.url}`,
        lastmod: new Date().toISOString().split("T")[0],
        changefreq: "weekly",
        priority: 0.8,
      });
    }

    // 3. All sub-hub pages
    const subHubs = TaxonomyService.getAllSubHubs();
    for (const subHub of subHubs) {
      urls.push({
        loc: `${BASE_URL}${subHub.url}`,
        lastmod: new Date().toISOString().split("T")[0],
        changefreq: "weekly",
        priority: 0.7,
      });
    }

    // 4. Clinician landing page
    const clinicianLanding = TaxonomyService.getClinicianLanding();
    urls.push({
      loc: `${BASE_URL}${clinicianLanding.url}`,
      lastmod: new Date().toISOString().split("T")[0],
      changefreq: "weekly",
      priority: 0.8,
    });

    // 5. All clinician hub pages
    const clinicianHubs = TaxonomyService.getAllClinicianHubs();
    for (const clinicianHub of clinicianHubs) {
      urls.push({
        loc: `${BASE_URL}${clinicianHub.url}`,
        lastmod: new Date().toISOString().split("T")[0],
        changefreq: "weekly",
        priority: 0.7,
      });
    }

    // 6. All tool pages
    const tools = await ToolService.getAll();
    for (const tool of tools) {
      urls.push({
        loc: `${BASE_URL}/tools/${tool.slug}/`,
        lastmod: tool.governance.last_reviewed || new Date().toISOString().split("T")[0],
        changefreq: "monthly",
        priority: 0.6,
      });
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
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

function generateSitemapXML(urls: SitemapURL[]): string {
  const urlElements = urls
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
    )
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
