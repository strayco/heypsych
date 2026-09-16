"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackToolsComparisonClickThrough } from "@/lib/analytics/product-events";

interface ComparisonReferralTrackerProps {
  toolSlug: string;
}

/**
 * Tracks when a user arrives at a tool page from a comparison page.
 * Reads `ref=compare` and `compare=slug` URL params and fires attribution event.
 */
export function ComparisonReferralTracker({ toolSlug }: ComparisonReferralTrackerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    const compareSlug = searchParams.get("compare");

    if (ref === "compare" && compareSlug) {
      trackToolsComparisonClickThrough(compareSlug, toolSlug);
    }
  }, [searchParams, toolSlug]);

  return null;
}
