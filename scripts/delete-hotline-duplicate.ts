#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteHotline() {
  console.log("🗑️  Deleting old 'hotline' row for aasra-india...\n");

  const { data, error } = await supabase
    .from("entities")
    .delete()
    .eq("slug", "aasra-india")
    .eq("type", "hotline")
    .select();

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  console.log("✅ Deleted row:");
  console.log(JSON.stringify(data, null, 2));
  console.log("\n✅ Only the 'resource' type row should remain for aasra-india");
}

deleteHotline();
