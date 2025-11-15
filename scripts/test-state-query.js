const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testState(state) {
  console.log(`\nTesting ${state}...`);
  const start = Date.now();
  
  const { data, error, count } = await supabase
    .from('entities')
    .select('slug, content', { count: 'exact' })
    .eq('type', 'provider')
    .eq('content->address->>state', state)
    .range(0, 49);
  
  const duration = Date.now() - start;
  
  if (error) {
    console.error(`❌ ${state} Error (${duration}ms):`, error.message);
  } else {
    console.log(`✅ ${state} Success in ${duration}ms - Found ${data.length} providers, total: ${count}`);
  }
}

async function main() {
  await testState('CA'); // Should be fast (10k+ providers)
  await testState('NJ'); // Timing out
  await testState('ID'); // Timing out  
  await testState('NY'); // Should have many providers
  await testState('TX'); // Should have many providers
}

main();
