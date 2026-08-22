import { z } from "zod";

export const ScoreCategorySchema = z.enum(["directness", "persistence", "recovery", "exploration", "clarity", "resilience"]);
export const GradeSchema = z.enum(["S", "A", "B", "C", "D", "F"]);
export const MasteryTierSchema = z.enum(["none", "bronze", "silver", "gold", "platinum"]);
export const RankSchema = z.enum(["novice", "apprentice", "practitioner", "adept", "expert", "master", "grandmaster"]);
export const PackCategorySchema = z.enum(["starter", "themed", "life-stage", "challenge", "premium"]);
export const ScenarioDifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);
export const ScenarioCategorySchema = z.enum(["condition", "medication", "therapy", "life-event", "system", "other"]);
export const ObjectiveTypeSchema = z.enum(["primary", "challenge", "hidden"]);
export const ChoiceStyleSchema = z.enum(["direct", "indirect", "recovery", "avoidant", "exploratory", "supportive"]);
export const RiskLevelSchema = z.enum(["safe", "moderate", "bold"]);
export const EndingQualitySchema = z.enum(["positive", "mixed", "negative"]);
export const EndingRouteTypeSchema = z.enum(["main", "alternate", "hidden"]);
export const NodePresentationTypeSchema = z.enum(["narrative", "thought", "dialogue", "flashback", "action"]);
export const NodeMoodSchema = z.enum(["neutral", "tense", "hopeful", "anxious", "calm", "confident"]);
export const NodePacingSchema = z.enum(["normal", "fast", "slow"]);
export const ComparisonOperatorSchema = z.enum([">", "<", ">=", "<=", "=="]);

export const UnlockRequirementSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("always") }),
    z.object({ type: z.literal("scenario-complete"), scenarioId: z.string() }),
    z.object({ type: z.literal("scenario-mastery"), scenarioId: z.string(), minTier: MasteryTierSchema }),
    z.object({ type: z.literal("pack-complete"), packId: z.string() }),
    z.object({ type: z.literal("pack-mastery"), packId: z.string(), minTier: MasteryTierSchema }),
    z.object({ type: z.literal("total-stars"), count: z.number().int().positive() }),
    z.object({ type: z.literal("total-scenarios"), count: z.number().int().positive() }),
    z.object({ type: z.literal("achievement"), achievementId: z.string() }),
    z.object({ type: z.literal("all-of"), requirements: z.array(UnlockRequirementSchema) }),
    z.object({ type: z.literal("any-of"), requirements: z.array(UnlockRequirementSchema) }),
  ])
);

export const ScoringConfigSchema = z.object({
  completionBase: z.number(),
  categoryWeights: z.object({
    directness: z.number(),
    persistence: z.number(),
    recovery: z.number(),
    exploration: z.number(),
    clarity: z.number(),
    resilience: z.number(),
  }),
  positiveEndingBonus: z.number(),
  mixedEndingBonus: z.number(),
  negativeEndingBonus: z.number(),
  objectiveBonus: z.number(),
  routeDiscoveryBonus: z.number(),
  hiddenRouteBonus: z.number(),
  firstClearBonus: z.number(),
  gradeThresholds: z.object({ S: z.number(), A: z.number(), B: z.number(), C: z.number(), D: z.number() }),
  maxScoreEstimate: z.number(),
});

export const ObjectiveConditionSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("reach-ending"), endingId: z.string() }),
    z.object({ type: z.literal("reach-ending-quality"), quality: EndingQualitySchema }),
    z.object({ type: z.literal("reach-node"), nodeId: z.string() }),
    z.object({ type: z.literal("choice-made"), choiceId: z.string() }),
    z.object({ type: z.literal("choice-avoided"), choiceId: z.string() }),
    z.object({ type: z.literal("flag-set"), flag: z.string(), value: z.boolean() }),
    z.object({ type: z.literal("metric-threshold"), metric: z.string(), operator: ComparisonOperatorSchema, value: z.number() }),
    z.object({ type: z.literal("steps-under"), maxSteps: z.number().int().positive() }),
    z.object({ type: z.literal("route-taken"), routeId: z.string() }),
    z.object({ type: z.literal("all-of"), conditions: z.array(ObjectiveConditionSchema) }),
    z.object({ type: z.literal("any-of"), conditions: z.array(ObjectiveConditionSchema) }),
    z.object({ type: z.literal("none-of"), conditions: z.array(ObjectiveConditionSchema) }),
  ])
);

export const ObjectiveRewardSchema = z.object({ xpBonus: z.number(), starBonus: z.number(), achievementId: z.string().nullable() });

