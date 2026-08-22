/**
 * LLM Referral Module
 *
 * Privacy-safe tracking of referrals from LLM platforms.
 * Only stores aggregates - no user identities.
 *
 * @see Phase J of Wave 3 directive
 *
 * Usage in API routes or middleware:
 *
 * ```typescript
 * import { trackLLMReferral } from '@/lib/seo/llm-referrals';
 *
 * // In API route or middleware
 * trackLLMReferral(request.headers, '/conditions/depression', 'depression', 'condition');
 * ```
 */

// Types
export type {
  LLMPlatform,
  LLMReferralEvent,
  DailyReferralAggregate,
  PageReferralAggregate,
  LLMReferralSummary,
  LLMReferralStore,
} from "./types";

// Detector
export {
  detectLLMPlatform,
  detectFromReferrer,
  detectFromUserAgent,
  createReferralEvent,
  isLLMCrawler,
  getKnownPlatforms,
} from "./detector";

// Storage
export {
  recordReferral,
  getReferralSummary,
  getPageReferrals,
  getPlatformTrend,
  clearStore,
  getStoreMetadata,
} from "./storage";

// Convenience function
import { detectLLMPlatform, createReferralEvent } from "./detector";
import { recordReferral } from "./storage";

/**
 * Track an LLM referral from request headers
 *
 * Call this in API routes or middleware when serving pages.
 * Privacy-safe: only records platform, page, and date.
 *
 * @param headers - Request headers (referrer and user-agent)
 * @param pagePath - The page path being accessed
 * @param entitySlug - Optional entity slug
 * @param entityType - Optional entity type
 * @returns true if an LLM referral was detected and recorded
 */
export function trackLLMReferral(
  headers: { referer?: string | null; referrer?: string | null; "user-agent"?: string | null },
  pagePath: string,
  entitySlug?: string,
  entityType?: string
): boolean {
  const platform = detectLLMPlatform(headers);

  if (!platform) {
    return false;
  }

  const event = createReferralEvent(platform, pagePath, entitySlug, entityType);
  recordReferral(event);

  return true;
}
