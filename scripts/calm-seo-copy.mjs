#!/usr/bin/env node
/**
 * Calm SEO copy: undo scripts/ballistic-seo.ts.
 *
 * The ballistic pass wrote titles like "Sertraline (Zoloft) ⚠️ [26%] 2026:
 * Side Effects & FDA Warning" and descriptions with invented star ratings
 * ("Yoga Therapy (4.5★)"), urgency ("Read BEFORE starting →") and shouting.
 * That clashes with the site's voice, and fabricated ratings risk Google's
 * structured-data and spam policies on a health site (YMYL).
 *
 * This rewrites `seo.title` / `seo.description` in data/ JSON files in place,
 * keeping the names and real facts, removing the bait. Idempotent.
 *
 *   node scripts/calm-seo-copy.mjs          # dry run, prints a sample
 *   node scripts/calm-seo-copy.mjs --write  # rewrite files
 *
 * Records that also live in the database (conditions, learn) need the usual
 * sync afterwards for production to pick them up.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DATA = path.join(ROOT, "data");
const WRITE = process.argv.includes("--write");
const SKIP = /treatment-backups|node_modules|generated/;

const EMOJI = /[\p{Extended_Pictographic}️]/gu;

export function calmTitle(t) {
  let s = t
    .replace(EMOJI, "")
    .replace(/\s*\[[^\]]*\]/g, "") // [26%], [#1 App 2026], [4.8★ App Store], [FREE]
    .replace(/\s*\(\d(?:\.\d)?★\)/g, "") // (4.5★)
    .replace(/\s*\d(?:\.\d)?★/g, "")
    .replace(/\s+20\d\d\b(?=\s*[:|-]|$)/g, "") // " 2026:"
    .replace(/\s*\|\s*(Must Read|Read First|Complete Guide|Full Guide|Guide|Read Before Starting)\s*$/i, "")
    .replace(/\bHonest\s+/g, "")
    .replace(/\b\d+\s+(Side Effects|Interactions)\b/g, "$1")
    .replace(/,?\s*&?\s*Reviews\b/g, "")
    .replace(/&\s*FDA Warning\b/g, "& Warnings")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+:/g, ":")
    .replace(/\?:\s*/g, "? ")
    .replace(/:\s*(Expert Guide|Complete Guide|Full Guide)$/i, "")
    .replace(/:\s*:/g, ":")
    .replace(/[\s:|-]+$/g, "")
    .trim();
  return s;
}

export function calmDescription(d) {
  // A description the generator cut off mid-sentence ends at its last full sentence.
  if (/\.\.\.$|…$/.test(d)) {
    const cut = d.replace(/(\.\.\.|…)$/, "");
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
    if (end > 40) d = cut.slice(0, end + 1);
  }
  return d
    .replace(EMOJI, "")
    .replace(/\s+-\s+20\d\d (expert guide|guide|evidence review):?\s*/gi, ": ")
    .replace(/\s*\[[^\]]*★[^\]]*\]/g, "")
    .replace(/\s*\(\d(?:\.\d)?★\)/g, "")
    .replace(/\s*Read BEFORE (starting|you start)\.?\s*(→)?/gi, "")
    .replace(/\s*(Start here|Take the first step|Worth trying\?|Is it right for you\?|Find out|Learn more|See why)\s*→/gi, "")
    .replace(/\s*(Worth it|Worth taking|Worth trying|Does it work)\?\s*/gi, " ")
    .replace(/\s*Get the facts\.?/gi, "")
    .replace(/\.\s*(Expert-reviewed )?Guide\.\s*/g, ". ")
    .replace(/\b(\d+)% get /g, "$1% of people report ")
    .replace(/\s*→\s*$/g, "")
    .replace(/\s*→/g, ".")
    .replace(/\b20\d\d (expert guide|guide)\b/gi, "Guide")
    .replace(/\b20\d\d evidence review\b/gi, "Evidence review")
    .replace(/\+ FDA black box/g, "and an FDA boxed warning")
    .replace(/FDA black box warning/g, "FDA boxed warning")
    .replace(/\s\+\s/g, ", ")
    .replace(/\b(ACTUALLY|BEFORE|REALLY|NEVER|ALWAYS)\b/g, (w) => w.toLowerCase())
    .replace(/\.\.\.$/, "")
    .replace(/^\s*-\s*/, "")
    .replace(/\s+-\s+/, ": ")
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s*\./g, ".")
    .replace(/\s*\b(Guide|Evidence review)\.?$/, "")
    .replace(/([^.?!])$/, "$1.")
    .trim();
}

function* jsonFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (SKIP.test(p)) continue;
    if (entry.isDirectory()) yield* jsonFiles(p);
    else if (entry.name.endsWith(".json")) yield p;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let changed = 0;
  const samples = [];
  for (const file of jsonFiles(DATA)) {
    let record;
    const raw = fs.readFileSync(file, "utf8");
    try {
      record = JSON.parse(raw);
    } catch {
      continue;
    }
    const seo = record && typeof record === "object" ? record.seo : null;
    if (!seo || typeof seo !== "object") continue;
    let dirty = false;
    for (const [key, fn] of [["title", calmTitle], ["description", calmDescription]]) {
      if (typeof seo[key] !== "string") continue;
      const next = fn(seo[key]);
      if (next && next !== seo[key]) {
        if (samples.length < 400) samples.push([seo[key], next]);
        seo[key] = next;
        dirty = true;
      }
    }
    if (dirty) {
      changed++;
      if (WRITE) fs.writeFileSync(file, JSON.stringify(record, null, 2) + (raw.endsWith("\n") ? "\n" : ""));
    }
  }
  for (const [a, b] of samples) console.log(`- ${a}\n+ ${b}\n`);
  console.log(`${changed} files ${WRITE ? "rewritten" : "would change (dry run; pass --write)"}`);
}
