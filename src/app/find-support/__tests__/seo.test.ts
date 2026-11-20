import fs from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { findSupportMetadata, FIND_SUPPORT_CANONICAL } from "../_lib/seo";
import { SUPPORT_STARTING_POINTS } from "../_components/SupportEntry";
import robots from "@/app/robots";
import { getSitemapGenerator } from "@/lib/seo/sitemap-generator";

// next/font has no runtime in tests.
vi.mock("@/components/brand/fonts", () => ({ displayFont: { variable: "" }, interfaceFont: { variable: "" } }));

describe("/find-support SEO", () => {
  it("indexes the bare public entry with a self-referencing canonical", () => {
    const meta = findSupportMetadata({});
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.alternates?.canonical).toBe("https://heypsych.com/find-support");
    expect(FIND_SUPPORT_CANONICAL).toBe("https://heypsych.com/find-support");
  });

  it("never indexes a session view or any query-string variant", () => {
    for (const params of [{ need: "support" }, { need: "other" }, { utm_source: "x" }]) {
      expect(findSupportMetadata(params).robots).toEqual({ index: false, follow: false });
      expect(findSupportMetadata(params).alternates?.canonical).toBe(FIND_SUPPORT_CANONICAL);
    }
  });

  it("is in the hubs sitemap and not blocked by robots.txt", async () => {
    const xml = await getSitemapGenerator().generateHubsSitemap();
    expect(xml).toContain("<loc>https://heypsych.com/find-support</loc>");
    expect(xml).not.toContain("/my-path");
    const disallow = robots().rules;
    const star = (Array.isArray(disallow) ? disallow : [disallow]).find((r) => r.userAgent === "*")!;
    expect(star.disallow).toContain("/my-path");
    expect(star.disallow).not.toContain("/find-support");
  });

  it("keeps /my-path non-indexable", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/app/my-path/page.tsx"), "utf8");
    expect(src).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  });
});

describe("/find-support privacy", () => {
  it("starting points are generic links that carry no answers in the URL", () => {
    for (const p of SUPPORT_STARTING_POINTS) {
      const url = new URL(p.href, "https://heypsych.com");
      for (const key of url.searchParams.keys()) expect(key, p.href).toBe("need");
    }
  });

  it("server-renders the public entry with crisis information first and no personal state", async () => {
    const { default: FindSupportPage } = await import("../page");
    const html = renderToStaticMarkup(await FindSupportPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("What brings you here?");
    expect(html.indexOf("tel:988")).toBeGreaterThan(-1);
    expect(html.indexOf("tel:988")).toBeLessThan(html.indexOf("What brings you here?"));
    for (const p of SUPPORT_STARTING_POINTS) expect(html).toContain(p.label.replace(/'/g, "&#x27;"));
    expect(html).not.toMatch(/localStorage|my-path|brief|saved/i);
  });
});
