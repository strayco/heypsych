import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ClinicianToolV4Z } from '../src/lib/schemas/clinician-tool-v4.ts';

const dir = 'data/tools-v4/products/ai-scribe';
const files = readdirSync(dir).filter(f => f.endsWith('.json'));

let valid = 0;
let invalid = 0;
const errors = [];

for (const file of files) {
  const filepath = join(dir, file);
  try {
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    const result = ClinicianToolV4Z.safeParse(data);
    if (result.success) {
      valid++;
    } else {
      invalid++;
      if (result.error && result.error.errors && result.error.errors.length > 0) {
        const firstError = result.error.errors[0];
        errors.push({
          file,
          path: firstError.path ? firstError.path.join('.') : 'unknown',
          message: firstError.message || 'unknown error'
        });
      } else {
        errors.push({
          file,
          path: 'validation',
          message: String(result.error)
        });
      }
    }
  } catch (e) {
    invalid++;
    errors.push({ file, path: 'exception', message: e.message });
  }
}

console.log('AI Scribe Zod Validation Results:');
console.log('=================================');
console.log('Valid:', valid);
console.log('Invalid:', invalid);
console.log('Total:', files.length);

if (errors.length > 0) {
  console.log('\nFirst 20 errors:');
  errors.slice(0, 20).forEach(e => {
    console.log(`  ${e.file}: ${e.path}: ${e.message}`);
  });
}
