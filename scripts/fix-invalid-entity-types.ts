#!/usr/bin/env tsx

/**
 * Fix invalid entity types in treatment JSON files
 * Maps specific drug classes to valid entity types
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Map of invalid types to valid entity types
const TYPE_MAPPING: Record<string, string> = {
  // Medication subtypes
  'anxiolytic': 'medication',
  'antipsychotic': 'medication',
  'antidepressant': 'medication',
  'stimulant': 'medication',
  'mood-stabilizer': 'medication',
  'anticonvulsant': 'medication',
  'hypnotic': 'medication',
  'sedative-hypnotic': 'medication',
  'benzodiazepine': 'medication',
  'nootropic': 'medication',
  'cognitive-enhancer': 'medication',
  'sleep-medication': 'medication',
  'wakefulness-promoting agent': 'medication',
  'adhd-medication': 'medication',
  'combination-medication': 'medication',
  'anesthetic': 'medication',
  'antiemetic': 'medication',
  'herbal': 'supplement',

  // Addiction treatment
  'addiction-treatment': 'medication',
  'opioid-treatment': 'medication',
  'opioid-antagonist': 'medication',
  'smoking-cessation': 'medication',
  'weight-management': 'medication',

  // Adjunctive
  'adjunctive': 'medication',

  // Therapy subtypes
  'psychedelic-assisted therapy': 'investigational',

  // Other
  'comparison': 'resource',
};

async function fixEntityTypes() {
  console.log('🔧 Fixing Invalid Entity Types\n');
  console.log('==================================\n');

  // Find all JSON files in data/treatments
  const files = await glob('data/treatments/**/*.json', {
    cwd: '/Users/jack/heypsych',
    absolute: true,
    ignore: ['**/*.backup', '**/.DS_Store']
  });

  console.log(`📂 Found ${files.length} treatment files\n`);

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const data = JSON.parse(content);

      // Check if type needs fixing
      if (data.type && TYPE_MAPPING[data.type]) {
        const oldType = data.type;
        const newType = TYPE_MAPPING[data.type];

        // Update the type
        data.type = newType;

        // Preserve the old type as drug_class in metadata if not already there
        if (!data.metadata) {
          data.metadata = {};
        }

        // Add the specific class to metadata if it's a medication
        if (newType === 'medication' && oldType !== 'combination-medication') {
          if (!data.metadata.drug_classes) {
            data.metadata.drug_classes = [];
          }

          // Convert type to readable format (e.g., "anxiolytic" -> "Anxiolytic")
          const drugClass = oldType
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          if (!data.metadata.drug_classes.includes(drugClass)) {
            data.metadata.drug_classes.unshift(drugClass);
          }
        }

        // Write back to file
        fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');

        console.log(`✅ ${path.relative('/Users/jack/heypsych', file)}`);
        console.log(`   ${oldType} → ${newType}`);
        fixed++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
      errors++;
    }
  }

  console.log('\n==================================');
  console.log('📊 SUMMARY\n');
  console.log(`✅ Fixed:   ${fixed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors:  ${errors}`);
  console.log(`📁 Total:   ${files.length}`);

  if (fixed > 0) {
    console.log('\n✨ All invalid entity types have been fixed!');
    console.log('   Run "npm run sync:content -- --type=treatments" to sync.');
  }
}

fixEntityTypes().catch(console.error);
