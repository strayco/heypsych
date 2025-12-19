/**
 * Psych Trail - Zod Schemas
 *
 * Runtime validation schemas for scenario pack files.
 * Used at build/dev time to catch errors early.
 */

import { z } from "zod";

// ============================================================================
// Metadata & Configuration
// ============================================================================

const ScenarioCategorySchema = z.enum([
  "condition",
  "medication",
  "therapy",
  "life-event",
  "system",
  "other",
]);

const ScenarioDifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

const MetricDefinitionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  higherIsBetter: z.boolean().optional(),
});

const InventoryDefinitionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().optional(),
  unit: z.string().optional(),
});

const TimeConfigSchema = z.object({
  stepLabel: z.string().min(1),
  stepLabelPlural: z.string().min(1),
  maxSteps: z.number().int().positive().optional(),
});

const UIConfigSchema = z.object({
  metrics: z.array(MetricDefinitionSchema).min(1),
  inventory: z.array(InventoryDefinitionSchema).optional(),
  showTimeline: z.boolean().optional(),
  showEventLog: z.boolean().optional(),
  themeColor: z.string().optional(),
});

// ============================================================================
// Conditions
// ============================================================================

const ConditionSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("flag"),
      flag: z.string().min(1),
      value: z.boolean(),
    }),
    z.object({
      type: z.literal("metric"),
      metric: z.string().min(1),
      operator: z.enum([">", "<", ">=", "<=", "=="]),
      value: z.number(),
    }),
    z.object({
      type: z.literal("inventory"),
      item: z.string().min(1),
      operator: z.enum([">", "<", ">=", "<=", "=="]),
      value: z.number(),
    }),
    z.object({
      type: z.literal("step"),
      operator: z.enum([">", "<", ">=", "<=", "=="]),
      value: z.number().int().nonnegative(),
    }),
    z.object({
      type: z.literal("and"),
      conditions: z.array(ConditionSchema).min(1),
    }),
    z.object({
      type: z.literal("or"),
      conditions: z.array(ConditionSchema).min(1),
    }),
    z.object({
      type: z.literal("not"),
      condition: ConditionSchema,
    }),
  ])
);

// ============================================================================
// Effects
// ============================================================================

const EffectSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("metric"),
    metric: z.string().min(1),
    change: z.number(),
  }),
  z.object({
    type: z.literal("metric-set"),
    metric: z.string().min(1),
    value: z.number(),
  }),
  z.object({
    type: z.literal("flag"),
    flag: z.string().min(1),
    value: z.boolean(),
  }),
  z.object({
    type: z.literal("inventory"),
    item: z.string().min(1),
    change: z.number(),
  }),
  z.object({
    type: z.literal("inventory-set"),
    item: z.string().min(1),
    value: z.number(),
  }),
  z.object({
    type: z.literal("end"),
    endingId: z.string().min(1),
  }),
]);

// ============================================================================
// Scenario Content
// ============================================================================

const NodeSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  choiceIds: z.array(z.string()),
  isEnding: z.boolean().optional(),
});

const ChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  description: z.string().optional(),
  resultText: z.string().optional(),
  condition: ConditionSchema.optional(),
  effects: z.array(EffectSchema),
  nextNodeId: z.string().min(1),
  advancesTime: z.boolean().optional(),
});

const GameEventSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  probability: z.number().min(0).max(1),
  condition: ConditionSchema.optional(),
  effects: z.array(EffectSchema),
});

const EndingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  isPositive: z.boolean().optional(),
});

// ============================================================================
// Complete Scenario Pack
// ============================================================================

export const ScenarioSchema = z.object({
  // Metadata
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  category: ScenarioCategorySchema,
  tags: z.array(z.string()),
  version: z.string().min(1),
  reviewedBy: z.string().optional(),
  updatedAt: z.string().datetime(),
  difficulty: ScenarioDifficultySchema.optional(),
  estimatedMinutes: z.number().int().positive().optional(),

  // Configuration
  timeConfig: TimeConfigSchema,
  uiConfig: UIConfigSchema,

  // Initial State
  startNodeId: z.string().min(1),
  initialMetrics: z.record(z.string(), z.number()),
  initialFlags: z.record(z.string(), z.boolean()),
  initialInventory: z.record(z.string(), z.number()).optional(),

  // Content
  nodes: z.array(NodeSchema).min(1),
  choices: z.array(ChoiceSchema),
  events: z.array(GameEventSchema),
  endings: z.array(EndingSchema).min(1),
});

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a scenario and return detailed errors
 */
