/**
 * React Hook for Commercial Link Handling
 *
 * Phase 6: Client-side utilities for commercial link rendering.
 *
 * NOTE: Kill switch checks are server-side only. This hook handles
 * the client-side disclosure and link preparation logic.
 */

"use client";

import { useMemo } from "react";
import type { CommercialMetadata } from "../schemas/commercial";
import { needsDisclosure, getRequiredDisclosure, getDisclosureText } from "../schemas/commercial";

interface UseCommercialOptions {
  commercial?: CommercialMetadata;
  affiliateUrl?: string;
  websiteUrl?: string;
  isKillSwitchActive?: boolean; // Passed from server
}

interface UseCommercialResult {
  /** The URL to use (affiliate if enabled, otherwise website) */
  effectiveUrl: string | undefined;
  /** Whether to show disclosure */
  showDisclosure: boolean;
  /** Disclosure text to display */
  disclosureText: string;
  /** Rel attribute for the link */
  relAttribute: string;
  /** Whether this is currently tracking as affiliate */
  isTracking: boolean;
}

/**
 * Hook for preparing commercial link data
 *
 * @param options - Commercial configuration and URLs
 * @returns Prepared link data with disclosure
 */
export function useCommercial(options: UseCommercialOptions): UseCommercialResult {
  const {
    commercial,
    affiliateUrl,
    websiteUrl,
    isKillSwitchActive = false,
  } = options;

  return useMemo(() => {
    const hasCompensation = needsDisclosure(commercial);
    const isTracking = hasCompensation && !isKillSwitchActive && Boolean(affiliateUrl);

    // Determine URL
    let effectiveUrl: string | undefined;
    if (isKillSwitchActive || !affiliateUrl) {
      effectiveUrl = websiteUrl || affiliateUrl;
    } else {
      effectiveUrl = affiliateUrl;
    }

    // Build rel attribute
    const relAttribute = isTracking
      ? "noopener nofollow sponsored"
      : "noopener";

    // Get disclosure
    const showDisclosure = isTracking;
    const disclosureType = commercial?.status
      ? getRequiredDisclosure(commercial.status)
      : "none";
    const disclosureText = disclosureType !== "none"
      ? getDisclosureText(commercial?.status ?? "unknown", "medium")
      : "";

    return {
      effectiveUrl,
      showDisclosure,
      disclosureText,
      relAttribute,
      isTracking,
    };
  }, [commercial, affiliateUrl, websiteUrl, isKillSwitchActive]);
}

/**
 * Simple check if a tool needs affiliate disclosure
 *
 * @param commercial - Tool's commercial metadata
 * @returns true if disclosure is needed
 */
export function useNeedsDisclosure(commercial?: CommercialMetadata): boolean {
  return useMemo(() => needsDisclosure(commercial), [commercial]);
}
