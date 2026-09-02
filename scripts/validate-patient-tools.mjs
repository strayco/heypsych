#!/usr/bin/env node
/**
 * Validate all patient tools against DigitalToolV3 schema
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const V3_DIR = 'data/resources/tools';

// Import the schema validation - we'll do a basic check first
async function main() {
  const files = readdirSync(V3_DIR).filter(f => f.endsWith('.json'));
  let valid = 0;
  let invalid = 0;
  const errors = [];

  console.log(`Validating ${files.length} patient tools...\n`);

  for (const file of files) {
    try {
      const filepath = join(V3_DIR, file);
      const data = JSON.parse(readFileSync(filepath, 'utf8'));
      const issues = [];

      // Check required fields
      if (data.schema_version !== '3.0') issues.push('wrong schema_version');
      if (data.kind !== 'tool') issues.push('wrong kind');
      if (!data.slug) issues.push('missing slug');
      if (!data.name) issues.push('missing name');
      if (!data.one_liner || data.one_liner.length < 20) issues.push('one_liner too short');
      if (!data.best_for || data.best_for.length < 2) issues.push('best_for needs 2+ items');
      if (!data.not_for || data.not_for.length < 1) issues.push('not_for needs 1+ items');
      if (!data.support_level) issues.push('missing support_level');
      if (!data.short_description) issues.push('missing short_description');
      if (!data.long_description || data.long_description.length < 100) issues.push('long_description too short');
      if (!data.primary_hubs || data.primary_hubs.length < 1) issues.push('primary_hubs needs 1+ items');
      if (!data.tool_types || data.tool_types.length < 1) issues.push('tool_types needs 1+ items');
      if (!data.platforms) issues.push('missing platforms');
      if (!data.pricing?.model) issues.push('missing pricing.model');
      if (!data.privacy?.grade) issues.push('missing privacy.grade');
      if (!data.seo?.title) issues.push('missing seo.title');
      if (!data.seo?.meta_description) issues.push('missing seo.meta_description');
      if (!data.seo?.canonical_url) issues.push('missing seo.canonical_url');
      if (!data.seo?.faqs || data.seo.faqs.length < 3) issues.push('seo.faqs needs 3+ items');
      if (!data.governance?.last_reviewed) issues.push('missing governance.last_reviewed');

      // Check enum values
      const validHubs = ['sleep', 'anxiety-stress', 'mood-depression', 'focus-adhd', 'trauma-ptsd', 'substance-use', 'serious-mental-illness', 'find-support'];
      const validToolTypes = ['app', 'therapy-platform', 'psychiatry-platform', 'ai-therapist', 'mood-tracker', 'meditation', 'sleep-tracker', 'journal', 'peer-support', 'crisis-tool', 'assessment', 'coaching'];
      const validSupportLevels = ['self-help', 'coached', 'clinical', 'crisis'];
      const validPricingModels = ['free', 'freemium', 'subscription', 'one-time', 'enterprise', 'insurance-covered'];
      const validPrivacyGrades = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'unknown'];

      if (data.primary_hubs?.some(h => !validHubs.includes(h))) {
        issues.push('invalid primary_hub value');
      }
      if (data.tool_types?.some(t => !validToolTypes.includes(t))) {
        issues.push('invalid tool_type value');
      }
      if (data.support_level && !validSupportLevels.includes(data.support_level)) {
        issues.push('invalid support_level value');
      }
      if (data.pricing?.model && !validPricingModels.includes(data.pricing.model)) {
        issues.push('invalid pricing.model value');
      }
      if (data.privacy?.grade && !validPrivacyGrades.includes(data.privacy.grade)) {
        issues.push('invalid privacy.grade value');
      }

      // Check FAQ format
      if (data.seo?.faqs) {
        for (const faq of data.seo.faqs) {
          if (!faq.q || faq.q.length < 10) issues.push('FAQ question too short');
          if (!faq.a || faq.a.length < 20) issues.push('FAQ answer too short');
        }
      }

      if (issues.length === 0) {
        valid++;
      } else {
        invalid++;
        errors.push({ file, issues });
      }
    } catch (e) {
      invalid++;
      errors.push({ file, issues: [e.message] });
    }
  }

  console.log('========================================');
  console.log('VALIDATION RESULTS');
  console.log('========================================');
  console.log(`Valid: ${valid}`);
  console.log(`Invalid: ${invalid}`);

  if (errors.length > 0) {
    console.log('\nInvalid files:');
    errors.slice(0, 30).forEach(e => {
      console.log(`  ${e.file}: ${e.issues.join(', ')}`);
    });
    if (errors.length > 30) {
      console.log(`  ... and ${errors.length - 30} more`);
    }
  }
}

main().catch(console.error);
