import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Find all duplicates
const { data: all } = await supabase
  .from('entities')
  .select('id, slug, type, title')
  .eq('status', 'active')
  .order('slug');

// Group by slug
const bySlug = new Map();
for (const row of all || []) {
  if (!bySlug.has(row.slug)) {
    bySlug.set(row.slug, []);
  }
  bySlug.get(row.slug).push(row);
}

// Find duplicates
let dupeCount = 0;
for (const [slug, entries] of bySlug) {
  if (entries.length > 1) {
    dupeCount++;
    console.log(`\nDuplicate: ${slug}`);
    for (const e of entries) {
      console.log(`  - ${e.id} (type: ${e.type})`);
    }
  }
}

console.log(`\nTotal duplicate slugs: ${dupeCount}`);
