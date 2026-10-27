/**
 * Search title and description for an app profile.
 *
 * The hand-authored `seo` fields went stale or were written for the wrong
 * audience (therapist job pages, "review for mental health professionals",
 * unverified "largest"/"first" claims, old prices). For researched records
 * the description comes from the verified patient summary, and the title is
 * kept only when it is patient-facing and makes no unverifiable claim;
 * otherwise it is built from the record's facts. Unresearched records keep
 * their authored fields. Pure.
 */

import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { isResearched } from "./faqs";
import { helpOf } from "./finder/model";

const BAD_TITLE =
  /(jobs?\b|employment|\bw-?2\b|salary|for therapists|for (mental health )?professionals|for health systems|for (health )?plans|enterprise|partnership|largest|\bfirst\b|#1|best\b|outcomes-driven|\.\.\.$)/i;

const BRAND = /\s*\|\s*HeyPsych\s*$/i;

function kindPhrase(t: DigitalToolV3): string {
  const types = new Set(t.tool_types);
  if (types.has("crisis-tool")) return "Free Crisis Support";
  const help = helpOf(t);
  if (help.includes("therapist") && help.includes("prescriber")) return "Therapy & Psychiatry";
  if (help.includes("prescriber") || types.has("psychiatry-platform")) return "Online Psychiatry";
  if (help.includes("therapist") || types.has("therapy-platform")) return "Therapy";
  if (types.has("peer-support")) return "Peer Support";
  if (types.has("ai-therapist")) return "AI Mental Health App";
  if (types.has("meditation")) return "Meditation App";
  if (types.has("mood-tracker") || types.has("journal")) return "Mood Tracker";
  if (types.has("sleep-tracker")) return "Sleep App";
  if (types.has("coaching")) return "Coaching";
  return "Mental Health App";
}

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  // End at the last full sentence that fits, else at a word boundary.
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  if (end > max * 0.5) return cut.slice(0, end + 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`;
}

export interface ToolSeo {
  /** Without the "| HeyPsych" suffix (the layout template adds it). */
  title: string;
  description: string;
}

export function seoFor(tool: DigitalToolV3): ToolSeo {
  const authoredTitle = (tool.seo?.title ?? tool.name).replace(BRAND, "").trim();
  if (!isResearched(tool)) {
    return { title: authoredTitle, description: tool.seo?.meta_description ?? tool.one_liner };
  }
  const title = BAD_TITLE.test(authoredTitle) || !authoredTitle.toLowerCase().includes(tool.name.toLowerCase().split(/[\s(]/)[0])
    ? clip(`${tool.name}: ${kindPhrase(tool)}, Cost & Privacy`, 60)
    : authoredTitle;
  const description = clip(tool.patient_summary?.trim() || tool.one_liner, 158);
  return { title, description };
}
