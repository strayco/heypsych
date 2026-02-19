#!/usr/bin/env tsx
// scripts/sync-tools-to-db.ts
// Sync v3 tool JSON files from /data/tools/ to the database

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const TOOLS_DIR = path.join(process.cwd(), "data/resources/tools");

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface V3Tool {
  slug: string;
  name: string;
  schema_version: string;
  [key: string]: any;
}

async function syncTool(tool: V3Tool): Promise<boolean> {
  try {
    // Check if tool exists
    const { data: existing } = await supabase
      .from("entities")
      .select("id, slug")
      .eq("slug", tool.slug)
      .eq("type", "resource")
      .single();

    const entityData = {
      type: "resource",
      slug: tool.slug,
      title: tool.name,
      status: tool.status || "active",
      metadata: {
        category: "digital-tools",
        schema_version: "3.0",
      },
      content: tool,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("entities")
        .update(entityData)
        .eq("id", existing.id);

      if (error) {
        console.error(`Failed to update ${tool.slug}:`, error);
        return false;
      }
      console.log(`✅ Updated: ${tool.slug}`);
    } else {
      // Insert new
      const { error } = await supabase.from("entities").insert({
        ...entityData,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`Failed to insert ${tool.slug}:`, error);
        return false;
      }
      console.log(`✅ Created: ${tool.slug}`);
    }

    return true;
  } catch (error) {
    console.error(`Error syncing ${tool.slug}:`, error);
    return false;
  }
}

async function main() {
  console.log("🚀 Syncing tools to database...\n");

  if (!fs.existsSync(TOOLS_DIR)) {
    console.error(`Tools directory not found: ${TOOLS_DIR}`);
    process.exit(1);
  }

  // Get only JSON files at root level (not in taxonomies/)
  const files = fs.readdirSync(TOOLS_DIR).filter((f) => 
    f.endsWith(".json") && !f.startsWith(".")
  );
  console.log(`📂 Found ${files.length} tools to sync\n`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(TOOLS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const tool = JSON.parse(content) as V3Tool;

    // Only sync v3 tools
    if (tool.schema_version !== "3.0") {
      console.log(`⏭️  Skipped: ${file} (not v3 schema)`);
      continue;
    }

    const result = await syncTool(tool);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 SYNC SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
