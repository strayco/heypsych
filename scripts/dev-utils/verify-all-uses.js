import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAllUses() {
  const medicationTypes = [
    "medication", "antidepressant", "antipsychotic", "anxiolytic",
    "benzodiazepine", "hypnotic", "sedative-hypnotic", "stimulant",
    "mood-stabilizer", "anticonvulsant", "nootropic", "cognitive-enhancer",
    "adhd-medication", "addiction-treatment", "opioid-dependence-treatment",
    "alcohol-dependence-treatment", "smoking-cessation-antidepressant",
    "antihistamine", "muscle-relaxant", "barbiturate", "anesthetic",
    "antiemetic", "antihypertensive", "opioid-antagonist",
    "combination-medication", "antidepressant-antipsychotic-combination",
    "combination-antipsychotic-antihistamine", "wakefulness-promoting-agent",
    "non-stimulant-adhd-medication", "sleep-medication", "herbal",
  ];

  const { data, error } = await supabase
    .from("entities")
    .select("slug, content")
    .in("type", medicationTypes)
    .eq("status", "active");

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\nChecking ${data.length} medications...\n`);

  // Expected simplified categories
  const expectedCategories = [
    'Depression', 'Anxiety', 'Psychosis', 'OCD', 'ADHD',
    'Dementia', 'PTSD', 'ASD', 'Bipolar', 'Insomnia',
    'Substance Use', 'Seizures', 'Pain', 'Other'
  ];

  // Collect all unique uses
  const allUses = new Set();
  const problematicMeds = [];
  const useCounts = {};

  data.forEach(med => {
    const uses = med.content?.clinical_metadata?.primary_indications || [];

    uses.forEach(use => {
      allUses.add(use);
      useCounts[use] = (useCounts[use] || 0) + 1;

      // Check if this use is NOT in our expected categories
      if (!expectedCategories.includes(use)) {
        const existing = problematicMeds.find(p => p.use === use);
        if (existing) {
          existing.meds.push(med.content?.name || med.slug);
        } else {
          problematicMeds.push({
            use: use,
            meds: [med.content?.name || med.slug]
          });
        }
      }
    });
  });

  console.log('=== ALL UNIQUE USES ===\n');
  Array.from(allUses).sort().forEach(use => {
    const count = useCounts[use];
    const isExpected = expectedCategories.includes(use);
    const status = isExpected ? '✅' : '❌';
    console.log(`${status} ${use} (${count} medications)`);
  });

  console.log(`\n\nTotal unique use values: ${allUses.size}`);
  console.log(`Expected categories: ${expectedCategories.length}`);
  console.log(`Unexpected categories: ${problematicMeds.length}`);

  if (problematicMeds.length > 0) {
    console.log('\n\n=== MEDICATIONS WITH NON-SIMPLIFIED USES ===\n');
    problematicMeds.forEach(({ use, meds }) => {
      console.log(`\n"${use}" (${meds.length} medications):`);
      meds.slice(0, 5).forEach(med => console.log(`  - ${med}`));
      if (meds.length > 5) {
        console.log(`  ... and ${meds.length - 5} more`);
      }
    });
  }

  // Count medications by category
  console.log('\n\n=== MEDICATION COUNT BY USE ===\n');
  expectedCategories.forEach(cat => {
    const count = data.filter(med => {
      const uses = med.content?.clinical_metadata?.primary_indications || [];
      return uses.includes(cat);
    }).length;
    console.log(`${cat}: ${count} medications`);
  });
}

verifyAllUses().then(() => process.exit(0));