export function validateScenario(scenario: unknown): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Schema validation
  const result = ScenarioSchema.safeParse(scenario);
  if (!result.success) {
    errors.push(...result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`));
    return { valid: false, errors, warnings };
  }

  const s = result.data;

  // Structural validation
  const nodeIds = new Set(s.nodes.map((n) => n.id));
  const choiceIds = new Set(s.choices.map((c) => c.id));
  const eventIds = new Set(s.events.map((e) => e.id));
  const endingIds = new Set(s.endings.map((e) => e.id));
  const metricKeys = new Set(s.uiConfig.metrics.map((m) => m.key));
  const inventoryKeys = new Set(s.uiConfig.inventory?.map((i) => i.key) || []);

  // Check startNodeId exists
  if (!nodeIds.has(s.startNodeId)) {
    errors.push(`startNodeId "${s.startNodeId}" does not exist in nodes`);
  }

  // Check all node choiceIds exist
  s.nodes.forEach((node) => {
    node.choiceIds.forEach((cid) => {
      if (!choiceIds.has(cid)) {
        errors.push(`Node "${node.id}" references non-existent choice "${cid}"`);
      }
    });
  });

  // Check all choice nextNodeIds exist
  s.choices.forEach((choice) => {
    if (!nodeIds.has(choice.nextNodeId)) {
      errors.push(`Choice "${choice.id}" leads to non-existent node "${choice.nextNodeId}"`);
    }
  });

  // Check all "end" effects reference valid endings
  [...s.choices, ...s.events].forEach((item) => {
    item.effects.forEach((effect) => {
      if (effect.type === "end" && !endingIds.has(effect.endingId)) {
        errors.push(`Effect in "${item.id}" references non-existent ending "${effect.endingId}"`);
      }
    });
  });

  // Check that metrics used in initial state match UI config
  Object.keys(s.initialMetrics).forEach((key) => {
    if (!metricKeys.has(key)) {
      warnings.push(`Initial metric "${key}" has no UI definition in uiConfig.metrics`);
    }
  });

  // Check that inventory used in initial state match UI config (if inventory is enabled)
  if (s.initialInventory) {
    Object.keys(s.initialInventory).forEach((key) => {
      if (!inventoryKeys.has(key)) {
        warnings.push(`Initial inventory "${key}" has no UI definition in uiConfig.inventory`);
      }
    });
  }

  // Warnings: detect dead ends (nodes with no choices and not marked as ending)
  s.nodes.forEach((node) => {
    if (node.choiceIds.length === 0 && !node.isEnding) {
      warnings.push(
        `Node "${node.id}" has no choices and is not marked as ending (potential dead end)`
      );
    }
  });

  // Warnings: detect unreachable nodes (simple check)
  const reachableNodes = new Set<string>();
  const visitQueue = [s.startNodeId];
  const visited = new Set<string>();

  while (visitQueue.length > 0) {
    const nodeId = visitQueue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    reachableNodes.add(nodeId);

    const node = s.nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    node.choiceIds.forEach((cid) => {
      const choice = s.choices.find((c) => c.id === cid);
      if (choice && !visited.has(choice.nextNodeId)) {
        visitQueue.push(choice.nextNodeId);
      }
    });
  }

  s.nodes.forEach((node) => {
    if (!reachableNodes.has(node.id)) {
      warnings.push(`Node "${node.id}" appears to be unreachable from start node`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Export schemas for use elsewhere
export {
  ConditionSchema,
  EffectSchema,
  NodeSchema,
  ChoiceSchema,
  GameEventSchema,
  EndingSchema,
  MetricDefinitionSchema,
  InventoryDefinitionSchema,
  TimeConfigSchema,
  UIConfigSchema,
};
