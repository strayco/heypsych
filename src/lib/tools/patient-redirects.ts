/**
 * Patient Apps & Tools consolidation (2026-10-23): the retired patient
 * landers and programmatic guides redirect into the finder (/tools and the
 * need pages) or an app's profile. Destinations carry only `?help=` / `?pay=`
 * (never a health need) and the need itself as a path.
 *
 * Imported by next.config.ts: relative imports only.
 */

import fs from "fs";
import path from "path";

interface Redirect {
  source: string;
  destination: string;
  permanent: true;
}
const r = (source: string, destination: string): Redirect => ({ source, destination, permanent: true });

/** Guide condition slugs → need page. */
const CONDITION_TO_NEED: Record<string, string> = {
  anxiety: "/tools/anxiety-stress",
  ocd: "/tools/anxiety-stress",
  depression: "/tools/mood-depression",
  grief: "/tools/mood-depression",
  bipolar: "/tools/serious-mental-illness",
  sleep: "/tools/sleep",
  adhd: "/tools/focus-adhd",
  ptsd: "/tools/trauma-ptsd",
  addiction: "/tools/substance-use",
  "eating-disorders": "/tools/serious-mental-illness",
};

const APP_TYPE_TO_VIEW: Record<string, string> = {
  "therapy-apps": "/tools/find-support?help=therapist",
  "psychiatry-apps": "/tools/find-support?help=prescriber",
  "meditation-apps": "/tools?help=self-guided",
  "mood-trackers": "/tools?help=self-guided",
  "cbt-apps": "/tools?help=self-guided",
  "journal-apps": "/tools?help=self-guided",
  "ai-therapy": "/tools?help=self-guided",
  "peer-support": "/tools?help=peer",
};

function patientSlugs(root: string): string[] {
  const dir = path.join(root, "data/resources/tools");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();
}

/** Duplicate records folded into another: slug → surviving slug. */
function mergedRecords(root: string): Array<[string, string]> {
  const dir = path.join(root, "data/resources/tools");
  if (!fs.existsSync(dir)) return [];
  const out: Array<[string, string]> = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    try {
      const rec = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as { slug?: string; merged_into?: string };
      if (rec.slug && rec.merged_into && rec.merged_into !== rec.slug) out.push([rec.slug, rec.merged_into]);
    } catch {
      // A malformed record fails validation elsewhere; skip it here.
    }
  }
  return out.sort();
}

export function buildPatientRedirects(root: string = process.cwd()): Redirect[] {
  const out: Redirect[] = [];
  for (const [from, to] of mergedRecords(root)) out.push(r(`/tools/${from}`, `/tools/${to}`));
  const G = "/tools/for-patients/guides";

  out.push(
    r("/tools/for-patients", "/tools"),
    r("/tools/for-patients/compare", "/tools#compare"),
    // Name search now lives in the finder; ?q= is carried over.
    r("/tools/search", "/tools")
  );

  for (const [condition, need] of Object.entries(CONDITION_TO_NEED)) {
    out.push(r(`${G}/best-${condition}-apps`, need));
    out.push(r(`${G}/free-${condition}-apps`, `${need}?pay=free`));
  }
  for (const [type, view] of Object.entries(APP_TYPE_TO_VIEW)) out.push(r(`${G}/best-${type}`, view));
  for (const slug of patientSlugs(root)) out.push(r(`${G}/${slug}-alternatives`, `/tools/${slug}#compare`));
  out.push(r(`${G}/:slug`, "/tools"));

  // Sub-hubs of "someone to talk to".
  out.push(
    r("/tools/find-support/therapy-platforms", "/tools/find-support?help=therapist"),
    r("/tools/find-support/psychiatry-platforms", "/tools/find-support?help=prescriber"),
    r("/tools/find-support/ai-therapists", "/tools?help=self-guided")
  );

  // /tools/free/<clinician category> were clinician pages.
  out.push(
    r("/tools/free/:c(ehr-practice-management|ai-scribe-documentation|telehealth-communication|billing-rcm|measurement-outcomes)", "/tools/for-clinicians/:c?practice=budget"),
    r("/tools/free/:category", "/tools/for-clinicians")
  );

  return out;
}
