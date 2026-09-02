import { readFileSync } from 'fs';
import { ClinicianToolV4Z } from '../src/lib/schemas/clinician-tool-v4.ts';

const filepath = 'data/tools-v4/products/ehr/kipu-emr.json';

const data = JSON.parse(readFileSync(filepath, 'utf8'));
const result = ClinicianToolV4Z.safeParse(data);

if (result.success) {
  console.log('✓ VALID');
} else {
  console.log('✗ INVALID');
  console.log('Issues:', result.error.issues);
}
