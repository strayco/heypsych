import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check specific slugs
const slugsToCheck = [
  'oppositional-defiant-disorder',
  'conduct-disorder', 
  'attention-deficit-hyperactivity-disorder',
  'adjustment-disorders',
  'adjustment-disorder',
  'family-therapy',
];

for (const slug of slugsToCheck) {
  const { data } = await supabase
    .from('entities')
    .select('slug, type, status')
    .eq('slug', slug);
  
  console.log(`${slug}: ${data?.length ? JSON.stringify(data[0]) : 'NOT FOUND'}`);
}

// Also search partial matches
console.log('\n--- Searching for similar slugs ---');
const { data: odd } = await supabase
  .from('entities')
  .select('slug, type')
  .ilike('slug', '%oppositional%');
console.log('Oppositional:', odd);

const { data: cond } = await supabase
  .from('entities')
  .select('slug, type')
  .ilike('slug', '%conduct%');
console.log('Conduct:', cond);

const { data: adhd } = await supabase
  .from('entities')
  .select('slug, type')
  .ilike('slug', '%attention-deficit%');
console.log('ADHD:', adhd);
