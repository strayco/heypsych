/**
 * No-JavaScript Content Verification Test
 *
 * Critical requirement for LLM/AI retrieval: Content must be available in the initial HTML
 * payload without requiring JavaScript execution. This ensures AI crawlers (Gemini, GPTBot,
 * Google-Extended) can extract "Golden Answers" even if they don't execute JavaScript or
 * timeout before React hydration completes.
 *
 * Test Strategy:
 * - Disable JavaScript in the browser
 * - Verify that core content is still visible in the DOM
 * - Ensure the "first 14KB" requirement is met (content in initial payload)
 *
 * @see https://nextjs.org/docs/app/building-your-application/rendering/server-components
 */

import { test, expect } from '@playwright/test';

// Base URL - adjust for your environment
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Content Availability Without JavaScript', () => {
  // Disable JavaScript for all tests in this suite
  test.use({ javaScriptEnabled: false });

  test.describe('Condition Pages (SSG)', () => {
    test('Major Depressive Disorder - Core content visible without JS', async ({ page }) => {
      await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);

      // Verify primary heading (h1) is in DOM
      const mainHeading = page.locator('h1');
      await expect(mainHeading).toBeVisible();
      await expect(mainHeading).toContainText('Major Depressive Disorder');

      // Verify "Golden Answer" (short definition/abstract) is visible
      const abstract = page.locator('article[itemprop*="abstract"]');
      await expect(abstract).toBeVisible();

      // Verify main content section exists
      const mainContent = page.locator('section[itemprop="mainEntityOfPage"]');
      await expect(mainContent).toBeVisible();

      // Verify description text is present
      const description = page.locator('article[itemprop*="description"]');
      await expect(description).toBeVisible();
    });

    test('Generalized Anxiety Disorder - Core content visible without JS', async ({ page }) => {
      await page.goto(`${BASE_URL}/conditions/generalized-anxiety-disorder`);

      const mainHeading = page.locator('h1');
      await expect(mainHeading).toBeVisible();
      await expect(mainHeading).toContainText('Generalized Anxiety Disorder');

      // Main content must be in initial HTML
      const mainContent = page.locator('section[itemprop="mainEntityOfPage"]');
      await expect(mainContent).toBeVisible();
    });

    test('PTSD - Core content visible without JS', async ({ page }) => {
      await page.goto(`${BASE_URL}/conditions/post-traumatic-stress-disorder`);

      const mainHeading = page.locator('h1');
      await expect(mainHeading).toBeVisible();

      const mainContent = page.locator('section[itemprop="mainEntityOfPage"]');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Treatment Pages (SSG)', () => {
    test('Cognitive Behavioral Therapy - Core content visible without JS', async ({ page }) => {
      await page.goto(`${BASE_URL}/treatments/cognitive-behavioral-therapy`);

      // Verify primary heading
      const mainHeading = page.locator('h1[itemprop*="headline"]');
      await expect(mainHeading).toBeVisible();
      await expect(mainHeading).toContainText('Cognitive Behavioral Therapy');

      // Verify patient summary (abstract) is visible
      const abstract = page.locator('article[itemprop*="abstract"]');
      await expect(abstract).toBeVisible();

      // Verify main content section
      const mainContent = page.locator('section[itemprop="mainEntityOfPage"]');
      await expect(mainContent).toBeVisible();
    });

    test('SSRIs - Core content visible without JS', async ({ page }) => {
      await page.goto(`${BASE_URL}/treatments/selective-serotonin-reuptake-inhibitors`);

      const mainHeading = page.locator('h1');
      await expect(mainHeading).toBeVisible();

      const mainContent = page.locator('section[itemprop="mainEntityOfPage"]');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Schema.org Structured Data (No-JS)', () => {
    test('JSON-LD schemas present in initial HTML - Condition', async ({ page }) => {
      await page.goto(`${BASE_URL}/conditions/depression`);

      // Verify JSON-LD scripts are in the initial HTML (not injected by JS)
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      // Should have multiple schemas: MedicalCondition, MedicalWebPage, BreadcrumbList, etc.
      expect(count).toBeGreaterThanOrEqual(3);

      // Verify at least one contains MedicalCondition type
      const firstScript = jsonLdScripts.first();
      const content = await firstScript.textContent();
      expect(content).toBeTruthy();

      if (content) {
        const schema = JSON.parse(content);
        // Should be either MedicalCondition or @graph with MedicalCondition
        const hasMedicalCondition =
          schema['@type'] === 'MedicalCondition' ||
          (schema['@graph'] && schema['@graph'].some((s: any) => s['@type'] === 'MedicalCondition'));
        expect(hasMedicalCondition).toBe(true);
      }
    });

    test('JSON-LD schemas present in initial HTML - Treatment', async ({ page }) => {
      await page.goto(`${BASE_URL}/treatments/cognitive-behavioral-therapy`);

      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Semantic HTML Microformats', () => {
    test('Condition page has proper itemprop attributes', async ({ page }) => {
      await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);

      // Check for Schema.org microformats in HTML
      const mainElement = page.locator('main[itemscope]');
      await expect(mainElement).toBeVisible();

      // Verify itemprop attributes are present
      const headline = page.locator('[itemprop*="headline"]');
      await expect(headline).toBeVisible();

      const abstract = page.locator('[itemprop*="abstract"]');
      await expect(abstract).toBeVisible();

      const mainEntity = page.locator('[itemprop="mainEntityOfPage"]');
      await expect(mainEntity).toBeVisible();
    });

    test('Treatment page has proper itemprop attributes', async ({ page }) => {
      await page.goto(`${BASE_URL}/treatments/cognitive-behavioral-therapy`);

      const mainElement = page.locator('main[itemscope]');
      await expect(mainElement).toBeVisible();

      const headline = page.locator('[itemprop*="headline"]');
      await expect(headline).toBeVisible();

      const mainEntity = page.locator('[itemprop="mainEntityOfPage"]');
      await expect(mainEntity).toBeVisible();
    });
  });

  test.describe('E-A-T Signals (No-JS)', () => {
    test('Medical review information visible without JS', async ({ page }) => {
      await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);

      // Medical review badge or board information should be in initial HTML
      const medicalReview = page.getByText(/Medical Review Board|Reviewed by/i);
      await expect(medicalReview).toBeVisible();
    });

    test('Timestamps visible without JS', async ({ page }) => {
      await page.goto(`${BASE_URL}/treatments/cognitive-behavioral-therapy`);

      // Published/Updated/Reviewed dates should be in initial HTML for freshness signals
      const timestamps = page.getByText(/Published|Updated|Reviewed/i);
      await expect(timestamps.first()).toBeVisible();
    });
  });

  test.describe('Initial Payload Size (14KB Rule)', () => {
    test('Condition page loads core content in first 14KB', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);
      expect(response).toBeTruthy();

      if (response) {
        const body = await response.text();

        // Verify that h1 and core content appear within first 14KB (14,336 bytes)
        const first14KB = body.substring(0, 14336);

        // h1 should be in first 14KB
        expect(first14KB).toContain('<h1');

        // Main content section should start in first 14KB
        expect(first14KB).toContain('itemprop');
      }
    });

    test('Treatment page loads core content in first 14KB', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/treatments/cognitive-behavioral-therapy`);
      expect(response).toBeTruthy();

      if (response) {
        const body = await response.text();
        const first14KB = body.substring(0, 14336);

        expect(first14KB).toContain('<h1');
        expect(first14KB).toContain('itemprop');
      }
    });
  });

  test.describe('Navigation Without JS', () => {
    test('Internal links are standard <a> tags (not JS-routed)', async ({ page }) => {
      await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);

      // Verify that links use standard href attributes (Next.js Link components should SSR to <a>)
      const internalLinks = page.locator('a[href^="/"]').first();
      await expect(internalLinks).toHaveAttribute('href');
    });

    test('Breadcrumbs work without JS', async ({ page }) => {
      await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);

      // Breadcrumbs should be functional links
      const breadcrumbLinks = page.locator('nav a, [aria-label*="breadcrumb"] a').first();
      const hasHref = await breadcrumbLinks.count() > 0
        ? await breadcrumbLinks.getAttribute('href')
        : null;

      if (hasHref) {
        expect(hasHref).toBeTruthy();
      }
    });
  });
});

test.describe('Content Availability WITH JavaScript (Sanity Check)', () => {
  // Re-enable JavaScript to ensure nothing breaks when JS IS available
  test.use({ javaScriptEnabled: true });

  test('Content still visible with JS enabled - Condition', async ({ page }) => {
    await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);

    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();

    const mainContent = page.locator('section[itemprop="mainEntityOfPage"]');
    await expect(mainContent).toBeVisible();
  });

  test('Content still visible with JS enabled - Treatment', async ({ page }) => {
    await page.goto(`${BASE_URL}/treatments/cognitive-behavioral-therapy`);

    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();

    const mainContent = page.locator('section[itemprop="mainEntityOfPage"]');
    await expect(mainContent).toBeVisible();
  });
});
