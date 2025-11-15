import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

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
  await testState('CA');
  await testState('NJ');
  await testState('ID');
  await testState('NY');
  await testState('TX');
}

main();
