import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const missing = [
  'bipolar-disorder',
  'schizophrenia', 
  'autism-spectrum-disorder',
  'persistent-depressive-disorder',
  'separation-anxiety-disorder',
  'body-dysmorphic-disorder',
];

for (const slug of missing) {
  const { data } = await supabase.from('entities').select('slug, type, status').eq('slug', slug);
  if (data && data.length > 0) {
    console.log(`✓ ${slug} exists (${data[0].type}, ${data[0].status})`);
  } else {
    // Search similar
    const { data: similar } = await supabase.from('entities').select('slug').ilike('slug', `%${slug.split('-')[0]}%`).limit(3);
    console.log(`✗ ${slug} NOT FOUND. Similar:`, similar?.map(s => s.slug));
  }
}
