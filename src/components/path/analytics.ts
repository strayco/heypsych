/**
 * Your Path — privacy-safe events
 *
 * Only what kind of thing happened and coarse counts. Never a slug, a name,
 * a symptom, an answer or a question the visitor wrote: which conditions or
 * treatments someone keeps is health information.
 * Contract: docs/active/contracts/DECISION_EVENTS_CONTRACT.md (Your Path section).
 */

import { track } from "@vercel/analytics";

export type PathEvent =
  | "path_item_saved"
  | "path_item_removed"
  | "path_opened"
  | "path_brief_printed"
  | "path_brief_copied"
  | "path_cleared"
  | "path_next_step_kept"
  | "path_resume_clicked"
  /** A completed decision led to a commercial-intent page (options, profiles, directories). */
  | "path_qualified_action"
  /** A returning visitor opened their path; `days` is a bucket. */
  | "path_returned"
  /** Treatments compared in place on the map (count bucket only). */
  | "path_comparison_viewed"
  /** The brief tab was opened. */
  | "path_brief_viewed"
  /** The first meaningful interaction in this browser session. */
  | "first_meaningful_interaction";

type Props = {
  kind?: "condition" | "treatment" | "symptom" | "app" | "next-step" | "question";
  /** Bucketed: "0", "1-2", "3-5", "6+". */
  items?: string;
  surface?: "header" | "homepage" | "page" | "workspace" | "journey" | "architect";
  /** Bucketed days since the last visit: "1", "2-7", "8-30", "31+". */
  days?: string;
};

export function daysBucket(n: number): string {
  if (n <= 1) return "1";
  if (n <= 7) return "2-7";
  if (n <= 30) return "8-30";
  return "31+";
}

export function itemsBucket(n: number): string {
  if (n <= 0) return "0";
  if (n <= 2) return "1-2";
  if (n <= 5) return "3-5";
  return "6+";
}

export function trackPathEvent(event: PathEvent, props: Props = {}): void {
  try {
    track(event, props);
  } catch {
    // Analytics unavailable: nothing to do.
  }
}

/**
 * Report the first meaningful interaction of this browser session, once:
 * an answer on the decision board, a save, selecting something on the map,
 * drafting a practice, or choosing a tool. Surface only.
 */
export function markFirstInteraction(surface: "journey" | "page" | "workspace" | "architect"): void {
  try {
    if (window.sessionStorage.getItem("hp:first-interaction")) return;
    window.sessionStorage.setItem("hp:first-interaction", surface);
  } catch {
    // storage blocked: report anyway, once per page load
  }
  track("first_meaningful_interaction", { surface });
}
