import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Delete the generic 'medication' type duplicates, keep the specific types
const dupsToDelete = [
  { slug: 'fluoxetine-prozac', typeToDelete: 'medication' },
  { slug: 'fluoxetine-olanzapine-symbyax', typeToDelete: 'medication' },
  { slug: 'acamprosate-campral', typeToDelete: 'medication' },
  { slug: 'agomelatine-valdoxan', typeToDelete: 'medication' },
];

for (const { slug, typeToDelete } of dupsToDelete) {
  const { data, error } = await supabase
    .from('entities')
    .delete()
    .eq('slug', slug)
    .eq('type', typeToDelete);
  
  if (error) {
    console.log(`Error deleting ${slug} (${typeToDelete}):`, error);
  } else {
    console.log(`Deleted duplicate: ${slug} (type: ${typeToDelete})`);
  }
}

// Verify fluoxetine-prozac now has single entry
const { data: check } = await supabase
  .from('entities')
  .select('id, slug, type')
  .eq('slug', 'fluoxetine-prozac');

console.log('\nFluoxetine-prozac entries after cleanup:', check);
