/**
 * PsychTrails - Core Type Definitions
 *
 * Scenario-agnostic simulation engine types.
 * The engine is completely domain-neutral and works for any simulation type.
 */

// ============================================================================
// Scenario Pack Metadata
// ============================================================================

/**
 * Category for organizing scenario packs
 */
export type ScenarioCategory =
  | "condition" // Mental health condition journeys
  | "medication" // Medication experiences
  | "therapy" // Therapy modality experiences
  | "life-event" // Life transitions and events
  | "system" // Healthcare system navigation
  | "other"; // Custom categories

/**
 * Difficulty level (optional, for user filtering)
 */
export type ScenarioDifficulty = "beginner" | "intermediate" | "advanced";

/**
 * Metadata for a scenario pack
 */
export interface ScenarioMetadata {
  /** Unique identifier (kebab-case) */
  id: string;
  /** Human-readable title */
  title: string;
  /** Brief description */
  summary: string;
  /** Category for organization */
  category: ScenarioCategory;
  /** Tags for filtering (e.g., ["adhd", "stimulant", "college"]) */
  tags: string[];
  /** Scenario version (semantic versioning) */
  version: string;
  /** Who reviewed/approved this scenario */
  reviewedBy?: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  /** Optional difficulty rating */
  difficulty?: ScenarioDifficulty;
  /** Estimated play time in minutes */
  estimatedMinutes?: number;

  // ========== E-E-A-T / SEO Metadata ==========
  /** Content author (for E-E-A-T signals) */
  author?: string;
  /** Author's credentials or role */
  authorRole?: string;
  /** Medical/clinical reviewer name */
  medicalReviewer?: string;
  /** Medical reviewer's credentials */
  medicalReviewerCredentials?: string;
  /** Date clinically reviewed (ISO 8601) */
  clinicalReviewDate?: string;
  /** Date clinical review is due (ISO 8601) */
  clinicalReviewDueDate?: string;
  /** SEO keywords for this scenario */
  keywords?: string[];
  /** What users will learn (for LearningResource schema) */
  learningObjectives?: string[];
  /** Educational level (for schema.org educationalLevel) */
  educationalLevel?: 'beginner' | 'intermediate' | 'advanced';
}

// ============================================================================
// State (Domain-Neutral)
// ============================================================================

/**
 * Generic numeric state values (engine doesn't care what they represent)
 */
export interface Metrics {
  [key: string]: number;
}

/**
 * Generic boolean state flags (engine doesn't care what they represent)
 */
export interface Flags {
  [key: string]: boolean;
}

/**
 * Optional inventory/resources (for Oregon Trail-style resource management)
 */
export interface Inventory {
  [key: string]: number;
}

/**
 * The complete state of a simulation run
 */
export interface RunState {
  /** Current time step (generic, scenario defines meaning) */
  currentStep: number;
  /** Current node ID in the scenario graph */
  currentNodeId: string;
  /** Numeric metrics (scenario-defined) */
  metrics: Metrics;
  /** Boolean flags (scenario-defined) */
  flags: Flags;
  /** Optional inventory/resources (scenario-defined) */
  inventory?: Inventory;
  /** History of all turns (for replay/debug/share) */
  history: HistoryEntry[];
  /** Random seed for deterministic replays */
  seed: number;
  /** Has the run reached an ending? */
  isEnded: boolean;
  /** If ended, which ending ID? */
  endingId?: string;
}

/**
 * A single entry in the history log
 */
export interface HistoryEntry {
  step: number;
  nodeId: string;
  choiceId?: string;
  events: string[]; // Event IDs that triggered this turn
  metricsSnapshot: Metrics;
  inventorySnapshot?: Inventory;
}

// ============================================================================
// Scenario Configuration (UI & Mechanics)
// ============================================================================

/**
 * Definition for a single metric (how to display it)
 */
export interface MetricDefinition {
  /** Metric key (matches keys in state.metrics) */
  key: string;
  /** Display label */
  label: string;
  /** Optional icon name (lucide-react icon) */
  icon?: string;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Higher is better? (affects color coding) */
  higherIsBetter?: boolean;
}

/**
 * Definition for inventory/resource item
 */
export interface InventoryDefinition {
  /** Inventory key (matches keys in state.inventory) */
  key: string;
  /** Display label */
  label: string;
  /** Optional icon name */
  icon?: string;
  /** Unit (e.g., "days", "$", "points") */
  unit?: string;
}

/**
 * Time model configuration
 */
export interface TimeConfig {
  /** What each step represents (e.g., "day", "week", "month") */
  stepLabel: string;
  /** Plural form (e.g., "days", "weeks", "months") */
  stepLabelPlural: string;
  /** Maximum steps before auto-end (optional) */
  maxSteps?: number;
}

/**
 * UI rendering configuration
 */
export interface UIConfig {
  /** Metric definitions (what to display and how) */
  metrics: MetricDefinition[];
  /** Inventory definitions (optional) */
  inventory?: InventoryDefinition[];
  /** Show timeline? (default: true) */
  showTimeline?: boolean;
  /** Show event log? (default: true) */
  showEventLog?: boolean;
  /** Primary color theme (optional) */
  themeColor?: string;
}

// ============================================================================
// Scenario Content
// ============================================================================

/**
 * A moment in the story where the user sees text and makes choices
 */
