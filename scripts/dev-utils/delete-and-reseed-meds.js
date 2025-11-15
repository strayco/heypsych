import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteAndReseed() {
  console.log('🗑️  Deleting all medications...');

  const { error: deleteError } = await supabase
    .from('entities')
    .delete()
    .eq('type', 'medication');

  if (deleteError) {
    console.error('Error deleting:', deleteError);
    return;
  }

  console.log('✅ All medications deleted');
  console.log('🔄 Re-seeding medications...');
  console.log('Run: npm run seed:treatments');
}

deleteAndReseed().then(() => process.exit(0));
