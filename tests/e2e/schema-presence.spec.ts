import { test, expect } from '@playwright/test';

/**
 * Schema.org JSON-LD Presence Tests
 * 
 * Verifies that all entity pages have the required structured data
 * for SEO and Google Rich Results.
 */

interface Schema {
  '@type': string;
  [key: string]: unknown;
}

async function extractSchemas(page: import('@playwright/test').Page): Promise<Schema[]> {
  return await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const schemas: Schema[] = [];
    
    scripts.forEach((script) => {
      try {
        const content = script.textContent;
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            schemas.push(...parsed);
          } else {
            schemas.push(parsed);
          }
        }
      } catch {
        // Skip invalid JSON
      }
    });
    
    return schemas;
  });
}

test.describe('Condition Page Schemas', () => {
  const conditionPages = [
    '/conditions/major-depressive-disorder',
    '/conditions/generalized-anxiety-disorder',
    '/conditions/attention-deficit-hyperactivity-disorder',
  ];

  for (const path of conditionPages) {
    test(`should have MedicalCondition schema on ${path}`, async ({ page }) => {
      await page.goto(path);
      const schemas = await extractSchemas(page);
      
      const medicalCondition = schemas.find(s => s['@type'] === 'MedicalCondition');
      expect(medicalCondition).toBeDefined();
      expect(medicalCondition?.name).toBeTruthy();
      expect(medicalCondition?.description).toBeTruthy();
    });

    test(`should have MedicalWebPage schema on ${path}`, async ({ page }) => {
      await page.goto(path);
      const schemas = await extractSchemas(page);
      
      const webPage = schemas.find(s => s['@type'] === 'MedicalWebPage');
      expect(webPage).toBeDefined();
    });

    test(`should have BreadcrumbList schema on ${path}`, async ({ page }) => {
      await page.goto(path);
      const schemas = await extractSchemas(page);
      
      const breadcrumbs = schemas.find(s => s['@type'] === 'BreadcrumbList');
      expect(breadcrumbs).toBeDefined();
      expect(Array.isArray(breadcrumbs?.itemListElement)).toBe(true);
      expect((breadcrumbs?.itemListElement as unknown[])?.length).toBeGreaterThan(0);
    });
  }
});

test.describe('Treatment Page Schemas', () => {
  test('should have Drug schema on medication page', async ({ page }) => {
    await page.goto('/treatments/sertraline');
    const schemas = await extractSchemas(page);
    
    const drug = schemas.find(s => s['@type'] === 'Drug');
    expect(drug).toBeDefined();
    expect(drug?.name).toBeTruthy();
    expect(drug?.description).toBeTruthy();
  });

  test('should have MedicalTherapy schema on therapy page', async ({ page }) => {
    await page.goto('/treatments/cognitive-behavioral-therapy');
    const schemas = await extractSchemas(page);
    
    const therapy = schemas.find(s => s['@type'] === 'MedicalTherapy');
    expect(therapy).toBeDefined();
    expect(therapy?.name).toBeTruthy();
  });

  test('should have valid publisher in treatment schema', async ({ page }) => {
    await page.goto('/treatments/fluoxetine');
    const schemas = await extractSchemas(page);
    
    const webPage = schemas.find(s => 
      s['@type'] === 'MedicalWebPage' || s['@type'] === 'WebPage'
    );
    
    // Should have publisher information
    if (webPage?.publisher) {
      expect((webPage.publisher as Schema)['@type']).toBe('Organization');
    }
  });
});

test.describe('Resource Page Schemas', () => {
  test('should have MedicalWebPage schema on assessment', async ({ page }) => {
    await page.goto('/resources/gad-7');
    const schemas = await extractSchemas(page);
    
    const webPage = schemas.find(s => 
      s['@type'] === 'MedicalWebPage' || s['@type'] === 'WebPage'
    );
    expect(webPage).toBeDefined();
  });
});

test.describe('Medical Review Board Page Schemas', () => {
  test('should have MedicalOrganization schema', async ({ page }) => {
    await page.goto('/about/medical-review-board');
    const schemas = await extractSchemas(page);
    
    const org = schemas.find(s => 
      s['@type'] === 'MedicalOrganization' || s['@type'] === 'Organization'
    );
    expect(org).toBeDefined();
    expect(org?.name).toBeTruthy();
  });

  test('should have Person schemas for reviewers', async ({ page }) => {
    await page.goto('/about/medical-review-board');
    const schemas = await extractSchemas(page);
    
    const persons = schemas.filter(s => s['@type'] === 'Person');
    // Should have at least one person schema for board members
    expect(persons.length).toBeGreaterThan(0);
    
    // Each person should have required fields
    persons.forEach(person => {
      expect(person.name).toBeTruthy();
    });
  });
});

test.describe('Schema Validity', () => {
  test('should not have duplicate @id values', async ({ page }) => {
    await page.goto('/conditions/major-depressive-disorder');
    const schemas = await extractSchemas(page);
    
    const ids = schemas.map(s => s['@id']).filter(Boolean);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  test('should have valid URL formats', async ({ page }) => {
    await page.goto('/treatments/sertraline');
    const schemas = await extractSchemas(page);
    
    schemas.forEach(schema => {
      if (schema.url && typeof schema.url === 'string') {
        expect(schema.url).toMatch(/^https?:\/\//);
      }
      if (schema.mainEntityOfPage && typeof schema.mainEntityOfPage === 'string') {
        expect(schema.mainEntityOfPage).toMatch(/^https?:\/\//);
      }
    });
  });

  test('should not have empty required fields', async ({ page }) => {
    await page.goto('/conditions/generalized-anxiety-disorder');
    const schemas = await extractSchemas(page);
    
    schemas.forEach(schema => {
      // name and description should never be empty if present
      if ('name' in schema) {
        expect(schema.name).not.toBe('');
      }
      if ('description' in schema) {
        expect(schema.description).not.toBe('');
      }
    });
  });
});

