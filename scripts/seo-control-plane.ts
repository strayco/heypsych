#!/usr/bin/env ts-node
/**
 * SEO Control Plane CLI
 *
 * Generates reports on SEO health, cohort distribution, search performance,
 * and LLM referrals.
 *
 * Usage:
 *   npx ts-node scripts/seo-control-plane.ts [command]
 *
 * Commands:
 *   status      - Overall SEO health status
 *   cohorts     - Cohort distribution
 *   failures    - Pages failing eligibility
 *   performance - Search performance summary
 *   llm         - LLM referral breakdown
 *   full        - Full report (all of the above)
 *
 * @see Phase K of Wave 3 directive
 */

import path from "path";
import fs from "fs";

// Import SEO modules
import {
  getSiteSummary,
  getOptimizationOpportunities,
  getStoreMetadata as getGSCMetadata,
} from "../src/lib/seo/search-performance";
import {
  getReferralSummary,
  getStoreMetadata as getLLMMetadata,
} from "../src/lib/seo/llm-referrals";
import { getGraphStats } from "../src/lib/trust/authority-graph";
import { getRegistryStats as getContributorStats } from "../src/lib/trust/contributor-registry";
import { getRegistryStats as getSourceStats } from "../src/lib/trust/clinical-source-registry";
import { getLedgerStats } from "../src/lib/trust/medical-claim-ledger";
import {
  makeEntityIndexDecision,
  type IndexCohort,
  type RouteFamily,
} from "../src/lib/seo/index-decision-service";

// Types
interface CohortCounts {
  candidate: number;
  public_noindex: number;
  indexable_pilot: number;
  validated: number;
  answer_king: number;
  retired: number;
  total: number;
}

interface FailedPage {
  path: string;
  cohort: string;
  reasons: string[];
}

// Formatting helpers
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function header(text: string): void {
  console.log(`\n${colors.bright}${colors.cyan}═══ ${text} ═══${colors.reset}\n`);
}

function subheader(text: string): void {
  console.log(`${colors.bright}${text}${colors.reset}`);
}

function success(text: string): void {
  console.log(`${colors.green}✓${colors.reset} ${text}`);
}

function warning(text: string): void {
  console.log(`${colors.yellow}⚠${colors.reset} ${text}`);
}

function error(text: string): void {
  console.log(`${colors.red}✗${colors.reset} ${text}`);
}

function info(text: string): void {
  console.log(`  ${text}`);
}

function table(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] || "").length))
  );

  const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join(" │ ");
  const separator = colWidths.map((w) => "─".repeat(w)).join("─┼─");

  console.log(`  ${headerLine}`);
  console.log(`  ${separator}`);
  for (const row of rows) {
    const line = row.map((c, i) => (c || "").padEnd(colWidths[i])).join(" │ ");
    console.log(`  ${line}`);
  }
}

// Report generators
async function reportStatus(): Promise<void> {
  header("SEO Control Plane Status");

  const now = new Date().toISOString();
  console.log(`Report generated: ${now}\n`);

  // Trust modules status
  subheader("Trust Modules");
  const graphStats = getGraphStats();
  const contributorStats = getContributorStats();
  const sourceStats = getSourceStats();
  const ledgerStats = getLedgerStats();

  info(`Authority Graph: ${graphStats.totalNodes} pages, ${graphStats.totalLinks} links`);
  info(`Contributors: ${contributorStats.totalContributors} registered`);
  info(`Clinical Sources: ${sourceStats.totalSources} sources`);
  info(`Claim Ledger: ${ledgerStats.totalClaims} claims tracked`);

  // Storage status
  console.log("");
  subheader("Data Stores");
  const gscMeta = getGSCMetadata();
  const llmMeta = getLLMMetadata();

  if (gscMeta.exists) {
    success(`GSC data: ${gscMeta.pageCount} pages, updated ${gscMeta.lastUpdated}`);
  } else {
    warning("GSC data: Not initialized (run 'npx ts-node scripts/import-gsc-data.ts')");
  }

  if (llmMeta.totalPages > 0) {
    success(`LLM referrals: ${llmMeta.totalDays} days, ${llmMeta.totalPages} pages`);
  } else {
    info("LLM referrals: No data yet (tracking is active)");
  }
}

