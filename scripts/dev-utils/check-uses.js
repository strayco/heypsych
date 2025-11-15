import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUses() {
  // Get all medications
  const { data: allMeds } = await supabase
    .from('entities')
    .select('slug, content')
    .eq('type', 'medication');

  if (allMeds) {
    const allUses = new Set();
    allMeds.forEach(med => {
      const uses = med.content?.clinical_metadata?.primary_indications || [];
      uses.forEach(u => allUses.add(u));
    });

    console.log('\n=== All Unique Uses in Database ===');
    console.log(Array.from(allUses).sort());
    console.log(`\nTotal unique uses: ${allUses.size}`);

    // Check specific meds
    console.log('\n=== Specific Medications ===\n');
    const specificMeds = ['sertraline-zoloft', 'escitalopram-lexapro', 'fluoxetine-prozac', 'alprazolam-xanax'];

    for (const slug of specificMeds) {
      const med = allMeds.find(m => m.slug === slug);
      if (med) {
        console.log(`${med.content?.name || slug}:`);
        console.log('  Uses:', med.content?.clinical_metadata?.primary_indications || []);
      }
    }
  }
}

checkUses().then(() => process.exit(0));
