import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get distinct types
const { data } = await supabase
  .from('entities')
  .select('type')
  .eq('status', 'active');

const typeCounts = {};
for (const row of data || []) {
  typeCounts[row.type] = (typeCounts[row.type] || 0) + 1;
}

console.log('Entity types in database:');
for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}

// Check if conditions exist with a sample slug
const { data: sample } = await supabase
  .from('entities')
  .select('slug, type, title')
  .ilike('slug', '%anxiety%')
  .limit(5);

console.log('\nSample anxiety entities:', sample);
