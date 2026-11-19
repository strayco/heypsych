"use client";

/**
 * Reports that a comparison was viewed. Kind only: never which treatments or
 * apps (health information). Renders nothing, so server HTML and SEO markup
 * are unchanged.
 */

import { useEffect } from "react";
import { track } from "@vercel/analytics";

export function TrackComparisonView({ kind, count }: { kind: "treatment" | "app" | "clinician-tool"; count?: number }) {
  useEffect(() => {
    try {
      track("comparison_viewed", { kind, items: count === undefined ? null : count <= 2 ? "1-2" : "3-5" });
    } catch {
      // analytics unavailable
    }
  }, [kind, count]);
  return null;
}