export interface Node {
  id: string;
  /** Text shown to the user (supports markdown) */
  text: string;
  /** Choices available at this node (if any) */
  choiceIds: string[];
  /** Is this an ending node? */
  isEnding?: boolean;
}

/**
 * A decision the user can make
 */
export interface Choice {
  id: string;
  /** Text shown for the choice button */
  text: string;
  /** Optional explanation of what this choice means and its potential effects (shown BEFORE continuing) */
  description?: string;
  /** Optional narrative of what happened as a result of this choice (shown AFTER continuing to next node) */
  resultText?: string;
  /** Condition that must be true for choice to appear */
  condition?: Condition;
  /** Effects applied when this choice is selected */
  effects: Effect[];
  /** Where this choice leads (node ID) */
  nextNodeId: string;
  /** Does selecting this choice advance time? (default: true) */
  advancesTime?: boolean;
}

/**
 * Something that can happen randomly or conditionally during a turn
 */
export interface GameEvent {
  id: string;
  /** Description of what happened */
  text: string;
  /** Probability this event triggers (0-1) */
  probability: number;
  /** Condition that must be true for event to be eligible */
  condition?: Condition;
  /** Effects applied if event triggers */
  effects: Effect[];
}

/**
 * A final state of the simulation
 */
export interface Ending {
  id: string;
  /** Title of this ending */
  title: string;
  /** Full ending text (supports markdown) */
  text: string;
  /** Was this a "good" ending? (for analytics/categorization) */
  isPositive?: boolean;
}

// ============================================================================
// Conditions & Effects
// ============================================================================

/**
 * A condition that can be evaluated against current state (domain-neutral)
 */
export type Condition =
  | { type: "flag"; flag: string; value: boolean }
  | { type: "metric"; metric: string; operator: ">" | "<" | ">=" | "<=" | "=="; value: number }
  | { type: "inventory"; item: string; operator: ">" | "<" | ">=" | "<=" | "=="; value: number }
  | { type: "step"; operator: ">" | "<" | ">=" | "<=" | "=="; value: number }
  | { type: "and"; conditions: Condition[] }
  | { type: "or"; conditions: Condition[] }
  | { type: "not"; condition: Condition };

/**
 * A modification to state (domain-neutral)
 */
export type Effect =
  | { type: "metric"; metric: string; change: number }
  | { type: "metric-set"; metric: string; value: number }
  | { type: "flag"; flag: string; value: boolean }
  | { type: "inventory"; item: string; change: number }
  | { type: "inventory-set"; item: string; value: number }
  | { type: "end"; endingId: string };

// ============================================================================
// Scenario Definition (Complete Pack)
// ============================================================================

/**
 * A complete scenario pack (JSON)
 * This is the full data structure for a playable scenario.
 */
export interface Scenario {
  // ========== Metadata ==========
  /** Unique identifier (kebab-case) */
  id: string;
  /** Human-readable title */
  title: string;
  /** Brief description */
  summary: string;
  /** Category for organization */
  category: ScenarioCategory;
  /** Tags for filtering */
  tags: string[];
  /** Scenario version (semantic versioning) */
  version: string;
  /** Who reviewed/approved this scenario */
  reviewedBy?: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  /** Optional difficulty rating */
  difficulty?: ScenarioDifficulty;
  /** Estimated play time in minutes */
  estimatedMinutes?: number;

  // ========== E-E-A-T / SEO Metadata ==========
  /** Content author (for E-E-A-T signals) */
  author?: string;
  /** Author's credentials or role */
  authorRole?: string;
  /** Medical/clinical reviewer name */
  medicalReviewer?: string;
  /** Medical reviewer's credentials */
  medicalReviewerCredentials?: string;
  /** Date clinically reviewed (ISO 8601) */
  clinicalReviewDate?: string;
  /** Date clinical review is due (ISO 8601) */
  clinicalReviewDueDate?: string;
  /** SEO keywords for this scenario */
  keywords?: string[];
  /** What users will learn (for LearningResource schema) */
  learningObjectives?: string[];
  /** Educational level (for schema.org educationalLevel) */
  educationalLevel?: 'beginner' | 'intermediate' | 'advanced';

  // ========== Configuration ==========
  /** Time model (step labels, max steps) */
  timeConfig: TimeConfig;
  /** UI rendering config (metrics display, etc.) */
  uiConfig: UIConfig;

  // ========== Initial State ==========
  /** Starting node ID */
  startNodeId: string;
  /** Initial metrics values */
  initialMetrics: Metrics;
  /** Initial flags values */
  initialFlags: Flags;
  /** Initial inventory values (optional) */
  initialInventory?: Inventory;

  // ========== Content ==========
  /** All nodes in the scenario */
  nodes: Node[];
  /** All choices in the scenario */
  choices: Choice[];
  /** All random/conditional events */
  events: GameEvent[];
  /** All possible endings */
  endings: Ending[];
}

// ============================================================================
// Engine API
// ============================================================================

/**
 * Input for making a choice and advancing the simulation
 */
export interface TurnInput {
  choiceId: string;
}

/**
 * Result of processing a turn
 */
export interface TurnResult {
  /** Updated state after the turn */
  newState: RunState;
  /** Events that triggered this turn */
  triggeredEvents: GameEvent[];
  /** The choice that was made */
  choice: Choice;
}
