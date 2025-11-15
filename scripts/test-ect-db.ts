import { supabase } from "../src/lib/config/database";

async function testECT() {
  console.log("🔍 Checking for ECT in database...\n");

  // Check all interventional treatments
  const { data: allInterventional, error: allError } = await supabase
    .from("entities")
    .select("slug, title, type, status")
    .eq("type", "interventional")
    .order("title");

  if (allError) {
    console.error("❌ Error fetching interventional treatments:", allError);
    return;
  }

  console.log(`📊 Found ${allInterventional?.length || 0} interventional treatments in database`);
  console.log("Treatments:");
  allInterventional?.forEach((t) => {
    console.log(`  - ${t.title} (${t.slug}) [status: ${t.status}]`);
  });

  // Check specifically for ECT
  console.log("\n🔍 Searching specifically for ECT...");
  const { data: ectData, error: ectError } = await supabase
    .from("entities")
    .select("*")
    .eq("slug", "electroconvulsive-therapy");

  if (ectError) {
    console.error("❌ Error:", ectError);
  } else if (!ectData || ectData.length === 0) {
    console.log("❌ ECT not found in database");
  } else {
    console.log("✅ ECT found:", {
      slug: ectData[0].slug,
      title: ectData[0].title,
      type: ectData[0].type,
      status: ectData[0].status,
    });
  }

  process.exit(0);
}

testECT();
