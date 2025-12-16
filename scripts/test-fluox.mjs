import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check if fluoxetine-prozac exists at all
const { data: any, error } = await supabase
  .from('entities')
  .select('id, slug, type, title, status')
  .ilike('slug', '%fluoxetine%');
  
console.log('All fluoxetine entries:', any);
console.log('Error:', error);

// Also check what type='antidepressant' and status='active' shows
const { data: active } = await supabase
  .from('entities')
  .select('slug, type, status')
  .eq('slug', 'fluoxetine-prozac');
  
console.log('\nDirect slug match for fluoxetine-prozac:', active);
