/**
 * Symptom Domain Types
 *
 * Normalized types for symptom exploration experience.
 * These types represent a presentation/search layer over condition content.
 */

/**
 * Broad categories for organizing symptoms in the UI
 */
export type SymptomCategory =
  | "mood-motivation"
  | "worry-fear"
  | "sleep"
  | "attention-memory"
  | "thoughts-perceptions"
  | "trauma-stress"
  | "eating-body-image"
  | "energy-physical"
  | "behavior-impulses"
  | "relationships-social";

/**
 * Category metadata for display and navigation
 */
export interface SymptomCategoryMeta {
  id: SymptomCategory;
  name: string;
  description: string;
  icon: string;
}

/**
 * Context in which an example might apply
 */
export type ExampleContext =
  | "everyday"
  | "work-school"
  | "relationships"
  | "children-teens"
  | "older-adults";

/**
 * Context in which a symptom example applies
 */
export type SymptomExampleContext =
  | "everyday"
  | "work-school"
  | "relationships"
  | "internal"
  | "physical"
  | "social"
  | "sleep"
  | "motivation"
  | "general";

/**
 * An illustrative example of what a symptom can look like
 *
 * IMPORTANT: These are illustrative examples, NOT real patient quotations.
 * If using quotation marks for readability, always label clearly as illustrative.
 */
export interface SymptomExample {
  /** The illustrative example text */
  text: string;
  /** Optional context tag for filtering and display */
  context?: SymptomExampleContext;
  /** If adapted from a condition's real_life_examples, track provenance */
  sourceConditionSlug?: string;
}

/**
 * Relationship between a symptom and a condition
 * Tracks how this symptom appears in the context of a specific condition
 */
export interface SymptomConditionRelationship {
  /** Slug of the related condition */
  conditionSlug: string;
  /** Display name of the condition */
  conditionName: string;
  /** Context explaining why this symptom appears with this condition */
  context: string;
  /** Optional prevalence info (e.g., "Very common", "Core symptom") */
  prevalence?: string;
  /** Original symptom text(s) from the condition JSON that map to this symptom */
  symptomText?: string[];
  /** Which subgroup(s) the symptom came from in the condition JSON */
  sourceSubgroups?: string[];
}

/**
 * A raw symptom extracted from condition JSON
 * Used during normalization before mapping to canonical entities
 */
export interface ExtractedSymptom {
  /** The raw symptom text */
  text: string;
  /** Source condition slug */
  conditionSlug: string;
  /** Source condition name */
  conditionName: string;
  /** Which subgroup it came from (e.g., "core", "emotional_cognitive") */
  subgroup: string;
  /** The source field path (e.g., "content.symptoms.core") */
  sourcePath: string;
}

/**
 * A canonical symptom entity
 * This is the approved, indexable representation of a symptom
 */
export interface SymptomEntity {
  /** URL-safe unique identifier */
  slug: string;
  /** Plain-language display name */
  name: string;
  /** Brief, educational definition (1-2 sentences) */
  shortDefinition: string;
  /** Alternative phrasings users might search for */
  aliases: string[];
  /** Search phrases for the index */
  searchPhrases: string[];
  /** Categorization for browsing */
  category: SymptomCategory;
  /** Illustrative examples of what this looks like */
  examples: SymptomExample[];
  /** Related canonical symptom slugs */
  relatedSymptoms: string[];
  /** Conditions where this symptom can appear, with context */
  conditionRelationships: SymptomConditionRelationship[];
  /** Non-psychiatric factors that can also cause this */
  nonPsychiatricConsiderations: string[];
  /** When to seek professional help */
  whenToSeekHelp?: string[];
  /** Links to relevant validated assessments */
  assessmentLinks?: Array<{
    /** Display label of the assessment */
    label: string;
    /** Link to the assessment */
    href: string;
    /** Optional relevance description */
    relevance?: string;
  }>;
  /** Whether this entity should have an indexable page */
  indexable: boolean;
  /** Whether content has been editorially reviewed */
  reviewed: boolean;
  /** ISO date of last review */
  lastReviewed?: string;
}

/**
 * Search result for a symptom query
 */
export interface SymptomSearchResult {
  /** The matched symptom entity slug */
  slug: string;
  /** Display name */
  name: string;
  /** Category for grouping */
  category: SymptomCategory;
  /** Short definition for preview */
  shortDefinition: string;
  /** Which text matched the search */
  matchedText: string;
  /** Match type for ranking */
  matchType: "canonical" | "alias" | "phrase" | "example" | "keyword";
  /** Relevance score (higher is better) */
  score: number;
}

/**
 * Compact search index entry for client-side search
 * Uses single-letter keys for minimal bundle size
 */
export interface SymptomSearchIndexEntry {
  /** Symptom slug */
  s: string;
  /** Display name */
  n: string;
  /** Category */
  c: SymptomCategory;
  /** Short definition (truncated) */
  d: string;
  /** Combined searchable text (name + aliases + phrases) */
  t: string;
}

/**
 * Quality gate check result
 */
export interface QualityGateResult {
  /** Whether the entity passes the quality gate */
  passes: boolean;
  /** Reasons for failure if applicable */
  failures: string[];
  /** Warnings that don't prevent indexing */
  warnings: string[];
}

/**
 * Summary builder item for the "What I've Noticed" feature
 */
export interface NoticedItem {
  /** Canonical symptom slug */
  symptomSlug: string;
  /** Display name */
  symptomName: string;
  /** Optional duration */
  duration?: "days" | "weeks" | "months" | "years" | "unsure";
  /** Optional context notes */
  contextNotes?: string;
  /** Optional functional impact */
  functionalImpact?: "minimal" | "moderate" | "significant" | "unsure";
  /** Timestamp when added */
  addedAt: number;
}

/**
 * Props for the symptom explorer component
 */
export interface SymptomExplorerProps {
  /** Initial search query */
  initialQuery?: string;
  /** Initial category filter */
  initialCategory?: SymptomCategory;
}

/**
 * Props for the symptom detail page
 */
export interface SymptomDetailProps {
  /** The symptom entity to display */
  symptom: SymptomEntity;
}
