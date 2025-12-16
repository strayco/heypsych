import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all entities
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
  return all;
}

const allEntities = await getAllEntities();
const validSlugs = new Set(allEntities.map(e => e.slug));

console.log('Total slugs:', validSlugs.size);
console.log('Has oppositional-defiant-disorder:', validSlugs.has('oppositional-defiant-disorder'));
console.log('Has conduct-disorder:', validSlugs.has('conduct-disorder'));
console.log('Has attention-deficit-hyperactivity-disorder:', validSlugs.has('attention-deficit-hyperactivity-disorder'));

// Check if they're actually in the set
const testSlugs = ['oppositional-defiant-disorder', 'conduct-disorder'];
for (const slug of testSlugs) {
  const found = [...validSlugs].find(s => s === slug);
  console.log(`Direct find ${slug}:`, found);
}
