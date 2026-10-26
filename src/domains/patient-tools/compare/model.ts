/**
 * Two patient apps side by side, from their records only. No winner, no
 * score: each row states what each record says, and "Not stated" when it
 * doesn't. The reader decides.
 */

import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { evidenceOf, helpOf, HELP, payOf, PAY } from "@/domains/patient-tools/finder/model";

export interface CompareRow {
  id: string;
  label: string;
  a: string;
  b: string;
  /** True when both sides say the same thing (rendered quieter). */
  same: boolean;
}

const NOT_STATED = "Not stated";

function yesNo(v: unknown): string {
  if (v === true || v === "yes") return "Yes";
  if (v === false || v === "no") return "No";
  if (v === "not_applicable") return "Not applicable";
  return NOT_STATED;
}

function cost(p: DigitalToolV3["pricing"]): string {
  if (p.model === "free") return "Free";
  const base = p.starting_price ? `${p.free_tier ? "Free version, or " : ""}${p.starting_price}` : p.free_tier ? "Free to start" : null;
  return base ?? NOT_STATED;
}

function list(items: string[] | undefined, n: number): string {
  const xs = (items ?? []).filter(Boolean).slice(0, n);
  return xs.length ? xs.join("; ") : NOT_STATED;
}

function platforms(p: DigitalToolV3["platforms"]): string {
  const xs = [p.ios && "iPhone", p.android && "Android", p.web && "Web"].filter(Boolean);
  return xs.length ? xs.join(", ") : NOT_STATED;
}

export function compareRows(a: DigitalToolV3, b: DigitalToolV3): CompareRow[] {
  const helpLabel = (t: DigitalToolV3) =>
    helpOf(t)
      .map((h) => HELP.find((x) => x.id === h)?.label)
      .filter(Boolean)
      .join(", ") || NOT_STATED;
  const payLabel = (t: DigitalToolV3) =>
    payOf(t.pricing)
      .map((p) => PAY.find((x) => x.id === p)?.label)
      .filter(Boolean)
      .join(", ") || NOT_STATED;
  const research = (t: DigitalToolV3) => evidenceOf(t.clinical_metadata?.evidence_level).label ?? NOT_STATED;
  const privacy = (t: DigitalToolV3) => (t.privacy.grade && t.privacy.grade !== "unknown" ? `Grade ${t.privacy.grade}` : "Not graded");

  const rows: Omit<CompareRow, "same">[] = [
    { id: "help", label: "Kind of help", a: helpLabel(a), b: helpLabel(b) },
    { id: "good-for", label: "Good for", a: list(a.best_for, 2), b: list(b.best_for, 2) },
    { id: "not-for", label: "Probably not for", a: list(a.not_for, 1), b: list(b.not_for, 1) },
    { id: "cost", label: "Cost", a: cost(a.pricing), b: cost(b.pricing) },
    { id: "pay", label: "How you pay", a: payLabel(a), b: payLabel(b) },
    { id: "platforms", label: "Where", a: platforms(a.platforms), b: platforms(b.platforms) },
    { id: "research", label: "Research", a: research(a), b: research(b) },
    { id: "privacy", label: "Privacy", a: privacy(a), b: privacy(b) },
    { id: "data-sold", label: "Sells your data", a: yesNo(a.privacy.data_sold), b: yesNo(b.privacy.data_sold) },
    { id: "hipaa", label: "HIPAA", a: yesNo(a.privacy.hipaa_compliant), b: yesNo(b.privacy.hipaa_compliant) },
  ];
  return rows.map((r) => ({ ...r, same: r.a === r.b }));
}
