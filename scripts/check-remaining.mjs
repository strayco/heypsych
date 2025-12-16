import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const slugs = [
  'bipolar-disorder',
  'persistent-depressive-disorder', 
  'separation-anxiety-disorder',
  'adjustment-disorders',
  'adjustment-disorder',
  'alcohol',
];

for (const slug of slugs) {
  const { data } = await supabase.from('entities').select('slug, type').eq('slug', slug);
  if (data?.length) {
    console.log(`✓ ${slug} → ${data[0].type}`);
  } else {
    // Find similar
    const base = slug.replace(/-?s$/, '').split('-')[0];
    const { data: similar } = await supabase.from('entities').select('slug, type').ilike('slug', `%${base}%`).limit(5);
    console.log(`✗ ${slug} NOT FOUND. Similar:`);
    similar?.forEach(s => console.log(`   - ${s.slug} (${s.type})`));
  }
}
