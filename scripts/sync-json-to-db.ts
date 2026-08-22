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
import { execSync } from "child_process";

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
  // Exit cleanly (code 0) when DB credentials are missing
  // This allows builds to proceed without database sync
  // Database sync is optional - JSON files are the source of truth
  console.log("ℹ️  Database sync skipped: Missing database credentials");
  console.log("   NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
  console.log("   SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_KEY ? "✓" : "✗");
  console.log("   Build will continue without database sync.");
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configuration
const DATA_DIR = path.join(process.cwd(), "data");
const IS_CI = process.env.CI === "true" || process.env.VERCEL === "1";
const BATCH_SIZE = IS_CI ? 5 : 20; // Smaller batches in CI to avoid timeouts and network issues
const CONCURRENCY = IS_CI ? 1 : 3; // Lower concurrency to reduce database load
const MAX_RETRIES = IS_CI ? 5 : 3; // More retries in CI for network issues
const RETRY_DELAY_MS = IS_CI ? 2000 : 2000; // Retry delay (reduced from 3s to 2s for faster recovery)
const BATCH_DELAY_MS = IS_CI ? 200 : 0; // Minimal delay between batches in CI (reduced from 500ms)
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
  const v2Files = new Set<string>(); // Track which base names have v2 versions

  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    // First pass: identify all v2 files
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith("-v2.json")) {
        // Extract base name (e.g., "sertraline-zoloft" from "sertraline-zoloft-v2.json")
        const baseName = entry.name.replace(/-v2\.json$/, "");
        v2Files.add(path.join(currentDir, baseName));
      }
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip backup directories and taxonomies
        if (entry.name.startsWith("_backup") || entry.name === "taxonomies") {
          continue;
        }
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        // Skip backup files and index files
        if (entry.name.includes(".backup") || entry.name === "index.json") {
          continue;
        }

        // Handle legacy files: skip if v2 version exists
        if (entry.name.endsWith(".legacy.json")) {
          const baseName = entry.name.replace(/\.legacy\.json$/, "");
          const baseKey = path.join(currentDir, baseName);
          if (v2Files.has(baseKey)) {
            // v2 exists, skip legacy
            continue;
          }
        }

        // Handle regular files: skip if v2 version exists (e.g., skip foo.json if foo-v2.json exists)
        if (!entry.name.endsWith("-v2.json") && !entry.name.endsWith(".legacy.json")) {
          const baseName = entry.name.replace(/\.json$/, "");
          const baseKey = path.join(currentDir, baseName);
          if (v2Files.has(baseKey)) {
            // v2 exists, skip this older version
            continue;
          }
        }

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
    // SAFEGUARD: Convert legacy type values to correct types
    // Old data had "digital-tool" and "hotline" which should be "resource"
    if (content.type === "digital-tool" || content.type === "hotline") {
      console.warn(`⚠️  Converting legacy type "${content.type}" to "resource" for ${filePath}`);
      return "resource";
    }
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

  // Validate entity type - prevent legacy/invalid types
  const validTypes = [
    'condition', 'medication', 'therapy', 'treatment',
    'interventional', 'investigational', 'alternative', 'supplement',
    'resource', 'provider'
  ];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid entity type "${type}" for ${filePath}. Must be one of: ${validTypes.join(', ')}`);
  }

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
    // Check if it's a timeout, network, or database error that can be retried
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    const isTimeout = errorCode === '57014' || errorMessage.includes('timeout');
    const isNetworkError = errorMessage.includes('fetch failed') ||
                          errorMessage.includes('network') ||
                          errorMessage.includes('econnreset') ||
                          errorMessage.includes('econnrefused');
    const isDatabaseError = errorCode === 'PGRST002' || // Schema cache error
                           errorCode === 'PGRST003' || // Connection error
                           errorMessage.includes('schema cache') ||
                           errorMessage.includes('could not query');
    const isRetryable = isTimeout || isNetworkError || isDatabaseError;

    if (isRetryable && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff: 3s, 6s, 12s, 24s, 48s
      const errorType = isTimeout ? 'Timeout' :
                       isNetworkError ? 'Network error' :
                       'Database connection error';
      if (verbose || IS_CI) {
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

  // Deduplicate by type+slug (prefer v2 files over legacy/older files)
  const seen = new Map<string, { entity: any; filePath: string }>();
  const dedupedEntities: any[] = [];

  for (const entity of entities) {
    const key = `${entity.type}:${entity.slug}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, { entity, filePath: entity.metadata?.file_path || '' });
      dedupedEntities.push(entity);
    } else {
      // Prefer v2 files over legacy or older files
      const existingPath = existing.filePath;
      const newPath = entity.metadata?.file_path || '';

      const existingIsV2 = existingPath.includes('-v2.json');
      const newIsV2 = newPath.includes('-v2.json');
      const existingIsLegacy = existingPath.includes('.legacy.json');
      const newIsLegacy = newPath.includes('.legacy.json');

      // Priority: v2 > regular > legacy
      const existingPriority = existingIsV2 ? 2 : existingIsLegacy ? 0 : 1;
      const newPriority = newIsV2 ? 2 : newIsLegacy ? 0 : 1;

      if (newPriority > existingPriority) {
        // Replace with the newer/better version
        const existingIndex = dedupedEntities.findIndex(e => e === existing.entity);
        if (existingIndex !== -1) {
          dedupedEntities[existingIndex] = entity;
        }
        seen.set(key, { entity, filePath: newPath });
        if (verbose) {
          console.log(`   ℹ️  Deduped: keeping ${newPath} over ${existingPath}`);
        }
      } else if (verbose) {
        console.log(`   ℹ️  Deduped: skipping ${newPath} (keeping ${existingPath})`);
      }
    }
  }

  if (verbose && dedupedEntities.length < entities.length) {
    console.log(`   ℹ️  Removed ${entities.length - dedupedEntities.length} duplicate(s)`);
  }

  // Batch upsert with concurrency control
  const batches: any[][] = [];
  for (let i = 0; i < dedupedEntities.length; i += BATCH_SIZE) {
    batches.push(dedupedEntities.slice(i, i + BATCH_SIZE));
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
 * Check if content files have changed in this commit
 * Returns true if data/ directory has changes, false otherwise
 */
function hasContentChanged(): boolean {
  if (!IS_CI) {
    // In local development, always sync
    return true;
  }

  try {
    // Check if any files in data/ directory changed
    // Compare current commit with previous commit
    const diff = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
    const changedFiles = diff.split('\n').filter(Boolean);
    const contentChanged = changedFiles.some(file => file.startsWith('data/'));

    if (!contentChanged) {
      console.log("📋 No content files changed in this deployment");
      console.log("   Skipping database sync to save egress bandwidth\n");
      return false;
    }

    console.log(`📋 Found ${changedFiles.filter(f => f.startsWith('data/')).length} changed content file(s)`);
    return true;
  } catch (error) {
    // If git command fails (e.g., first commit), assume content changed
    console.log("   ⚠️  Could not check git diff, proceeding with sync...\n");
    return true;
  }
}

/**
 * Warm up database connection to avoid cold start issues
 */
async function warmupDatabase(): Promise<void> {
  if (isDryRun) return;

  try {
    console.log("🔌 Warming up database connection...");
    const { error } = await supabase
      .from("entities")
      .select("slug")
      .limit(1);

    if (error) {
      console.log("   ⚠️  Database warmup query failed, but continuing...");
    } else {
      console.log("   ✅ Database connection ready\n");
    }
  } catch (err) {
    console.log("   ⚠️  Database warmup failed, but continuing...\n");
  }
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

  // Check if content files changed before syncing (saves egress bandwidth)
  if (!hasContentChanged()) {
    console.log("✨ Sync skipped - no content changes detected");
    process.exit(0);
  }

  // Warm up database connection before starting sync
  await warmupDatabase();

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
