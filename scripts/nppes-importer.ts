// scripts/nppes-importer.ts
import { createReadStream } from "fs";
import { writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import csv from "csv-parser";
import pLimit from "p-limit";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(".env.local") });

// ------------------------- Supabase -------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars");
  console.log(
    "Available env vars:",
    Object.keys(process.env).filter((k) => k.includes("SUPABASE"))
  );
  process.exit(1);
}

// Extended timeout for large operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
  db: { schema: "public" },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(60000), // 60 second timeout
      });
    },
  },
});

// ------------------------- CLI -------------------------
const argv = await yargs(hideBin(process.argv))
  .option("file", { type: "string", demandOption: true, desc: "Path to NPPES CSV" })
  .option("batch", {
    type: "number",
    default: 25,
    desc: "Upsert batch size (reduced for stability)",
  })
  .option("concurrency", { type: "number", default: 1, desc: "Parallel upsert concurrency" })
  .option("resumeFromNpi", { type: "string", desc: "Skip rows until this NPI is seen" })
  .option("maxRetries", { type: "number", default: 3, desc: "Max retries per batch" })
  .option("retryDelay", { type: "number", default: 1000, desc: "Base retry delay in ms" })
  .option("progressFile", {
    type: "string",
    default: "import-progress.json",
    desc: "Progress tracking file",
  })
  .option("failedBatchesFile", {
    type: "string",
    default: "failed-batches.json",
    desc: "Failed batches log",
  })
  .option("updateSpecialtiesOnly", {
    type: "boolean",
    default: false,
    desc: "Only update specialties field for existing records",
  })
  .option("dryRun", { type: "boolean", default: false, desc: "Validate data without inserting" })
  .help()
  .parse();

// ------------------------- Progress Tracking -------------------------
interface ImportProgress {
  lastProcessedNpi?: string;
  totalProcessed: number;
  totalImported: number;
  totalSkipped: number;
  totalErrors: number;
  startTime: string;
  lastUpdateTime: string;
  failedBatches: any[];
}

function saveProgress(progress: ImportProgress) {
  try {
    writeFileSync(argv.progressFile as string, JSON.stringify(progress, null, 2));
  } catch (e) {
    console.warn("Failed to save progress:", e);
  }
}

function loadProgress(): ImportProgress {
  try {
    if (existsSync(argv.progressFile as string)) {
      return JSON.parse(readFileSync(argv.progressFile as string, "utf8"));
    }
  } catch (e) {
    console.warn("Failed to load progress:", e);
  }

  return {
    totalProcessed: 0,
    totalImported: 0,
    totalSkipped: 0,
    totalErrors: 0,
    startTime: new Date().toISOString(),
    lastUpdateTime: new Date().toISOString(),
    failedBatches: [],
  };
}

function logFailedBatch(batch: any[], error: string) {
  try {
    const failedBatches = existsSync(argv.failedBatchesFile as string)
      ? JSON.parse(readFileSync(argv.failedBatchesFile as string, "utf8"))
      : [];

    failedBatches.push({
      timestamp: new Date().toISOString(),
      error,
      batchSize: batch.length,
      firstNpi: batch[0]?.content?.npi,
      lastNpi: batch[batch.length - 1]?.content?.npi,
      sample: batch.slice(0, 3).map((r) => ({ npi: r.content?.npi, name: r.content?.full_name })),
    });

    writeFileSync(argv.failedBatchesFile as string, JSON.stringify(failedBatches, null, 2));
  } catch (e) {
    console.warn("Failed to log failed batch:", e);
  }
}

// ------------------------- Types -------------------------
export type NPPESRow = Record<string, string> & {
  NPI: string;
  "Entity Type Code": string;
  "Provider Last Name (Legal Name)": string;
  "Provider First Name": string;
  "Provider Middle Name"?: string;
  "Provider Name Suffix Text"?: string;
  "Provider Credential Text"?: string;
  "Provider Gender Code"?: string;
  "Provider Business Practice Location Address City Name"?: string;
  "Provider Business Practice Location Address State Name"?: string;
  "Provider Business Practice Location Address Postal Code"?: string;
  "Provider First Line Business Practice Location Address"?: string;
  "Provider Second Line Business Practice Location Address"?: string;
  "Provider Business Practice Location Address Telephone Number"?: string;
  "Provider Organization Name (Legal Business Name)"?: string;
  "Provider Enumeration Date"?: string;
  "Last Update Date"?: string;
  "NPI Deactivation Date"?: string;
  "NPI Reactivation Date"?: string;
};

