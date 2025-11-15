import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function countAnxietyMeds() {
  const { data: allMeds } = await supabase
    .from('entities')
    .select('slug, content')
    .eq('type', 'medication')
    .eq('status', 'active');

  if (allMeds) {
    const anxietyMeds = allMeds.filter(med => {
      const uses = med.content?.clinical_metadata?.primary_indications || [];
      return uses.includes('Anxiety');
    });

    console.log(`\n=== Medications with "Anxiety" ===`);
    console.log(`Total: ${anxietyMeds.length}\n`);

    anxietyMeds.forEach(med => {
      console.log(`- ${med.content?.name || med.slug}`);
    });

    // Also check what the major anxiety meds have
    console.log('\n\n=== Major Anxiety Medications ===\n');
    const majorAnxietyMeds = [
      'sertraline-zoloft',
      'escitalopram-lexapro',
      'fluoxetine-prozac',
      'paroxetine-paxil',
      'venlafaxine-effexor',
      'duloxetine-cymbalta',
      'buspirone-buspar',
      'alprazolam-xanax',
      'lorazepam-ativan',
      'clonazepam-klonopin'
    ];

    for (const slug of majorAnxietyMeds) {
      const med = allMeds.find(m => m.slug === slug);
      if (med) {
        const uses = med.content?.clinical_metadata?.primary_indications || [];
        console.log(`${med.content?.name || slug}:`);
        console.log(`  Uses: ${uses.join(', ')}`);
        console.log(`  Has "Anxiety": ${uses.includes('Anxiety')}`);
        console.log();
      } else {
        console.log(`${slug}: NOT FOUND IN DATABASE`);
        console.log();
      }
    }
  }
}

countAnxietyMeds().then(() => process.exit(0));