export const ObjectiveSchema = z.object({
  id: z.string(),
  type: ObjectiveTypeSchema,
  title: z.string(),
  description: z.string(),
  condition: ObjectiveConditionSchema,
  showPreRun: z.boolean(),
  showInRun: z.boolean(),
  revealOnComplete: z.boolean(),
  reward: ObjectiveRewardSchema,
});

export const RouteIdentifierSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ending"), endingId: z.string() }),
  z.object({ type: z.literal("choice-sequence"), choiceIds: z.array(z.string()) }),
  z.object({ type: z.literal("choice-includes"), choiceId: z.string() }),
  z.object({ type: z.literal("node-sequence"), nodeIds: z.array(z.string()) }),
  z.object({ type: z.literal("flag-combination"), flags: z.record(z.string(), z.boolean()) }),
]);

export const RouteDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  identifiedBy: RouteIdentifierSchema,
  isHidden: z.boolean(),
  discoveryHint: z.string().nullable(),
  discoveryReward: z.object({ xpBonus: z.number(), achievementId: z.string().nullable() }),
});

export const ChallengeModifierSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("forbid-choices"), choiceIds: z.array(z.string()) }),
  z.object({ type: z.literal("forbid-style"), styles: z.array(ChoiceStyleSchema) }),
  z.object({ type: z.literal("require-ending-grade"), minGrade: GradeSchema }),
  z.object({ type: z.literal("max-steps"), steps: z.number().int().positive() }),
  z.object({ type: z.literal("require-route"), routeId: z.string() }),
  z.object({ type: z.literal("require-objectives"), objectiveIds: z.array(z.string()) }),
]);

export const ChallengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  unlockRequirements: z.array(UnlockRequirementSchema),
  modifiers: z.array(ChallengeModifierSchema),
  xpMultiplier: z.number(),
  masteryCredit: MasteryTierSchema,
  achievementId: z.string().nullable(),
});

export const NodePresentationSchema = z.object({ type: NodePresentationTypeSchema, mood: NodeMoodSchema, pacing: NodePacingSchema });
export const ObjectiveTriggerSchema = z.object({ objectiveId: z.string(), action: z.enum(["progress", "complete", "fail"]) });

export const NodeV2Schema = z.object({
  id: z.string(),
  text: z.string(),
  choiceIds: z.array(z.string()),
  isEnding: z.boolean().default(false),
  presentation: NodePresentationSchema,
  routeMarkers: z.array(z.string()).default([]),
  objectiveTriggers: z.array(ObjectiveTriggerSchema).default([]),
  isCheckpoint: z.boolean().default(false),
});

export const ConditionV2Schema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("flag"), flag: z.string(), value: z.boolean() }),
    z.object({ type: z.literal("metric"), metric: z.string(), operator: ComparisonOperatorSchema, value: z.number() }),
    z.object({ type: z.literal("inventory"), item: z.string(), operator: ComparisonOperatorSchema, value: z.number() }),
    z.object({ type: z.literal("step"), operator: ComparisonOperatorSchema, value: z.number() }),
    z.object({ type: z.literal("and"), conditions: z.array(ConditionV2Schema) }),
    z.object({ type: z.literal("or"), conditions: z.array(ConditionV2Schema) }),
    z.object({ type: z.literal("not"), condition: ConditionV2Schema }),
  ])
);

export const EffectV2Schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("metric"), metric: z.string(), change: z.number() }),
  z.object({ type: z.literal("metric-set"), metric: z.string(), value: z.number() }),
  z.object({ type: z.literal("flag"), flag: z.string(), value: z.boolean() }),
  z.object({ type: z.literal("inventory"), item: z.string(), change: z.number() }),
  z.object({ type: z.literal("inventory-set"), item: z.string(), value: z.number() }),
  z.object({ type: z.literal("end"), endingId: z.string() }),
]);

export const ScoreEffectSchema = z.object({ category: ScoreCategorySchema, points: z.number(), reason: z.string() });
export const ObjectiveEffectSchema = z.object({ objectiveId: z.string(), action: z.enum(["progress", "complete", "fail"]) });
export const SkillSignalSchema = z.object({ skill: z.string(), strength: z.number() });

