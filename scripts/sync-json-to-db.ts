#!/usr/bin/env tsx
/**
 * JSON → Database Sync Script
 *
 * Purpose: Synchronizes JSON content files to Supabase database
 * JSON remains the canonical source of truth
 * Database acts as runtime mirror for performance
 *
 * Usage:
 *   npm run sync:content              # Full sync
 *   npm run sync:content -- --dry-run # Preview changes
 *   npm run sync:content -- --type=treatments # Sync specific type
 *
 * Workflow:
 *   1. Read JSON files recursively
 *   2. Validate against schemas
 *   3. Normalize to Entity format
 *   4. Batch upsert to database
 *   5. Report statistics
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import dotenv from "dotenv";

// Load environment variables from .env.local if it exists (local dev)
// In CI/production, environment variables are already injected
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Environment setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configuration
const DATA_DIR = path.join(process.cwd(), "data");
const IS_CI = process.env.CI === "true" || process.env.VERCEL === "1";
const BATCH_SIZE = IS_CI ? 5 : 20; // Smaller batches in CI to avoid timeouts and network issues
const CONCURRENCY = IS_CI ? 1 : 3; // Lower concurrency to reduce database load
const MAX_RETRIES = IS_CI ? 5 : 3; // More retries in CI for network issues
const RETRY_DELAY_MS = IS_CI ? 3000 : 2000; // Longer delays in CI for network recovery
const BATCH_DELAY_MS = IS_CI ? 500 : 0; // Small delay between batches in CI to prevent connection overload
const MIN_SUCCESS_RATE = 0.85; // Require 85% success rate to pass (tolerates some timeouts in CI)

// CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const typeFilter = args.find((arg) => arg.startsWith("--type="))?.split("=")[1];
const verbose = args.includes("--verbose") || args.includes("-v");

// Statistics
interface Stats {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ file: string; error: string }>;
}

const stats: Record<string, Stats> = {};

function initStats(type: string) {
  stats[type] = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };
}

/**
 * Recursively read all JSON files in a directory
 */
