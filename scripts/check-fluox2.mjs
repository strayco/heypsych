import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('entities')
  .select('id, slug, type, title, status')
  .ilike('slug', '%fluoxetine%');

console.log('All fluoxetine entries:');
for (const row of data || []) {
  console.log(`  ${row.slug} | type=${row.type} | status=${row.status}`);
}
