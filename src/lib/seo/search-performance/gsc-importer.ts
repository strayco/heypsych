/**
 * Google Search Console Importer
 *
 * Imports performance data from Google Search Console API.
 * Stores data for the SEO control plane.
 *
 * @see Phase I of Wave 3 directive
 *
 * Setup:
 * 1. Create a GCP project and enable Search Console API
 * 2. Create OAuth2 credentials or service account
 * 3. Set GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY environment variables
 * 4. Verify site ownership in Search Console
 */

import type {
  GSCPerformanceRow,
  PagePerformance,
  SitePerformanceSummary,
  DateRange,
  ImportResult,
} from "./types";
import {
  writeStore,
  readStore,
  initializeStore,
  updateSiteSummary,
} from "./storage";

// GSC API configuration
const GSC_API_BASE = "https://searchconsole.googleapis.com/webmasters/v3";

/**
 * GSC API client configuration
 */
interface GSCClientConfig {
  siteUrl: string;
  accessToken?: string;
  // For service account auth
  clientEmail?: string;
  privateKey?: string;
}

/**
 * Build GSC API request body for performance data
 */
function buildSearchAnalyticsRequest(
  dateRange: DateRange,
  dimensions: string[] = ["page"]
): Record<string, any> {
  return {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    dimensions,
    rowLimit: 25000,
    startRow: 0,
  };
}

/**
 * Parse GSC API response into typed rows
 */
