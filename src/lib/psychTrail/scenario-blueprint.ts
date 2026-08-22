import type { ScenarioV2, Objective, RouteDefinition, Challenge, NodeV2, ChoiceV2, EndingV2, ScoringConfig, ScoreCategory, ObjectiveType, ChoiceStyle, RiskLevel, EndingQuality, Grade, MasteryTier } from "./types-v2";

export const BLUEPRINT_TARGETS = {
  routes: { min: 4, max: 6, hiddenMin: 1 },
  objectives: { primaryMin: 2, primaryMax: 4, hiddenMin: 1, hiddenMax: 2 },
  challenges: { min: 2, max: 3 },
  runLength: { minSteps: 3, maxSteps: 8, idealSteps: 5 },
  endings: { positiveMin: 1, mixedMin: 1, negativeMin: 1 },
  nodes: { min: 8, max: 15 },
  choicesPerNode: { min: 2, max: 4 },
  mastery: {
    bronze: "First completion",
    silver: "2+ stars, 50% routes, 1 primary objective",
    gold: "3 stars, 75% routes, 2+ objectives, 1 challenge",
    platinum: "100% routes, all objectives, all challenges, S/A grade",
  },
  rewardCadence: {
    completion: 50,
    positiveEnding: 100,
    mixedEnding: 50,
    negativeEnding: 25,
    objectivePrimary: 50,
    objectiveHidden: 100,
    routeVisible: 50,
    routeHidden: 100,
    firstClear: 100,
    challengeMultiplier: { easy: 1.5, hard: 2.0, extreme: 2.5 },
  },
};

export interface ScenarioBlueprint {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  category: string;
  packId: string;
  metricsTemplate: { key: string; label: string; initial: number }[];
  objectivesTemplate: { type: ObjectiveType; title: string; hint: string }[];
  routesTemplate: { name: string; isHidden: boolean; hint: string }[];
  challengesTemplate: { title: string; description: string; difficulty: "easy" | "hard" | "extreme" }[];
  endingsTemplate: { title: string; quality: EndingQuality; grade: Grade }[];
  llmContext: string;
  coachingFocus: string[];
}

