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

async function checkHappify() {
  console.log("🔍 Checking happify entity...\n");

  const { data, error } = await supabase
    .from("entities")
    .select("id, slug, type, title, status, created_at")
    .eq("slug", "happify")
    .order("type");

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("❌ No entity found with slug 'happify'");
    return;
  }

  console.log(`Found ${data.length} row(s) with slug='happify':\n`);
  data.forEach((entity, i) => {
    console.log(`${i + 1}. Type: ${entity.type || 'NULL'}`);
    console.log(`   Title: ${entity.title}`);
    console.log(`   Status: ${entity.status}`);
    console.log(`   Created: ${entity.created_at}`);
    console.log(`   ID: ${entity.id}\n`);
  });

  if (data.length > 1) {
    console.log("⚠️  DUPLICATE FOUND!");
  }
}

checkHappify();
