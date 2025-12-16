#!/usr/bin/env node
/**
 * Fix JSON Syntax Errors
 *
 * Fixes double-double-quote errors in JSON files: ""text"" → "text"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BROKEN_FILES = [
  'treatments/interventional/transcranial-magnetic-stimulation.json',
  'treatments/interventional/xenon-therapy.json',
  'treatments/therapy/accelerated-resolution-therapy.json',
  'treatments/therapy/anos-family-approach.json',
  'treatments/therapy/attachment-based-family-therapy-parenting.json',
  'treatments/therapy/attachment-based-family-therapy.json',
  'treatments/therapy/authoritative-parenting-training.json',
  'treatments/therapy/behavioral-activation.json',
  'treatments/therapy/bowen-family-systems.json',
  'treatments/therapy/brainspotting.json',
  'treatments/therapy/cognitive-behavioral-therapy-insomnia.json',
  'treatments/therapy/cognitive-behavioral-therapy.json',
  'treatments/therapy/cognitive-processing-therapy.json',
  'treatments/therapy/cognitive-therapy-ptsd.json',
  'treatments/therapy/dialectical-behavior-therapy.json',
  'treatments/therapy/emdr.json',
  'treatments/therapy/emotion-coaching.json',
  'treatments/therapy/exposure-response-prevention.json',
  'treatments/therapy/filial-therapy.json',
  'treatments/therapy/interpersonal-therapy.json',
  'treatments/therapy/logotherapy.json',
  'treatments/therapy/person-centered-therapy.json',
  'treatments/therapy/psychoanalysis.json',
  'treatments/therapy/psychoeducational-groups.json',
  'treatments/therapy/rational-emotive-behavior-therapy.json',
  'treatments/therapy/short-term-dynamic-therapy.json',
  'treatments/therapy/skills-training-groups.json',
  'treatments/therapy/solution-focused-brief-therapy.json',
  'treatments/therapy/somatic-experiencing.json',
  'treatments/therapy/support-groups.json',
  'treatments/therapy/supportive-therapy.json',
  'treatments/therapy/theraplay.json'
];

const DATA_DIR = path.join(__dirname, '..', 'data');

let filesFixed = 0;
let filesFailed = 0;

console.log('=====================================');
console.log('JSON Syntax Fix Script');
console.log('=====================================\n');
console.log(`Fixing ${BROKEN_FILES.length} files...\n`);

for (const relPath of BROKEN_FILES) {
  const filePath = path.join(DATA_DIR, relPath);

  try {
    // Read file
    let content = fs.readFileSync(filePath, 'utf-8');

    // Fix double-double-quotes in array items
    // Pattern: ""text"" → "text"
    // Only fix within array contexts (after : or ,)
    const fixed = content.replace(/("")([^"]+)("")/g, '"$2"');

    // Validate JSON
    JSON.parse(fixed);

    // Write back
    fs.writeFileSync(filePath, fixed, 'utf-8');

    console.log(`✅ Fixed: ${relPath}`);
    filesFixed++;

  } catch (error) {
    console.error(`❌ Failed: ${relPath} - ${error.message}`);
    filesFailed++;
  }
}

console.log('\n=====================================');
console.log('Summary');
console.log('=====================================');
console.log(`✅ Files fixed: ${filesFixed}`);
console.log(`❌ Files failed: ${filesFailed}`);
console.log('=====================================\n');

process.exit(filesFailed > 0 ? 1 : 0);
