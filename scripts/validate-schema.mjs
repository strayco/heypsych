#!/usr/bin/env node
/**
 * Schema Validation Script
 * 
 * Validates JSON-LD schemas across key pages using Playwright.
 * Mandatory CI gate - deployment blocked if schemas are invalid.
 * 
 * Usage:
 *   node scripts/validate-schema.mjs
 *   npm run test:schema
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Required schema types per page type
const REQUIRED_SCHEMAS = {
  condition: ['MedicalCondition', 'MedicalWebPage', 'BreadcrumbList', 'MedicalOrganization'],
  treatment: ['Drug', 'MedicalWebPage', 'BreadcrumbList', 'MedicalOrganization'],
  therapy: ['MedicalTherapy', 'MedicalWebPage', 'BreadcrumbList', 'MedicalOrganization'],
  resource: ['MedicalWebPage', 'BreadcrumbList'],
  board: ['MedicalOrganization', 'Person'],
};

// Test pages to validate
const TEST_PAGES = [
  { url: '/conditions/major-depressive-disorder', type: 'condition', name: 'MDD Condition' },
  { url: '/conditions/generalized-anxiety-disorder', type: 'condition', name: 'GAD Condition' },
  { url: '/treatments/sertraline', type: 'treatment', name: 'Sertraline Medication' },
  { url: '/treatments/cognitive-behavioral-therapy', type: 'therapy', name: 'CBT Therapy' },
  { url: '/resources/gad-7', type: 'resource', name: 'GAD-7 Assessment' },
  { url: '/about/medical-review-board', type: 'board', name: 'Medical Review Board' },
];

// Schema.org validation rules
const SCHEMA_RULES = {
  MedicalCondition: {
    required: ['@type', 'name', 'description'],
    recommended: ['code', 'possibleTreatment', 'signOrSymptom'],
  },
  Drug: {
    required: ['@type', 'name', 'description'],
    recommended: ['drugClass', 'activeIngredient', 'administrationRoute'],
  },
  MedicalTherapy: {
    required: ['@type', 'name', 'description'],
    recommended: ['procedureType', 'followup'],
  },
  MedicalWebPage: {
    required: ['@type', 'name', 'description', 'lastReviewed'],
    recommended: ['reviewedBy', 'dateModified'],
  },
  BreadcrumbList: {
    required: ['@type', 'itemListElement'],
  },
  MedicalOrganization: {
    required: ['@type', 'name'],
    recommended: ['description', 'url'],
  },
  Person: {
    required: ['@type', 'name'],
    recommended: ['jobTitle', 'worksFor'],
  },
  FAQPage: {
    required: ['@type', 'mainEntity'],
  },
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const errors = [];

/**
 * Extract JSON-LD schemas from page
 */
async function extractSchemas(page) {
  return await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const schemas = [];
    
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '');
        // Handle @graph format
        if (data['@graph']) {
          schemas.push(...data['@graph']);
        } else {
          schemas.push(data);
        }
      } catch (e) {
        console.error('Failed to parse JSON-LD:', e);
      }
    });
    
    return schemas;
  });
}

/**
 * Validate a single schema against rules
 */
function validateSchema(schema, rules) {
  const issues = [];
  const schemaType = schema['@type'];
  
  if (!schemaType) {
    issues.push('Missing @type');
    return { valid: false, issues };
  }
  
  const typeRules = rules[schemaType];
  if (!typeRules) {
    // Unknown type - just check for @type and name
    if (!schema.name && !schema['@id']) {
      issues.push(`Schema ${schemaType} missing name or @id`);
    }
    return { valid: issues.length === 0, issues };
  }
  
  // Check required fields
  for (const field of typeRules.required) {
    if (!schema[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  }
  
  // Check for empty values
  for (const [key, value] of Object.entries(schema)) {
    if (value === '' || value === null) {
      issues.push(`Empty value for field: ${key}`);
    }
  }
  
  return { valid: issues.length === 0, issues };
}

/**
 * Validate page schemas
 */
async function validatePage(browser, pageConfig) {
  const { url, type, name } = pageConfig;
  const fullUrl = `${BASE_URL}${url}`;
  
  console.log(`\n📄 Testing: ${name}`);
  console.log(`   URL: ${fullUrl}`);
  
  const page = await browser.newPage();
  
  try {
    const response = await page.goto(fullUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    if (!response || response.status() !== 200) {
      failedTests++;
      totalTests++;
      errors.push({ page: name, error: `HTTP ${response?.status() || 'no response'}` });
      console.log(`   ❌ FAILED: Page returned ${response?.status() || 'no response'}`);
      return;
    }
    
    const schemas = await extractSchemas(page);
    console.log(`   Found ${schemas.length} schemas`);
    
    if (schemas.length === 0) {
      failedTests++;
      totalTests++;
      errors.push({ page: name, error: 'No JSON-LD schemas found' });
      console.log(`   ❌ FAILED: No JSON-LD schemas found`);
      return;
    }
    
    // Check required schema types
    const foundTypes = schemas.map(s => s['@type']).filter(Boolean);
    const requiredTypes = REQUIRED_SCHEMAS[type] || [];
    
    for (const requiredType of requiredTypes) {
      totalTests++;
      if (foundTypes.includes(requiredType)) {
        passedTests++;
        console.log(`   ✅ Has ${requiredType}`);
      } else {
        failedTests++;
        errors.push({ page: name, error: `Missing required schema: ${requiredType}` });
        console.log(`   ❌ Missing ${requiredType}`);
      }
    }
    
    // Validate each schema
    for (const schema of schemas) {
      totalTests++;
      const result = validateSchema(schema, SCHEMA_RULES);
      
      if (result.valid) {
        passedTests++;
      } else {
        failedTests++;
        for (const issue of result.issues) {
          errors.push({ page: name, schema: schema['@type'], error: issue });
          console.log(`   ⚠️  ${schema['@type']}: ${issue}`);
        }
      }
    }
    
  } catch (error) {
    failedTests++;
    totalTests++;
    errors.push({ page: name, error: error.message });
    console.log(`   ❌ ERROR: ${error.message}`);
  } finally {
    await page.close();
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           SCHEMA.ORG VALIDATION - CI GATE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Testing ${TEST_PAGES.length} pages`);
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    for (const pageConfig of TEST_PAGES) {
      await validatePage(browser, pageConfig);
    }
  } finally {
    await browser.close();
  }
  
  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                      RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (errors.length > 0) {
    console.log('');
    console.log('ERRORS:');
    for (const err of errors.slice(0, 10)) {
      console.log(`  - ${err.page}: ${err.error}`);
    }
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more`);
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Exit with error code if any failures
  if (failedTests > 0) {
    console.log('');
    console.log('❌ SCHEMA VALIDATION FAILED - Deployment blocked');
    process.exit(1);
  } else {
    console.log('');
    console.log('✅ SCHEMA VALIDATION PASSED - Ready for deployment');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
















