/**
 * Search Performance Storage
 *
 * Flat-file JSON storage for search performance data.
 * Stores GSC and Bing data for the SEO control plane.
 *
 * @see Phase I of Wave 3 directive
 */

import fs from "fs";
import path from "path";
import type {
  PerformanceDataStore,
  PagePerformance,
  SitePerformanceSummary,
  PerformanceQueryOptions,
  DateRange,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "seo-performance");
const STORE_FILE = path.join(DATA_DIR, "performance-data.json");

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Read the performance data store
 */
export function readStore(): PerformanceDataStore | null {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      return null;
    }
    const data = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(data) as PerformanceDataStore;
  } catch (error) {
    console.error("Error reading performance store:", error);
    return null;
  }
}

/**
 * Write the performance data store
 */
export function writeStore(store: PerformanceDataStore): void {
  ensureDataDir();
  store.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

/**
 * Initialize empty store
 */
export function initializeStore(siteUrl: string): PerformanceDataStore {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  const startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return {
    version: "1.0.0",
    lastUpdated: now.toISOString(),
    gsc: {
      siteUrl,
      dateRange: { startDate, endDate },
      pages: {},
      summary: createEmptySummary({ startDate, endDate }),
    },
  };
}

/**
 * Create empty summary
 */
function createEmptySummary(dateRange: DateRange): SitePerformanceSummary {
  return {
    totals: {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      averagePosition: 0,
    },
    topPages: [],
    decliningPages: [],
    improvingPages: [],
    dateRange,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Update or add page performance data
 */
export function updatePagePerformance(
  path: string,
  performance: PagePerformance
): void {
  const store = readStore() || initializeStore("https://heypsych.com");
  store.gsc.pages[path] = performance;
  writeStore(store);
}

/**
 * Get page performance data
 */
export function getPagePerformance(pagePath: string): PagePerformance | null {
  const store = readStore();
  if (!store) return null;
  return store.gsc.pages[pagePath] || null;
}

/**
 * Query pages by criteria
 */
export function queryPages(
  options: PerformanceQueryOptions = {}
): PagePerformance[] {
  const store = readStore();
  if (!store) return [];

  let pages = Object.values(store.gsc.pages);

  // Filter by path prefix
  if (options.pathPrefix) {
    pages = pages.filter((p) => p.path.startsWith(options.pathPrefix!));
  }

  // Filter by entity type
  if (options.entityType) {
    pages = pages.filter((p) => p.entityType === options.entityType);
  }

  // Filter by minimum impressions
  if (options.minImpressions !== undefined) {
    pages = pages.filter(
      (p) => p.metrics.impressions >= options.minImpressions!
    );
  }

  // Filter by minimum clicks
  if (options.minClicks !== undefined) {
    pages = pages.filter((p) => p.metrics.clicks >= options.minClicks!);
  }

  // Sort
  const sortField = options.sortBy || "impressions";
  const sortOrder = options.sortOrder || "desc";
  const multiplier = sortOrder === "asc" ? 1 : -1;

  pages.sort((a, b) => {
    const aVal = a.metrics[sortField as keyof typeof a.metrics] || 0;
    const bVal = b.metrics[sortField as keyof typeof b.metrics] || 0;
    return (aVal - bVal) * multiplier;
  });

  // Limit
  if (options.limit) {
    pages = pages.slice(0, options.limit);
  }

  return pages;
}

/**
 * Get site-wide summary
 */
export function getSiteSummary(): SitePerformanceSummary | null {
  const store = readStore();
  if (!store) return null;
  return store.gsc.summary;
}

/**
 * Update site summary
 */
export function updateSiteSummary(summary: SitePerformanceSummary): void {
  const store = readStore() || initializeStore("https://heypsych.com");
  store.gsc.summary = summary;
  writeStore(store);
}

/**
 * Get pages with most impressions but low CTR (optimization opportunities)
 */
export function getOptimizationOpportunities(limit = 20): PagePerformance[] {
  const pages = queryPages({
    minImpressions: 100,
    sortBy: "impressions",
    sortOrder: "desc",
  });

  // Filter to pages with CTR < 3% (below average)
  const lowCtrPages = pages.filter((p) => p.metrics.ctr < 0.03);

  return lowCtrPages.slice(0, limit);
}

/**
 * Get pages losing rankings
 */
export function getDecliningPages(
  limit = 20
): SitePerformanceSummary["decliningPages"] {
  const summary = getSiteSummary();
  if (!summary) return [];
  return summary.decliningPages.slice(0, limit);
}

/**
 * Get pages gaining rankings
 */
export function getImprovingPages(
  limit = 20
): SitePerformanceSummary["improvingPages"] {
  const summary = getSiteSummary();
  if (!summary) return [];
  return summary.improvingPages.slice(0, limit);
}

/**
 * Export performance data as CSV
 */
export function exportToCsv(): string {
  const store = readStore();
  if (!store) return "";

  const headers = [
    "path",
    "entitySlug",
    "entityType",
    "clicks",
    "impressions",
    "ctr",
    "averagePosition",
    "topQuery",
  ];

  const rows = Object.values(store.gsc.pages).map((page) => [
    page.path,
    page.entitySlug || "",
    page.entityType || "",
    page.metrics.clicks,
    page.metrics.impressions,
    (page.metrics.ctr * 100).toFixed(2) + "%",
    page.metrics.averagePosition.toFixed(1),
    page.topQueries[0]?.query || "",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Get store metadata (for debugging)
 */
export function getStoreMetadata(): {
  exists: boolean;
  version: string | null;
  lastUpdated: string | null;
  pageCount: number;
} {
  const store = readStore();
  return {
    exists: store !== null,
    version: store?.version || null,
    lastUpdated: store?.lastUpdated || null,
    pageCount: store ? Object.keys(store.gsc.pages).length : 0,
  };
}
