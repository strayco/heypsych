"use client";

import { useEffect } from "react";
import { trackToolsComparisonView } from "@/lib/analytics/product-events";

interface ComparisonTrackerProps {
  toolASlug: string;
  toolBSlug: string;
  winnerSlug?: string;
}

/**
 * Client component to track comparison page views
 * Enables conversion attribution from comparison → affiliate click
 */
export function ComparisonTracker({
  toolASlug,
  toolBSlug,
  winnerSlug,
}: ComparisonTrackerProps) {
  useEffect(() => {
    trackToolsComparisonView(toolASlug, toolBSlug, winnerSlug);
  }, [toolASlug, toolBSlug, winnerSlug]);

  return null;
}
