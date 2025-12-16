import { test, expect } from '@playwright/test';

/**
 * Internal Linking Engine Tests
 * 
 * Verifies that the internal linking system correctly:
 * - Links entity names to their pages
 * - Avoids linking generic words
 * - Produces no 404 links
 * - Respects blacklist rules
 */

test.describe('Internal Link Rendering', () => {
  test('should render condition links in treatment page content', async ({ page }) => {
    await page.goto('/treatments/sertraline');
    
    // Should have internal links to conditions
    const conditionLinks = page.locator('a[href^="/conditions/"]');
    const count = await conditionLinks.count();
    
    // Sertraline treats multiple conditions, should have some links
    expect(count).toBeGreaterThan(0);
  });

  test('should render treatment links in condition page content', async ({ page }) => {
    await page.goto('/conditions/major-depressive-disorder');
    
    // Should have internal links to treatments
    const treatmentLinks = page.locator('a[href^="/treatments/"]');
    const count = await treatmentLinks.count();
    
    // MDD has multiple treatments, should have some links
    expect(count).toBeGreaterThan(0);
  });

  test('internal links should be styled distinctly', async ({ page }) => {
    await page.goto('/conditions/generalized-anxiety-disorder');
    
    // Find an internal link
    const internalLink = page.locator('a[href^="/treatments/"], a[href^="/conditions/"]').first();
    
    if (await internalLink.count() > 0) {
      // Should have distinct styling (underline or color)
      const textDecoration = await internalLink.evaluate(el => 
        window.getComputedStyle(el).textDecoration
      );
      const color = await internalLink.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      // Link should either be underlined or have a distinct color
      const isStyled = textDecoration.includes('underline') || 
                       color !== 'rgb(0, 0, 0)';
      expect(isStyled).toBe(true);
    }
  });
});

test.describe('No 404 Links', () => {
  const pagesToCheck = [
    '/conditions/major-depressive-disorder',
    '/conditions/generalized-anxiety-disorder',
    '/treatments/sertraline',
    '/treatments/cognitive-behavioral-therapy',
  ];

  for (const path of pagesToCheck) {
    test(`should have no broken internal links on ${path}`, async ({ page }) => {
      await page.goto(path);
      
      // Get all internal links
      const internalLinks = page.locator('a[href^="/conditions/"], a[href^="/treatments/"], a[href^="/resources/"]');
      const hrefs: string[] = await internalLinks.evaluateAll(links => 
        links.map(link => link.getAttribute('href')).filter(Boolean) as string[]
      );
      
      // Deduplicate
      const uniqueHrefs = [...new Set(hrefs)];
      
      // Check each link (limit to first 10 to avoid timeout)
      const linksToCheck = uniqueHrefs.slice(0, 10);
      
      for (const href of linksToCheck) {
        const response = await page.request.get(href);
        expect(response.status(), `Link ${href} should not be 404`).not.toBe(404);
      }
    });
  }
});

test.describe('Generic Word Blacklist', () => {
  test('should not link generic medical terms', async ({ page }) => {
    await page.goto('/conditions/major-depressive-disorder');
    
    // Get the page content
    const content = await page.content();
    
    // These generic words should NOT be linked
    const genericWords = ['treatment', 'medication', 'therapy', 'symptoms', 'disorder', 'condition'];
    
    for (const word of genericWords) {
      // Check if the word appears as a standalone link text (not part of an entity name)
      const standaloneLink = page.locator(`a:has-text("${word}")`).filter({
        hasNot: page.locator(`a:has-text("cognitive behavioral therapy"), a:has-text("major depressive disorder")`)
      });
      
      // If there's a link with just this word, it should be part of a longer phrase
      const count = await standaloneLink.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const linkText = await standaloneLink.nth(i).textContent();
          if (linkText) {
            // The link text should be longer than just the generic word
            const words = linkText.trim().split(/\s+/);
            expect(words.length, `"${word}" should not be linked alone`).toBeGreaterThan(1);
          }
        }
      }
    }
  });

  test('should not link common abbreviations without context', async ({ page }) => {
    await page.goto('/treatments/sertraline');
    
    // These abbreviations should not be linked unless they're actual entity names
    const abbrevs = ['FDA', 'US', 'USA', 'SSRI', 'mg', 'ml'];
    
    for (const abbrev of abbrevs) {
      const standaloneAbbrevLink = page.locator(`a`).filter({ hasText: new RegExp(`^${abbrev}$`) });
      await expect(standaloneAbbrevLink).toHaveCount(0);
    }
  });
});

test.describe('Cross-Linking Behavior', () => {
  test('should have bidirectional links between related conditions and treatments', async ({ page }) => {
    // Visit a condition
    await page.goto('/conditions/major-depressive-disorder');
    
    // Get a treatment link
    const treatmentLink = page.locator('a[href^="/treatments/"]').first();
    if (await treatmentLink.count() > 0) {
      const treatmentHref = await treatmentLink.getAttribute('href');
      
      if (treatmentHref) {
        // Visit the treatment page
        await page.goto(treatmentHref);
        
        // Should have link back to the condition or a related condition
        const conditionLinks = page.locator('a[href^="/conditions/"]');
        const count = await conditionLinks.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('assessment pages should link to related conditions', async ({ page }) => {
    await page.goto('/resources/gad-7');
    
    // GAD-7 is for anxiety, should link to anxiety conditions
    const conditionLinks = page.locator('a[href*="/conditions/"]');
    const count = await conditionLinks.count();
    
    // Should have at least one related condition link
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Link Density', () => {
  test('should not over-link content', async ({ page }) => {
    await page.goto('/conditions/major-depressive-disorder');
    
    // Get the main content area
    const contentArea = page.locator('main, article, [role="main"]').first();
    
    if (await contentArea.count() > 0) {
      const text = await contentArea.textContent();
      const links = await contentArea.locator('a').count();
      
      if (text) {
        const wordCount = text.split(/\s+/).length;
        const linkDensity = links / wordCount;
        
        // Link density should be reasonable (less than 1 link per 10 words)
        expect(linkDensity).toBeLessThan(0.1);
      }
    }
  });

  test('same entity should not be linked multiple times in same paragraph', async ({ page }) => {
    await page.goto('/treatments/sertraline');
    
    // Get all paragraphs
    const paragraphs = page.locator('p');
    const count = await paragraphs.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const para = paragraphs.nth(i);
      const links = await para.locator('a[href^="/"]').all();
      
      // Get hrefs
      const hrefs: string[] = [];
      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href) hrefs.push(href);
      }
      
      // No duplicate hrefs in same paragraph
      const uniqueHrefs = new Set(hrefs);
      expect(hrefs.length).toBe(uniqueHrefs.size);
    }
  });
});

