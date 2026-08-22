import { test, expect } from '@playwright/test';

/**
 * Navigation V1 E2E Tests
 *
 * Tests for the Navigation V1 mental health navigation platform features:
 * - Homepage intent-based navigation
 * - Primary navigation structure
 * - OCD vertical slice with next steps
 * - For Clinicians page
 * - Search functionality (privacy-safe)
 */

test.describe('Navigation V1 Homepage', () => {
  test('should display intent-based navigation grid', async ({ page }) => {
    await page.goto('/');

    // Should have intent cards visible (use more specific text to avoid multiple matches)
    await expect(page.getByText(/concerned about symptoms/i)).toBeVisible();
    await expect(page.getByText(/understand a diagnosis/i)).toBeVisible();
    await expect(page.getByText(/comparing treatments/i)).toBeVisible();
    await expect(page.getByText(/need to find care/i)).toBeVisible();
  });

  test('should navigate to conditions from symptom intent', async ({ page }) => {
    await page.goto('/');

    const symptomCard = page.getByRole('link', { name: /concerned about symptoms/i });
    await expect(symptomCard).toHaveAttribute('href', '/conditions');
  });

  test('should navigate to treatments from treatment intent', async ({ page }) => {
    await page.goto('/');

    const treatmentCard = page.getByRole('link', { name: /comparing treatments/i });
    await expect(treatmentCard).toHaveAttribute('href', '/treatments');
  });

  test('should navigate to psychiatrists from find care intent', async ({ page }) => {
    await page.goto('/');

    // Use exact text to avoid matching navigation item
    const findCareCard = page.getByRole('link', { name: /need to find care/i });
    await expect(findCareCard).toHaveAttribute('href', '/psychiatrists');
  });
});

test.describe('Primary Navigation', () => {
  test('should have correct navigation structure', async ({ page }) => {
    await page.goto('/');

    // Check primary navigation items exist
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /conditions/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /treatments/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /tools/i })).toBeVisible();
  });

  test('should navigate to conditions index', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('navigation').getByRole('link', { name: /conditions/i }).click();
    await expect(page).toHaveURL('/conditions');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/condition/i);
  });

  test('should navigate to treatments index', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('navigation').getByRole('link', { name: /treatments/i }).click();
    await expect(page).toHaveURL('/treatments');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/treatment/i);
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
  test('should display for clinicians landing page', async ({ page }) => {
    await page.goto('/for-clinicians');

    // Should show clinician-focused content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Check for specific heading text to avoid multiple matches
    await expect(page.getByRole('heading', { name: /mental health professionals/i })).toBeVisible();
  });

  test('should have clinician intent card on homepage', async ({ page }) => {
    await page.goto('/');

    // Use more specific text to match only the intent card, not navigation
    const clinicianCard = page.getByRole('link', { name: /I'm a clinician/i });
    await expect(clinicianCard).toBeVisible();
    await expect(clinicianCard).toHaveAttribute('href', /for-clinicians/);
  });

  test('should navigate to for-clinicians from homepage card', async ({ page }) => {
    await page.goto('/');

    // Click the intent card specifically
    await page.getByRole('link', { name: /I'm a clinician/i }).click();
    await expect(page).toHaveURL('/for-clinicians');
  });
});

test.describe('Find Care (Psychiatrists)', () => {
  test('should display psychiatrist search page', async ({ page }) => {
    await page.goto('/psychiatrists');

    // Should show page title (use exact heading with level 1)
    await expect(page.getByRole('heading', { level: 1, name: /psychiatrists/i })).toBeVisible();
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
