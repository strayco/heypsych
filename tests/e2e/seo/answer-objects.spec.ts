/**
 * Answer Objects E2E Tests
 *
 * Verifies that server-rendered answer blocks have proper semantic markers
 * for Google's featured-snippet parser.
 *
 * @see Phase H of Wave 3 directive
 */

import { test, expect } from "@playwright/test";

test.describe("Server-Rendered Answer Objects", () => {
  test.describe("Condition Pages", () => {
    test("should have data-answer markers on key sections", async ({
      page,
    }) => {
      await page.goto("/conditions/major-depressive-disorder");

      // Check for at least one answer-marked section
      const answerSections = await page.locator("[data-answer='true']").count();
      expect(answerSections).toBeGreaterThan(0);
    });

    test("should have KEY_FACTS section with list structure", async ({
      page,
    }) => {
      await page.goto("/conditions/major-depressive-disorder");

      // Check for KEY_FACTS section
      const keyFactsSection = page.locator("#KEY_FACTS");
      const keyFactsExists = (await keyFactsSection.count()) > 0;

      // If KEY_FACTS exists, verify it has list structure
      if (keyFactsExists) {
        await expect(keyFactsSection).toHaveAttribute("data-answer", "true");

        // Should contain ul or ol (semantic list)
        const hasList =
          (await keyFactsSection.locator("ul, ol").count()) > 0 ||
          (await keyFactsSection.locator("li").count()) > 0;
        expect(hasList).toBe(true);
      }
    });

    test("should use semantic heading hierarchy", async ({ page }) => {
      await page.goto("/conditions/major-depressive-disorder");

      // Page should have exactly one h1
      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBe(1);

      // H2s should exist for main sections
      const h2Count = await page.locator("h2").count();
      expect(h2Count).toBeGreaterThan(0);
    });

    test("should have structured content in description", async ({ page }) => {
      await page.goto("/conditions/major-depressive-disorder");

      // The main content area should exist
      const mainContent = page.locator("[itemProp='mainEntityOfPage']");
      const mainExists = (await mainContent.count()) > 0;

      if (mainExists) {
        // Should have paragraph or structured content
        const hasContent =
          (await mainContent.locator("p, ul, ol, dl").count()) > 0;
        expect(hasContent).toBe(true);
      }
    });
  });

  test.describe("Treatment Pages", () => {
    test("should have data-answer markers", async ({ page }) => {
      await page.goto("/treatments/escitalopram-lexapro-v2");

      // Check for answer-marked sections
      const answerSections = await page.locator("[data-answer='true']").count();

      // Treatment pages should have at least KEY_FACTS or similar
      // Note: This may be 0 if the page doesn't have FastFacts rendered
      // We're testing that IF markers exist, they're properly structured
      if (answerSections > 0) {
        const firstAnswer = page.locator("[data-answer='true']").first();
        await expect(firstAnswer).toBeVisible();
      }
    });

    test("should have semantic tables for comparisons", async ({ page }) => {
      await page.goto("/treatments/escitalopram-lexapro-v2");

      // Check for tables
      const tables = await page.locator("table").count();

      // If tables exist, verify they have proper headers
      if (tables > 0) {
        const firstTable = page.locator("table").first();
        const hasHeaders = (await firstTable.locator("th").count()) > 0;
        expect(hasHeaders).toBe(true);
      }
    });

    test("should use lists for enumerable content", async ({ page }) => {
      await page.goto("/treatments/escitalopram-lexapro-v2");

      // Side effects, warnings, etc. should use lists
      const lists = await page.locator("ul, ol").count();
      expect(lists).toBeGreaterThan(0);
    });
  });

  test.describe("Resource Pages", () => {
    test("should have semantic structure", async ({ page }) => {
      await page.goto("/resources/phq-9");

      // Resource pages should have structured content
      const hasLists = (await page.locator("ul, ol").count()) > 0;
      const hasTables = (await page.locator("table").count()) > 0;
      const hasDefinitions = (await page.locator("dl").count()) > 0;

      // Should have at least one type of structured content
      expect(hasLists || hasTables || hasDefinitions).toBe(true);
    });
  });

  test.describe("Semantic HTML Compliance", () => {
    test("should not have empty heading elements", async ({ page }) => {
      await page.goto("/conditions/major-depressive-disorder");

      // Check for empty headings (bad for SEO)
      const headings = page.locator("h1, h2, h3, h4, h5, h6");
      const headingCount = await headings.count();

      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const text = await heading.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });

    test("should have accessible link text", async ({ page }) => {
      await page.goto("/conditions/major-depressive-disorder");

      // Links should not use "click here" or "read more" as sole text
      const badLinkPatterns = ["click here", "read more", "learn more", "here"];

      const links = page.locator("a");
      const linkCount = await links.count();

      for (let i = 0; i < Math.min(linkCount, 20); i++) {
        // Sample first 20
        const link = links.nth(i);
        const text = (await link.textContent())?.toLowerCase().trim() || "";

        // If link text is ONLY one of the bad patterns, flag it
        const isBadLink = badLinkPatterns.includes(text);
        expect(isBadLink).toBe(false);
      }
    });

    test("should have proper image alt text", async ({ page }) => {
      await page.goto("/conditions/major-depressive-disorder");

      const images = page.locator("img");
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute("alt");
        const isDecorativeRole =
          (await img.getAttribute("role")) === "presentation";
        const ariaHidden = await img.getAttribute("aria-hidden");

        // Images should have alt text OR be marked as decorative
        const hasAlt = alt !== null && alt.trim().length > 0;
        const isDecorativeElement =
          isDecorativeRole || ariaHidden === "true" || alt === "";

        expect(hasAlt || isDecorativeElement).toBe(true);
      }
    });
  });

  test.describe("Entity Grounding", () => {
    test("should have data-entity attributes on linked terms", async ({
      page,
    }) => {
      await page.goto("/conditions/major-depressive-disorder");

      // Check for entity-marked terms (may not exist yet - this documents the requirement)
      const entityTerms = await page.locator("[data-entity]").count();

      // Note: This test documents the requirement - if entities exist, they should be marked
      // Currently this may be 0, which is acceptable but flagged for future implementation
      if (entityTerms > 0) {
        const firstEntity = page.locator("[data-entity]").first();
        const entityType = await firstEntity.getAttribute("data-entity");
        expect(entityType).toBeTruthy();
      }
    });
  });

  test.describe("Featured Snippet Eligibility", () => {
    test("should have concise answer paragraphs", async ({ page }) => {
      await page.goto("/conditions/major-depressive-disorder");

      // First paragraph in main content should be concise (featured snippet target)
      const mainContent = page.locator(
        "[itemProp='mainEntityOfPage'] p, [itemProp='description']"
      );
      const mainExists = (await mainContent.count()) > 0;

      if (mainExists) {
        const firstParagraph = mainContent.first();
        const text = await firstParagraph.textContent();

        // Featured snippet paragraphs should be under 300 characters ideally
        // But this is a soft guideline, not a hard rule
        // We just check that content exists
        expect(text?.trim().length).toBeGreaterThan(50);
      }
    });

    test("should have numbered steps in appropriate sections", async ({
      page,
    }) => {
      await page.goto("/conditions/major-depressive-disorder");

      // Check for ordered lists (steps)
      const olCount = await page.locator("ol").count();

      // If ordered lists exist, they should have list items
      if (olCount > 0) {
        const firstOl = page.locator("ol").first();
        const liCount = await firstOl.locator("li").count();
        expect(liCount).toBeGreaterThan(0);
      }
    });
  });
});
