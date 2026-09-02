import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ClinicianToolV4Z, isPublishReady } from '../src/lib/schemas/clinician-tool-v4.ts';
import { LAUNCH_ALLOWLIST, isToolPublishable } from '../src/lib/tools/clinician-tool-service.ts';

const dir = 'data/tools-v4/products/ai-scribe';
const files = readdirSync(dir).filter(f => f.endsWith('.json'));

let zodValid = 0;
let publishReady = 0;
let onAllowlist = 0;
let publishable = 0;
const publishableTools = [];
const notPublishableReasons = [];

for (const file of files) {
  const filepath = join(dir, file);
  try {
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    const result = ClinicianToolV4Z.safeParse(data);

    if (!result.success) {
      notPublishableReasons.push({ file, reason: 'Zod validation failed' });
      continue;
    }
    zodValid++;

    const tool = result.data;

    if (isPublishReady(tool)) {
      publishReady++;
    } else {
      notPublishableReasons.push({ file, reason: 'Not publish ready' });
      continue;
    }

    if (LAUNCH_ALLOWLIST.has(tool.slug)) {
      onAllowlist++;
    } else {
      notPublishableReasons.push({ file, reason: `Slug "${tool.slug}" not on allowlist` });
      continue;
    }

    if (isToolPublishable(tool)) {
      publishable++;
      publishableTools.push(tool.slug);
    } else {
      notPublishableReasons.push({ file, reason: 'isToolPublishable returned false' });
    }
  } catch (e) {
    notPublishableReasons.push({ file, reason: 'Parse error: ' + e.message });
  }
}

console.log('AI Scribe Publication Status:');
console.log('============================');
console.log('Total files:', files.length);
console.log('Zod valid:', zodValid);
console.log('Publish ready:', publishReady);
console.log('On allowlist:', onAllowlist);
console.log('Fully publishable:', publishable);
console.log();
console.log('Publishable tools:');
publishableTools.forEach(t => console.log('  -', t));
console.log();
console.log('Not publishable (first 15):');
notPublishableReasons.slice(0, 15).forEach(r => console.log(`  ${r.file}: ${r.reason}`));
