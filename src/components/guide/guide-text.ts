/**
 * Plain-text helpers for guide chapters: teasers and reading time.
 * Server- and client-safe (no "use client"), so server pages can build
 * chapter lists directly.
 */

/** Plain text of a section's data, for teasers and reading time. */
export function sectionText(value: unknown): string {
  const parts: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  return parts.join(" ").replace(/\{link:[^:}]+:[^:}]+:([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
}

/** The first readable sentence among the given fields, link markup removed. */
export function teaserFrom(fields: unknown[], max = 120): string | null {
  for (const field of fields) {
    const text = field == null ? null : sectionText(field);
    if (text && text.length > 20) {
      const sentence = (text.match(/^.+?[.!?](\s|$)/)?.[0] ?? text).trim();
      return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
    }
  }
  return null;
}

export function readingMinutes(value: unknown): number {
  const words = sectionText(value).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
