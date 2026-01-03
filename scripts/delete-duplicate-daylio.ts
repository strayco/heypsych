#!/usr/bin/env tsx
/**
 * Delete the old "digital-tool" type daylio entity
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deleteDuplicate() {
  console.log("🗑️  Deleting old 'digital-tool' row...\n");

  // Delete the row with type='digital-tool'
  const { data, error } = await supabase
    .from("entities")
    .delete()
    .eq("slug", "daylio")
    .eq("type", "digital-tool")
    .select();

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  console.log("✅ Deleted row:");
  console.log(JSON.stringify(data, null, 2));
  console.log("\n✅ The 'resource' type row should now be the only one with slug='daylio'");
  console.log("After deployment, /treatments/daylio should return 404");
}

deleteDuplicate();
