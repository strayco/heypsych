/**
 * E2E Tests for E-A-T, Schema.org, and Internal Linking
 * 
 * Run with: npx playwright test e2e/eat-schema-linking.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface Schema {
  '@type'?: string;
  name?: string;
  description?: string;
  itemListElement?: unknown[];
  [key: string]: unknown;
}

// Helper to extract JSON-LD schemas
async function getSchemas(page: Page): Promise<Schema[]> {
  return await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const schemas: Record<string, unknown>[] = [];
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@graph']) {
          schemas.push(...(data['@graph'] as Record<string, unknown>[]));
        } else {
          schemas.push(data);
        }
      } catch { /* ignore parse errors */ }
    });
    return schemas;
  });
}

test.describe('E-A-T Compliance', () => {
  test('Condition page shows Medical Review Board attribution', async ({ page }) => {
    await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);
    
    // Should have author byline component
    const byline = page.locator('[data-testid="author-byline"]').or(
      page.locator('text=/Medical Review Board|Reviewed by|Medically reviewed/i')
    );
    await expect(byline.first()).toBeVisible({ timeout: 10000 });
  });

  test('Treatment page shows Medical Review Board attribution', async ({ page }) => {
    await page.goto(`${BASE_URL}/treatments/sertraline`);
    
    const byline = page.locator('[data-testid="author-byline"]').or(
      page.locator('text=/Medical Review Board|Reviewed by|Medically reviewed/i')
    );
    await expect(byline.first()).toBeVisible({ timeout: 10000 });
  });

  test('Assessment page shows Medical Review Board attribution', async ({ page }) => {
    await page.goto(`${BASE_URL}/resources/gad-7`);
    
    const byline = page.locator('[data-testid="author-byline"]').or(
      page.locator('text=/Medical Review Board|Reviewed by|Medically reviewed/i')
    );
    await expect(byline.first()).toBeVisible({ timeout: 10000 });
  });

  test('Medical Review Board page exists and shows reviewers', async ({ page }) => {
    await page.goto(`${BASE_URL}/about/medical-review-board`);
    
    // Page should load
    await expect(page).toHaveURL(/medical-review-board/);
    
    // Should show board members
    const reviewers = page.locator('text=/Dr\\.|MD|Psychiatrist/i');
    await expect(reviewers.first()).toBeVisible({ timeout: 10000 });
  });

  test('Medical disclaimer is present on condition pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/conditions/bipolar-disorder`);
    
    const disclaimer = page.locator('text=/not a substitute|professional advice|consult.*doctor/i');
    await expect(disclaimer.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Schema.org Validation', () => {
  test('Condition page has MedicalCondition schema', async ({ page }) => {
    await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);
    await page.waitForLoadState('networkidle');
    
    const schemas = await getSchemas(page);
    const medicalCondition = schemas.find((s: Schema) => s['@type'] === 'MedicalCondition');
    
    expect(medicalCondition).toBeTruthy();
    expect(medicalCondition?.name).toBeTruthy();
    expect(medicalCondition?.description).toBeTruthy();
  });

  test('Medication page has Drug schema', async ({ page }) => {
    await page.goto(`${BASE_URL}/treatments/sertraline`);
    await page.waitForLoadState('networkidle');
    
    const schemas = await getSchemas(page);
    const drugSchema = schemas.find((s: Schema) => s['@type'] === 'Drug');
    
    expect(drugSchema).toBeTruthy();
    expect(drugSchema?.name).toBeTruthy();
  });

  test('All entity pages have MedicalWebPage schema', async ({ page }) => {
    const pages = [
      '/conditions/generalized-anxiety-disorder',
      '/treatments/fluoxetine',
    ];
    
    for (const url of pages) {
      await page.goto(`${BASE_URL}${url}`);
      await page.waitForLoadState('networkidle');
      
      const schemas = await getSchemas(page);
      const medicalWebPage = schemas.find((s: Schema) => s['@type'] === 'MedicalWebPage');
      
      expect(medicalWebPage, `MedicalWebPage missing on ${url}`).toBeTruthy();
    }
  });

  test('All pages have BreadcrumbList schema', async ({ page }) => {
    const pages = [
      '/conditions/adhd',
      '/treatments/cognitive-behavioral-therapy',
    ];
    
    for (const url of pages) {
      await page.goto(`${BASE_URL}${url}`);
      await page.waitForLoadState('networkidle');
      
      const schemas = await getSchemas(page);
      const breadcrumb = schemas.find((s: Schema) => s['@type'] === 'BreadcrumbList');
      
      expect(breadcrumb, `BreadcrumbList missing on ${url}`).toBeTruthy();
      expect((breadcrumb?.itemListElement as unknown[] | undefined)?.length).toBeGreaterThan(0);
    }
  });

  test('Medical Review Board page has Organization and Person schemas', async ({ page }) => {
    await page.goto(`${BASE_URL}/about/medical-review-board`);
    await page.waitForLoadState('networkidle');
    
    const schemas = await getSchemas(page);
    
    const organization = schemas.find((s: Schema) => 
      s['@type'] === 'MedicalOrganization' || s['@type'] === 'Organization'
    );
    expect(organization).toBeTruthy();
    
    const persons = schemas.filter((s: Schema) => s['@type'] === 'Person');
    expect(persons.length).toBeGreaterThan(0);
  });
});

