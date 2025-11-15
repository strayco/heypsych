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

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testECTStructure() {
  console.log("🔍 Testing ECT data structure...\n");

  // Get ECT from database
  const { data: row, error } = await supabase
    .from("entities")
    .select("*")
    .eq("slug", "electroconvulsive-therapy")
    .eq("type", "interventional")
    .single();

  if (error || !row) {
    console.error("❌ Error fetching ECT:", error);
    process.exit(1);
  }

  console.log("📦 Raw database row:");
  console.log("  id:", row.id);
  console.log("  slug:", row.slug);
  console.log("  title:", row.title);
  console.log("  type:", row.type);
  console.log("  description:", row.description?.substring(0, 100) + "...");
  console.log("\n  content structure:");
  console.log("    content.metadata:", row.content?.metadata ? "EXISTS" : "MISSING");
  console.log("    content.sections:", Array.isArray(row.content?.sections) ? `${row.content.sections.length} sections` : "MISSING");

  if (row.content?.metadata) {
    console.log("\n    metadata fields:");
    console.log("      session_duration:", row.content.metadata.session_duration);
    console.log("      treatment_duration:", row.content.metadata.treatment_duration);
    console.log("      invasiveness_level:", row.content.metadata.invasiveness_level);
  }

  console.log("\n  metadata (column):", row.metadata);

  // Map the row
  const mapped = mapRowToEntity(row, "interventional");

  console.log("\n📦 Mapped entity structure:");
  console.log("  name:", mapped.name);
  console.log("  description:", mapped.description?.substring(0, 100) + "...");
  console.log("  data structure:");
  console.log("    data.metadata:", mapped.data?.metadata ? "EXISTS" : "MISSING");
  console.log("    data.sections:", Array.isArray(mapped.data?.sections) ? `${mapped.data.sections.length} sections` : "MISSING");

  if (mapped.data?.metadata) {
    console.log("\n    metadata fields:");
    console.log("      session_duration:", mapped.data.metadata.session_duration);
    console.log("      treatment_duration:", mapped.data.metadata.treatment_duration);
    console.log("      invasiveness_level:", mapped.data.metadata.invasiveness_level);
  }

  // Check what the card expects
  console.log("\n🎴 What TreatmentCard expects for interventional:");
  console.log("  - data.metadata?.session_duration");
  console.log("  - data.metadata?.treatment_duration?.[0]");
  console.log("  - data.metadata?.invasiveness_level");
  console.log("  - sections with type 'cost_considerations'");

  console.log("\n✅ ECT has:", {
    session_duration: mapped.data?.metadata?.session_duration || "MISSING",
    treatment_duration: mapped.data?.metadata?.treatment_duration?.[0] || "MISSING",
    invasiveness_level: mapped.data?.metadata?.invasiveness_level || "MISSING",
    has_sections: Array.isArray(mapped.data?.sections),
  });

  process.exit(0);
}

testECTStructure();