function readJsonFiles(dir: string): Array<{ path: string; content: any }> {
  const files: Array<{ path: string; content: any }> = [];

  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json") ) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          files.push({ path: fullPath, content });
        } catch (error) {
          console.error(`⚠️  Failed to parse ${fullPath}:`, error);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Determine entity type from file path and content
 */
function determineEntityType(filePath: string, content: any): string {
  // Check content.type first
  if (content.type) {
    return content.type;
  }

  // Infer from directory structure
  if (filePath.includes("/treatments/medications/")) return "medication";
  if (filePath.includes("/treatments/therapy/")) return "therapy";
  if (filePath.includes("/treatments/interventional/")) return "interventional";
  if (filePath.includes("/treatments/investigational/")) return "investigational";
  if (filePath.includes("/treatments/alternative/")) return "alternative";
  if (filePath.includes("/treatments/supplements/")) return "supplement";
  if (filePath.includes("/treatments/")) return "treatment";
  if (filePath.includes("/conditions/")) return "condition";
  if (filePath.includes("/resources/")) return "resource";

  return "unknown";
}

/**
 * Extract category from file path
 */
function extractCategory(filePath: string): string | null {
  const match = filePath.match(/data\/(\w+)\/([\w-]+)\//);
  if (match) {
    return match[2]; // e.g., "medications", "anxiety-fear"
  }
  return null;
}

/**
 * Normalize JSON content to Entity format
 */
function normalizeToEntity(filePath: string, content: any): any {
  const type = determineEntityType(filePath, content);
  const category = extractCategory(filePath);

  // Validate required fields
  if (!content.slug) {
    throw new Error("Missing required field: slug");
  }
  if (!content.name && !content.title) {
    throw new Error("Missing required field: name or title");
  }

  // Build metadata
  const metadata: any = {
    category: category || content.category || content.metadata?.category,
    source: "json-file",
    file_path: path.relative(process.cwd(), filePath),
    last_synced: new Date().toISOString(),
  };

  // Merge existing metadata
  if (content.metadata) {
    Object.assign(metadata, content.metadata);
  }

  // Extract brand names for medications
  if (type === "medication" && content.brand_names) {
    metadata.brand_names = content.brand_names;
  }

  // Extract diagnostic codes for conditions
  if (type === "condition") {
    if (content.dsm5_code) metadata.dsm5_code = content.dsm5_code;
    if (content.icd10_code) metadata.icd10_code = content.icd10_code;
  }

  // Extract pillar for resources
  if (type === "resource" && content.pillar) {
    metadata.pillar = content.pillar;
  }

  return {
    slug: content.slug,
    type,
    title: content.name || content.title,
    description: content.description || content.summary || null,
    content: content, // Store full content in JSONB column
    metadata,
    status: content.status || "active",
  };
}

/**
 * Batch upsert entities to database with retry logic
 */
async function batchUpsertEntities(entities: any[], type: string, retryCount = 0): Promise<void> {
  if (isDryRun) {
    console.log(`   [DRY RUN] Would upsert ${entities.length} ${type}s`);
    stats[type].created += entities.length;
    return;
  }

  const { data, error } = await supabase.from("entities").upsert(entities, {
    onConflict: "type,slug",
    ignoreDuplicates: false,
  });

  if (error) {
    // Check if it's a timeout or network error that can be retried
    const errorMessage = error.message?.toLowerCase() || '';
    const isTimeout = error.code === '57014' || errorMessage.includes('timeout');
    const isNetworkError = errorMessage.includes('fetch failed') ||
                          errorMessage.includes('network') ||
                          errorMessage.includes('econnreset') ||
                          errorMessage.includes('econnrefused');
    const isRetryable = isTimeout || isNetworkError;

    if (isRetryable && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff: 3s, 6s, 12s, 24s, 48s
      const errorType = isTimeout ? 'Timeout' : 'Network error';
      if (verbose) {
        console.log(`   ⏳ ${errorType} on batch, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return batchUpsertEntities(entities, type, retryCount + 1);
    }

    console.error(`   ❌ Batch upsert failed for ${type}:`, error.message);
    stats[type].errors += entities.length;
    throw error;
  }

  if (verbose) {
    console.log(`   ✅ Upserted ${entities.length} ${type}s`);
  }
}

/**
 * Sync a single content type
 */
async function syncContentType(type: string, directory: string): Promise<void> {
  console.log(`\n📦 Syncing ${type}...`);
  initStats(type);

  const dir = path.join(DATA_DIR, directory);
  if (!fs.existsSync(dir)) {
    console.log(`   ⚠️  Directory not found: ${dir}`);
    return;
  }

  // Read all JSON files
  const files = readJsonFiles(dir);
  stats[type].total = files.length;
  console.log(`   Found ${files.length} files`);

  if (files.length === 0) {
    return;
  }

  // Normalize to entities
  const entities: any[] = [];
  for (const file of files) {
    try {
      const entity = normalizeToEntity(file.path, file.content);
      entities.push(entity);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      stats[type].errors++;
      stats[type].errorDetails.push({
        file: path.relative(process.cwd(), file.path),
        error: errorMsg,
      });
      if (verbose) {
        console.error(`   ❌ Failed to normalize ${file.path}: ${errorMsg}`);
      }
    }
  }

  if (entities.length === 0) {
    console.log(`   ⚠️  No valid entities to sync`);
    return;
  }

  // Batch upsert with concurrency control
  const batches: any[][] = [];
  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    batches.push(entities.slice(i, i + BATCH_SIZE));
  }

  console.log(`   Processing ${batches.length} batches (${BATCH_SIZE} per batch)...`);

  const limit = pLimit(CONCURRENCY);
  const upsertPromises = batches.map((batch, index) =>
    limit(async () => {
      try {
        // Add delay between batches in CI to prevent connection overload
        if (BATCH_DELAY_MS > 0 && index > 0) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }

        await batchUpsertEntities(batch, type);
        stats[type].created += batch.length;
        if (!verbose) {
          process.stdout.write(
            `   Progress: ${Math.round(((index + 1) / batches.length) * 100)}%\r`
          );
        }
      } catch (error) {
        stats[type].errors += batch.length;
        console.error(`   ❌ Batch ${index + 1} failed:`, error);
      }
    })
  );

  await Promise.all(upsertPromises);

  // Clear progress line
  if (!verbose) {
    process.stdout.write("\n");
  }

  console.log(`   ✅ Completed: ${stats[type].created} synced, ${stats[type].errors} errors`);
}

/**
 * Main sync function
 */
async function main() {
  console.log("🔄 JSON → Database Sync");
  console.log("========================\n");

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }

  console.log(`📂 Data directory: ${DATA_DIR}`);
  console.log(`🗄️  Database: ${SUPABASE_URL}\n`);

  const startTime = Date.now();

  // Define sync jobs
  const syncJobs = [
    { type: "treatments", directory: "treatments" },
    { type: "conditions", directory: "conditions" },
    { type: "resources", directory: "resources" },
  ];

  // Filter by type if specified
  const jobs = typeFilter ? syncJobs.filter((job) => job.type === typeFilter) : syncJobs;

  if (jobs.length === 0) {
    console.error(`❌ Unknown type: ${typeFilter}`);
    console.error("   Valid types: treatments, conditions, resources");
    process.exit(1);
  }

  // Execute sync jobs sequentially
  for (const job of jobs) {
    await syncContentType(job.type, job.directory);
  }

  const elapsed = Date.now() - startTime;

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SYNC SUMMARY");
  console.log("=".repeat(50) + "\n");

  let totalProcessed = 0;
  let totalErrors = 0;

  for (const [type, stat] of Object.entries(stats)) {
    console.log(`${type.toUpperCase()}:`);
    console.log(`   Total files:  ${stat.total}`);
    console.log(`   Synced:       ${stat.created}`);
    console.log(`   Errors:       ${stat.errors}`);

    if (stat.errorDetails.length > 0 && verbose) {
      console.log(`   Error details:`);
      stat.errorDetails.forEach(({ file, error }) => {
        console.log(`      - ${file}: ${error}`);
      });
    }
    console.log("");

    totalProcessed += stat.created;
    totalErrors += stat.errors;
  }

  console.log(`⏱️  Total time: ${(elapsed / 1000).toFixed(2)}s`);
  console.log(`✅ Successfully synced: ${totalProcessed}`);
  console.log(`❌ Errors: ${totalErrors}`);

  // Calculate overall success rate
  const totalFiles = totalProcessed + totalErrors;
  const successRate = totalFiles > 0 ? totalProcessed / totalFiles : 0;

  if (totalErrors > 0) {
    console.log("\n⚠️  Some files failed to sync. Run with --verbose for details.");

    // In CI, tolerate some failures due to timeouts (e.g., 85% success is acceptable)
    if (IS_CI && successRate >= MIN_SUCCESS_RATE) {
      console.log(`✅ Success rate: ${(successRate * 100).toFixed(1)}% (>= ${(MIN_SUCCESS_RATE * 100).toFixed(0)}% threshold)`);
      console.log("   Build will continue despite partial sync failures.");
      process.exit(0);
    }

    console.log(`❌ Success rate: ${(successRate * 100).toFixed(1)}% (< ${(MIN_SUCCESS_RATE * 100).toFixed(0)}% threshold)`);
    process.exit(1);
  }

  console.log("\n✨ Sync complete!");
}

// Execute
main().catch((error) => {
  console.error("\n❌ Sync failed:", error);
  process.exit(1);
});
