/**
 * Practice Stack Schema
 *
 * Represents the user's selected products and stack state.
 * This is the core domain object that gets persisted.
 */

import { z } from "zod";
import { PracticeFingerprintZ, type PracticeFingerprint } from "./fingerprint";
import { CapabilityIdZ, type CapabilityId } from "./lifecycle";

// ============================================================================
// ARCHITECT MODE
// ============================================================================

export const ArchitectModeZ = z.enum([
  "build-for-me",
  "build-myself",
  "audit",
]);

export type ArchitectMode = z.infer<typeof ArchitectModeZ>;

export const ARCHITECT_MODE_LABELS: Record<ArchitectMode, string> = {
  "build-for-me": "Build for me",
  "build-myself": "Build myself",
  "audit": "Audit my current stack",
};

// ============================================================================
// SELECTED PRODUCT
// ============================================================================

export const SelectedProductZ = z.object({
  slug: z.string(),
  addedAt: z.string().datetime(),
  addedFromCapability: CapabilityIdZ.optional(),
  addedFromSource: z.enum(["shortlist", "search", "recommendation", "audit", "demo"]).optional(),
  isDemo: z.boolean().default(false),
});

export type SelectedProduct = z.infer<typeof SelectedProductZ>;

// ============================================================================
// RELEVANCE OVERRIDE
// ============================================================================

export const RelevanceLevelZ = z.enum([
  "required",
  "strongly-recommended",
  "useful",
  "optional",
  "irrelevant",
]);

export type RelevanceLevel = z.infer<typeof RelevanceLevelZ>;

export const RELEVANCE_LEVEL_LABELS: Record<RelevanceLevel, string> = {
  "required": "Required",
  "strongly-recommended": "Strongly recommended",
  "useful": "Useful",
  "optional": "Optional",
  "irrelevant": "Not relevant",
};

export const RELEVANCE_WEIGHTS: Record<RelevanceLevel, number> = {
  "required": 1.0,
  "strongly-recommended": 0.75,
  "useful": 0.4,
  "optional": 0.15,
  "irrelevant": 0,
};

export const RelevanceOverrideZ = z.object({
  capabilityId: CapabilityIdZ,
  overrideLevel: RelevanceLevelZ,
  derivedLevel: RelevanceLevelZ,
  reason: z.string().optional(),
  setAt: z.string().datetime(),
});

export type RelevanceOverride = z.infer<typeof RelevanceOverrideZ>;

// ============================================================================
// STACK HISTORY ENTRY
// ============================================================================

export const StackMutationTypeZ = z.enum([
  "add-product",
  "remove-product",
  "replace-product",
  "clear-stack",
  "reset-preferences",
  "update-relevance",
  "update-priorities",
]);

export type StackMutationType = z.infer<typeof StackMutationTypeZ>;

export const StackHistoryEntryZ = z.object({
  id: z.string().optional(),
  type: StackMutationTypeZ,
  timestamp: z.string(),
  description: z.string().optional(),

  // For product mutations
  productSlug: z.string().optional(),
  replacedProductSlug: z.string().optional(),

  // For relevance mutations
  capabilityId: CapabilityIdZ.optional(),
  previousRelevance: RelevanceLevelZ.optional(),
  newRelevance: RelevanceLevelZ.optional(),

  // Snapshot for undo
  previousSelectedProducts: z.array(SelectedProductZ).optional(),
  previousRelevanceOverrides: z.array(RelevanceOverrideZ).optional(),
  previousPriorities: z.array(z.string()).optional(),
});

export type StackHistoryEntry = z.infer<typeof StackHistoryEntryZ>;

// ============================================================================
// ITEM DECISION (for practice area items)
// ============================================================================

export const ItemDecisionZ = z.enum([
  "complete", // User marked as done (for foundational items)
  "not-needed", // User marked as not relevant
  "add-later", // User deferred for now
]);

export type ItemDecision = z.infer<typeof ItemDecisionZ>;

export const ItemDecisionRecordZ = z.object({
  itemKey: z.string(), // Format: "areaId:itemId"
  decision: ItemDecisionZ,
  setAt: z.string().datetime(),
});

export type ItemDecisionRecord = z.infer<typeof ItemDecisionRecordZ>;

// ============================================================================
// PRACTICE STACK
// ============================================================================

export const PracticeStackZ = z.object({
  // Identity
  id: z.string(),
  name: z.string().default("My Practice Stack"),
  createdAt: z.string(),
  updatedAt: z.string(),

  // Mode
  mode: ArchitectModeZ.optional(),

  // Fingerprint
  fingerprint: PracticeFingerprintZ,

  // Selected products
  selectedProducts: z.array(SelectedProductZ).default([]),

  // User overrides for capabilities
  relevanceOverrides: z.array(RelevanceOverrideZ).default([]),

  // User decisions for practice items (foundation completions, deferrals, not-needed)
  itemDecisions: z.array(ItemDecisionRecordZ).default([]),

  // History for undo (limited to recent mutations)
  history: z.array(StackHistoryEntryZ).default([]),

  // Demo mode flag
  isDemoMode: z.boolean().default(false),
});

