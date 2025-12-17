import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.join(path.dirname(__dirname), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEntities() {
  // Check specific depression entity by slug
  const { data: depression, error: depError } = await supabase
    .from('entities')
    .select('title, slug, metadata, status, description')
    .eq('slug', 'depression-major-depressive-disorder')
    .single();

  console.log('=== DEPRESSION ENTITY ===');
  if (depError) console.error('Error:', depError);
  else {
    console.log('Title:', depression.title);
    console.log('Slug:', depression.slug);
    console.log('Status:', depression.status);
    console.log('Description length:', depression.description?.length || 0);
    console.log('Metadata.seo:', JSON.stringify(depression.metadata?.seo, null, 2));
  }

  // Search for supplement entities
  const { data: supplements, error: suppError } = await supabase
    .from('entities')
    .select('title, slug, metadata')
    .eq('category', 'supplements')
    .limit(3);

  console.log('\n=== SUPPLEMENT ENTITIES (first 3) ===');
  if (suppError) console.error('Error:', suppError);
  else {
    supplements.forEach(s => {
      console.log(`- ${s.title} (${s.slug})`);
      console.log(`  seo.noindex:`, s.metadata?.seo?.noindex);
    });
  }
}

checkEntities().catch(console.error).finally(() => process.exit(0));
