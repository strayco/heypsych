import { test, expect } from "@playwright/test";

/**
 * Brand integrity
 *
 * The mark, icons, social images, and structured-data logos must all resolve,
 * and every page must declare the same icon set. These are the assets search
 * engines, browsers, and social platforms show for HeyPsych.
 */

const ASSETS = [
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-48x48.png",
  "/favicon-96x96.png",
  "/favicon-192x192.png",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/site.webmanifest",
  "/logo.svg",
  "/logo-mark.svg",
  "/images/logo.png",
  "/images/logo-wordmark.png",
  "/images/og/heypsych.png",
];

test.describe("Brand assets", () => {
  test("every brand asset resolves", async ({ request }) => {
    for (const path of ASSETS) {
      const response = await request.get(path);
      expect(response.status(), `${path} should return 200`).toBe(200);
    }
  });

  for (const route of ["/", "/conditions", "/tools", "/about", "/architect"]) {
    test(`${route} declares the icon set, theme colour, and a resolving social image`, async ({
      page,
      request,
    }) => {
      await page.goto(route);
      const head = page.locator("head");

      await expect(head.locator('link[rel="icon"][href^="/favicon.ico"]')).toHaveCount(1);
      await expect(head.locator('link[rel="icon"][href^="/favicon.svg"]')).toHaveCount(1);
      await expect(
        head.locator('link[rel="icon"][sizes="48x48"][href^="/favicon-48x48.png"]')
      ).toHaveCount(1);
      await expect(head.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
      await expect(head.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#FAF9F6");

      const ogImage = await head
        .locator('meta[property="og:image"]')
        .first()
        .getAttribute("content");
      expect(ogImage, "og:image should be set").toBeTruthy();
      const ogPath = new URL(ogImage!).pathname + new URL(ogImage!).search;
      expect((await request.get(ogPath)).status(), `og:image ${ogPath}`).toBe(200);
    });
  }

  test("structured-data logos all resolve", async ({ page, request }) => {
    for (const route of ["/", "/tools/sleep", "/about/medical-review-board"]) {
      await page.goto(route);
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      const logos = new Set<string>();
      const walk = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        const obj = node as Record<string, unknown>;
        const logo = obj.logo;
        if (typeof logo === "string") logos.add(logo);
        if (
          logo &&
          typeof logo === "object" &&
          typeof (logo as { url?: unknown }).url === "string"
        ) {
          logos.add((logo as { url: string }).url);
        }
        Object.values(obj).forEach(walk);
      };
      blocks.forEach((text) => walk(JSON.parse(text)));
      for (const logo of logos) {
        expect(new URL(logo).pathname, `${route} logo`).toBe("/images/logo.png");
        expect((await request.get(new URL(logo).pathname)).status()).toBe(200);
      }
    }
  });
});
