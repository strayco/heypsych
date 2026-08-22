/**
 * LLM Referral Storage
 *
 * Privacy-safe storage for LLM referral aggregates.
 * Only stores counts by date, platform, and page - no user data.
 *
 * @see Phase J of Wave 3 directive
 */

import fs from "fs";
import path from "path";
import type {
  LLMPlatform,
  LLMReferralEvent,
  LLMReferralStore,
  DailyReferralAggregate,
  PageReferralAggregate,
  LLMReferralSummary,
} from "./types";
import { getKnownPlatforms } from "./detector";

const DATA_DIR = path.join(process.cwd(), "data", "seo-performance");
const STORE_FILE = path.join(DATA_DIR, "llm-referrals.json");

/** Maximum days of daily aggregates to keep */
const MAX_DAILY_HISTORY = 90;

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Initialize empty platform counts
 */
function emptyPlatformCounts(): Record<LLMPlatform, number> {
  const counts: Partial<Record<LLMPlatform, number>> = {};
  for (const platform of getKnownPlatforms()) {
    counts[platform] = 0;
  }
  counts.unknown = 0;
  return counts as Record<LLMPlatform, number>;
}

/**
 * Read the referral store
 */
export function readStore(): LLMReferralStore {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      return initializeStore();
    }
    const data = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(data) as LLMReferralStore;
  } catch (error) {
    console.error("Error reading LLM referral store:", error);
    return initializeStore();
  }
}

/**
 * Write the referral store
 */
export function writeStore(store: LLMReferralStore): void {
  ensureDataDir();
  store.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

/**
 * Initialize empty store
 */
export function initializeStore(): LLMReferralStore {
  return {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    dailyAggregates: [],
    pageAggregates: {},
  };
}

/**
 * Record an LLM referral event
 *
 * Updates both daily and page aggregates.
 * Privacy-safe: only increments counts, no user data stored.
 */
export function recordReferral(event: LLMReferralEvent): void {
  const store = readStore();
  const { date, platform, pagePath, entitySlug, entityType } = event;

  // Update daily aggregate
  let dailyAggregate = store.dailyAggregates.find((d) => d.date === date);
  if (!dailyAggregate) {
    dailyAggregate = {
      date,
      byPlatform: emptyPlatformCounts(),
      totalReferrals: 0,
    };
    store.dailyAggregates.push(dailyAggregate);

    // Sort by date and trim old entries
    store.dailyAggregates.sort((a, b) => b.date.localeCompare(a.date));
    if (store.dailyAggregates.length > MAX_DAILY_HISTORY) {
      store.dailyAggregates = store.dailyAggregates.slice(0, MAX_DAILY_HISTORY);
    }
  }
  dailyAggregate.byPlatform[platform] = (dailyAggregate.byPlatform[platform] || 0) + 1;
  dailyAggregate.totalReferrals += 1;

  // Update page aggregate
  let pageAggregate = store.pageAggregates[pagePath];
  if (!pageAggregate) {
    pageAggregate = {
      pagePath,
      entitySlug,
      entityType,
      byPlatform: emptyPlatformCounts(),
      totalReferrals: 0,
      lastSeen: date,
    };
    store.pageAggregates[pagePath] = pageAggregate;
  }
  pageAggregate.byPlatform[platform] = (pageAggregate.byPlatform[platform] || 0) + 1;
  pageAggregate.totalReferrals += 1;
  pageAggregate.lastSeen = date;

  writeStore(store);
}

/**
 * Get referral summary for the SEO control plane
 */
export function getReferralSummary(days = 30): LLMReferralSummary {
  const store = readStore();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  // Filter daily aggregates to the requested period
  const recentDaily = store.dailyAggregates.filter(
    (d) => d.date >= cutoffStr
  );

  // Calculate totals
  const totalByPlatform = emptyPlatformCounts();
  let totalReferrals = 0;

  for (const daily of recentDaily) {
    totalReferrals += daily.totalReferrals;
    for (const platform of Object.keys(daily.byPlatform) as LLMPlatform[]) {
      totalByPlatform[platform] =
        (totalByPlatform[platform] || 0) + (daily.byPlatform[platform] || 0);
    }
  }

  // Get top pages
  const topPages = Object.values(store.pageAggregates)
    .filter((p) => p.lastSeen >= cutoffStr)
    .sort((a, b) => b.totalReferrals - a.totalReferrals)
    .slice(0, 20);

  // Date range
  const dates = recentDaily.map((d) => d.date).sort();
  const startDate = dates[0] || cutoffStr;
  const endDate = dates[dates.length - 1] || new Date().toISOString().split("T")[0];

  return {
    totalReferrals,
    byPlatform: totalByPlatform,
    topPages,
    dailyTrend: recentDaily.sort((a, b) => a.date.localeCompare(b.date)),
    dateRange: { startDate, endDate },
    lastUpdated: store.lastUpdated,
  };
}

/**
 * Get referrals for a specific page
 */
export function getPageReferrals(pagePath: string): PageReferralAggregate | null {
  const store = readStore();
  return store.pageAggregates[pagePath] || null;
}

/**
 * Get daily trend for a specific platform
 */
export function getPlatformTrend(
  platform: LLMPlatform,
  days = 30
): Array<{ date: string; count: number }> {
  const store = readStore();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  return store.dailyAggregates
    .filter((d) => d.date >= cutoffStr)
    .map((d) => ({
      date: d.date,
      count: d.byPlatform[platform] || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Clear all referral data (for testing)
 */
export function clearStore(): void {
  const emptyStore = initializeStore();
  writeStore(emptyStore);
}

/**
 * Get store metadata
 */
export function getStoreMetadata(): {
  totalDays: number;
  totalPages: number;
  lastUpdated: string;
} {
  const store = readStore();
  return {
    totalDays: store.dailyAggregates.length,
    totalPages: Object.keys(store.pageAggregates).length,
    lastUpdated: store.lastUpdated,
  };
}
