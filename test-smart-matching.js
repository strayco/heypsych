// Test smart matching for medication entities
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ceqfyvzexvjlmqusscid.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlcWZ5dnpleHZqbG1xdXNzY2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4OTM5OTgsImV4cCI6MjA1MjQ2OTk5OH0.rsjhbLZy7yA8k3HhPzHlZ0PYqVx8qzm6x5vVEkr4aFY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSmartMatching() {
  console.log('\n=== Testing Smart Matching ===\n');

  // Test 1: Check if medications exist at all
  console.log('1. Checking all medications in database...');
  const { data: allMeds, error: allError } = await supabase
    .from('entities')
    .select('slug, title, type')
    .eq('type', 'medication')
    .eq('status', 'active')
    .order('title')
    .limit(20);

  if (allError) {
    console.error('Error:', allError);
  } else {
    console.log(`Found ${allMeds.length} medications:`);
    allMeds.forEach(med => console.log(`  - ${med.slug} (${med.title})`));
  }

  // Test 2: Search for sertraline
  console.log('\n2. Searching for sertraline...');
  const { data: sertraline, error: serrError } = await supabase
    .from('entities')
    .select('slug, title, type')
    .eq('type', 'medication')
    .eq('status', 'active')
    .ilike('slug', 'sertraline-%')
    .limit(5);

  if (serrError) {
    console.error('Error:', serrError);
  } else {
    console.log(`Found ${sertraline.length} matches:`);
    sertraline.forEach(med => console.log(`  - ${med.slug} (${med.title})`));
  }

  // Test 3: Search for CBT
  console.log('\n3. Searching for CBT (therapy)...');
  const { data: therapies, error: therapyError } = await supabase
    .from('entities')
    .select('slug, title, type, data, metadata')
    .eq('type', 'therapy')
    .eq('status', 'active')
    .ilike('title', '%cognitive%behavioral%')
    .limit(5);

  if (therapyError) {
    console.error('Error:', therapyError);
  } else {
    console.log(`Found ${therapies.length} matches:`);
    therapies.forEach(t => {
      const abbrev = t.data?.abbreviation || t.metadata?.abbreviation || 'none';
      console.log(`  - ${t.slug} (${t.title}) [abbrev: ${abbrev}]`);
    });
  }

  // Test 4: Search by exact slug
  console.log('\n4. Testing exact slug match for "sertraline"...');
  const { data: exact, error: exactError } = await supabase
    .from('entities')
    .select('slug, title, type')
    .eq('type', 'medication')
    .eq('status', 'active')
    .eq('slug', 'sertraline')
    .limit(1)
    .maybeSingle();

  if (exactError) {
    console.error('Error:', exactError);
  } else {
    console.log(exact ? `Found: ${exact.slug} (${exact.title})` : 'No exact match');
  }

  // Test 5: Search by slug prefix
  console.log('\n5. Testing slug prefix match for "sertraline-%"...');
  const { data: prefix, error: prefixError } = await supabase
    .from('entities')
    .select('slug, title, type')
    .eq('type', 'medication')
    .eq('status', 'active')
    .ilike('slug', 'sertraline-%')
    .order('slug')
    .limit(1)
    .maybeSingle();

  if (prefixError) {
    console.error('Error:', prefixError);
  } else {
    console.log(prefix ? `Found: ${prefix.slug} (${prefix.title})` : 'No prefix match');
  }
}

testSmartMatching().catch(console.error);
