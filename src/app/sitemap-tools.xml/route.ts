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
import { NEEDS, isListable } from "@/domains/patient-tools/finder/model";
import { INTENTS } from "@/domains/patient-tools/shelves/model";
import { KEY_COMPARISONS } from "@/lib/seo/patient-programmatic-seo-engine";
import { ToolService } from "@/lib/tools/tool-service";
import { filterToolsForSitemap } from "@/lib/tools/tools-seo";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { resolveCategoryHubSlug } from "@/lib/tools/category-hub-slug";
import { getAllPublishableCurated } from "@/lib/tools/curated-comparisons";

export async function GET() {
  try {
    const urls: SitemapURL[] = [];

    // 1. Tools directory landing (no lastmod - static hub page)
    urls.push({
      loc: `${siteConfig.url}/tools`,
      changefreq: "weekly",
      priority: 0.9,
    });

    // 2. Clinician hub
    urls.push({
      loc: `${siteConfig.url}/tools/for-clinicians`,
      changefreq: "weekly",
      priority: 0.85,
    });

    // 3. Patient need pages (the finder, preset to a need)
    for (const need of NEEDS) {
      urls.push({
        loc: `${siteConfig.url}${need.href}`,
        changefreq: "weekly",
        priority: 0.8,
      });
    }

    // 3b. Patient intent pages (online therapy, free apps, …)
    for (const intent of INTENTS) {
      urls.push({ loc: `${siteConfig.url}${intent.href}`, changefreq: "weekly", priority: 0.8 });
    }

    // 4. Compare-any page and patient head-to-heads
    const activeApps = new Set((await ToolService.getAll()).filter(isListable).map((t) => t.slug));
    for (const { a, b } of KEY_COMPARISONS.filter((c) => activeApps.has(c.a) && activeApps.has(c.b))) {
      urls.push({
        loc: `${siteConfig.url}/tools/for-patients/compare/${a}-vs-${b}`,
        changefreq: "monthly",
        priority: 0.6,
      });
    }

    // 5. V3 clinician hub pages REMOVED - now redirected to V4
    // Legacy hubs (clinical-answers-evidence, ai-scribes-documentation, etc.)
    // are 301-redirected in next.config.ts (src/lib/tools/clinician-redirects.ts)
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

      const taxonomyCategory = SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category;
      const entry: SitemapURL = {
        loc: `${siteConfig.url}/tools/for-clinicians/${taxonomyCategory}/${tool.slug}`,
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
    // Empty categories are excluded from sitemap to avoid thin content.
    // Schema category slugs are translated to the taxonomy slugs the hub route
    // actually serves; unresolvable categories are skipped rather than emitted
    // as 404s.
    const emittedHubSlugs = new Set<string>();
    for (const category of v4CategoriesWithTools) {
      const hubSlug = resolveCategoryHubSlug(category);
      if (!hubSlug || emittedHubSlugs.has(hubSlug)) continue;
      emittedHubSlugs.add(hubSlug);

      urls.push({
        loc: `${siteConfig.url}/tools/for-clinicians/${hubSlug}`,
        changefreq: "weekly",
        priority: 0.75,
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
    // Only include tools that have 3+ alternatives in their category (meaningful content)
    // Pre-compute category counts
    const categoryCounts = new Map<string, number>();
    for (const tool of v4Tools) {
      const cat = tool.primary_category;
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    }

    // Per-tool alternatives pages
    for (const tool of v4Tools) {
      if (!tool.short_description || tool.short_description.length < 50) continue;
      // Quality gate: only include if category has 4+ tools (3+ alternatives)
      const categorySize = categoryCounts.get(tool.primary_category) || 0;
      if (categorySize < 4) continue;
      urls.push({
        loc: `${siteConfig.url}/tools/alternatives/${tool.slug}`,
        changefreq: "monthly",
        priority: 0.65,
      });
    }

    // Retired 2026-10-23 (301s in src/lib/tools/clinician-redirects.ts):
    // switch-from, integrations, works-with, for-practices, best, best-for,
    // pricing, stacks, audience and feature landers, clinician guides.

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

    // 11. Curated comparisons: the same publication gate as the page.
    for (const c of await getAllPublishableCurated()) {
      urls.push({
        loc: `${siteConfig.url}/tools/compare/${c.slug}`,
        changefreq: "monthly",
        priority: 0.65,
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