export const ChoiceV2Schema = z.object({
  id: z.string(),
  text: z.string(),
  description: z.string().default(""),
  resultText: z.string().default(""),
  condition: ConditionV2Schema.nullable().default(null),
  effects: z.array(EffectV2Schema),
  nextNodeId: z.string().nullable().default(null),
  advancesTime: z.boolean().default(true),
  scoreEffects: z.array(ScoreEffectSchema).default([]),
  routeTags: z.array(z.string()).default([]),
  style: ChoiceStyleSchema.default("direct"),
  riskLevel: RiskLevelSchema.default("moderate"),
  objectiveEffects: z.array(ObjectiveEffectSchema).default([]),
  skillSignals: z.array(SkillSignalSchema).default([]),
});

export const EndingRewardsSchema = z.object({ xpBase: z.number(), masteryCredits: z.number(), achievementTriggers: z.array(z.string()).default([]) });
export const StarContributionSchema = z.object({ baseStars: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]), requiresObjectives: z.array(z.string()).default([]) });

export const EndingV2Schema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  quality: EndingQualitySchema,
  grade: GradeSchema,
  rewards: EndingRewardsSchema,
  routeType: EndingRouteTypeSchema,
  starContribution: StarContributionSchema,
});

export const GameEventV2Schema = z.object({
  id: z.string(),
  text: z.string(),
  probability: z.number().min(0).max(1),
  condition: ConditionV2Schema.nullable().default(null),
  effects: z.array(EffectV2Schema),
});

export const TimeConfigSchema = z.object({ stepLabel: z.string(), stepLabelPlural: z.string(), maxSteps: z.number().int().positive() });
export const MetricDefinitionSchema = z.object({ key: z.string(), label: z.string(), min: z.number().default(0), max: z.number().default(100), higherIsBetter: z.boolean().default(true), icon: z.string().optional() });
export const UIConfigSchema = z.object({ metrics: z.array(MetricDefinitionSchema), showTimeline: z.boolean().default(true), showEventLog: z.boolean().default(false), themeColor: z.string().default("#3b82f6") });
export const SkillSignalDefinitionSchema = z.object({ skill: z.string(), description: z.string() });
export const LLMHintsSchema = z.object({ scenarioContext: z.string(), coachingFocus: z.array(z.string()), debriefPrompts: z.array(z.string()) });

export const ScenarioV2Schema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  difficulty: ScenarioDifficultySchema,
  estimatedMinutes: z.number().int().positive(),
  icon: z.string(),
  category: ScenarioCategorySchema,
  packIds: z.array(z.string()),
  unlockRequirements: z.array(UnlockRequirementSchema),
  timeConfig: TimeConfigSchema,
  uiConfig: UIConfigSchema,
  startNodeId: z.string(),
  initialMetrics: z.record(z.string(), z.number()),
  initialFlags: z.record(z.string(), z.boolean()),
  scoringConfig: ScoringConfigSchema,
  objectives: z.array(ObjectiveSchema),
  routes: z.array(RouteDefinitionSchema),
  challenges: z.array(ChallengeSchema),
  nodes: z.array(NodeV2Schema),
  choices: z.array(ChoiceV2Schema),
  events: z.array(GameEventV2Schema),
  endings: z.array(EndingV2Schema),
  skillSignals: z.array(SkillSignalDefinitionSchema).default([]),
  llmHints: LLMHintsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PackThemeSchema = z.object({ primaryColor: z.string(), accentColor: z.string(), backgroundGradient: z.string() });
export const PackChallengeConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("all-scenarios-completed") }),
  z.object({ type: z.literal("all-scenarios-mastery"), minTier: MasteryTierSchema }),
  z.object({ type: z.literal("total-stars"), minStars: z.number().int().positive() }),
  z.object({ type: z.literal("all-routes-discovered") }),
]);
export const PackRewardSchema = z.object({ xpBonus: z.number(), achievementId: z.string().nullable() });
export const PackChallengeSchema = z.object({ id: z.string(), title: z.string(), description: z.string(), condition: PackChallengeConditionSchema, reward: PackRewardSchema });

export const PackSchema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  longDescription: z.string(),
  icon: z.string(),
  coverImage: z.string(),
  theme: PackThemeSchema,
  scenarioIds: z.array(z.string()),
  unlockRequirements: z.array(UnlockRequirementSchema),
  packChallenges: z.array(PackChallengeSchema).default([]),
  category: PackCategorySchema,
  difficulty: ScenarioDifficultySchema,
  estimatedTotalMinutes: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const BestRunSchema = z.object({
  score: z.number(),
  grade: GradeSchema,
  stars: z.number(),
  routeId: z.string().nullable(),
  objectivesCompleted: z.array(z.string()),
  challengeId: z.string().nullable(),
  timestamp: z.number(),
});

