// scripts/verify-provider-indexes.js
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyIndexes() {
  console.log("🔍 Verifying provider indexes...\n");

  // Test query with timing
  const startTime = Date.now();

  const { data, error, count } = await supabase
    .from("entities")
    .select("slug", { count: "exact" })
    .eq("type", "provider")
    .eq("content->address->>state", "CA")
    .range(0, 49);

  const duration = Date.now() - startTime;

  console.log("📊 Query Results:");
  console.log(`  State: California`);
  console.log(`  Found: ${data?.length || 0} providers (out of ${count || 0} total)`);
  console.log(`  Query Time: ${duration}ms\n`);

  if (error) {
    console.error("❌ Query Error:", error);
    return;
  }

  // Evaluate performance
  if (duration < 200) {
    console.log("✅ EXCELLENT! Indexes are working perfectly!");
    console.log("   Query completed in <200ms - this means indexes are active.\n");
  } else if (duration < 1000) {
    console.log("✅ GOOD! Indexes are working.");
    console.log("   Query completed in <1000ms.\n");
  } else if (duration < 3000) {
    console.log("⚠️  SLOW! Indexes may not be created yet.");
    console.log("   Query took >1000ms. Expected <200ms with indexes.\n");
  } else {
    console.log("❌ VERY SLOW! Indexes are NOT working.");
    console.log("   Query took >3000ms. Expected <200ms with indexes.");
    console.log("   Please verify the SQL was executed successfully.\n");
  }

  // Provide next steps
  if (duration > 1000) {
    console.log("💡 Troubleshooting:");
    console.log("   1. Check Supabase Dashboard → Database → entities table → Indexes tab");
    console.log("   2. Verify you see indexes like: idx_entities_provider_state");
    console.log("   3. If missing, re-run: node scripts/show-index-sql.js");
    console.log("   4. Copy the SQL and run in Supabase SQL Editor\n");
  } else {
    console.log("🎉 Your provider search should now be lightning fast!");
    console.log("   Test at: http://localhost:3000/providers\n");
  }
}

verifyIndexes();
