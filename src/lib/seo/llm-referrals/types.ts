/**
 * LLM Referral Types
 *
 * Type definitions for privacy-safe LLM referral tracking.
 * Stores only aggregates - no user identities.
 *
 * @see Phase J of Wave 3 directive
 */

/**
 * Known LLM platforms that may link to our content
 */
export type LLMPlatform =
  | "chatgpt"
  | "perplexity"
  | "claude"
  | "copilot"
  | "gemini"
  | "you"
  | "phind"
  | "other_ai"
  | "unknown";

/**
 * A detected LLM referral
 */
export interface LLMReferralEvent {
  /** The detected platform */
  platform: LLMPlatform;
  /** The page path that was visited */
  pagePath: string;
  /** Entity slug if applicable */
  entitySlug?: string;
  /** Entity type if applicable */
  entityType?: string;
  /** Timestamp (date only, no time for privacy) */
  date: string; // YYYY-MM-DD
}

/**
 * Aggregated referral counts by date and platform
 */
export interface DailyReferralAggregate {
  date: string; // YYYY-MM-DD
  byPlatform: Record<LLMPlatform, number>;
  totalReferrals: number;
}

/**
 * Aggregated referral counts by page
 */
export interface PageReferralAggregate {
  pagePath: string;
  entitySlug?: string;
  entityType?: string;
  byPlatform: Record<LLMPlatform, number>;
  totalReferrals: number;
  lastSeen: string; // YYYY-MM-DD
}

/**
 * Overall LLM referral summary
 */
export interface LLMReferralSummary {
  /** Total referrals in period */
  totalReferrals: number;
  /** Breakdown by platform */
  byPlatform: Record<LLMPlatform, number>;
  /** Top pages receiving LLM traffic */
  topPages: PageReferralAggregate[];
  /** Trend: daily aggregates */
  dailyTrend: DailyReferralAggregate[];
  /** Date range */
  dateRange: {
    startDate: string;
    endDate: string;
  };
  /** Last updated */
  lastUpdated: string;
}

/**
 * Storage format for LLM referral data
 */
export interface LLMReferralStore {
  version: string;
  lastUpdated: string;
  /** Daily aggregates (last 90 days) */
  dailyAggregates: DailyReferralAggregate[];
  /** Page aggregates */
  pageAggregates: Record<string, PageReferralAggregate>;
}
