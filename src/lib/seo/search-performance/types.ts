/**
 * Search Performance Types
 *
 * Type definitions for search performance data from
 * Google Search Console and Bing Webmaster Tools.
 *
 * @see Phase I of Wave 3 directive
 */

/**
 * Time range for performance queries
 */
export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * Individual row from GSC Performance Report
 */
export interface GSCPerformanceRow {
  /** URL path (e.g., "/conditions/depression") */
  page: string;
  /** Search query that triggered impression */
  query?: string;
  /** Country code */
  country?: string;
  /** Device type: DESKTOP, MOBILE, TABLET */
  device?: string;
  /** Total clicks */
  clicks: number;
  /** Total impressions */
  impressions: number;
  /** Click-through rate (0-1) */
  ctr: number;
  /** Average position (1-based) */
  position: number;
}

/**
 * Aggregated performance data for a single URL
 */
export interface PagePerformance {
  /** URL path */
  path: string;
  /** Entity slug (if applicable) */
  entitySlug?: string;
  /** Entity type */
  entityType?: string;
  /** Performance metrics */
  metrics: {
    clicks: number;
    impressions: number;
    ctr: number;
    averagePosition: number;
  };
  /** Top queries driving traffic */
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    position: number;
  }>;
  /** Device breakdown */
  deviceBreakdown: {
    desktop: { clicks: number; impressions: number };
    mobile: { clicks: number; impressions: number };
    tablet: { clicks: number; impressions: number };
  };
  /** Date range for this data */
  dateRange: DateRange;
  /** When this data was fetched */
  fetchedAt: string;
}

/**
 * Site-wide performance summary
 */
export interface SitePerformanceSummary {
  /** Total metrics across all pages */
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    averagePosition: number;
  };
  /** Top performing pages */
  topPages: PagePerformance[];
  /** Pages with declining performance */
  decliningPages: Array<{
    path: string;
    clickDelta: number;
    impressionDelta: number;
    positionDelta: number;
  }>;
  /** Pages with improving performance */
  improvingPages: Array<{
    path: string;
    clickDelta: number;
    impressionDelta: number;
    positionDelta: number;
  }>;
  /** Date range */
  dateRange: DateRange;
  /** Comparison date range (for deltas) */
  comparisonDateRange?: DateRange;
  /** When this data was fetched */
  fetchedAt: string;
}

/**
 * Bing Webmaster Tools row
 */
export interface BingPerformanceRow {
  /** URL */
  url: string;
  /** Search query */
  query?: string;
  /** Impressions */
  impressions: number;
  /** Clicks */
  clicks: number;
  /** Average position */
  averagePosition: number;
  /** CTR */
  ctr: number;
}

/**
 * Import result status
 */
export interface ImportResult {
  success: boolean;
  source: "gsc" | "bing";
  rowsImported: number;
  dateRange: DateRange;
  importedAt: string;
  errors?: string[];
}

/**
 * Storage format for persisted performance data
 */
export interface PerformanceDataStore {
  version: string;
  lastUpdated: string;
  gsc: {
    siteUrl: string;
    dateRange: DateRange;
    pages: Record<string, PagePerformance>;
    summary: SitePerformanceSummary;
  };
  bing?: {
    siteUrl: string;
    dateRange: DateRange;
    pages: Record<string, PagePerformance>;
  };
}

/**
 * Query options for performance data
 */
export interface PerformanceQueryOptions {
  /** Filter by path prefix */
  pathPrefix?: string;
  /** Filter by entity type */
  entityType?: string;
  /** Minimum impressions threshold */
  minImpressions?: number;
  /** Minimum clicks threshold */
  minClicks?: number;
  /** Sort field */
  sortBy?: "clicks" | "impressions" | "ctr" | "position";
  /** Sort direction */
  sortOrder?: "asc" | "desc";
  /** Limit results */
  limit?: number;
}
