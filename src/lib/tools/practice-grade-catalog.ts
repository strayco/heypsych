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
 * Explicitly out: hospital EHRs, Canada/AU-first products, coach/wellness
 * EHRs, Alma (acquired), Freed/Nabla/Suki (general medical scribes),
 * GoodTherapy, malpractice carriers (Architect treats cover as insurance,
 * not software), QuickBooks/Wave, clearinghouses, credentialing utilities.
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
]);

export function isPracticeGrade(slug: string): boolean {
  return PRACTICE_GRADE_SLUGS.has(slug);
}
