import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const slugs = ['persistent-depressive-disorder', 'separation-anxiety-disorder', 'adjustment-disorders', 'alcohol'];
const excludedTypes = new Set(['provider', 'hotline', 'directory', 'resource']);

for (const slug of slugs) {
  const { data } = await supabase.from('entities').select('slug, type, status').eq('slug', slug).single();
  const included = data && !excludedTypes.has(data.type);
  console.log(`${slug}: type=${data?.type}, status=${data?.status}, included=${included}`);
}
