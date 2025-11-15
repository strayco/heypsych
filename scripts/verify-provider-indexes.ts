import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function verifyIndexes() {
  console.log("🔍 Verifying provider search indexes...\n");

  // Test a provider search with the name query
  console.log("📊 Testing provider search speed...");
  const startTime = Date.now();

  const { data, error, count } = await supabase
    .from("entities")
    .select("slug, content", { count: "exact" })
    .eq("type", "provider")
    .ilike("content->>full_name", "%tinklenberg%")
    .limit(10);

  const duration = Date.now() - startTime;

  if (error) {
    console.error("❌ Query error:", error);
    process.exit(1);
  }

  console.log(`\n✅ Query completed in ${duration}ms`);
  console.log(`   Found: ${count} total matches`);
  console.log(`   Returned: ${data?.length || 0} results`);

  if (duration < 1000) {
    console.log("\n🎉 Excellent! Search is very fast (< 1 second)");
  } else if (duration < 3000) {
    console.log("\n✅ Good! Search is reasonably fast (< 3 seconds)");
  } else if (duration < 6000) {
    console.log("\n⚠️  Slow: Search took 3-6 seconds. Indexes may not be applied yet.");
  } else {
    console.log("\n❌ Very Slow: Search took > 6 seconds. Indexes likely not working.");
    console.log("   Please verify indexes were created in Supabase SQL Editor");
  }

  process.exit(0);
}

verifyIndexes();
