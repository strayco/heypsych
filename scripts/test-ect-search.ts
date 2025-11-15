import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { mapRowToEntity } from "../src/lib/data/entity-mappers";

// Load environment variables
dotenv.config({ path: ".env.local" });

const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

// Use anon key like the frontend does
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testECTSearch() {
  console.log("🔍 Testing ECT search...\n");

  // Get ECT from database exactly like the hook does
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("type", "interventional")
    .eq("status", "active")
    .order("title");

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  console.log(`📊 Found ${data?.length || 0} interventional treatments\n`);

  // Map like the hook does
  const mapped = (data || []).map((row) => mapRowToEntity(row, "interventional"));

  // Find ECT
  const ect = mapped.find((t) => t.slug === "electroconvulsive-therapy");

  if (!ect) {
    console.log("❌ ECT not found in mapped data!");
    process.exit(1);
  }

  console.log("✅ Found ECT:");
  console.log("  slug:", ect.slug);
  console.log("  name:", ect.name);
  console.log("  description:", ect.description?.substring(0, 100) + "...");

  // Test search logic
  console.log("\n🔍 Testing search queries:");

  const queries = ["ECT", "ect", "electroconvulsive", "Electroconvulsive"];

  for (const searchQuery of queries) {
    const query = searchQuery.toLowerCase().trim();
    const name = ect.name?.toLowerCase() || "";
    const description = ect.description?.toLowerCase() || "";
    const content = JSON.stringify(ect.data || {}).toLowerCase();

    const matchesName = name.includes(query);
    const matchesDesc = description.includes(query);
    const matchesContent = content.includes(query);
    const matches = matchesName || matchesDesc || matchesContent;

    console.log(`\n  Query: "${searchQuery}"`);
    console.log(`    name.includes("${query}"): ${matchesName}`);
    console.log(`    description.includes("${query}"): ${matchesDesc}`);
    console.log(`    content.includes("${query}"): ${matchesContent}`);
    console.log(`    RESULT: ${matches ? "✅ MATCH" : "❌ NO MATCH"}`);
  }

  process.exit(0);
}

testECTSearch();
