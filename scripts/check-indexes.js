// scripts/check-indexes.js
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkIndexes() {
  console.log("🔍 Checking for provider indexes in database...\n");

  // Try to query pg_indexes view
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'entities'
      AND indexname LIKE '%provider%'
      ORDER BY indexname;
    `
  });

  if (error) {
    console.log("⚠️  Cannot query pg_indexes view directly.");
    console.log("   This is expected - Supabase restricts system table access.\n");

    console.log("📋 Please check manually in Supabase Dashboard:");
    console.log("   1. Go to: Database → Tables → entities");
    console.log("   2. Click the 'Indexes' tab");
    console.log("   3. Look for these index names:\n");

    const expectedIndexes = [
      "idx_entities_provider_type",
      "idx_entities_provider_state",
      "idx_entities_provider_city",
      "idx_entities_provider_zip",
      "idx_entities_provider_specialties",
      "idx_entities_provider_slug",
      "idx_entities_provider_state_type"
    ];

    expectedIndexes.forEach(idx => {
      console.log(`      - ${idx}`);
    });

    console.log("\n   If you DON'T see these indexes, run:");
    console.log("      node scripts/show-index-sql.js");
    console.log("   And paste the SQL in Supabase SQL Editor\n");

    return;
  }

  if (data && data.length > 0) {
    console.log(`✅ Found ${data.length} provider indexes:`);
    data.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    console.log("\n🎉 Indexes are created!\n");
  } else {
    console.log("❌ No provider indexes found!");
    console.log("   Run: node scripts/show-index-sql.js");
    console.log("   And execute the SQL in Supabase SQL Editor\n");
  }
}

checkIndexes();