export function createScenarioFromBlueprint(bp: ScenarioBlueprint): Partial<ScenarioV2> {
  return {
    id: bp.id,
    version: "2.0.0",
    title: bp.title,
    summary: bp.summary,
    tags: bp.tags,
    difficulty: bp.difficulty,
    estimatedMinutes: bp.estimatedMinutes,
    icon: "circle",
    category: bp.category as any,
    packIds: [bp.packId],
    unlockRequirements: [{ type: "always" }],
    timeConfig: { stepLabel: "moment", stepLabelPlural: "moments", maxSteps: 10 },
    uiConfig: {
      metrics: bp.metricsTemplate.map((m) => ({ key: m.key, label: m.label, min: 0, max: 100, higherIsBetter: true })),
      showTimeline: true,
      showEventLog: false,
      themeColor: "#3b82f6",
    },
    initialMetrics: Object.fromEntries(bp.metricsTemplate.map((m) => [m.key, m.initial])),
    initialFlags: {},
    scoringConfig: {
      completionBase: 50,
      categoryWeights: { directness: 1.5, persistence: 1.3, recovery: 1.2, exploration: 1.0, clarity: 1.0, resilience: 1.0 },
      positiveEndingBonus: 75,
      mixedEndingBonus: 25,
      negativeEndingBonus: 0,
      objectiveBonus: 50,
      routeDiscoveryBonus: 50,
      hiddenRouteBonus: 100,
      firstClearBonus: 100,
      gradeThresholds: { S: 95, A: 80, B: 65, C: 50, D: 35 },
      maxScoreEstimate: 400,
    },
    objectives: bp.objectivesTemplate.map((o, i) => ({
      id: `obj_${i}`,
      type: o.type,
      title: o.title,
      description: o.hint,
      condition: { type: "reach-ending-quality" as const, quality: "positive" as const },
      showPreRun: o.type === "primary",
      showInRun: o.type === "primary",
      revealOnComplete: o.type === "hidden",
      reward: { xpBonus: o.type === "hidden" ? 100 : 50, starBonus: o.type === "primary" ? 1 : 0, achievementId: null },
    })),
    routes: bp.routesTemplate.map((r, i) => ({
      id: `route_${i}`,
      name: r.name,
      description: r.hint,
      identifiedBy: { type: "ending" as const, endingId: `ending_${i}` },
      isHidden: r.isHidden,
      isRecovery: false,
      discoveryHint: r.isHidden ? r.hint : null,
      discoveryReward: { xpBonus: r.isHidden ? 100 : 50, achievementId: null },
      mechanismSignature: { positive: [], negative: [] },
      associatedPatterns: { positive: [], negative: [] },
      transferMapping: null,
    })),
    challenges: bp.challengesTemplate.map((c, i) => ({
      id: `challenge_${i}`,
      title: c.title,
      description: c.description,
      unlockRequirements: [{ type: "scenario-complete" as const, scenarioId: bp.id }],
      modifiers: [],
      xpMultiplier: c.difficulty === "easy" ? 1.5 : c.difficulty === "hard" ? 2.0 : 2.5,
      masteryCredit: c.difficulty === "extreme" ? "platinum" as const : "gold" as const,
      achievementId: null,
      targetMechanisms: [],
      targetPatterns: { trains: [], prevents: [] },
      transferFocus: null,
    })),
    endings: bp.endingsTemplate.map((e, i) => ({
      id: `ending_${i}`,
      title: e.title,
      text: "",
      quality: e.quality,
      grade: e.grade,
      rewards: { xpBase: e.quality === "positive" ? 100 : e.quality === "mixed" ? 50 : 25, masteryCredits: e.quality === "positive" ? 3 : 1, achievementTriggers: [] },
      routeType: "main" as const,
      starContribution: { baseStars: (e.quality === "positive" ? 2 : e.quality === "mixed" ? 1 : 0) as 0 | 1 | 2 | 3, requiresObjectives: [] },
      mechanismOutcomes: {} as any,
      patternOutcomes: { positive: [], negative: [] },
      transferPrompts: { default: "", byPattern: {} as any, byRoute: {} },
      reflectionPrompts: [],
      smallestBetterMove: null,
    })),
    nodes: [],
    choices: [],
    events: [],
    skillSignals: [],
    llmHints: { scenarioContext: bp.llmContext, coachingFocus: bp.coachingFocus, debriefPrompts: [], mechanismCoaching: {} as any, patternCoaching: {} as any },
    stuckMoment: { description: "", domain: "other" as any, trigger: "", internalExperience: "" },
    primaryMechanisms: [],
    secondaryMechanisms: [],
    realWorldAnalogs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const DINING_HALL_BLUEPRINT: ScenarioBlueprint = {
  id: "dining_hall",
  title: "Dining Hall",
  summary: "Practice low-stakes social exposure in a crowded dining hall",
  tags: ["social-anxiety", "college", "exposure", "small-talk"],
  difficulty: "beginner",
  estimatedMinutes: 8,
  category: "life-event",
  packId: "social-anxiety-fundamentals",
  metricsTemplate: [
    { key: "preparedness", label: "Preparedness", initial: 30 },
    { key: "comfort", label: "Comfort", initial: 20 },
    { key: "communication", label: "Communication", initial: 40 },
  ],
  objectivesTemplate: [
    { type: "primary", title: "Reach a Positive Ending", hint: "Navigate to a positive outcome" },
    { type: "primary", title: "Stay Through the Meal", hint: "Don't bail before sitting down" },
    { type: "primary", title: "Ask a Follow-Up Question", hint: "Go beyond 'is this seat taken?'" },
    { type: "hidden", title: "The Comeback", hint: "Return and succeed after bailing" },
  ],
  routesTemplate: [
    { name: "Direct & Confident", isHidden: false, hint: "Planned, grounded, direct approach" },
    { name: "Safe But Present", isHidden: false, hint: "Used safety behaviors but stayed" },
    { name: "Mind-Reading Trap", isHidden: false, hint: "Interpreted neutral as rejection" },
    { name: "Avoidance Loop", isHidden: false, hint: "Bailed before completing" },
    { name: "The Comeback", isHidden: true, hint: "What if you give yourself a second chance?" },
  ],
  challengesTemplate: [
    { title: "No Phone Shield", description: "Complete without using phone as safety behavior", difficulty: "hard" },
    { title: "Quick Confidence", description: "Reach positive ending in 4 steps with A grade", difficulty: "extreme" },
  ],
  endingsTemplate: [
    { title: "Confident Step", quality: "positive", grade: "A" },
    { title: "Mixed But Moving", quality: "mixed", grade: "C" },
    { title: "Avoidance Loop", quality: "negative", grade: "F" },
  ],
  llmContext: "College student with social anxiety navigating dining hall. Core challenge: asking 'is this seat taken?' and tolerating the moment.",
  coachingFocus: ["neutral vs negative responses", "safety behaviors vs direct engagement", "recovery after avoidance", "small talk as practice"],
};

export const CHOICE_STYLE_SCORING: Record<ChoiceStyle, { primary: ScoreCategory; secondary?: ScoreCategory; basePoints: number }> = {
  direct: { primary: "directness", secondary: "persistence", basePoints: 25 },
  indirect: { primary: "persistence", secondary: "resilience", basePoints: 10 },
  recovery: { primary: "recovery", secondary: "persistence", basePoints: 40 },
  avoidant: { primary: "persistence", basePoints: -15 },
  exploratory: { primary: "exploration", secondary: "directness", basePoints: 20 },
  supportive: { primary: "clarity", secondary: "resilience", basePoints: 15 },
};

export const RISK_SCORE_MODIFIER: Record<RiskLevel, number> = {
  safe: 0,
  moderate: 5,
  bold: 10,
};

export function calculateChoiceScoreEffects(style: ChoiceStyle, risk: RiskLevel): { category: ScoreCategory; points: number; reason: string }[] {
  const config = CHOICE_STYLE_SCORING[style];
  const effects: { category: ScoreCategory; points: number; reason: string }[] = [];
  const modifier = RISK_SCORE_MODIFIER[risk];
  effects.push({ category: config.primary, points: config.basePoints + modifier, reason: `${style} approach` });
  if (config.secondary) {
    effects.push({ category: config.secondary, points: Math.round((config.basePoints + modifier) * 0.5), reason: `${risk} risk` });
  }
  return effects;
}
