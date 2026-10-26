/**
 * Privacy grade, computed — never typed in by hand.
 *
 * A grade is a rule applied to facts read from the product's privacy policy
 * and the regulatory record (PrivacyBasis). Same facts, same grade, every
 * time; the profile shows the facts behind it. Rubric in
 * docs/active/APP_RESEARCH_STANDARD.md.
 *
 *   A+  Data stays on your device and no account is needed; no sale or ad sharing.
 *   A   No sale or ad sharing, deletion on request, and health data protected
 *       by HIPAA (or kept only on your device).
 *   B+  No sale or ad sharing, and deletion on request.
 *   B   No sale or ad sharing, but no clear right to delete.
 *   C   Sells data or shares it for advertising, OR a regulator's finding about
 *       health data in the last five years.
 *   D   Both of the above.
 *   unknown  The policy doesn't say whether it sells or shares data for ads.
 */

import type { PrivacyBasis } from "@/lib/schemas/digital-tool-v3";

export type Grade = "A+" | "A" | "B+" | "B" | "C" | "D" | "unknown";

export function gradeFromBasis(b: PrivacyBasis): Grade {
  const action = Boolean(b.regulatory_action);
  if (b.sells_or_ads === "yes") return action ? "D" : "C";
  if (action) return "C";
  if (b.sells_or_ads === "unknown") return "unknown";
  if (b.on_device_only && !b.account_required) return "A+";
  if (b.deletion === "yes" && (b.hipaa === "covered" || b.on_device_only)) return "A";
  if (b.deletion === "yes") return "B+";
  return "B";
}

/** The facts behind a grade, in plain words, for the profile. */
export function basisLines(b: PrivacyBasis): { label: string; value: string; good: boolean | null }[] {
  const yn = (v: "yes" | "no" | "unknown", goodWhen: "yes" | "no") =>
    v === "unknown" ? { value: "Policy doesn't say", good: null } : { value: v === "yes" ? "Yes" : "No", good: v === goodWhen };
  return [
    { label: "Sells data or shares it for ads", ...yn(b.sells_or_ads, "no") },
    { label: "You can have your data deleted", ...yn(b.deletion, "yes") },
    {
      label: "Health data protected by HIPAA",
      value: b.hipaa === "covered" ? "Yes" : b.hipaa === "not-covered" ? "No" : "Not stated",
      good: b.hipaa === "covered" ? true : b.hipaa === "not-covered" ? false : null,
    },
    { label: "Data stays on your device", value: b.on_device_only ? "Yes" : "No", good: b.on_device_only ? true : null },
    { label: "Account needed", value: b.account_required ? "Yes" : "No", good: b.account_required ? null : true },
    {
      label: "Regulatory action (last 5 years)",
      value: b.regulatory_action ?? "None found",
      good: b.regulatory_action ? false : true,
    },
  ];
}
