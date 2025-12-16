import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Count all entities
const { count } = await supabase
  .from('entities')
  .select('*', { count: 'exact', head: true });

console.log('Total entities:', count);

// Count treatments
const { count: treatmentCount } = await supabase
  .from('entities')
  .select('*', { count: 'exact', head: true })
  .eq('type', 'antidepressant');

console.log('Antidepressant entities:', treatmentCount);

// List all antidepressants
const { data: antidepressants } = await supabase
  .from('entities')
  .select('slug, title')
  .eq('type', 'antidepressant')
  .limit(10);

console.log('Antidepressants:', antidepressants);