/**
 * Calculate cohort counts by iterating actual entity data files
 * and running them through the indexation firewall
 */
function calculateCohortCounts(): { cohorts: CohortCounts; byFamily: Record<string, CohortCounts>; failures: FailedPage[] } {
  const cohorts: CohortCounts = {
    candidate: 0,
    public_noindex: 0,
    indexable_pilot: 0,
    validated: 0,
    answer_king: 0,
    retired: 0,
    total: 0,
  };

  const byFamily: Record<string, CohortCounts> = {};
  const failures: FailedPage[] = [];

  // Entity directories to scan
  const entityDirs = [
    { dir: "conditions", family: "conditions" },
    { dir: "treatments/medications", family: "treatments" },
    { dir: "treatments/therapy", family: "treatments" },
    { dir: "treatments/alternative", family: "treatments" },
    { dir: "treatments/supplements", family: "treatments" },
    { dir: "treatments/interventional", family: "treatments" },
    { dir: "treatments/investigational", family: "treatments" },
    { dir: "resources", family: "resources" },
  ];

  const dataRoot = path.join(process.cwd(), "data");

  for (const { dir, family } of entityDirs) {
    const dirPath = path.join(dataRoot, dir);
    if (!fs.existsSync(dirPath)) continue;

    // Initialize family counter
    if (!byFamily[family]) {
      byFamily[family] = {
        candidate: 0,
        public_noindex: 0,
        indexable_pilot: 0,
        validated: 0,
        answer_king: 0,
        retired: 0,
        total: 0,
      };
    }

    // Recursively find all JSON files
    const findJsonFiles = (dirPath: string): string[] => {
      const files: string[] = [];
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          files.push(...findJsonFiles(fullPath));
        } else if (entry.name.endsWith(".json")) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const jsonFiles = findJsonFiles(dirPath);

    for (const filePath of jsonFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const entity = JSON.parse(content);

        // Skip if not a proper entity structure
        if (!entity.slug && !entity.identity?.slug) continue;

        // Normalize entity to match Entity interface
        const normalizedEntity = {
          id: entity.id || entity.identity?.slug || path.basename(filePath, ".json"),
          slug: entity.slug || entity.identity?.slug || path.basename(filePath, ".json"),
          name: entity.name || entity.identity?.name || "",
          type: family as any,
          status: entity.status || "active",
          visibility: entity.visibility || "public",
          description: entity.description || entity.identity?.description || "",
          data: entity,
          metadata: entity.metadata || {},
          editorial: entity.editorial || {},
          seo: entity.seo || {},
          created_at: entity.created_at || new Date().toISOString(),
          updated_at: entity.updated_at || new Date().toISOString(),
        };

        // Make indexation decision
        const decision = makeEntityIndexDecision(normalizedEntity as any);

        // Count by cohort
        const cohort = decision.cohort as keyof CohortCounts;
        if (cohort !== "total" && cohort in cohorts) {
          cohorts[cohort]++;
          byFamily[family][cohort]++;
        }
        cohorts.total++;
        byFamily[family].total++;

        // Track failures
        if (decision.cohort === "public_noindex" || decision.cohort === "retired") {
          failures.push({
            path: decision.canonicalPath,
            cohort: decision.cohort,
            reasons: decision.reasons,
          });
        }
      } catch (e) {
        // Skip malformed files
      }
    }
  }

  return { cohorts, byFamily, failures };
}