// ------------------------- Taxonomy config -------------------------
const PSYCHIATRY_CODES = new Set([
  "2084P0800X", // General Psychiatry
  "2084P0804X", // Child & Adolescent Psychiatry
  "2084F0202X", // Forensic Psychiatry
  "2084P0802X", // Addiction Psychiatry
  "2084P0805X", // Geriatric Psychiatry
  "103TP0016X", // Prescribing Psychologist (Medical) - ADD THIS
]);

const TAXONOMY_TO_SPECIALTY: Record<string, string[]> = {
  "2084P0800X": ["general_psychiatry"],
  "2084P0804X": ["child_adolescent"],
  "2084F0202X": ["forensic"],
  "2084P0802X": ["addiction"],
  "2084P0805X": ["geriatric"],
  "103TP0016X": ["general_psychiatry"],
};

function extractTaxonomyCodes(row: NPPESRow): string[] {
  const codes: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const key = `Healthcare Provider Taxonomy Code_${i}`;
    const val = row[key];
    if (val && val.trim()) codes.push(val.trim());
  }
  return codes;
}

function isPsychiatrist(codes: string[]): boolean {
  return codes.some((c) => PSYCHIATRY_CODES.has(c));
}

function getAllSpecialties(codes: string[]): string[] {
  const specialties = new Set<string>();

  for (const code of codes) {
    if (TAXONOMY_TO_SPECIALTY[code]) {
      TAXONOMY_TO_SPECIALTY[code].forEach((specialty) => specialties.add(specialty));
    }
  }

  // If no specialties found, default to general psychiatry
  if (specialties.size === 0) {
    specialties.add("general_psychiatry");
  }

  return Array.from(specialties);
}

// ------------------------- Validation -------------------------
function validateRow(row: NPPESRow): string | null {
  if (!row.NPI || !/^\d{10}$/.test(row.NPI)) {
    return `Invalid NPI: ${row.NPI}`;
  }

  if (!row["Provider First Name"] || !row["Provider Last Name (Legal Name)"]) {
    return `Missing required name fields for NPI ${row.NPI}`;
  }

  // No credential filtering - only filter by taxonomy code
  return null;
}

// ------------------------- Normalizers -------------------------
function formatPhone(s?: string | null): string | null {
  if (!s) return null;
  const d = s.replace(/\D+/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith("1")) return formatPhone(d.slice(1));
  return null; // Invalid phone number
}

function parseZip5(s?: string | null): string | null {
  if (!s) return null;
  const d = s.replace(/\D+/g, "");
  return d.length >= 5 ? d.slice(0, 5) : null;
}

function slugifyName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 50); // Prevent extremely long slugs
}

function sanitizeString(s?: string | null): string | null {
  if (!s) return null;
  return s.trim().substring(0, 500) || null; // Prevent overly long strings
}

// ------------------------- Mapping -------------------------
function mapRowToEntity(row: NPPESRow) {
  const first = sanitizeString(row["Provider First Name"]) || "";
  const last = sanitizeString(row["Provider Last Name (Legal Name)"]) || "";
  const credential = sanitizeString(row["Provider Credential Text"]);
  const fullName = `${first} ${last}`.trim();

  const codes = extractTaxonomyCodes(row);
  const primary = codes[0];

  const practiceAddress = {
    street: [
      sanitizeString(row["Provider First Line Business Practice Location Address"]),
      sanitizeString(row["Provider Second Line Business Practice Location Address"]),
    ]
      .filter(Boolean)
      .join(", "),
    city: sanitizeString(row["Provider Business Practice Location Address City Name"]) || "",
    state: sanitizeString(row["Provider Business Practice Location Address State Name"]) || "",
    zip: parseZip5(row["Provider Business Practice Location Address Postal Code"]),
  };

  const slug = `${slugifyName(first)}-${slugifyName(last)}-${(practiceAddress.state || "xx").toLowerCase()}-${row.NPI}`;

  return {
    type: "provider",
    slug: slug,
    title: fullName,
    description: `${credential || "Psychiatrist"} - Psychiatrist`,
    content: {
      // Basic info
      npi: row.NPI,
      full_name: fullName,
      first_name: first,
      last_name: last,
      credentials: credential,
      gender: sanitizeString(row["Provider Gender Code"]),

      // Practice info
      practice_name: sanitizeString(row["Provider Organization Name (Legal Business Name)"]),
      address: practiceAddress,
      phone: formatPhone(row["Provider Business Practice Location Address Telephone Number"]),

      // Professional
      specialties: getAllSpecialties(codes),
      taxonomy_code: primary || null,
      all_taxonomy_codes: codes, // Store all codes for reference

      // System
      data_source: "NPPES",
      last_verified: new Date().toISOString().split("T")[0],
      profile_claimed: false,

      // Defaults for your UI
      accepting_new_patients: null,
      telehealth_available: null,
      languages: ["English"],
      bio: null,
      treatment_approaches: [],
      session_fee: {},
      insurance_accepted: [],
      website: null,
      email: null,

      // Online presence (to be populated manually or through data enrichment)
      online_presence: {
        website: null,
        linkedin: null,
        academic_profile: null,
        practice_profile: null,
        other_links: [],
      },
    },
    metadata: {
      npi: row.NPI,
      specialties: getAllSpecialties(codes),
      location: practiceAddress,
      data_source: "NPPES",
      import_timestamp: new Date().toISOString(),
    },
  };
}

