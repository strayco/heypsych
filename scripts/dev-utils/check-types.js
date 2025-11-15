import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTypes() {
  const { data: all } = await supabase
    .from('entities')
    .select('type');

  if (all) {
    const typeCounts = {};
    all.forEach(e => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    });

    console.log('\n=== Entity Types in Database ===\n');
    Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`${type}: ${count}`);
      });

    console.log(`\nTotal entities: ${all.length}`);

    // Check alprazolam specifically
    const { data: alprazolam } = await supabase
      .from('entities')
      .select('type, slug, content')
      .eq('slug', 'alprazolam-xanax');

    console.log('\n=== Alprazolam ===');
    if (alprazolam && alprazolam.length > 0) {
      console.log('Type:', alprazolam[0].type);
      console.log('Name:', alprazolam[0].content?.name);
    } else {
      console.log('NOT FOUND');
    }
  }
}

checkTypes().then(() => process.exit(0));