function parseGSCResponse(response: any): GSCPerformanceRow[] {
  if (!response?.rows) return [];

  return response.rows.map((row: any) => ({
    page: row.keys?.[0] || "",
    query: row.keys?.[1],
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

/**
 * Aggregate rows by page URL
 */
function aggregateByPage(rows: GSCPerformanceRow[]): Map<string, PagePerformance> {
  const pageMap = new Map<string, PagePerformance>();

  for (const row of rows) {
    const pagePath = new URL(row.page).pathname;

    if (!pageMap.has(pagePath)) {
      pageMap.set(pagePath, {
        path: pagePath,
        metrics: {
          clicks: 0,
          impressions: 0,
          ctr: 0,
          averagePosition: 0,
        },
        topQueries: [],
        deviceBreakdown: {
          desktop: { clicks: 0, impressions: 0 },
          mobile: { clicks: 0, impressions: 0 },
          tablet: { clicks: 0, impressions: 0 },
        },
        dateRange: { startDate: "", endDate: "" },
        fetchedAt: new Date().toISOString(),
      });
    }

    const page = pageMap.get(pagePath)!;
    page.metrics.clicks += row.clicks;
    page.metrics.impressions += row.impressions;

    // Add to top queries if query is present
    if (row.query) {
      const existingQuery = page.topQueries.find((q) => q.query === row.query);
      if (existingQuery) {
        existingQuery.clicks += row.clicks;
        existingQuery.impressions += row.impressions;
      } else {
        page.topQueries.push({
          query: row.query,
          clicks: row.clicks,
          impressions: row.impressions,
          position: row.position,
        });
      }
    }
  }

  // Calculate derived metrics
  for (const page of pageMap.values()) {
    if (page.metrics.impressions > 0) {
      page.metrics.ctr = page.metrics.clicks / page.metrics.impressions;
    }

    // Sort queries by clicks
    page.topQueries.sort((a, b) => b.clicks - a.clicks);
    page.topQueries = page.topQueries.slice(0, 10); // Keep top 10
  }

  return pageMap;
}

/**
 * Calculate site summary from page data
 */
function calculateSummary(
  pages: Map<string, PagePerformance>,
  dateRange: DateRange
): SitePerformanceSummary {
  let totalClicks = 0;
  let totalImpressions = 0;
  let totalPositionSum = 0;
  let positionCount = 0;

  const pageArray = Array.from(pages.values());

  for (const page of pageArray) {
    totalClicks += page.metrics.clicks;
    totalImpressions += page.metrics.impressions;
    if (page.metrics.averagePosition > 0) {
      totalPositionSum += page.metrics.averagePosition;
      positionCount++;
    }
  }

  // Sort by clicks for top pages
  const sortedByClicks = [...pageArray].sort(
    (a, b) => b.metrics.clicks - a.metrics.clicks
  );

  return {
    totals: {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      averagePosition: positionCount > 0 ? totalPositionSum / positionCount : 0,
    },
    topPages: sortedByClicks.slice(0, 20),
    decliningPages: [], // Calculated from comparison data
    improvingPages: [], // Calculated from comparison data
    dateRange,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Import GSC data using the API
 *
 * NOTE: Requires GSC API credentials to be configured.
 * For local development, use importFromMockData() instead.
 */
export async function importFromGSCApi(
  config: GSCClientConfig,
  dateRange?: DateRange
): Promise<ImportResult> {
  const range = dateRange || getDefaultDateRange();
  const errors: string[] = [];

  try {
    // Check for credentials
    if (!config.accessToken && !config.clientEmail) {
      return {
        success: false,
        source: "gsc",
        rowsImported: 0,
        dateRange: range,
        importedAt: new Date().toISOString(),
        errors: ["No GSC credentials configured. Use importFromMockData() for testing."],
      };
    }

    // TODO: Implement actual GSC API call
    // This would use googleapis package or direct HTTP requests
    // with OAuth2 or service account authentication

    return {
      success: false,
      source: "gsc",
      rowsImported: 0,
      dateRange: range,
      importedAt: new Date().toISOString(),
      errors: ["GSC API integration not yet implemented"],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(errorMessage);

    return {
      success: false,
      source: "gsc",
      rowsImported: 0,
      dateRange: range,
      importedAt: new Date().toISOString(),
      errors,
    };
  }
}

/**
 * Import mock data for testing and development
 */
export function importFromMockData(siteUrl: string): ImportResult {
  const dateRange = getDefaultDateRange();
  const mockRows = generateMockGSCData();

  const pageMap = aggregateByPage(mockRows);
  const summary = calculateSummary(pageMap, dateRange);

  // Update date ranges
  for (const page of pageMap.values()) {
    page.dateRange = dateRange;
  }

  // Build and save store
  const store = initializeStore(siteUrl);
  store.gsc.dateRange = dateRange;
  store.gsc.pages = Object.fromEntries(pageMap);
  store.gsc.summary = summary;
  writeStore(store);

  return {
    success: true,
    source: "gsc",
    rowsImported: mockRows.length,
    dateRange,
    importedAt: new Date().toISOString(),
  };
}

/**
 * Generate mock GSC data for testing
 */
function generateMockGSCData(): GSCPerformanceRow[] {
  const pages = [
    { path: "/conditions/major-depressive-disorder", impressions: 5000, clicks: 250 },
    { path: "/conditions/anxiety-disorders", impressions: 4500, clicks: 200 },
    { path: "/conditions/ptsd", impressions: 3000, clicks: 180 },
    { path: "/conditions/bipolar-disorder", impressions: 2800, clicks: 140 },
    { path: "/conditions/ocd", impressions: 2500, clicks: 125 },
    { path: "/treatments/escitalopram-lexapro-v2", impressions: 3500, clicks: 175 },
    { path: "/treatments/sertraline-zoloft-v2", impressions: 3200, clicks: 160 },
    { path: "/treatments/cognitive-behavioral-therapy", impressions: 2000, clicks: 120 },
    { path: "/treatments/fluoxetine-prozac-v2", impressions: 1800, clicks: 90 },
    { path: "/resources/phq-9", impressions: 1500, clicks: 100 },
  ];

  const queries = [
    "depression symptoms",
    "anxiety treatment",
    "ptsd therapy",
    "escitalopram side effects",
    "zoloft vs lexapro",
    "cbt therapy near me",
    "phq-9 scoring",
    "bipolar diagnosis",
    "ocd treatment",
    "antidepressants",
  ];

  const rows: GSCPerformanceRow[] = [];

  for (const page of pages) {
    // Main page row
    rows.push({
      page: `https://heypsych.com${page.path}`,
      clicks: page.clicks,
      impressions: page.impressions,
      ctr: page.clicks / page.impressions,
      position: Math.random() * 20 + 5,
    });

    // Add query rows
    const numQueries = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numQueries; i++) {
      const query = queries[Math.floor(Math.random() * queries.length)];
      const queryImpressions = Math.floor(page.impressions * (Math.random() * 0.3 + 0.1));
      const queryClicks = Math.floor(queryImpressions * (Math.random() * 0.1));

      rows.push({
        page: `https://heypsych.com${page.path}`,
        query,
        clicks: queryClicks,
        impressions: queryImpressions,
        ctr: queryImpressions > 0 ? queryClicks / queryImpressions : 0,
        position: Math.random() * 15 + 3,
      });
    }
  }

  return rows;
}

/**
 * Get default date range (last 28 days)
 */
function getDefaultDateRange(): DateRange {
  const end = new Date();
  const start = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

/**
 * Import from CSV file (exported from GSC UI)
 */
export function importFromCsv(csvContent: string, siteUrl: string): ImportResult {
  const dateRange = getDefaultDateRange();
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const rows: GSCPerformanceRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const row: Record<string, any> = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim();
    });

    rows.push({
      page: row.page || row.url || "",
      query: row.query,
      clicks: parseInt(row.clicks || "0", 10),
      impressions: parseInt(row.impressions || "0", 10),
      ctr: parseFloat(row.ctr || "0"),
      position: parseFloat(row.position || "0"),
    });
  }

  const pageMap = aggregateByPage(rows);
  const summary = calculateSummary(pageMap, dateRange);

  const store = initializeStore(siteUrl);
  store.gsc.dateRange = dateRange;
  store.gsc.pages = Object.fromEntries(pageMap);
  store.gsc.summary = summary;
  writeStore(store);

  return {
    success: true,
    source: "gsc",
    rowsImported: rows.length,
    dateRange,
    importedAt: new Date().toISOString(),
  };
}
