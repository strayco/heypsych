/**
 * Your Path — types
 *
 * "Your path" is the visitor's private working file: what they have noticed,
 * read, considered, saved and decided across HeyPsych, and the appointment
 * brief built from it. It lives only in this browser (decision D-012). Nothing
 * in this domain transmits anything.
 *
 * Facts are snapshots of reviewed records taken when an item is saved (and
 * refreshed whenever the visitor opens that page again), so the workspace
 * renders with no network requests and never tells the server what a visitor
 * keeps.
 */

import type { SupportPathId, ConfidenceLevel } from "@/domains/patient-support/types";
import type {
  PatientJourneyInput,
  SymptomDuration,
  SupportGoal,
  PriorSupportLevel,
  InsurancePreference,
} from "@/domains/patient-support/types";
import type { SymptomCategory } from "@/domains/symptoms/types";

export const PATH_VERSION = 1;

/** Facts from a reviewed condition record, as the brief uses them. */
export interface ConditionFacts {
  /** One plain sentence: what it is. */
  whatItIs: string | null;
  /** What an evaluation usually checks, first sentence of the record. */
  evaluation: string | null;
  /** Questionnaires a clinician may use (names only, max 3). */
  measures: string[];
  /** Other things a clinician may consider (names only, max 3). */
  alsoConsidered: string[];
  /** Kinds of treatment the record describes, e.g. "Therapy", "Medications". */
  approaches: string[];
  /** When the record says to get checked. */
  whenToSeekHelp: string | null;
  /** ISO date the record was last reviewed, if known. */
  reviewed: string | null;
}

export type TreatmentKind = "medication" | "supplement" | "therapy" | "procedure";

/** Facts from a reviewed treatment record, as the brief uses them. */
export interface TreatmentFacts {
  kind: TreatmentKind;
  /** e.g. "SSRI". */
  drugClass: string | null;
  whatItIs: string | null;
  /** When effects usually begin, from the record. */
  onset: string | null;
  /** Typical course for therapies and procedures. */
  course: string | null;
  /** Session length for therapies and procedures. */
  session: string | null;
  /** Formats offered (e.g. "Teletherapy"). Max 3. */
  formats: string[];
  /** Plain-language boxed warning, if the label carries one. */
  boxedWarning: string | null;
  /** Most common side effects, most frequent first. Max 3. */
  sideEffects: string[];
  /** What prescribers monitor. Short labels, max 3. */
  monitoring: string[];
  /** The record lists drug or supplement interactions. */
  hasInteractions: boolean;
  /** "Schedule II" etc., or "Controlled" when the schedule is unknown. */
  controlled: string | null;
  /** True only when the record explicitly says it is not a controlled substance. */
  notControlled?: boolean;
  /** True prescription-only, false over the counter, null unknown. */
  prescription: boolean | null;
  /** The record has guidance for pregnancy or breastfeeding. */
  hasPregnancyGuidance: boolean;
  /** Conditions it is used for. Names only, max 3. */
  usedFor: string[];
  /** Condition page slugs it is used for (approved and off-label), max 8. For connections. */
  usedForSlugs: string[];
  reviewed: string | null;
}

export interface PathCondition {
  slug: string;
  name: string;
  savedAt: number;
  facts: ConditionFacts;
}

export interface PathTreatment {
  slug: string;
  name: string;
  savedAt: number;
  facts: TreatmentFacts;
}

/** "I've noticed this", written by symptom pages (key `hp:noticed`). */
export type NoticedDuration = "days" | "weeks" | "months" | "years";
export interface PathNoticed {
  slug: string;
  name: string;
  duration: NoticedDuration | null;
  addedAt?: number;
}

/** A saved app (key `hp:saved-apps`). */
export interface PathApp {
  slug: string;
  name: string;
}

/** Self-help strategies ticked on a condition page (keys `hp:selfhelp:<slug>`). */
export interface PathTried {
  conditionSlug: string;
  items: string[];
}

/** The outcome of the next-step journey the visitor chose to keep. */
export interface PathNextStep {
  savedAt: number;
  pathId: SupportPathId;
  pathName: string;
  typicalFirst: string;
  whyThisFits: string[];
  alternatives: { id: SupportPathId; name: string }[];
  confidence: ConfidenceLevel;
  missingInfo: string[];
  /** The answers, so the journey can be resumed and the brief can say what was asked for. */
  answers: NextStepAnswers;
  versions: { definition: string; evaluator: string };
  /** How this kept step changed over time, newest first (max 10). Local only. */
  history?: { at: number; from: string; to: string; because: string }[];
}

/** The non-urgent part of the journey input, as kept in the path. */
export interface NextStepAnswers {
  primaryConcerns: SymptomCategory[];
  duration?: SymptomDuration;
  goals: SupportGoal[];
  priorSupport?: PriorSupportLevel;
  insurancePreference?: InsurancePreference;
}

/** What `hp:path` stores. Symptoms, apps and tried items keep their own keys. */
export interface PathDocument {
  v: typeof PATH_VERSION;
  conditions: PathCondition[];
  treatments: PathTreatment[];
  nextStep: PathNextStep | null;
  /** Visitor's own questions for the appointment. Short, local only. */
  questions: string[];
  /** Date of the visitor's appointment, YYYY-MM-DD, if they set one. Local only. */
  appointment: string | null;
}

/** Everything the workspace sees, gathered from every store. */
export interface PathSnapshot extends PathDocument {
  noticed: PathNoticed[];
  apps: PathApp[];
  tried: PathTried[];
}

/** Public reference data for symptoms, passed from the server. */
export interface SymptomRef {
  slug: string;
  name: string;
  category: SymptomCategory;
  alsoCausedBy: string[];
  seekHelpWhen: string[];
  /** Condition slugs whose guides describe this symptom (registry relationships). */
  conditions?: string[];
}

export type JourneyInput = PatientJourneyInput;

export const PATH_LIMITS = {
  conditions: 12,
  treatments: 12,
  questions: 8,
  questionLength: 200,
} as const;
