import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Count total
const { count: total } = await supabase.from('entities').select('*', { count: 'exact', head: true }).eq('status', 'active');
console.log('Total active entities:', total);

// Count conditions
const { count: conditions } = await supabase.from('entities').select('*', { count: 'exact', head: true }).eq('type', 'condition').eq('status', 'active');
console.log('Total conditions:', conditions);

// Check if alcohol is in first 1000
const { data: page0 } = await supabase.from('entities').select('slug').eq('status', 'active').range(0, 999);
console.log('Page 0 has alcohol:', page0?.some(e => e.slug === 'alcohol'));

// Get all conditions explicitly
const { data: allConditions } = await supabase.from('entities').select('slug').eq('type', 'condition').eq('status', 'active');
console.log('All conditions count:', allConditions?.length);
console.log('Has alcohol in conditions:', allConditions?.some(e => e.slug === 'alcohol'));
console.log('Has adjustment-disorders in conditions:', allConditions?.some(e => e.slug === 'adjustment-disorders'));