// ------------------------- Robust Upsert -------------------------
async function upsertBatch(
  rows: ReturnType<typeof mapRowToEntity>[],
  retries = 3
): Promise<boolean> {
  if (rows.length === 0) return true;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (argv.dryRun) {
        console.log(`[DRY RUN] Would upsert ${rows.length} providers`);
        return true;
      }

      if (argv.updateSpecialtiesOnly) {
        // Update only specialties for existing records
        for (const row of rows) {
          // Get existing record first
          const { data: existing, error: fetchError } = await supabase
            .from("entities")
            .select("content")
            .eq("type", "provider")
            .eq("content->>npi", row.content.npi)
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            // PGRST116 = not found
            throw fetchError;
          }

          if (existing) {
            // Merge the new specialties with existing content
            const updatedContent = {
              ...existing.content,
              specialties: row.content.specialties,
              all_taxonomy_codes: row.content.all_taxonomy_codes,
              last_verified: row.content.last_verified,
            };

            const { error } = await supabase
              .from("entities")
              .update({ content: updatedContent })
              .eq("type", "provider")
              .eq("content->>npi", row.content.npi);

            if (error) throw error;
          }
        }
      } else {
        // Full upsert
        const { error } = await supabase.from("entities").upsert(rows, {
          onConflict: "type,slug",
          ignoreDuplicates: false,
        });

        if (error) throw error;
      }

      console.log(`✓ Upserted ${rows.length} providers (attempt ${attempt + 1})`);
      return true;
    } catch (error: any) {
      const isLastAttempt = attempt === retries - 1;
      const delay = argv.retryDelay * Math.pow(2, attempt); // Exponential backoff

      console.error(`✗ Batch failed (attempt ${attempt + 1}/${retries}):`, error.message);

      if (isLastAttempt) {
        logFailedBatch(rows, error.message);
        return false;
      }

      console.log(`  Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return false;
}

// ------------------------- Health Check -------------------------
async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("entities").select("count").limit(1);

    if (error) throw error;
    console.log("✓ Supabase connection verified");
    return true;
  } catch (error: any) {
    console.error("✗ Supabase connection failed:", error.message);
    return false;
  }
}

// ------------------------- Main Runner -------------------------
async function run() {
  console.log("\n🚀 NPPES Import Starting");
  console.log("=".repeat(50));

  // Load previous progress
  const progress = loadProgress();
  console.log("📊 Previous Progress:");
  console.log(`   Processed: ${progress.totalProcessed.toLocaleString()}`);
  console.log(`   Imported: ${progress.totalImported.toLocaleString()}`);
  console.log(`   Errors: ${progress.totalErrors.toLocaleString()}`);

  const filePath = path.resolve(String(argv.file));
  const batchSize = Number(argv.batch);
  const concurrency = Number(argv.concurrency);
  const resumeFromNpi = (argv.resumeFromNpi as string) || progress.lastProcessedNpi;

  console.log("\n⚙️  Configuration:");
  console.log(`   File: ${filePath}`);
  console.log(`   Batch size: ${batchSize}`);
  console.log(`   Concurrency: ${concurrency}`);
  console.log(`   Max retries: ${argv.maxRetries}`);
  console.log(`   Update specialties only: ${argv.updateSpecialtiesOnly}`);
  console.log(`   Dry run: ${argv.dryRun}`);
  if (resumeFromNpi) console.log(`   Resume from NPI: ${resumeFromNpi}`);

  // Health check
  if (!(await checkSupabaseConnection())) {
    console.error("❌ Cannot proceed without database connection");
    process.exit(1);
  }

  const stream = createReadStream(filePath);
  let seenResume = !resumeFromNpi;
  let processed = progress.totalProcessed;
  let imported = progress.totalImported;
  let skipped = progress.totalSkipped;
  let errors = progress.totalErrors;

  const queue: ReturnType<typeof mapRowToEntity>[] = [];
  const limit = pLimit(concurrency);
  const inflight: Promise<void>[] = [];

  const flush = async () => {
    if (queue.length === 0) return;
    const batch = queue.splice(0, queue.length);
    inflight.push(
      limit(async () => {
        const success = await upsertBatch(batch, argv.maxRetries as number);
        if (success) {
          imported += batch.length;
        } else {
          errors += batch.length;
        }
      })
    );
  };

  // Progress reporting
  const progressInterval = setInterval(() => {
    const currentProgress: ImportProgress = {
      lastProcessedNpi:
        queue.length > 0 ? queue[queue.length - 1].content.npi : progress.lastProcessedNpi,
      totalProcessed: processed,
      totalImported: imported,
      totalSkipped: skipped,
      totalErrors: errors,
      startTime: progress.startTime,
      lastUpdateTime: new Date().toISOString(),
      failedBatches: progress.failedBatches,
    };
    saveProgress(currentProgress);
  }, 30000); // Save progress every 30 seconds

  try {
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (row: NPPESRow) => {
          try {
            processed++;

            // Resume logic
            if (!seenResume) {
              if (row.NPI === resumeFromNpi) {
                seenResume = true;
                console.log(`📍 Resumed at NPI: ${resumeFromNpi}`);
              } else {
                skipped++;
                return;
              }
            }

            // Basic validation
            const validationError = validateRow(row);
            if (validationError) {
              if (processed % 10000 === 0) console.log(`⚠️  ${validationError}`);
              return;
            }

            // Only individuals (Type 1)
            if (row["Entity Type Code"] !== "1") return;

            // Skip deactivated NPIs
            if (row["NPI Deactivation Date"] && !row["NPI Reactivation Date"]) return;

            const codes = extractTaxonomyCodes(row);
            if (!isPsychiatrist(codes)) return;

            const mapped = mapRowToEntity(row);
            queue.push(mapped);

            if (queue.length >= batchSize) void flush();

            if (processed % 10000 === 0) {
              const rate =
                processed / ((Date.now() - new Date(progress.startTime).getTime()) / 1000);
              console.log(
                `📈 Processed ${processed.toLocaleString()} | ` +
                  `imported ${imported.toLocaleString()} | ` +
                  `errors ${errors} | ` +
                  `rate ${rate.toFixed(0)}/sec`
              );
            }
          } catch (e: any) {
            errors++;
            if (processed % 1000 === 0) {
              console.error(`❌ Row error at ${processed}:`, e.message);
            }
          }
        })
        .on("end", async () => {
          console.log("\n🏁 Processing complete, finishing batches...");
          await flush();
          await Promise.all(inflight);
          resolve();
        })
        .on("error", reject);
    });
  } finally {
    clearInterval(progressInterval);
  }

  // Final report
  console.log("\n✅ Import Complete!");
  console.log("=".repeat(50));
  console.log(`📊 Final Statistics:`);
  console.log(`   Processed: ${processed.toLocaleString()}`);
  console.log(`   Imported:  ${imported.toLocaleString()}`);
  console.log(`   Skipped:   ${skipped.toLocaleString()}`);
  console.log(`   Errors:    ${errors.toLocaleString()}`);

  const successRate = processed > 0 ? ((imported / processed) * 100).toFixed(2) : "0";
  console.log(`   Success:   ${successRate}%`);

  if (errors > 0) {
    console.log(`\n⚠️  Check ${argv.failedBatchesFile} for failed batch details`);
  }

  // Save final progress
  const finalProgress: ImportProgress = {
    lastProcessedNpi: undefined, // Reset for next run
    totalProcessed: processed,
    totalImported: imported,
    totalSkipped: skipped,
    totalErrors: errors,
    startTime: progress.startTime,
    lastUpdateTime: new Date().toISOString(),
    failedBatches: progress.failedBatches,
  };
  saveProgress(finalProgress);
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Graceful shutdown requested...");
  console.log("Progress has been saved. Use --resumeFromNpi to continue.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n🛑 Process terminated. Progress saved.");
  process.exit(0);
});

run().catch((e) => {
  console.error("💥 Fatal error:", e);
  process.exit(1);
});
