import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { DigitalToolV3Z } from '../src/lib/schemas/digital-tool-v3.ts';

const dir = 'data/resources/tools';
const files = readdirSync(dir)
  .filter(f => f.endsWith('.json'));

let valid = 0;
let invalid = 0;
const errors = [];
const validTools = [];

for (const file of files) {
  const filepath = join(dir, file);
  try {
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    const result = DigitalToolV3Z.safeParse(data);

    if (result.success) {
      valid++;
      validTools.push({
        slug: data.slug,
        name: data.name,
        status: data.status,
        score: data.governance?.quality_score
      });
    } else {
      invalid++;
      errors.push({
        file,
        slug: data.slug,
        issues: result.error.issues.slice(0, 3)
      });
    }
  } catch (e) {
    invalid++;
    errors.push({ file, error: e.message });
  }
}

console.log('=== PATIENT TOOLS VALIDATION ===\n');
console.log(`Valid: ${valid}/${files.length}`);
console.log(`Invalid: ${invalid}/${files.length}`);

console.log('\n=== VALID TOOLS ===');
for (const tool of validTools) {
  console.log(`  ${tool.slug}: ${tool.name} (status: ${tool.status}, score: ${tool.score})`);
}

if (errors.length > 0) {
  console.log('\n=== ERRORS ===');
  for (const err of errors) {
    console.log(`\n${err.file}:`);
    if (err.issues) {
      for (const issue of err.issues) {
        console.log(`  - ${issue.path.join('.')}: ${issue.message}`);
      }
    } else {
      console.log(`  - ${err.error}`);
    }
  }
}
