/**
 * FAQs for an app profile, written from the record's researched facts.
 *
 * Hand-written SEO FAQs went stale as soon as prices, owners or services
 * changed (one still said a service prescribes controlled substances after
 * it stopped). For any record researched to the standard (it has
 * `privacy.basis`), the questions people ask are answered from the same
 * verified fields the page shows, so the two can never disagree. Unresearched
 * records keep their existing FAQs. Pure.
 */

import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { gradeFromBasis } from "./privacy";
import { yearCost } from "./shelves/model";

export interface Faq {
  q: string;
  a: string;
}

const LEVEL: Record<string, string> = {
  high: "strong research support: at least two randomized trials of it, or FDA clearance",
  moderate: "some research support: at least one controlled study of it",
  low: "limited research: published studies without a control group",
  emerging: "early research: it uses an established method, but no published study of the product itself",
  none: "no published research on it",
};

function sentence(s: string): string {
  const t = s.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function list(items: string[], max = 3): string {
  const xs = items.slice(0, max).map((x) => lowerFirst(x.replace(/[.]$/, "")));
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join("; ")}; and ${xs[xs.length - 1]}`;
}

export function isResearched(tool: Pick<DigitalToolV3, "privacy">): boolean {
  return Boolean(tool.privacy?.basis);
}

export function faqsFor(tool: DigitalToolV3): Faq[] {
  if (!isResearched(tool)) return tool.seo?.faqs ?? [];
  const name = tool.name;
  const out: Faq[] = [];
  const p = tool.pricing;
  const year = yearCost(p.starting_price);

  // Cost
  if (p.starting_price) {
    const parts = [sentence(p.starting_price)];
    if (year && /year/.test(year.headline) && year.headline !== p.starting_price) parts.push(`That comes to ${lowerFirst(year.headline)} at the listed price.`);
    if (p.notes) parts.push(sentence(p.notes));
    out.push({ q: `How much does ${name} cost?`, a: parts.join(" ") });
  }

  // Insurance
  const insuranceText = `${p.starting_price ?? ""} ${p.notes ?? ""}`;
  const takesInsurance = p.model === "insurance-covered" || /\binsurance\b|medicaid|medicare|copay|in-network/i.test(insuranceText);
  out.push({
    q: `Does ${name} take insurance?`,
    a: takesInsurance
      ? `Yes, ${name} works with insurance. ${p.notes ? sentence(p.notes) : "Check that your plan is in network before you book."}`
      : p.model === "free"
        ? `${name} is free, so insurance isn't needed.`
        : `${name} doesn't list insurance. You pay ${lowerFirst(p.starting_price ?? "the listed price")}${/[.]$/.test(p.starting_price ?? "") ? "" : "."}`,
  });

  // Who it's for
  if (tool.best_for.length || tool.not_for.length) {
    const a = [
      tool.best_for.length ? `It suits ${list(tool.best_for)}.` : "",
      tool.not_for.length ? `It isn't the right fit for ${list(tool.not_for)}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    out.push({ q: `Who is ${name} for?`, a });
  }

  // Privacy
  const b = tool.privacy.basis!;
  const grade = gradeFromBasis(b);
  const facts = [
    b.sells_or_ads === "no"
      ? "its privacy policy says it doesn't sell your data or share it for advertising"
      : b.sells_or_ads === "yes"
        ? "its privacy policy says it sells data or shares it for advertising"
        : "its privacy policy doesn't say whether it sells data or shares it for advertising",
    b.deletion === "yes" ? "you can ask for your data to be deleted" : b.deletion === "no" ? "it doesn't offer deletion" : "it doesn't clearly offer deletion",
    b.hipaa === "covered" ? "your health information is protected by HIPAA" : b.hipaa === "not-covered" ? "it says HIPAA doesn't apply" : null,
    b.on_device_only ? "what you enter stays on your device" : null,
  ].filter(Boolean) as string[];
  out.push({
    q: `Is ${name} private?`,
    a: `${grade === "unknown" ? "We couldn't grade it yet" : `Our privacy grade is ${grade}`}: ${facts.join(", ")}.${
      b.regulatory_action ? ` Regulatory record: ${sentence(b.regulatory_action)}` : ""
    } Checked ${b.checked}.`,
  });

  // Research
  const lvl = tool.clinical_metadata?.evidence_level;
  if (lvl) {
    const studies = (tool.clinical_metadata?.clinical_trials ?? []).filter((c) => c.citation);
    const first = studies[0]?.citation;
    out.push({
      q: `Is there research behind ${name}?`,
      a: `${name} has ${LEVEL[lvl] ?? lvl}.${
        first ? ` ${studies.length === 1 ? "One study" : `${studies.length} studies`} listed, including ${first.authors} (${first.year}), ${first.journal}.` : ""
      }`,
    });
  }

  // Where
  if (tool.availability?.state === "limited" && tool.availability.note) {
    out.push({ q: `Can I use ${name} where I live?`, a: sentence(tool.availability.note) });
  }

  // Crisis
  if (!tool.tool_types.includes("crisis-tool")) {
    out.push({
      q: `Can ${name} help in a crisis?`,
      a: `No. If you are thinking about suicide or are in danger, call or text 988 in the US, any time, or go to your nearest emergency room.`,
    });
  }

  return out;
}
