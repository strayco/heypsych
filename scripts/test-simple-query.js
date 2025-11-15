// scripts/test-simple-query.js
// Test with minimal data fetching
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQueries() {
  console.log("🧪 Testing different query patterns...\n");

  // Test 1: Just count (no data fetching)
  console.log("Test 1: COUNT only (no data fetching)");
  let start = Date.now();
  const { count: count1, error: error1 } = await supabase
    .from("entities")
    .select("*", { count: "exact", head: true })
    .eq("type", "provider")
    .eq("content->address->>state", "CA");
  let duration = Date.now() - start;
  console.log(`  Result: ${count1} providers in ${duration}ms`);
  if (error1) console.log(`  Error: ${error1.message}`);

  // Test 2: Select only slug (minimal data)
  console.log("\nTest 2: SELECT slug only");
  start = Date.now();
  const { data: data2, error: error2 } = await supabase
    .from("entities")
    .select("slug")
    .eq("type", "provider")
    .eq("content->address->>state", "CA")
    .limit(50);
  duration = Date.now() - start;
  console.log(`  Result: ${data2?.length || 0} providers in ${duration}ms`);
  if (error2) console.log(`  Error: ${error2.message}`);

  // Test 3: Select slug and content (full data - what we actually need)
  console.log("\nTest 3: SELECT slug, content (actual query)");
  start = Date.now();
  const { data: data3, error: error3 } = await supabase
    .from("entities")
    .select("slug, content")
    .eq("type", "provider")
    .eq("content->address->>state", "CA")
    .limit(50);
  duration = Date.now() - start;
  console.log(`  Result: ${data3?.length || 0} providers in ${duration}ms`);
  if (error3) console.log(`  Error: ${error3.message}`);

  // Test 4: Try with filter instead of eq
  console.log("\nTest 4: Using filter() instead of eq()");
  start = Date.now();
  const { data: data4, error: error4 } = await supabase
    .from("entities")
    .select("slug, content")
    .filter("type", "eq", "provider")
    .filter("content->address->>state", "eq", "CA")
    .limit(50);
  duration = Date.now() - start;
  console.log(`  Result: ${data4?.length || 0} providers in ${duration}ms`);
  if (error4) console.log(`  Error: ${error4.message}`);

  console.log("\n" + "=".repeat(60));
  console.log("💡 Analysis:");
  console.log("   If ALL tests are slow (>1000ms), the indexes aren't being used.");
  console.log("   This might be because:");
  console.log("   1. Index definition doesn't match query syntax");
  console.log("   2. PostgreSQL thinks table scan is faster");
  console.log("   3. Too much data being fetched (content is large)");
  console.log("=".repeat(60));
}

testQueries();