export const ScenarioProgressSchema = z.object({
  completions: z.number(),
  bestStars: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  bestGrade: GradeSchema,
  bestScore: z.number(),
  masteryTier: MasteryTierSchema,
  completedObjectives: z.array(z.string()),
  completedChallenges: z.array(z.string()),
  firstCompletedAt: z.number(),
  lastPlayedAt: z.number(),
});

export const PackProgressSchema = z.object({
  scenariosCompleted: z.number(),
  totalStars: z.number(),
  masteryTier: MasteryTierSchema,
  firstCompletedAt: z.number().nullable(),
});

export const GlobalProgressSchema = z.object({
  totalXP: z.number(),
  rank: RankSchema,
  totalRuns: z.number(),
  totalScenariosCompleted: z.number(),
  totalPacksCompleted: z.number(),
  totalRoutesDiscovered: z.number(),
  firstPlayAt: z.number(),
  lastPlayAt: z.number(),
});

export const ProgressStateSchema = z.object({
  version: z.number(),
  scenarios: z.record(z.string(), ScenarioProgressSchema),
  routes: z.record(z.string(), z.array(z.string())),
  bestRuns: z.record(z.string(), BestRunSchema),
  packs: z.record(z.string(), PackProgressSchema),
  achievements: z.array(z.string()),
  unlocks: z.object({
    scenarios: z.array(z.string()),
    packs: z.array(z.string()),
    challenges: z.record(z.string(), z.array(z.string())),
  }),
  global: GlobalProgressSchema,
  _profileId: z.string().nullable(),
});

export const StructuredRunSummarySchema = z.object({
  scenarioId: z.string(),
  scenarioTitle: z.string(),
  scenarioSummary: z.string(),
  scenarioTags: z.array(z.string()),
  nodeSequence: z.array(z.string()),
  choiceSequence: z.array(z.string()),
  choiceTexts: z.array(z.string()),
  endingId: z.string(),
  endingTitle: z.string(),
  endingQuality: EndingQualitySchema,
  endingText: z.string(),
  totalScore: z.number(),
  categoryScores: z.record(ScoreCategorySchema, z.number()),
  grade: GradeSchema,
  objectivesCompleted: z.array(z.object({ id: z.string(), title: z.string() })),
  objectivesFailed: z.array(z.object({ id: z.string(), title: z.string() })),
  routeId: z.string().nullable(),
  routeName: z.string().nullable(),
  isNewRoute: z.boolean(),
  isHiddenRoute: z.boolean(),
  challengeId: z.string().nullable(),
  challengeTitle: z.string().nullable(),
  challengeCompleted: z.boolean(),
  isPersonalBest: z.boolean(),
  attemptNumber: z.number(),
  masteryTierBefore: MasteryTierSchema,
  masteryTierAfter: MasteryTierSchema,
  finalMetrics: z.record(z.string(), z.number()),
  flagsSet: z.array(z.string()),
  llmHints: LLMHintsSchema,
});

export function validateScenarioV2(scenario: unknown): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const result = ScenarioV2Schema.safeParse(scenario);
  if (!result.success) {
    errors.push(...result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`));
    return { valid: false, errors, warnings };
  }
  const s = result.data;
  const nodeIds = new Set(s.nodes.map((n) => n.id));
  const choiceIds = new Set(s.choices.map((c) => c.id));
  const endingIds = new Set(s.endings.map((e) => e.id));
  if (!nodeIds.has(s.startNodeId)) errors.push(`startNodeId "${s.startNodeId}" does not exist`);
  s.nodes.forEach((node) => node.choiceIds.forEach((cid) => { if (!choiceIds.has(cid)) errors.push(`Node "${node.id}" references non-existent choice "${cid}"`); }));
  s.choices.forEach((choice) => {
    if (choice.nextNodeId && !nodeIds.has(choice.nextNodeId)) errors.push(`Choice "${choice.id}" leads to non-existent node`);
    const hasEnd = choice.effects.some((e) => e.type === "end");
    if (!choice.nextNodeId && !hasEnd) errors.push(`Choice "${choice.id}" has no destination`);
    choice.effects.forEach((e) => { if (e.type === "end" && !endingIds.has(e.endingId!)) errors.push(`Choice "${choice.id}" references non-existent ending`); });
  });
  return { valid: errors.length === 0, errors, warnings };
}

export function validatePack(pack: unknown): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const result = PackSchema.safeParse(pack);
  if (!result.success) {
    errors.push(...result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`));
    return { valid: false, errors, warnings };
  }
  return { valid: true, errors, warnings };
}
