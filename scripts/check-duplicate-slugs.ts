#!/usr/bin/env tsx
/**
 * Check for duplicate slugs across different entity types
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

async function checkDuplicateSlugs() {
  console.log("🔍 Checking for duplicate slugs...\n");

  // Get all entities with slug 'daylio'
  const { data: daylioEntities, error } = await supabase
    .from("entities")
    .select("id, slug, type, title, status, created_at")
    .eq("slug", "daylio")
    .order("type");

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  if (!daylioEntities || daylioEntities.length === 0) {
    console.log("✅ No entities found with slug 'daylio'");
    return;
  }

  console.log(`Found ${daylioEntities.length} row(s) with slug='daylio':\n`);

  daylioEntities.forEach((entity, i) => {
    console.log(`${i + 1}. Type: ${entity.type || 'NULL'}`);
    console.log(`   Title: ${entity.title}`);
    console.log(`   Status: ${entity.status}`);
    console.log(`   Created: ${entity.created_at}`);
    console.log(`   ID: ${entity.id}\n`);
  });

  if (daylioEntities.length > 1) {
    console.log("⚠️  DUPLICATE FOUND! Multiple rows with the same slug but different types.");
    console.log("This is why /treatments/daylio is accessible - the database has both types!");
    console.log("\nSuggested fix: Delete the incorrect row(s)");
  } else if (daylioEntities[0].type === "resource") {
    console.log("✅ Only one row found with correct type='resource'");
    console.log("The issue must be in the type detection logic.");
  } else {
    console.log(`⚠️  Found ONE row but with type='${daylioEntities[0].type}' (should be 'resource')`);
    console.log("The database row has the wrong type!");
  }
}

checkDuplicateSlugs();
