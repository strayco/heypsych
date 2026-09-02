import { readFileSync } from 'fs';
import { ClinicianToolV4Z } from '../src/lib/schemas/clinician-tool-v4.ts';

const files = [
  'data/tools-v4/products/credentialing/pesi.json',
  'data/tools-v4/products/telehealth/curogram.json',
  'data/tools-v4/products/ehr/kipu-emr.json',
];

for (const filepath of files) {
  console.log(`\n=== ${filepath} ===`);
  try {
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    const result = ClinicianToolV4Z.safeParse(data);

    if (result.success) {
      console.log('  ✓ VALID');
    } else {
      console.log('  ✗ INVALID');
      console.log('  Error type:', typeof result.error);
      console.log('  Error keys:', Object.keys(result.error));
      console.log('  Raw error:', JSON.stringify(result.error, null, 2).slice(0, 2000));
    }
  } catch (e) {
    console.log('  ✗ EXCEPTION:', e.message);
  }
}
