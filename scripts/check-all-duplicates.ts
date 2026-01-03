#!/usr/bin/env tsx
/**
 * Check for ALL duplicate slugs across entity types
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

async function checkAllDuplicates() {
  console.log("🔍 Checking for ALL duplicate slugs in database...\n");

  // Query to find all slugs that appear more than once
  const { data: entities, error } = await supabase
    .from("entities")
    .select("id, slug, type, title, status, created_at")
    .eq("status", "active")
    .order("slug")
    .order("type");

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  if (!entities || entities.length === 0) {
    console.log("✅ No entities found");
    return;
  }

  // Group by slug to find duplicates
  const slugGroups = new Map<string, typeof entities>();

  entities.forEach(entity => {
    if (!slugGroups.has(entity.slug)) {
      slugGroups.set(entity.slug, []);
    }
    slugGroups.get(entity.slug)!.push(entity);
  });

  // Find duplicates
  const duplicates = Array.from(slugGroups.entries())
    .filter(([_, items]) => items.length > 1);

  if (duplicates.length === 0) {
    console.log("✅ No duplicate slugs found!");
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} slug(s) with duplicates:\n`);

  duplicates.forEach(([slug, items]) => {
    console.log(`📌 Slug: "${slug}" (${items.length} rows)`);
    items.forEach((entity, i) => {
      console.log(`   ${i + 1}. Type: ${entity.type || 'NULL'} | Title: ${entity.title} | Created: ${entity.created_at.substring(0, 10)} | ID: ${entity.id}`);
    });
    console.log();
  });

  // Check specifically for resources with wrong types
  console.log("\n🔍 Checking all resources for incorrect types...\n");

  const resourceSlugs = entities
    .filter(e => e.type === 'resource')
    .map(e => e.slug);

  const resourceDupes = entities.filter(e =>
    resourceSlugs.includes(e.slug) && e.type !== 'resource'
  );

  if (resourceDupes.length > 0) {
    console.log(`⚠️  Found ${resourceDupes.length} non-resource rows with resource slugs:`);
    resourceDupes.forEach(entity => {
      console.log(`   - ${entity.slug}: type="${entity.type}" (should be "resource")`);
    });
  } else {
    console.log("✅ All resources have correct type='resource'");
  }

  // Check for legacy type values
  console.log("\n🔍 Checking for legacy/non-standard type values...\n");

  const validTypes = [
    'medication', 'therapy', 'treatment', 'interventional',
    'investigational', 'alternative', 'supplement',
    'condition', 'resource', 'provider'
  ];

  const invalidTypes = entities.filter(e =>
    e.type && !validTypes.includes(e.type)
  );

  if (invalidTypes.length > 0) {
    console.log(`⚠️  Found ${invalidTypes.length} entities with non-standard types:`);
    const typeCount = new Map<string, number>();
    invalidTypes.forEach(e => {
      typeCount.set(e.type, (typeCount.get(e.type) || 0) + 1);
    });
    typeCount.forEach((count, type) => {
      console.log(`   - "${type}": ${count} entities`);
    });
    console.log("\nSample entities with non-standard types:");
    invalidTypes.slice(0, 10).forEach(entity => {
      console.log(`   - ${entity.slug}: type="${entity.type}" | ${entity.title}`);
    });
  } else {
    console.log("✅ All entities have valid type values");
  }
}

checkAllDuplicates();
