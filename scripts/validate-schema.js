#!/usr/bin/env node
/**
 * Schema Validation CI Gate
 * 
 * Validates JSON-LD schemas on key pages against Schema.org and Google Rich Results rules.
 * Fails the build if any invalid schemas are found.
 * 
 * Usage:
 *   npm run test:schema
 *   
 * CI Usage:
 *   npm run ci:validate
 */

const { chromium } = require('playwright');

// Pages to validate
const TEST_PAGES = [
  // Conditions
  { path: '/conditions/major-depressive-disorder', expectedSchemas: ['MedicalCondition', 'MedicalWebPage', 'BreadcrumbList'] },
  { path: '/conditions/generalized-anxiety-disorder', expectedSchemas: ['MedicalCondition', 'MedicalWebPage', 'BreadcrumbList'] },
  { path: '/conditions/attention-deficit-hyperactivity-disorder', expectedSchemas: ['MedicalCondition', 'MedicalWebPage', 'BreadcrumbList'] },
  
  // Treatments
  { path: '/treatments/sertraline', expectedSchemas: ['Drug', 'MedicalWebPage', 'BreadcrumbList'] },
  { path: '/treatments/cognitive-behavioral-therapy', expectedSchemas: ['MedicalTherapy', 'MedicalWebPage', 'BreadcrumbList'] },
  
  // Resources
  { path: '/resources/gad-7', expectedSchemas: ['MedicalWebPage'] },
  { path: '/resources/phq-9', expectedSchemas: ['MedicalWebPage'] },
  
  // Medical Review Board
  { path: '/about/medical-review-board', expectedSchemas: ['MedicalOrganization', 'Person'] },
];

// Schema.org required properties by type
const REQUIRED_PROPERTIES = {
  MedicalCondition: ['@type', 'name', 'description'],
  Drug: ['@type', 'name', 'description'],
  MedicalTherapy: ['@type', 'name', 'description'],
  MedicalWebPage: ['@type', 'name', 'lastReviewed'],
  BreadcrumbList: ['@type', 'itemListElement'],
  MedicalOrganization: ['@type', 'name'],
  Person: ['@type', 'name'],
  FAQPage: ['@type', 'mainEntity'],
  Organization: ['@type', 'name', 'url'],
};

// Google Rich Results specific rules
const GOOGLE_RULES = {
  MedicalCondition: {
    recommended: ['alternateName', 'associatedAnatomy', 'possibleTreatment'],
  },
  Drug: {
    recommended: ['activeIngredient', 'manufacturer', 'prescribingInfo'],
  },
  FAQPage: {
    required: ['mainEntity'],
    mainEntityRules: { '@type': 'Question', required: ['name', 'acceptedAnswer'] },
  },
  BreadcrumbList: {
    required: ['itemListElement'],
    itemRules: { '@type': 'ListItem', required: ['position', 'name'] },
  },
};

class SchemaValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const prefix = {
      info: '   ',
      success: ' ✅',
      warning: ' ⚠️',
      error: ' ❌',
    }[type];
    console.log(`${prefix} ${message}`);
  }

  validateSchema(schema, path) {
    const type = schema['@type'];
    const issues = [];

    if (!type) {
      issues.push('Missing @type property');
      return issues;
    }

    // Check required properties
    const required = REQUIRED_PROPERTIES[type];
    if (required) {
      for (const prop of required) {
        if (!schema[prop] && schema[prop] !== 0 && schema[prop] !== false) {
          issues.push(`Missing required property: ${prop}`);
        }
      }
    }

    // Check for empty strings
    for (const [key, value] of Object.entries(schema)) {
      if (value === '' || value === null) {
        issues.push(`Empty value for property: ${key}`);
      }
    }

    // Check Google-specific rules
    const googleRules = GOOGLE_RULES[type];
    if (googleRules) {
      if (googleRules.required) {
        for (const prop of googleRules.required) {
          if (!schema[prop]) {
            issues.push(`Google requires: ${prop}`);
          }
        }
      }
    }

    // Validate BreadcrumbList items
    if (type === 'BreadcrumbList' && schema.itemListElement) {
      if (!Array.isArray(schema.itemListElement)) {
        issues.push('BreadcrumbList.itemListElement must be an array');
      } else {
        schema.itemListElement.forEach((item, index) => {
          if (!item.position) issues.push(`BreadcrumbList item ${index} missing position`);
          if (!item.name && !item.item?.name) issues.push(`BreadcrumbList item ${index} missing name`);
        });
      }
    }

    // Validate FAQPage items
    if (type === 'FAQPage' && schema.mainEntity) {
      if (!Array.isArray(schema.mainEntity)) {
        issues.push('FAQPage.mainEntity must be an array');
      } else {
        schema.mainEntity.forEach((item, index) => {
          if (item['@type'] !== 'Question') {
            issues.push(`FAQ item ${index} must be type Question`);
          }
          if (!item.name) issues.push(`FAQ item ${index} missing question text (name)`);
          if (!item.acceptedAnswer) issues.push(`FAQ item ${index} missing acceptedAnswer`);
        });
      }
    }

    // Check for valid URLs
    const urlProps = ['url', 'sameAs', 'mainEntityOfPage', 'image'];
    for (const prop of urlProps) {
      if (schema[prop]) {
        const urls = Array.isArray(schema[prop]) ? schema[prop] : [schema[prop]];
        for (const url of urls) {
          if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('/')) {
            issues.push(`Invalid URL format for ${prop}: ${url}`);
          }
        }
      }
    }

    return issues;
  }

  async extractSchemas(page) {
    return await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      const schemas = [];
      
      scripts.forEach((script, index) => {
        try {
          const content = script.textContent;
          if (content) {
            const parsed = JSON.parse(content);
            // Handle both single schemas and arrays
            if (Array.isArray(parsed)) {
              schemas.push(...parsed);
            } else {
              schemas.push(parsed);
            }
          }
        } catch (e) {
          schemas.push({ parseError: e.message, index });
        }
      });
      
      return schemas;
    });
  }

  async validatePage(browser, baseUrl, testPage) {
    const page = await browser.newPage();
    const url = `${baseUrl}${testPage.path}`;
    
    this.log(`Validating: ${testPage.path}`);
    
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      if (!response || response.status() !== 200) {
        this.errors.push({ path: testPage.path, error: `HTTP ${response?.status() || 'unknown'}` });
        this.failed++;
        this.log(`Page returned ${response?.status()}`, 'error');
        return;
      }
      
      const schemas = await this.extractSchemas(page);
      
      if (schemas.length === 0) {
        this.errors.push({ path: testPage.path, error: 'No JSON-LD schemas found' });
        this.failed++;
        this.log('No JSON-LD schemas found', 'error');
        return;
      }
      
      // Check for parse errors
      const parseErrors = schemas.filter(s => s.parseError);
      if (parseErrors.length > 0) {
        this.errors.push({ path: testPage.path, error: `JSON parse errors: ${parseErrors.map(p => p.parseError).join(', ')}` });
        this.failed++;
        this.log('JSON-LD parse errors', 'error');
        return;
      }
      
      // Check for expected schema types
      const foundTypes = schemas.map(s => s['@type']).filter(Boolean);
      const missingTypes = testPage.expectedSchemas.filter(t => !foundTypes.includes(t));
      
      if (missingTypes.length > 0) {
        this.warnings.push({ path: testPage.path, warning: `Missing expected schemas: ${missingTypes.join(', ')}` });
        this.log(`Missing schemas: ${missingTypes.join(', ')}`, 'warning');
      }
      
      // Validate each schema
      let pageValid = true;
      for (const schema of schemas) {
        if (schema.parseError) continue;
        
        const issues = this.validateSchema(schema, testPage.path);
        if (issues.length > 0) {
          pageValid = false;
          this.errors.push({
            path: testPage.path,
            type: schema['@type'],
            issues,
          });
          this.log(`${schema['@type']}: ${issues.length} issues`, 'error');
          issues.forEach(issue => this.log(`  - ${issue}`, 'error'));
        }
      }
      
      if (pageValid) {
        this.passed++;
        this.log(`Found ${schemas.length} valid schemas: ${foundTypes.join(', ')}`, 'success');
      } else {
        this.failed++;
      }
      
    } catch (error) {
      this.errors.push({ path: testPage.path, error: error.message });
      this.failed++;
      this.log(`Error: ${error.message}`, 'error');
    } finally {
      await page.close();
    }
  }

  printReport() {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                 SCHEMA VALIDATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`  ✅ Passed: ${this.passed}`);
    console.log(`  ❌ Failed: ${this.failed}`);
    console.log(`  ⚠️  Warnings: ${this.warnings.length}`);
    console.log('');
    
    if (this.errors.length > 0) {
      console.log('ERRORS:');
      console.log('───────────────────────────────────────────────────────────────');
      this.errors.forEach(err => {
        console.log(`  ${err.path}`);
        if (err.type) console.log(`    Type: ${err.type}`);
        if (err.error) console.log(`    Error: ${err.error}`);
        if (err.issues) {
          err.issues.forEach(issue => console.log(`    - ${issue}`));
        }
      });
      console.log('');
    }
    
    if (this.warnings.length > 0) {
      console.log('WARNINGS:');
      console.log('───────────────────────────────────────────────────────────────');
      this.warnings.forEach(warn => {
        console.log(`  ${warn.path}: ${warn.warning}`);
      });
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
    
    return this.failed === 0;
  }
}

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('');
  console.log('🔍 Schema Validation CI Gate');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Pages to validate: ${TEST_PAGES.length}`);
  console.log('');
  
  const validator = new SchemaValidator();
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    
    for (const testPage of TEST_PAGES) {
      await validator.validatePage(browser, baseUrl, testPage);
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
  
  const success = validator.printReport();
  
  if (!success) {
    console.log('❌ Schema validation FAILED - blocking deployment');
    process.exit(1);
  }
  
  console.log('✅ Schema validation PASSED');
  process.exit(0);
}

main();

