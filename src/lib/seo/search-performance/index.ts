/**
 * Search Performance Module
 *
 * Importers and storage for Google Search Console and Bing Webmaster data.
 * Used by the SEO control plane to track search performance.
 *
 * @see Phase I of Wave 3 directive
 */

// Types
export type {
  DateRange,
  GSCPerformanceRow,
  PagePerformance,
  SitePerformanceSummary,
  BingPerformanceRow,
  ImportResult,
  PerformanceDataStore,
  PerformanceQueryOptions,
} from "./types";

// Storage
export {
  readStore,
  writeStore,
  initializeStore,
  updatePagePerformance,
  getPagePerformance,
  queryPages,
  getSiteSummary,
  updateSiteSummary,
  getOptimizationOpportunities,
  getDecliningPages,
  getImprovingPages,
  exportToCsv,
  getStoreMetadata,
} from "./storage";

// GSC Importer
export {
  importFromGSCApi,
  importFromMockData,
  importFromCsv,
} from "./gsc-importer";
