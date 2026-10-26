import { test, expect } from '@playwright/test';

/**
 * Navigation V1 E2E Tests
 *
 * Tests for the mental health navigation platform:
 * - Homepage Two Worlds entry (patient and clinician destinations)
 * - Primary navigation structure and Explore
 * - OCD vertical slice with next steps
 * - For Clinicians page
 * - Search functionality (privacy-safe)
 */

test.describe('Homepage: Two Worlds', () => {
  test('asks one question and offers the two destinations', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'A little clarity changes everything.'
    );
    await expect(page.getByRole('heading', { name: 'Where would you like to begin?' })).toBeVisible();
  });

  test('patient world links to the support journey', async ({ page }) => {
    await page.goto('/');
    const patient = page.getByRole('link', { name: /for me or someone i love.*find my way/i });
    await expect(patient).toHaveAttribute('href', '/find-support');
  });

  test('clinician world links to Practice Architect', async ({ page }) => {
    await page.goto('/');
    const clinician = page.getByRole('link', { name: /for my practice.*build my practice/i });
    await expect(clinician).toHaveAttribute('href', '/architect');
  });

  test('crisis help is available without choosing a world', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main a[href="tel:988"]').first()).toBeVisible();
  });

  test('discovery pathways link to the existing libraries', async ({ page }) => {
    await page.goto('/');
    for (const [name, href] of [
      [/^conditions/i, '/conditions'],
      [/^treatments/i, '/treatments'],
      [/^apps & tools/i, '/tools'],
      [/^find care/i, '/psychiatrists'],
      [/^clinician tools/i, '/tools/for-clinicians'],
    ] as const) {
      await expect(page.getByRole('link', { name }).first()).toHaveAttribute('href', href);
    }
  });
});

test.describe('Primary Navigation', () => {
  test('has Explore, For Clinicians, About, and search', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('#site-header');
    await expect(header.getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/browse');
    await expect(header.getByRole('link', { name: 'For Clinicians' })).toHaveAttribute('href', '/architect');
    await expect(header.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    await expect(header.getByRole('searchbox', { name: 'Search HeyPsych' })).toBeVisible();
  });

  test('Explore lists every area of the site', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Explore HeyPsych');
    await expect(page.getByRole('link', { name: /^conditions/i }).first()).toHaveAttribute('href', '/conditions');
    await expect(page.getByRole('link', { name: /^practice architect/i }).first()).toHaveAttribute('href', '/architect');
  });

  test('skip link moves focus to the main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveAttribute('href', '#main-content');
  });
});

test.describe('OCD Vertical Slice', () => {
  test('should display OCD condition page', async ({ page }) => {
    await page.goto('/conditions/obsessive-compulsive-disorder');

    // Should show condition name
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/obsessive.compulsive/i);
  });

  test('should display treatment options section on OCD page', async ({ page }) => {
    await page.goto('/conditions/obsessive-compulsive-disorder');

    // OCD page should have treatment-related content
    // Either a treatments section, related treatments, or treatment links
    const treatmentSection = page.getByText(/treatment|therapy|medication/i);
    await expect(treatmentSection.first()).toBeVisible();
  });

  test('should have treatment section visible on OCD page', async ({ page }) => {
    await page.goto('/conditions/obsessive-compulsive-disorder');

    // OCD page should show treatment-related information
    // Check for treatment section heading or treatment-related links
    const treatmentHeading = page.getByRole('heading', { name: /treatment/i });
    const treatmentLink = page.getByRole('link').filter({ hasText: /treatment|therapy|medication/i });

    const hasHeading = await treatmentHeading.count() > 0;
    const hasLinks = await treatmentLink.count() > 0;

    // Should have either treatment heading or treatment links
    expect(hasHeading || hasLinks).toBe(true);
  });
});

test.describe('For Clinicians Page', () => {
  test('should display V4 clinician tools hub', async ({ page }) => {
    await page.goto('/tools/for-clinicians');

    // Should show clinician tools content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should have clinician path from the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: /build my practice/i })
    ).toHaveAttribute('href', '/architect');
  });

  test('legacy /for-clinicians page should still work', async ({ page }) => {
    // Old page still exists as a general resource hub
    const response = await page.goto('/for-clinicians');
    expect(response?.status()).toBe(200);
    // Should show clinician-focused content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Find Care (Psychiatrists)', () => {
  test('should display psychiatrist search page', async ({ page }) => {
    await page.goto('/psychiatrists');

    // Should show page title (use exact heading with level 1)
    await expect(page.getByRole('heading', { level: 1, name: /psychiatrist/i })).toBeVisible();
  });

  test('should not show unsupported claims before search', async ({ page }) => {
    await page.goto('/psychiatrists');

    // Should NOT show board-certified claims (not verifiable from NPPES)
    const boardCertified = page.getByText(/board.certified/i);
    await expect(boardCertified).toHaveCount(0);

    // Should NOT show hardcoded provider counts before search
    const preSearchCount = page.getByText(/68,945|69,000.*total/i);
    await expect(preSearchCount).toHaveCount(0);
  });

  test('should show NPPES data attribution after search', async ({ page }) => {
    await page.goto('/psychiatrists');

    // Click search to trigger results
    await page.getByRole('button', { name: /search/i }).first().click();

    // Wait for loading to complete (either results or no results message)
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 30000 }).catch(() => {});

    // After search, NPPES attribution should be visible
    const nppesRef = page.getByText(/NPPES/i);
    await expect(nppesRef).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/psychiatrists');

    // Should have search input - use specific placeholder
    const searchInput = page.getByPlaceholder('Search by name');
    await expect(searchInput).toBeVisible();

    // Should have search button (use exact match to avoid matching "Search All Psychiatrists")
    const searchButton = page.getByRole('button', { name: 'Search', exact: true });
    await expect(searchButton).toBeVisible();
  });

  test('should have state filter', async ({ page }) => {
    await page.goto('/psychiatrists');

    // Should have state filter dropdown
    const stateFilter = page.locator('select#state-filter');
    await expect(stateFilter).toBeVisible();
  });
});

test.describe('Search Page Privacy', () => {
  test('should have search page', async ({ page }) => {
    await page.goto('/search');

    // Should have search functionality
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
    await expect(searchInput).toBeVisible();
  });

  test('should not display raw search queries in visible analytics', async ({ page }) => {
    await page.goto('/search');

    // Type a sensitive search query
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
    await searchInput.fill('depression help');

    // The query should not appear in any data-* attributes that might leak to analytics
    const pageContent = await page.content();

    // Verify no tracking pixels or analytics divs contain the raw query
    const analyticsElements = page.locator('[data-analytics-query], [data-search-query]');
    await expect(analyticsElements).toHaveCount(0);
  });
});

test.describe('Route Integrity', () => {
  test('should return 200 for all primary routes', async ({ page }) => {
    const routes = [
      '/',
      '/conditions',
      '/treatments',
      '/resources',
      '/psychiatrists',
      '/search',
      '/for-clinicians',
      '/tools/for-clinicians',
    ];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), `Route ${route} should return 200`).toBe(200);
    }
  });

  test('should return 200 for OCD condition page', async ({ page }) => {
    const response = await page.goto('/conditions/obsessive-compulsive-disorder');
    expect(response?.status()).toBe(200);
  });

  test('should return 200 for sample treatment page', async ({ page }) => {
    const response = await page.goto('/treatments/cognitive-behavioral-therapy');
    expect(response?.status()).toBe(200);
  });
});
