/**
 * Navigation Domain Types
 *
 * Core type definitions for HeyPsych Navigation V1.
 * These types power the contextual next-step system and navigation intents.
 */

/**
 * Audience for content and recommendations
 */
export type Audience = "patient" | "clinician";

/**
 * Types of next steps available in the navigation system
 */
export type NextStepKind =
  | "assessment"
  | "condition"
  | "treatment"
  | "comparison"
  | "tool"
  | "find_care"
  | "clinician_resource"
  | "article"
  | "external";

/**
 * Catalog entity types that can be sources or targets of relationships
 */
export type CatalogEntityType =
  | "condition"
  | "treatment"
  | "assessment"
  | "tool"
  | "resource"
  | "provider"
  | "article";

/**
 * Source of a recommendation - indicates how it was authored/derived
 */
export type NextStepSource =
  | "editorial" // Manually authored by editorial team
  | "verified_fact" // Derived from verified clinical relationship
  | "system"; // System-generated (e.g., from catalog relationships)

/**
 * A contextual next step recommendation
 */
export interface NextStep {
  /** Unique identifier for this next step */
  id: string;

  /** The type of action this next step represents */
  kind: NextStepKind;

  /** Display title for the next step */
  title: string;

  /** Optional description providing context */
  description?: string;

  /** URL to navigate to */
  href: string;

  /** Target audience for this recommendation */
  audience: Audience;

  /** Editorial rationale for this recommendation */
  reason?: string;

  /** Priority for ordering (lower = higher priority) */
  priority?: number;

  /** How this recommendation was sourced */
  source: NextStepSource;
}

/**
 * Search verticals for unified search
 */
export type SearchVertical =
  | "condition"
  | "treatment"
  | "assessment"
  | "resource"
  | "tool"
  | "provider";

/**
 * Unified search result presentation contract
 */
export interface NavigationSearchResult {
  /** Unique identifier */
  id: string;

  /** Which vertical this result belongs to */
  vertical: SearchVertical;

  /** Display title */
  title: string;

  /** Brief summary/description */
  summary?: string;

  /** URL to the detail page */
  href: string;

  /** Fields that matched the search query */
  matchedFields?: string[];

  /** Optional explanation of why this result was returned */
  reason?: string;
}

/**
 * Navigation intent - a user's expressed goal
 */
export type NavigationIntent =
  | "understand_symptoms"
  | "understand_diagnosis"
  | "compare_treatments"
  | "find_care"
  | "find_tool"
  | "clinician_resources";

/**
 * Intent entry point configuration
 */
export interface IntentEntryPoint {
  /** Unique identifier */
  id: NavigationIntent;

  /** Display label */
  label: string;

  /** Description shown to user */
  description: string;

  /** Destination URL */
  href: string;

  /** Icon name from lucide-react */
  icon: string;

  /** Target audience (defaults to patient) */
  audience?: Audience;
}

/**
 * Props for the NextStepsSection component
 */
export interface NextStepsSectionProps {
  /** Next steps to display */
  steps: NextStep[];

  /** Optional heading override */
  heading?: string;

  /** Filter by audience */
  audience?: Audience;

  /** Maximum number of steps to show */
  maxSteps?: number;

  /** Source entity for analytics */
  sourceType?: CatalogEntityType;

  /** Source slug for analytics */
  sourceSlug?: string;
}

/**
 * Props for the NextStepCard component
 */
export interface NextStepCardProps {
  step: NextStep;
  /** Source context for analytics */
  sourceType?: CatalogEntityType;
  sourceSlug?: string;
}

/**
 * Props for the IntentGrid component
 */
export interface IntentGridProps {
  /** Intent entry points to display (uses defaults if not provided) */
  intents?: IntentEntryPoint[];

  /** Number of columns on desktop */
  columns?: 2 | 3;
}
