// src/app/sitemap-tools.xml/route.ts
// Sitemap for /tools/ section
//
// P0 FIX: Now includes V4 clinician tools filtered by publication gate

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
 * V4 TOOLS:
 * V4 clinician tools are included only if they pass the publication gate
 * (status === "active" and lifecycle.status in ["active", "beta"]).
 * Additional quality gates (description length) are applied for indexation.
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#lastmod
 */

import { NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";
import { filterToolsForSitemap } from "@/lib/tools/tools-seo";
import { siteConfig } from "@/lib/config/site";
import {
  ClinicianToolService,
  isToolPublishable,
} from "@/lib/tools/clinician-tool-service";

export async function GET() {
  try {
    const urls: SitemapURL[] = [];

    // 1. Tools directory landing (no lastmod - static hub page)
    urls.push({
      loc: `${siteConfig.url}/tools`,
      changefreq: "weekly",
      priority: 0.9,
    });

    // 2. Audience landing pages
    urls.push({
      loc: `${siteConfig.url}/tools/for-patients`,
      changefreq: "weekly",
      priority: 0.85,
    });
    urls.push({
      loc: `${siteConfig.url}/tools/for-clinicians`,
      changefreq: "weekly",
      priority: 0.85,
    });

    // 3. All patient hub pages (no lastmod - static hub pages)
    const hubs = TaxonomyService.getAllHubs();
    for (const hub of hubs) {
      urls.push({
        loc: `${siteConfig.url}${normalizeUrl(hub.url)}`,
        changefreq: "weekly",
        priority: 0.8,
      });
    }

    // 4. All sub-hub pages (no lastmod - static hub pages)
    const subHubs = TaxonomyService.getAllSubHubs();
    for (const subHub of subHubs) {
      urls.push({
        loc: `${siteConfig.url}${normalizeUrl(subHub.url)}`,
        changefreq: "weekly",
        priority: 0.7,
      });
    }

    // 5. V3 clinician hub pages REMOVED - now redirected to V4
    // Legacy hubs (clinical-answers-evidence, ai-scribes-documentation, etc.)
    // are 301-redirected to /tools/for-clinicians in middleware.ts
    // V4 category pages are added below in section 8.

    // 6. All eligible V3 tool pages (filtered by SEO control plane)
    const allTools = await ToolService.getAll();
    const eligibleTools = filterToolsForSitemap(allTools);

    for (const { tool, decision } of eligibleTools) {
      // Only include tools that pass sitemap eligibility
      if (!decision.sitemapEligible) continue;

      const entry: SitemapURL = {
        loc: `${siteConfig.url}/tools/${tool.slug}`,
        changefreq: "monthly",
        priority: 0.6,
      };

      // Only add lastmod if we have actual review date (not fake "today")
      if (tool.governance?.last_reviewed) {
        entry.lastmod = tool.governance.last_reviewed;
      }

      urls.push(entry);
    }

    // 7. V4 Clinician tool product pages (P0 FIX: now included)
    // Publication gate filters to only active, non-draft tools
    const v4Tools = await ClinicianToolService.loadClinicianTools();

    // Track which V4 categories have tools for sitemap inclusion
    const v4CategoriesWithTools = new Set<string>();

    for (const tool of v4Tools) {
      // Additional quality gate: require meaningful description for indexation
      const hasSubstantiveContent =
        tool.short_description && tool.short_description.length > 50;

      if (!hasSubstantiveContent) continue;

      // Track this category
      v4CategoriesWithTools.add(tool.primary_category);

      const entry: SitemapURL = {
        loc: `${siteConfig.url}/tools/for-clinicians/${tool.primary_category}/${tool.slug}`,
        changefreq: "monthly",
        priority: 0.6,
      };

      // Add lastmod from governance if available
      if (tool.governance?.last_reviewed) {
        entry.lastmod = tool.governance.last_reviewed;
      }

      urls.push(entry);
    }

    // 8. V4 Category hub pages (only categories with tools)
    // Empty categories are excluded from sitemap to avoid thin content
    for (const category of v4CategoriesWithTools) {
      urls.push({
        loc: `${siteConfig.url}/tools/for-clinicians/${category}`,
        changefreq: "weekly",
        priority: 0.75,
      });
    }

    // 9. EHR Matcher page (interactive tool, always include)
    if (v4CategoriesWithTools.has("ehr-practice-management")) {
      urls.push({
        loc: `${siteConfig.url}/tools/for-clinicians/ehr-practice-management/match`,
        changefreq: "weekly",
        priority: 0.7,
      });
    }

    // 10. Compare page (landing)
    urls.push({
      loc: `${siteConfig.url}/tools/compare`,
      changefreq: "weekly",
      priority: 0.6,
    });

    // 12. Programmatic SEO pages - High-intent buyer journey pages
    // These are generated for all publishable V4 tools

    // 12a. Alternatives pages (/tools/alternatives/[slug])
    // High buyer intent - user looking for alternatives
    urls.push({
      loc: `${siteConfig.url}/tools/alternatives`,
      changefreq: "weekly",
      priority: 0.7,
    });
    for (const tool of v4Tools) {
      if (!tool.short_description || tool.short_description.length < 50) continue;
      urls.push({
        loc: `${siteConfig.url}/tools/alternatives/${tool.slug}`,
        changefreq: "monthly",
        priority: 0.65,
      });
    }

    // 12b. Switch-from pages (/tools/switch-from/[slug])
    // Highest buyer intent - user actively switching
    for (const tool of v4Tools) {
      if (!tool.short_description || tool.short_description.length < 50) continue;
      urls.push({
        loc: `${siteConfig.url}/tools/switch-from/${tool.slug}`,
        changefreq: "monthly",
        priority: 0.7,
      });
    }

    // 12c. Integrations pages (/tools/integrations/[slug])
    // High intent - checking compatibility before purchase
    urls.push({
      loc: `${siteConfig.url}/tools/integrations`,
      changefreq: "weekly",
      priority: 0.7,
    });
    for (const tool of v4Tools) {
      if (!tool.short_description || tool.short_description.length < 50) continue;
      urls.push({
        loc: `${siteConfig.url}/tools/integrations/${tool.slug}`,
        changefreq: "monthly",
        priority: 0.6,
      });
    }

    // 12d. Practice type pages (/tools/for-practices/[type])
    // High intent - user knows their practice type
    urls.push({
      loc: `${siteConfig.url}/tools/for-practices`,
      changefreq: "weekly",
      priority: 0.75,
    });
    const practiceTypes = [
      "solo-therapist",
      "therapy-group",
      "psychiatry",
      "telehealth-first",
      "iop-php",
      "psychological-testing",
      "addiction-treatment",
      "starting-out",
    ];
    for (const type of practiceTypes) {
      urls.push({
        loc: `${siteConfig.url}/tools/for-practices/${type}`,
        changefreq: "weekly",
        priority: 0.7,
      });
    }

    // 12e. Vendor claim page
    urls.push({
      loc: `${siteConfig.url}/tools/claim`,
      changefreq: "monthly",
      priority: 0.4,
    });

    // 12f. Practice Architect landing
    urls.push({
      loc: `${siteConfig.url}/architect`,
      changefreq: "weekly",
      priority: 0.8,
    });

    // 11. Curated comparisons (only those with all publishable tools)
    const comparisonsDir = join(process.cwd(), "data/tools-v4/comparisons");
    if (existsSync(comparisonsDir)) {
      const comparisonFiles = readdirSync(comparisonsDir).filter((f) =>
        f.endsWith(".json")
      );
      for (const file of comparisonFiles) {
        try {
          const content = JSON.parse(
            readFileSync(join(comparisonsDir, file), "utf-8")
          );
          const toolSlugs: string[] = content.tools || [];

          // Check if all tools are publishable
          let allPublishable = true;
          for (const slug of toolSlugs) {
            const tool = await ClinicianToolService.getBySlug(slug);
            if (!tool || !isToolPublishable(tool)) {
              allPublishable = false;
              break;
            }
          }

          if (allPublishable && toolSlugs.length >= 2 && content.slug) {
            urls.push({
              loc: `${siteConfig.url}/tools/compare/${content.slug}`,
              changefreq: "monthly",
              priority: 0.65,
            });
          }
        } catch {
          // Skip invalid comparison files
        }
      }
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

// Remove trailing slashes from URLs (canonical = no trailing slash)
function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
