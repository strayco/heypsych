/**
 * /sitemap-guide.xml timed out at 300 seconds in production (2026-11-12):
 * it ran per request, and on a warm instance compared every page with every
 * page from earlier runs, which also changed which URLs it listed.
 */
import { describe, expect, it } from "vitest";
import { getGuideSitemapEntries, renderGuideSitemapXml } from "../guide-sitemap";
import { parseDynamicSlug } from "../dynamic-generator";
import * as route from "@/app/sitemap-guide.xml/route";

describe("guide sitemap", () => {
  it("is built at build time, not per request", () => {
    expect(route.dynamic).toBe("force-static");
    expect("revalidate" in route).toBe(false);
  });

  it("lists the same URLs on every call, and only URLs that resolve", { timeout: 180_000 }, async () => {
    const first = await getGuideSitemapEntries();
    const second = await getGuideSitemapEntries();

    expect(first.length).toBeGreaterThan(500);
    expect(second).toEqual(first);
    expect(new Set(first.map((e) => e.slug)).size).toBe(first.length);

    for (const { slug } of first) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(await parseDynamicSlug(slug)).not.toBeNull();
    }
  });

  it("renders valid sitemap XML on the production host with no request-time lastmod", () => {
    const xml = renderGuideSitemapXml("https://heypsych.com/", [
      { slug: "zoloft-for-anxiety", changefreq: "weekly", priority: "0.9" },
    ]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<loc>https://heypsych.com/guide/zoloft-for-anxiety</loc>");
    expect(xml).not.toContain("<lastmod>");
    expect(xml.trim().endsWith("</urlset>")).toBe(true);
  });
});
