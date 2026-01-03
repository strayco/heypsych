import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("slug", "deepscribe")
    .limit(1);

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No entity found for slug: deepscribe");
    return;
  }

  const row = data[0];
  console.log("=== Database Row ===");
  console.log("row.type:", row.type);
  console.log("row.metadata?.entity_type:", row.metadata?.entity_type);
  console.log("row.content?.type:", row.content?.type);
  console.log("row.content?.kind:", row.content?.kind);
  console.log("row.metadata?.category:", row.metadata?.category);
}

test();
