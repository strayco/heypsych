import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('Fetching daylio entity from database...\n');

const { data, error } = await supabase
  .from('entities')
  .select('*')
  .eq('slug', 'daylio')
  .single();

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

if (!data) {
  console.log('❌ No entity found with slug "daylio"');
  process.exit(0);
}

console.log('✅ Found entity in database:\n');
console.log('Slug:', data.slug);
console.log('Title:', data.title || data.name);
console.log('Type (row.type):', data.type || 'NULL');
console.log('Status:', data.status);
console.log('Metadata:', JSON.stringify(data.metadata, null, 2));
console.log('\nContent/Data fields:');
console.log('content.type:', data.content?.type || data.data?.type || 'NOT SET');
console.log('content.kind:', data.content?.kind || data.data?.kind || 'NOT SET');
console.log('\nThis entity SHOULD route to /resources/daylio');
console.log('This entity SHOULD NOT be accessible at /treatments/daylio');
