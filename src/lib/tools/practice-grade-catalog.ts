/**
 * Decision catalog.
 *
 * These are the products a US independent mental health clinician is actually
 * trying to choose between. Everything else is noise.
 *
 * Keep rule: a product stays only if it sits in a real shopping pair that
 * private-practice therapists or psychiatrists search, ask peers about, and
 * that our own comparison set already treated as high-intent. Adjacent,
 * hospital, international, acquired, generic small-business, and "also exists"
 * products are out.
 *
 * The clusters:
 *
 * 1. Therapist EHR — SimplePractice vs TherapyNotes vs TheraNest, plus the
 *    2024–26 challengers Jane, Sessions Health, and IntakeQ.
 * 2. Psychiatry EHR — ICANotes vs Luminello vs Valant, and Osmind when the
 *    practice is interventional (ketamine / TMS / Spravato).
 * 3. AI notes — Mentalyc vs Upheal, with Blueprint when outcomes tracking
 *    is part of the same decision.
 * 4. Standalone video — Doxy.me vs Zoom for Healthcare vs the EHR's own
 *    telehealth (covered by cluster 1).
 * 5. Insurance panels — Headway vs Grow Therapy vs SonderMind.
 * 6. Directories — Psychology Today vs Zencare.
 * 7. Getting paid — Ivy Pay for cards; Mentaya vs Thrizer for out-of-network
 *    claims; Heard for therapist bookkeeping.
 *
 * Explicitly out: hospital EHRs (Cerner, Epic, Netsmart myAvatar, Qualifacts
 * InSync), Canada/AU-first products, coach/wellness EHRs, Freed/Nabla/Suki
 * (general medical scribes), QuickBooks/Wave, credentialing utilities.
 *
 * 2026-10-26: products whose pages carried search traffic before the cut
 * came back as researched profiles: malpractice programs (a hub job; still
 * not in Architect, which treats cover as insurance, not software), agency
 * EHRs and AI notes (directory only, see ARCHITECT_EXCLUDED_SLUGS),
 * TheraPlatform, Tebra billing (formerly Kareo), Candid Health and PESI.
 */

export const PRACTICE_GRADE_SLUGS: ReadonlySet<string> = new Set([
  // Therapist EHR
  "simplepractice",
  "therapynotes",
  "theranest",
  "jane-app",
  "sessions-health",
  "intakeq-practiceq",
  "therapyappointment",

  // Psychiatry EHR
  "icanotes",
  "luminello",
  "valant-ehr-suite",
  "osmind",

  // AI documentation
  "mentalyc",
  "upheal",
  "blueprint",
  "supanote",
  "berries",
  "novopsych",
  "greenspace-health",

  // Standalone telehealth
  "doxy-me",
  "zoom-for-healthcare",

  // Insurance panels
  "headway",
  "grow-therapy",
  "sondermind",
  "alma",
  "rula",

  // Directories
  "psychology-today",
  "zencare",
  "therapyden",
  "goodtherapy",

  // Payments, OON claims, books
  "ivypay",
  "mentaya",
  "thrizer",
  "heard",
  "office-ally",
  "claim-md",
  "availity-essentials",
  "therathink",

  // Restored 2026-10-26 (pages that carried search traffic before the cut).
  // Malpractice cover: its own job on the hub, kept out of Architect.
  "cph-associates",
  "apa-insurance-trust",
  "prms",
  "hpso",
  "american-professional-agency",
  "preferra-insurance",
  "cmf-group",
  // Notes, EHR, billing, CE
  "nuance-dragon-medical-one",
  "zoom-clinical-notes",
  "eleos-health",
  "qualifacts-iq",
  "qualifacts-carelogic",
  "qualifacts-credible",
  "procentive",
  "theraplatform",
  "tebra-billing",
  "candid-health",
  "pesi",
]);

/**
 * Published as directory profiles but not offered in Practice Architect:
 * products sold only to agencies and larger organizations (CMHCs, CCBHCs,
 * health systems), or add-ons to them, and general medical dictation/scribes
 * (same rule that keeps Freed, Nabla and Suki out). Architect builds
 * independent and small-group practices.
 */
export const ARCHITECT_EXCLUDED_SLUGS: ReadonlySet<string> = new Set([
  "nuance-dragon-medical-one",
  "zoom-clinical-notes",
  "qualifacts-carelogic",
  "qualifacts-credible",
  "qualifacts-iq",
  "eleos-health",
  "procentive",
  "candid-health",
]);

export function isPracticeGrade(slug: string): boolean {
  return PRACTICE_GRADE_SLUGS.has(slug);
}
