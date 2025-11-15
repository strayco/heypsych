// scripts/test-all-indexes.js
// Test if all provider indexes exist by trying to create them
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const indexes = [
  { name: "idx_entities_provider_state", sql: "CREATE INDEX idx_entities_provider_state ON entities((content->'address'->>'state')) WHERE type = 'provider';" },
  { name: "idx_entities_provider_city", sql: "CREATE INDEX idx_entities_provider_city ON entities((content->'address'->>'city')) WHERE type = 'provider';" },
  { name: "idx_entities_provider_type", sql: "CREATE INDEX idx_entities_provider_type ON entities(type) WHERE type = 'provider';" },
  { name: "idx_entities_provider_zip", sql: "CREATE INDEX idx_entities_provider_zip ON entities((content->'address'->>'zip')) WHERE type = 'provider';" },
  { name: "idx_entities_provider_specialties", sql: "CREATE INDEX idx_entities_provider_specialties ON entities USING GIN ((content->'specialties')) WHERE type = 'provider';" },
  { name: "idx_entities_provider_slug", sql: "CREATE INDEX idx_entities_provider_slug ON entities(slug) WHERE type = 'provider';" },
  { name: "idx_entities_provider_state_type", sql: "CREATE INDEX idx_entities_provider_state_type ON entities(type, (content->'address'->>'state')) WHERE type = 'provider';" }
];

async function testIndexes() {
  console.log("🔍 Testing all 7 provider indexes...\n");

  let existCount = 0;
  let createdCount = 0;
  let errorCount = 0;

  for (const idx of indexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: idx.sql });

      if (error) {
        if (error.message && error.message.includes('already exists')) {
          console.log(`✅ ${idx.name} - Already exists`);
          existCount++;
        } else {
          console.log(`❌ ${idx.name} - Error: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`🆕 ${idx.name} - Created successfully`);
        createdCount++;
      }
    } catch (err) {
      console.log(`❌ ${idx.name} - Exception: ${err.message}`);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary:");
  console.log(`   Already existed: ${existCount}`);
  console.log(`   Newly created:   ${createdCount}`);
  console.log(`   Errors:          ${errorCount}`);
  console.log(`   Total indexes:   ${existCount + createdCount}/7`);
  console.log("=".repeat(60) + "\n");

  if (existCount + createdCount === 7) {
    console.log("🎉 All 7 indexes are present!\n");
    console.log("⚡ Now running ANALYZE to optimize query planner...");

    // Run ANALYZE to update statistics
    const { error: analyzeError } = await supabase.rpc('exec_sql', {
      sql: "ANALYZE entities;"
    });

    if (analyzeError) {
      console.log("⚠️  Could not run ANALYZE (may need special permissions)");
      console.log("   This is OK - PostgreSQL will analyze automatically.\n");
    } else {
      console.log("✅ ANALYZE completed!\n");
    }

    console.log("🧪 Testing query performance...");
    const start = Date.now();
    const { data, error } = await supabase
      .from("entities")
      .select("slug", { count: "exact" })
      .eq("type", "provider")
      .eq("content->address->>state", "NY")
      .range(0, 49);
    const duration = Date.now() - start;

    console.log(`   Query for NY providers: ${duration}ms`);
    console.log(`   Found: ${data?.length || 0} providers`);

    if (duration < 500) {
      console.log("\n✅ FAST! Indexes are working!\n");
    } else {
      console.log("\n⚠️  Still slow. Checking query plan...\n");
      console.log("💡 The issue might be:");
      console.log("   1. Indexes need time to build (if just created)");
      console.log("   2. Query planner needs statistics (run ANALYZE in SQL editor)");
      console.log("   3. Different query syntax needed\n");
    }
  } else {
    console.log("⚠️  Some indexes are missing. Please create them manually.\n");
  }
}

testIndexes();
