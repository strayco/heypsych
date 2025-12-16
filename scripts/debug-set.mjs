import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAllEntities() {
  const all = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase.from('entities').select('slug, type').eq('status', 'active').range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) { console.error('Error:', error); break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    console.log(`Page ${page}: got ${data.length} entities (total: ${all.length})`);
    if (data.length < pageSize) break;
    page++;
  }
  return all;
}

const allEntities = await getAllEntities();
const validSlugs = new Set(allEntities.map(e => e.slug));

console.log(`\nTotal entities: ${allEntities.length}`);
console.log(`Unique slugs: ${validSlugs.size}`);

// Check specific slugs
const test = ['schizophrenia', 'autism-spectrum-disorder', 'bipolar-disorder'];
for (const s of test) {
  console.log(`${s}: ${validSlugs.has(s)}`);
}

// Find schizophrenia in raw data
const schiz = allEntities.find(e => e.slug === 'schizophrenia');
console.log('\nSchizophrenia entity:', schiz);