test.describe('Internal Linking', () => {
  test('Condition page has internal links to treatments', async ({ page }) => {
    await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);
    
    // Look for links to treatments
    const treatmentLinks = page.locator('a[href^="/treatments/"]');
    const count = await treatmentLinks.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('Internal links do not use generic words', async ({ page }) => {
    await page.goto(`${BASE_URL}/conditions/generalized-anxiety-disorder`);
    
    // Get all internal links
    const links = await page.locator('a[href^="/conditions/"], a[href^="/treatments/"]').all();
    
    const genericWords = ['anxiety', 'depression', 'treatment', 'therapy', 'medication'];
    
    for (const link of links.slice(0, 10)) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      
      // If link text is a single generic word, it's a problem
      if (text && genericWords.includes(text.toLowerCase().trim())) {
        // Check if href actually points to a real entity, not just generic
        expect(href).not.toBe(`/conditions/${text.toLowerCase()}`);
      }
    }
  });

  test('Internal links return 200 status', async ({ page, request }) => {
    await page.goto(`${BASE_URL}/conditions/panic-disorder`);
    
    const links = await page.locator('a[href^="/conditions/"], a[href^="/treatments/"]').all();
    const checked = new Set();
    
    for (const link of links.slice(0, 5)) {
      const href = await link.getAttribute('href');
      if (!href || checked.has(href)) continue;
      checked.add(href);
      
      const response = await request.get(`${BASE_URL}${href}`);
      expect(response.status(), `Link ${href} should return 200`).toBe(200);
    }
  });

  test('Cross-links appear on assessment pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/resources/gad-7`);
    
    // Should have cross-links to related conditions
    const conditionLinks = page.locator('a[href^="/conditions/"]');
    const count = await conditionLinks.count();
    
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('No Generic Word Linking', () => {
  test('Generic medical terms are NOT linked', async ({ page }) => {
    await page.goto(`${BASE_URL}/conditions/major-depressive-disorder`);
    
    // These generic words should NOT be hyperlinked
    const genericTerms = ['anxiety', 'depression', 'mood', 'symptoms', 'treatment'];
    
    for (const term of genericTerms) {
      // Find all links that contain just this generic word
      const badLinks = page.locator(`a:text-is("${term}")`);
      const count = await badLinks.count();
      
      // Should not have standalone generic word links
      // (Some contextual uses like "major depression" links are OK)
      if (count > 0) {
        const href = await badLinks.first().getAttribute('href');
        // If it links to a specific entity page, that's fine
        // But linking just "depression" to /conditions/depression is bad
        expect(href).not.toBe(`/conditions/${term}`);
      }
    }
  });
});

test.describe('Medical Review Board Fallback', () => {
  test('Pages without individual reviewer show Review Board', async ({ page }) => {
    // Visit a page that might not have an individual reviewer assigned
    await page.goto(`${BASE_URL}/treatments/5-htp`);
    
    // Should still show Medical Review Board attribution
    const attribution = page.locator('text=/Medical Review Board|HeyPsych.*Review/i');
    await expect(attribution.first()).toBeVisible({ timeout: 10000 });
  });
});

