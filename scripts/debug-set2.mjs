import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const excludedTypes = new Set(['provider', 'hotline', 'directory', 'resource']);

async function getAllEntities() {
  const all = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('entities')
      .select('slug, type')
      .eq('status', 'active')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    page++;
  }
  return all.filter(e => !excludedTypes.has(e.type));
}

const allEntities = await getAllEntities();
const validSlugs = new Set(allEntities.map(e => e.slug));

console.log('Total in set:', validSlugs.size);

const test = ['persistent-depressive-disorder', 'separation-anxiety-disorder', 'adjustment-disorders', 'alcohol'];
for (const s of test) {
  console.log(`${s}: ${validSlugs.has(s)}`);
}

// Find in raw data
for (const s of test) {
  const found = allEntities.find(e => e.slug === s);
  console.log(`Raw data ${s}:`, found);
}
