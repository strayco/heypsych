import type { TreatmentFacts } from "./types";

/**
 * Safety cells for patient-facing comparisons. Never assert absence: many
 * records (lithium, methylphenidate, amphetamine salts, venlafaxine, valproate,
 * methadone…) carry no boxed-warning or controlled-substance field even though
 * the real label has one. A missing field means "not in our guide", not "none".
 */
export const NOT_IN_GUIDE = "Not listed in our guide. Check the medication label.";

export function boxedWarningCell(f: Pick<TreatmentFacts, "kind" | "boxedWarning">): string {
  if (f.boxedWarning) return f.boxedWarning;
  return f.kind === "medication" ? NOT_IN_GUIDE : "—";
}

export function controlledCell(f: Pick<TreatmentFacts, "kind" | "controlled" | "notControlled">): string {
  if (f.controlled) return `Yes (${f.controlled})`;
  // Only an explicit "not controlled" in the record reads as "No".
  if (f.notControlled) return "No";
  return f.kind === "medication" ? NOT_IN_GUIDE : "—";
}
