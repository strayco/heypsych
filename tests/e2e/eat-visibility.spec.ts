import { test, expect } from '@playwright/test';

/**
 * E-A-T (Expertise, Authoritativeness, Trustworthiness) Visibility Tests
 * 
 * These tests verify that medical review information, author attribution,
 * and trust signals are properly displayed on all entity pages.
 */

test.describe('E-A-T Component Visibility', () => {
  // Condition pages
  test.describe('Condition Pages', () => {
    test('should display medical review badge on condition page', async ({ page }) => {
      await page.goto('/conditions/major-depressive-disorder');
      
      // Should have medical review badge
      const reviewBadge = page.locator('[data-testid="medical-review-badge"]');
      await expect(reviewBadge).toBeVisible();
      
      // Should show "Medically Reviewed" text or similar
      await expect(page.getByText(/medically reviewed|medical review/i)).toBeVisible();
    });

    test('should display review date on condition page', async ({ page }) => {
      await page.goto('/conditions/generalized-anxiety-disorder');
      
      // Should have a date in a recognizable format
      const datePattern = /reviewed:?\s*\w+\s+\d{1,2},?\s+\d{4}|last reviewed|reviewed on/i;
      await expect(page.getByText(datePattern)).toBeVisible();
    });

    test('should link to Medical Review Board', async ({ page }) => {
      await page.goto('/conditions/attention-deficit-hyperactivity-disorder');
      
      // Should have a link to the medical review board
      const boardLink = page.getByRole('link', { name: /medical review board/i });
      await expect(boardLink).toBeVisible();
      await expect(boardLink).toHaveAttribute('href', /\/about\/medical-review-board/);
    });
  });

  // Treatment pages
  test.describe('Treatment Pages', () => {
    test('should display author byline on treatment page', async ({ page }) => {
      await page.goto('/treatments/sertraline');
      
      // Should have author byline component
      const authorByline = page.locator('[data-testid="author-byline"]');
      await expect(authorByline).toBeVisible();
    });

    test('should display medical disclaimer on medication page', async ({ page }) => {
      await page.goto('/treatments/fluoxetine');
      
      // Should have medical disclaimer
      const disclaimer = page.getByText(/medical information|consult.*healthcare|not.*substitute/i);
      await expect(disclaimer).toBeVisible();
    });

    test('should display review attribution on therapy page', async ({ page }) => {
      await page.goto('/treatments/cognitive-behavioral-therapy');
      
      // Should show review attribution
      await expect(page.getByText(/reviewed|medical review/i)).toBeVisible();
    });
  });

  // Resource pages
  test.describe('Resource Pages', () => {
    test('should display E-A-T components on assessment page', async ({ page }) => {
      await page.goto('/resources/gad-7');
      
      // Should have medical disclaimer
      const disclaimer = page.getByText(/validated|clinically|medical/i);
      await expect(disclaimer).toBeVisible();
    });

    test('should display author on knowledge hub article', async ({ page }) => {
      await page.goto('/resources');
      
      // Find a knowledge hub article link and click it
      const articleLink = page.getByRole('link').filter({ hasText: /guide|article|hub/i }).first();
      if (await articleLink.count() > 0) {
        await articleLink.click();
        
        // Should have author information
        await expect(page.getByText(/written by|author|by/i)).toBeVisible();
      }
    });
  });

  // Medical Review Board page
  test.describe('Medical Review Board Page', () => {
    test('should display organization information', async ({ page }) => {
      await page.goto('/about/medical-review-board');
      
      // Should have board title
      await expect(page.getByRole('heading', { name: /medical review board/i })).toBeVisible();
    });

    test('should display reviewer credentials', async ({ page }) => {
      await page.goto('/about/medical-review-board');
      
      // Should show credential abbreviations (MD, PhD, etc.)
      const credentialPattern = /M\.?D\.?|Ph\.?D\.?|Psy\.?D\.?|LCSW|psychiatr/i;
      await expect(page.getByText(credentialPattern)).toBeVisible();
    });

    test('should list board members', async ({ page }) => {
      await page.goto('/about/medical-review-board');
      
      // Should have multiple team member cards or list items
      const memberElements = page.locator('[data-testid="reviewer-card"], [data-testid="team-member"], .reviewer-card, .team-member');
      const count = await memberElements.count();
      
      // Should have at least one board member displayed
      expect(count).toBeGreaterThan(0);
    });
  });
});

test.describe('E-A-T Fallback Behavior', () => {
  test('should show fallback to Medical Review Board when no individual reviewer', async ({ page }) => {
    // Visit any page - should always have review attribution
    await page.goto('/conditions/major-depressive-disorder');
    
    // Should either show individual reviewer OR Medical Review Board
    const hasReviewAttribution = await page.getByText(/medical review board|medically reviewed|reviewed by/i).count() > 0;
    expect(hasReviewAttribution).toBe(true);
  });

  test('should not show empty author sections', async ({ page }) => {
    await page.goto('/treatments/sertraline');
    
    // Author byline should either have content or not be rendered
    const emptyByline = page.locator('[data-testid="author-byline"]:empty');
    await expect(emptyByline).toHaveCount(0);
  });
});

