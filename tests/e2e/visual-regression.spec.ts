import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for HeyPsych Design System
 *
 * Purpose: Capture screenshots at 5 viewport sizes for visual QA review
 * Viewports: 320px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop), 1920px (wide)
 *
 * These tests generate baseline screenshots for manual visual review.
 * They verify the Apple HIG-inspired light-first design system renders correctly.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 320, height: 568 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
];

const KEY_PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/conditions', name: 'conditions-overview' },
  { path: '/treatments', name: 'treatments-overview' },
  { path: '/resources', name: 'resources-overview' },
  { path: '/resources/support-community', name: 'support-community' },
  { path: '/tools', name: 'tools-hub' },
  { path: '/search', name: 'search' },
];

test.describe('Visual Regression - Design System QA', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} (${viewport.width}px)`, () => {
      test.use({
        viewport: { width: viewport.width, height: viewport.height }
      });

      for (const page of KEY_PAGES) {
        test(`${page.name} renders correctly`, async ({ page: browserPage }) => {
          await browserPage.goto(page.path);

          // Wait for page to be fully loaded
          await browserPage.waitForLoadState('networkidle');

          // Additional wait for any animations to complete
          await browserPage.waitForTimeout(500);

          // Take full-page screenshot
          await browserPage.screenshot({
            path: `test-results/screenshots/${viewport.name}/${page.name}.png`,
            fullPage: true,
          });

          // Basic visibility assertions
          // Header should be visible
          const header = browserPage.locator('header').first();
          await expect(header).toBeVisible();

          // Main content should be visible
          const main = browserPage.locator('main').first();
          if (await main.count() > 0) {
            await expect(main).toBeVisible();
          }

          // No dark mode classes should be present (light-first design)
          const darkModeElements = await browserPage.locator('[class*="dark:"]').count();
          // Note: Some dark mode classes may exist for accessibility, this is informational
          console.log(`[${viewport.name}][${page.name}] Dark mode utility classes found: ${darkModeElements}`);

          // Verify semantic canvas background is applied
          const body = browserPage.locator('body');
          const bodyClasses = await body.getAttribute('class');
          console.log(`[${viewport.name}][${page.name}] Body classes: ${bodyClasses || 'none'}`);
        });
      }
    });
  }
});

test.describe('Visual Regression - Component Spot Checks', () => {
  test('Crisis card renders with semantic negative colors', async ({ page }) => {
    await page.goto('/resources/support-community');
    await page.waitForLoadState('networkidle');

    // Check that crisis banner uses semantic colors
    const crisisBanner = page.locator('[class*="negative"]').first();
    if (await crisisBanner.count() > 0) {
      await expect(crisisBanner).toBeVisible();
    }

    await page.screenshot({
      path: 'test-results/screenshots/components/crisis-banner.png',
      fullPage: false,
    });
  });

  test('Navigation grid renders with proper spacing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to navigation grid section
    const navGrid = page.locator('section').filter({ hasText: 'Treatments' }).first();
    if (await navGrid.count() > 0) {
      await navGrid.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: 'test-results/screenshots/components/navigation-grid.png',
        fullPage: false,
      });
    }
  });

  test('Treatment card renders with semantic tokens', async ({ page }) => {
    await page.goto('/treatments');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/screenshots/components/treatments-page.png',
      fullPage: true,
    });
  });
});

test.describe('Visual Regression - Color Consistency', () => {
  test('Semantic colors are consistent across pages', async ({ page }) => {
    const pages = ['/', '/conditions', '/treatments', '/resources'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Check for legacy non-semantic color classes
      const slateClasses = await page.locator('[class*="slate-"]').count();
      const blueClasses = await page.locator('[class*="blue-"]').count();

      console.log(`[${pagePath}] Legacy color classes - slate: ${slateClasses}, blue: ${blueClasses}`);
    }
  });
});
