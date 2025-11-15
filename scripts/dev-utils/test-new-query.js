import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  const medicationTypes = [
    "medication",
    "antidepressant",
    "antipsychotic",
    "anxiolytic",
    "benzodiazepine",
    "hypnotic",
    "sedative-hypnotic",
    "stimulant",
    "mood-stabilizer",
    "anticonvulsant",
    "nootropic",
    "cognitive-enhancer",
    "adhd-medication",
    "addiction-treatment",
    "opioid-dependence-treatment",
    "alcohol-dependence-treatment",
    "smoking-cessation-antidepressant",
    "antihistamine",
    "muscle-relaxant",
    "barbiturate",
    "anesthetic",
    "antiemetic",
    "antihypertensive",
    "opioid-antagonist",
    "combination-medication",
    "antidepressant-antipsychotic-combination",
    "combination-antipsychotic-antihistamine",
    "wakefulness-promoting-agent",
    "non-stimulant-adhd-medication",
    "sleep-medication",
    "herbal",
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

  console.log(`\nTotal medications: ${data.length}\n`);

  // Count how many have "Anxiety"
  const anxietyMeds = data.filter(med => {
    const uses = med.content?.clinical_metadata?.primary_indications || [];
    return uses.includes('Anxiety');
  });

  console.log(`Medications with "Anxiety": ${anxietyMeds.length}\n`);

  // Check for the major anxiety meds
  const majorMeds = [
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

  console.log('=== Major Anxiety Medications ===\n');
  majorMeds.forEach(slug => {
    const found = data.find(m => m.slug === slug);
    if (found) {
      const uses = found.content?.clinical_metadata?.primary_indications || [];
      const hasAnxiety = uses.includes('Anxiety');
      console.log(`✅ ${found.content?.name || slug} - Has Anxiety: ${hasAnxiety}`);
    } else {
      console.log(`❌ ${slug} - NOT FOUND`);
    }
  });
}

testQuery().then(() => process.exit(0));