export type PracticeStack = z.infer<typeof PracticeStackZ>;

// ============================================================================
// PERSISTENCE ENVELOPE
// ============================================================================

export const STACK_SCHEMA_VERSION = "1.0" as const;

export const StackPersistenceEnvelopeZ = z.object({
  schemaVersion: z.literal(STACK_SCHEMA_VERSION),
  savedAt: z.string().datetime(),
  stack: PracticeStackZ,
});

export type StackPersistenceEnvelope = z.infer<typeof StackPersistenceEnvelopeZ>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a new empty practice stack
 */
export function createEmptyStack(): PracticeStack {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "My Practice Stack",
    createdAt: now,
    updatedAt: now,
    fingerprint: {
      clinicalRoles: [],
      populations: [],
      statesServed: [],
      priorities: [],
    },
    selectedProducts: [],
    relevanceOverrides: [],
    itemDecisions: [],
    history: [],
    isDemoMode: false,
  };
}

/**
 * Check if a product is in the stack
 */
export function hasProduct(stack: PracticeStack, slug: string): boolean {
  return stack.selectedProducts.some((p) => p.slug === slug);
}

/**
 * Get a selected product by slug
 */
export function getSelectedProduct(
  stack: PracticeStack,
  slug: string
): SelectedProduct | undefined {
  return stack.selectedProducts.find((p) => p.slug === slug);
}

/**
 * Get product slugs in the stack
 */
export function getProductSlugs(stack: PracticeStack): string[] {
  return stack.selectedProducts.map((p) => p.slug);
}

/**
 * Get non-demo products in the stack
 */
export function getRealProducts(stack: PracticeStack): SelectedProduct[] {
  return stack.selectedProducts.filter((p) => !p.isDemo);
}

/**
 * Get relevance override for a capability
 */
export function getRelevanceOverride(
  stack: PracticeStack,
  capabilityId: CapabilityId
): RelevanceOverride | undefined {
  return stack.relevanceOverrides.find((o) => o.capabilityId === capabilityId);
}

/**
 * Create a history entry ID
 */
export function createHistoryId(): string {
  return `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Add a history entry, keeping only the most recent entries
 */
export function addHistoryEntry(
  stack: PracticeStack,
  entry: StackHistoryEntry,
  maxEntries = 10
): PracticeStack {
  const newHistory = [entry, ...stack.history].slice(0, maxEntries);
  return {
    ...stack,
    history: newHistory,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get the most recent history entry
 */
export function getLastHistoryEntry(
  stack: PracticeStack
): StackHistoryEntry | undefined {
  return stack.history[0];
}

/**
 * Check if stack can be undone
 */
export function canUndo(stack: PracticeStack): boolean {
  return stack.history.length > 0;
}

/**
 * Create a persistence envelope for saving
 */
export function createPersistenceEnvelope(
  stack: PracticeStack
): StackPersistenceEnvelope {
  return {
    schemaVersion: STACK_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    stack,
  };
}

/**
 * Validate and parse a persistence envelope
 */
export function parsePersistenceEnvelope(
  data: unknown
): { success: true; envelope: StackPersistenceEnvelope } | { success: false; error: string } {
  const result = StackPersistenceEnvelopeZ.safeParse(data);
  if (result.success) {
    return { success: true, envelope: result.data };
  }
  return {
    success: false,
    error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
  };
}

// ============================================================================
// ITEM DECISION HELPERS
// ============================================================================

/**
 * Get the decision for a practice item
 */
export function getItemDecision(
  stack: PracticeStack,
  areaId: string,
  itemId: string
): ItemDecision | undefined {
  const itemKey = `${areaId}:${itemId}`;
  const record = stack.itemDecisions?.find((d) => d.itemKey === itemKey);
  return record?.decision;
}

/**
 * Set an item decision
 */
export function setItemDecision(
  stack: PracticeStack,
  areaId: string,
  itemId: string,
  decision: ItemDecision
): PracticeStack {
  const itemKey = `${areaId}:${itemId}`;
  const existingIndex = (stack.itemDecisions || []).findIndex((d) => d.itemKey === itemKey);

  const newRecord: ItemDecisionRecord = {
    itemKey,
    decision,
    setAt: new Date().toISOString(),
  };

  let newDecisions: ItemDecisionRecord[];
  if (existingIndex >= 0) {
    newDecisions = [...(stack.itemDecisions || [])];
    newDecisions[existingIndex] = newRecord;
  } else {
    newDecisions = [...(stack.itemDecisions || []), newRecord];
  }

  return {
    ...stack,
    itemDecisions: newDecisions,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Clear an item decision
 */
export function clearItemDecision(
  stack: PracticeStack,
  areaId: string,
  itemId: string
): PracticeStack {
  const itemKey = `${areaId}:${itemId}`;
  return {
    ...stack,
    itemDecisions: (stack.itemDecisions || []).filter((d) => d.itemKey !== itemKey),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get all items with a specific decision
 */
export function getItemsByDecision(
  stack: PracticeStack,
  decision: ItemDecision
): string[] {
  return (stack.itemDecisions || [])
    .filter((d) => d.decision === decision)
    .map((d) => d.itemKey);
}
