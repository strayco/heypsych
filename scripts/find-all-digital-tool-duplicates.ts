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

async function findAllDigitalToolDuplicates() {
  console.log("🔍 Finding all entities with type='digital-tool'...\n");

  // Get all digital-tool entities
  const { data: digitalTools, error } = await supabase
    .from("entities")
    .select("id, slug, type, title, created_at")
    .eq("type", "digital-tool")
    .eq("status", "active")
    .order("slug");

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  if (!digitalTools || digitalTools.length === 0) {
    console.log("✅ No digital-tool entities found");
    return;
  }

  console.log(`Found ${digitalTools.length} entities with type='digital-tool':\n`);

  const slugs = digitalTools.map(e => e.slug);
  console.log("Slugs:", slugs.join(", "));

  // Check if any of these slugs also have type='resource'
  console.log("\n🔍 Checking which of these also have type='resource'...\n");

  const { data: resourceDupes, error: error2 } = await supabase
    .from("entities")
    .select("id, slug, type, title, created_at")
    .in("slug", slugs)
    .eq("type", "resource")
    .eq("status", "active");

  if (error2) {
    console.error("❌ Error:", error2);
    return;
  }

  if (!resourceDupes || resourceDupes.length === 0) {
    console.log("✅ No duplicates found - all digital-tool entities are unique");
    return;
  }

  console.log(`⚠️  Found ${resourceDupes.length} duplicates (exist as both 'digital-tool' and 'resource'):\n`);

  const duplicateSlugs = resourceDupes.map(r => r.slug);
  const duplicateDigitalTools = digitalTools.filter(dt => duplicateSlugs.includes(dt.slug));

  duplicateDigitalTools.forEach((dt, i) => {
    const resource = resourceDupes.find(r => r.slug === dt.slug);
    console.log(`${i + 1}. Slug: ${dt.slug}`);
    console.log(`   Digital-tool: Created ${dt.created_at.substring(0, 10)} | ID: ${dt.id}`);
    console.log(`   Resource:     Created ${resource!.created_at.substring(0, 10)} | ID: ${resource!.id}`);
    console.log();
  });

  console.log(`\n📋 Summary: Delete these ${duplicateDigitalTools.length} 'digital-tool' rows:\n`);
  duplicateDigitalTools.forEach(dt => {
    console.log(`   DELETE FROM entities WHERE id = '${dt.id}'; -- ${dt.slug}`);
  });
}

findAllDigitalToolDuplicates();