async function reportCohorts(): Promise<void> {
  header("Cohort Distribution");

  // First try to read from cached file (faster)
  const cohortFile = path.join(process.cwd(), "data", "seo-performance", "cohort-counts.json");
  let cohorts: CohortCounts;
  let byFamily: Record<string, CohortCounts> = {};
  let fromCache = false;

  if (fs.existsSync(cohortFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(cohortFile, "utf-8"));
      cohorts = data.cohorts || data;
      byFamily = data.byFamily || {};
      fromCache = true;
    } catch (e) {
      // Fall through to calculation
      cohorts = { candidate: 0, public_noindex: 0, indexable_pilot: 0, validated: 0, answer_king: 0, retired: 0, total: 0 };
    }
  } else {
    cohorts = { candidate: 0, public_noindex: 0, indexable_pilot: 0, validated: 0, answer_king: 0, retired: 0, total: 0 };
  }

  // If no cached data or user requested fresh calculation
  const forceRefresh = process.argv.includes("--refresh");
  if (!fromCache || forceRefresh || cohorts.total === 0) {
    info("Calculating cohorts from entity data...");
    const calculated = calculateCohortCounts();
    cohorts = calculated.cohorts;
    byFamily = calculated.byFamily;

    // Save to cache file
    const perfDir = path.join(process.cwd(), "data", "seo-performance");
    if (!fs.existsSync(perfDir)) {
      fs.mkdirSync(perfDir, { recursive: true });
    }
    fs.writeFileSync(cohortFile, JSON.stringify({ cohorts, byFamily, calculatedAt: new Date().toISOString() }, null, 2));
    success("Cohort data calculated and cached.");
  } else {
    info(`Using cached data from ${cohortFile}`);
  }

  table(
    ["Cohort", "Count", "% of Total"],
    [
      ["answer_king", String(cohorts.answer_king), cohorts.total ? ((cohorts.answer_king / cohorts.total) * 100).toFixed(1) + "%" : "0%"],
      ["validated", String(cohorts.validated), cohorts.total ? ((cohorts.validated / cohorts.total) * 100).toFixed(1) + "%" : "0%"],
      ["indexable_pilot", String(cohorts.indexable_pilot), cohorts.total ? ((cohorts.indexable_pilot / cohorts.total) * 100).toFixed(1) + "%" : "0%"],
      ["public_noindex", String(cohorts.public_noindex), cohorts.total ? ((cohorts.public_noindex / cohorts.total) * 100).toFixed(1) + "%" : "0%"],
      ["candidate", String(cohorts.candidate), cohorts.total ? ((cohorts.candidate / cohorts.total) * 100).toFixed(1) + "%" : "0%"],
      ["retired", String(cohorts.retired), cohorts.total ? ((cohorts.retired / cohorts.total) * 100).toFixed(1) + "%" : "0%"],
      ["TOTAL", String(cohorts.total), "100%"],
    ]
  );

  // Show breakdown by family if available
  if (Object.keys(byFamily).length > 0) {
    console.log("");
    subheader("By Route Family");
    const familyRows = Object.entries(byFamily).map(([family, counts]) => {
      const indexable = counts.indexable_pilot + counts.validated + counts.answer_king;
      return [
        family,
        String(counts.total),
        String(indexable),
        counts.total ? ((indexable / counts.total) * 100).toFixed(1) + "%" : "0%",
      ];
    });
    table(["Family", "Total", "Indexable", "% Indexable"], familyRows);
  }

  console.log("");
  info("Run 'npx ts-node scripts/seo-control-plane.ts cohorts --refresh' to recalculate from entity data.");
}

