import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMechanismsAndRoutes() {
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

  // Expected categories
  const expectedMechanisms = ['SSRI', 'SNRI', 'GABA', 'Dopamine Blocker', 'Alpha Blocker', 'Other'];
  const expectedRoutes = ['Oral', 'Liquid', 'Sublingual', 'Patch', 'Injection', 'Inhaled', 'Other'];

  // Collect all unique values
  const allMechanisms = new Set();
  const allRoutes = new Set();
  const mechanismCounts = {};
  const routeCounts = {};
  const problematicMechanisms = [];
  const problematicRoutes = [];

  data.forEach(med => {
    const mechanisms = med.content?.metadata?.mechanism_categories || [];
    const routes = med.content?.metadata?.administration_routes || [];

    mechanisms.forEach(mech => {
      allMechanisms.add(mech);
      mechanismCounts[mech] = (mechanismCounts[mech] || 0) + 1;

      if (!expectedMechanisms.includes(mech)) {
        const existing = problematicMechanisms.find(p => p.value === mech);
        if (existing) {
          existing.meds.push(med.content?.name || med.slug);
        } else {
          problematicMechanisms.push({ value: mech, meds: [med.content?.name || med.slug] });
        }
      }
    });

    routes.forEach(route => {
      allRoutes.add(route);
      routeCounts[route] = (routeCounts[route] || 0) + 1;

      if (!expectedRoutes.includes(route)) {
        const existing = problematicRoutes.find(p => p.value === route);
        if (existing) {
          existing.meds.push(med.content?.name || med.slug);
        } else {
          problematicRoutes.push({ value: route, meds: [med.content?.name || med.slug] });
        }
      }
    });
  });

  console.log('=== MECHANISMS OF ACTION ===\n');
  Array.from(allMechanisms).sort().forEach(mech => {
    const count = mechanismCounts[mech];
    const isExpected = expectedMechanisms.includes(mech);
    const status = isExpected ? '✅' : '❌';
    console.log(`${status} ${mech} (${count} medications)`);
  });

  console.log(`\nTotal unique mechanisms: ${allMechanisms.size}`);
  console.log(`Expected: ${expectedMechanisms.length}`);
  console.log(`Unexpected: ${problematicMechanisms.length}`);

  console.log('\n\n=== ROUTES OF ADMINISTRATION ===\n');
  Array.from(allRoutes).sort().forEach(route => {
    const count = routeCounts[route];
    const isExpected = expectedRoutes.includes(route);
    const status = isExpected ? '✅' : '❌';
    console.log(`${status} ${route} (${count} medications)`);
  });

  console.log(`\nTotal unique routes: ${allRoutes.size}`);
  console.log(`Expected: ${expectedRoutes.length}`);
  console.log(`Unexpected: ${problematicRoutes.length}`);

  if (problematicMechanisms.length > 0) {
    console.log('\n\n=== MEDICATIONS WITH NON-SIMPLIFIED MECHANISMS ===\n');
    problematicMechanisms.forEach(({ value, meds }) => {
      console.log(`\n"${value}" (${meds.length} medications):`);
      meds.slice(0, 5).forEach(med => console.log(`  - ${med}`));
      if (meds.length > 5) console.log(`  ... and ${meds.length - 5} more`);
    });
  }

  if (problematicRoutes.length > 0) {
    console.log('\n\n=== MEDICATIONS WITH NON-SIMPLIFIED ROUTES ===\n');
    problematicRoutes.forEach(({ value, meds }) => {
      console.log(`\n"${value}" (${meds.length} medications):`);
      meds.slice(0, 5).forEach(med => console.log(`  - ${med}`));
      if (meds.length > 5) console.log(`  ... and ${meds.length - 5} more`);
    });
  }

  // Summary
  console.log('\n\n=== SUMMARY ===\n');
  console.log(`✅ Uses: ${problematicMechanisms.length === 0 && problematicRoutes.length === 0 ? 'ALL VERIFIED' : 'NEEDS FIXING'}`);
  console.log(`Total medications: ${data.length}`);
  console.log(`Mechanism categories: ${allMechanisms.size} (expected ${expectedMechanisms.length})`);
  console.log(`Route categories: ${allRoutes.size} (expected ${expectedRoutes.length})`);
}

verifyMechanismsAndRoutes().then(() => process.exit(0));
