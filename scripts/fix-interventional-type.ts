import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function fixInterventionalType() {
  console.log("🔧 Fixing interventional treatment types...\n");

  // Find all treatments with type 'intervention' (should be 'interventional')
  const { data: wrongType, error: fetchError } = await supabase
    .from("entities")
    .select("slug, title, type")
    .eq("type", "intervention");

  if (fetchError) {
    console.error("❌ Error fetching:", fetchError);
    process.exit(1);
  }

  console.log(`Found ${wrongType?.length || 0} treatments with type 'intervention'`);

  if (!wrongType || wrongType.length === 0) {
    console.log("✅ No treatments to fix!");
    process.exit(0);
  }

  // Check if there are also 'interventional' entries (duplicates)
  const { data: correctType } = await supabase
    .from("entities")
    .select("slug, title, type")
    .eq("type", "interventional");

  console.log(`Found ${correctType?.length || 0} treatments with type 'interventional' (correct)`);

  // Delete the wrong 'intervention' entries since we have duplicates
  console.log("\n🗑️  Deleting duplicate 'intervention' entries...");
  const { data: deleted, error: deleteError } = await supabase
    .from("entities")
    .delete()
    .eq("type", "intervention")
    .select("slug, title");

  console.log("Delete result:", { count: deleted?.length, error: deleteError });

  if (deleteError) {
    console.error("❌ Error deleting:", deleteError);
    process.exit(1);
  }

  console.log(`\n✅ Deleted ${deleted?.length || 0} duplicate 'intervention' entries`);

  if (deleted && deleted.length > 0) {
    console.log("\nDeleted treatments:");
    deleted.forEach(t => console.log(`  - ${t.title} (${t.slug})`));
  }

  // Verify ECT is now correct
  const { data: ect } = await supabase
    .from("entities")
    .select("slug, title, type")
    .eq("slug", "electroconvulsive-therapy")
    .single();

  if (ect) {
    console.log(`\n✅ ECT is now: type='${ect.type}'`);
  }

  process.exit(0);
}

fixInterventionalType();
