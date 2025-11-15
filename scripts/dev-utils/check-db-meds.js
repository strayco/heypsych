import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMedications() {
  // Get a few sample medications to check their data
  const { data, error } = await supabase
    .from('entities')
    .select('slug, content')
    .eq('type', 'medication')
    .in('slug', ['sertraline-zoloft', 'alprazolam-xanax', 'aripiprazole-abilify'])
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Database Check ===\n');

  data.forEach(med => {
    console.log(`\n${med.content?.name} (${med.slug})`);
    console.log('Mechanisms:', med.content?.metadata?.mechanism_categories || 'none');
    console.log('Uses:', med.content?.clinical_metadata?.primary_indications?.slice(0, 3) || 'none');
    console.log('Routes:', med.content?.metadata?.administration_routes || 'none');
  });

  // Get all unique mechanism categories
  const { data: allMeds } = await supabase
    .from('entities')
    .select('content')
    .eq('type', 'medication');

  if (allMeds) {
    const allMechanisms = new Set();
    allMeds.forEach(med => {
      const mechs = med.content?.metadata?.mechanism_categories || [];
      mechs.forEach(m => allMechanisms.add(m));
    });

    console.log('\n\n=== All Unique Mechanisms in Database ===');
    console.log(Array.from(allMechanisms).sort());
  }
}

checkMedications().then(() => process.exit(0));