async function reportFailures(): Promise<void> {
  header("Pages Failing Eligibility");

  // Try to read from cached file first
  const failuresFile = path.join(process.cwd(), "data", "seo-performance", "eligibility-failures.json");
  let failures: FailedPage[] = [];

  if (fs.existsSync(failuresFile)) {
    try {
      failures = JSON.parse(fs.readFileSync(failuresFile, "utf-8"));
    } catch (e) {
      // Ignore
    }
  }

  // If no cached data, calculate from entity data
  if (failures.length === 0) {
    info("Calculating eligibility failures from entity data...");
    const calculated = calculateCohortCounts();
    failures = calculated.failures;

    // Save to cache file
    const perfDir = path.join(process.cwd(), "data", "seo-performance");
    if (!fs.existsSync(perfDir)) {
      fs.mkdirSync(perfDir, { recursive: true });
    }
    fs.writeFileSync(failuresFile, JSON.stringify(failures, null, 2));
  }

  if (failures.length === 0) {
    success("No eligibility failures detected - all entities pass quality gates.");
    return;
  }

  // Group by reason
  const byReason = new Map<string, number>();
  for (const failure of failures) {
    for (const reason of failure.reasons) {
      byReason.set(reason, (byReason.get(reason) || 0) + 1);
    }
  }

  subheader("Failure Reasons");
  const sortedReasons = Array.from(byReason.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  table(
    ["Reason", "Count"],
    sortedReasons.map(([reason, count]) => [reason.substring(0, 60), String(count)])
  );

  console.log("");
  subheader("Sample Failed Pages");
  const sampleFailures = failures.slice(0, 5);
  for (const failure of sampleFailures) {
    error(`${failure.path}`);
    for (const reason of failure.reasons.slice(0, 2)) {
      info(`  → ${reason}`);
    }
  }
}

async function reportPerformance(): Promise<void> {
  header("Search Performance");

  const summary = getSiteSummary();
  if (!summary) {
    warning("No search performance data available.");
    info("Import GSC data with: npx ts-node scripts/import-gsc-data.ts --mock");
    return;
  }

  subheader("Site Totals");
  info(`Clicks: ${summary.totals.clicks.toLocaleString()}`);
  info(`Impressions: ${summary.totals.impressions.toLocaleString()}`);
  info(`CTR: ${(summary.totals.ctr * 100).toFixed(2)}%`);
  info(`Avg Position: ${summary.totals.averagePosition.toFixed(1)}`);

  console.log("");
  subheader("Top Pages by Clicks");
  const topPages = summary.topPages.slice(0, 10);
  table(
    ["Page", "Clicks", "Impressions", "CTR", "Position"],
    topPages.map((p) => [
      p.path.substring(0, 40),
      String(p.metrics.clicks),
      String(p.metrics.impressions),
      (p.metrics.ctr * 100).toFixed(1) + "%",
      p.metrics.averagePosition.toFixed(1),
    ])
  );

  console.log("");
  subheader("Optimization Opportunities (High Impressions, Low CTR)");
  const opportunities = getOptimizationOpportunities(5);
  if (opportunities.length > 0) {
    for (const opp of opportunities) {
      warning(`${opp.path}`);
      info(`  Impressions: ${opp.metrics.impressions}, CTR: ${(opp.metrics.ctr * 100).toFixed(2)}%`);
    }
  } else {
    info("No optimization opportunities identified.");
  }
}

async function reportLLMReferrals(): Promise<void> {
  header("LLM Referral Breakdown");

  const summary = getReferralSummary(30);

  if (summary.totalReferrals === 0) {
    info("No LLM referrals recorded yet.");
    info("Tracking is active - data will appear as referrals are detected.");
    return;
  }

  subheader("Last 30 Days");
  info(`Total referrals: ${summary.totalReferrals.toLocaleString()}`);

  console.log("");
  subheader("By Platform");
  const platforms = Object.entries(summary.byPlatform)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  table(
    ["Platform", "Referrals", "% of Total"],
    platforms.map(([platform, count]) => [
      platform,
      String(count),
      ((count / summary.totalReferrals) * 100).toFixed(1) + "%",
    ])
  );

  console.log("");
  subheader("Top Pages from LLM Traffic");
  const topPages = summary.topPages.slice(0, 5);
  if (topPages.length > 0) {
    for (const page of topPages) {
      info(`${page.pagePath}: ${page.totalReferrals} referrals`);
    }
  }
}

async function reportFull(): Promise<void> {
  await reportStatus();
  await reportCohorts();
  await reportFailures();
  await reportPerformance();
  await reportLLMReferrals();

  header("End of Report");
}

// Main CLI
const command = process.argv[2] || "status";

async function main(): Promise<void> {
  switch (command) {
    case "status":
      await reportStatus();
      break;
    case "cohorts":
      await reportCohorts();
      break;
    case "failures":
      await reportFailures();
      break;
    case "performance":
      await reportPerformance();
      break;
    case "llm":
      await reportLLMReferrals();
      break;
    case "full":
      await reportFull();
      break;
    case "help":
    case "--help":
    case "-h":
      console.log(`
SEO Control Plane CLI

Usage: npx ts-node scripts/seo-control-plane.ts [command]

Commands:
  status      Overall SEO health status
  cohorts     Cohort distribution
  failures    Pages failing eligibility
  performance Search performance summary
  llm         LLM referral breakdown
  full        Full report (all of the above)
  help        Show this help message
`);
      break;
    default:
      error(`Unknown command: ${command}`);
      console.log("Run with 'help' for available commands.");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error running control plane:", err);
  process.exit(1);
});
