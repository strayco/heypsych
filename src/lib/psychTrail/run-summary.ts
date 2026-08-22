import type { ScenarioV2, RunStateV2, EndingV2, RunScoreResult, ObjectiveResult, RouteDetectionResult, Challenge, StructuredRunSummary, MasteryTier, MechanismRunScore, PatternDetection, MechanismFeedback, PatternFeedback, SmallestBetterMove, InterpretationResult } from "./types-v2";
import { MECHANISMS, PATTERN_DEFINITIONS, getMechanismStrength, getMechanismDemonstrated, type MechanismId, type PatternId, type MechanismStrength } from "./clinical-constants";
import { generateInterpretation } from "./interpretation-engine";

export function generateRunSummary(
  scenario: ScenarioV2,
  state: RunStateV2,
  ending: EndingV2,
  score: RunScoreResult,
  objectives: ObjectiveResult[],
  route: RouteDetectionResult,
  masteryBefore: MasteryTier,
  masteryAfter: MasteryTier,
  isPersonalBest: boolean,
  attemptNumber: number,
  challenge: Challenge | null,
  challengeCompleted: boolean
): StructuredRunSummary {
  const choiceTexts = state.choiceSequence.map((cid) => scenario.choices.find((c) => c.id === cid)?.text || cid);
  const completedObjectives = objectives.filter((o) => o.completed).map((o) => ({ id: o.objective.id, title: o.objective.title }));
  const failedObjectives = objectives.filter((o) => !o.completed && o.objective.type !== "hidden").map((o) => ({ id: o.objective.id, title: o.objective.title }));
  const flagsSet = Object.entries(state.flags).filter(([, v]) => v).map(([k]) => k);

  // Calculate mechanism scores from choices
  const mechanismScores = calculateMechanismScores(scenario, state, ending);
  
  // Detect patterns from choices and ending
  const patternsDetected = detectPatterns(scenario, state, ending);
  
  // Get transfer prompt
  const transferPrompt = getTransferPrompt(ending, route.routeId, patternsDetected);
  
  // Get reflection prompts from ending
  const reflectionPrompts = ending.reflectionPrompts || [];
  
  // Generate mechanism feedback
  const mechanismFeedback = generateMechanismFeedback(scenario, mechanismScores);
  
  // Generate pattern feedback
  const patternFeedback = generatePatternFeedback(scenario, patternsDetected);

  // Generate interpretation
  const interpretation = generateInterpretation(
    scenario,
    state,
    route.routeId,
    ending.id
  );

  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    scenarioSummary: scenario.summary,
    scenarioTags: scenario.tags,
    nodeSequence: state.nodeSequence,
    choiceSequence: state.choiceSequence,
    choiceTexts,
    endingId: ending.id,
    endingTitle: ending.title,
    endingQuality: ending.quality,
    endingText: ending.text,
    totalScore: score.totalScore,
    categoryScores: score.categoryScores,
    grade: score.grade,
    objectivesCompleted: completedObjectives,
    objectivesFailed: failedObjectives,
    routeId: route.routeId,
    routeName: route.routeName,
    isNewRoute: route.isNewDiscovery,
    isHiddenRoute: route.isHidden,
    challengeId: challenge?.id || null,
    challengeTitle: challenge?.title || null,
    challengeCompleted,
    isPersonalBest,
    attemptNumber,
    masteryTierBefore: masteryBefore,
    masteryTierAfter: masteryAfter,
    finalMetrics: state.metrics,
    flagsSet,
    llmHints: scenario.llmHints,
    
    // Clinical extensions
    mechanismScores,
    patternsDetected,
    transferPrompt,
    reflectionPrompts,
    mechanismFeedback,
    patternFeedback,
    smallestBetterMove: ending.smallestBetterMove,

    // Interpretation layer
    interpretation,
  };
}

function calculateMechanismScores(scenario: ScenarioV2, state: RunStateV2, ending: EndingV2): MechanismRunScore[] {
  const mechanismDeltas: Record<string, number> = {};
  
  // Initialize with zeros for primary mechanisms
  for (const mech of scenario.primaryMechanisms || []) {
    mechanismDeltas[mech] = 0;
  }
  for (const mech of scenario.secondaryMechanisms || []) {
    mechanismDeltas[mech] = 0;
  }

  // Sum up deltas from chosen choices
  for (const choiceId of state.choiceSequence) {
    const choice = scenario.choices.find(c => c.id === choiceId);
    if (choice?.mechanismEffects) {
      for (const effect of choice.mechanismEffects) {
        if (mechanismDeltas[effect.mechanism] !== undefined) {
          mechanismDeltas[effect.mechanism] += effect.delta;
        } else {
          mechanismDeltas[effect.mechanism] = effect.delta;
        }
      }
    }
  }

  // Convert to scores with ending outcomes as override
  const scores: MechanismRunScore[] = [];
  for (const mechId of Object.keys(mechanismDeltas) as MechanismId[]) {
    const endingOutcome = ending.mechanismOutcomes?.[mechId];
    if (endingOutcome) {
      scores.push({
        mechanism: mechId,
        rawScore: mechanismDeltas[mechId],
        normalizedScore: strengthToScore(endingOutcome.strength),
        demonstrated: endingOutcome.demonstrated,
        strength: endingOutcome.strength,
      });
    } else {
      const normalizedScore = normalizeScore(mechanismDeltas[mechId]);
      const strength = getMechanismStrength(normalizedScore);
      scores.push({
        mechanism: mechId,
        rawScore: mechanismDeltas[mechId],
        normalizedScore,
        demonstrated: getMechanismDemonstrated(strength),
        strength,
      });
    }
  }

  return scores;
}

function strengthToScore(strength: MechanismStrength): number {
  switch (strength) {
    case "strong": return 85;
    case "partial": return 55;
    case "weak": return 30;
    case "absent": return 10;
  }
}

function normalizeScore(delta: number): number {
  // Map delta to 0-100 scale. Assume typical range is -50 to +50
  return Math.max(0, Math.min(100, 50 + delta));
}

function detectPatterns(scenario: ScenarioV2, state: RunStateV2, ending: EndingV2): PatternDetection[] {
  const patterns: PatternDetection[] = [];
  const seenPatterns = new Set<PatternId>();

  // Collect patterns from choices
  for (const choiceId of state.choiceSequence) {
    const choice = scenario.choices.find(c => c.id === choiceId);
    if (choice?.patternTags) {
      for (const tag of choice.patternTags) {
        if (!seenPatterns.has(tag)) {
          seenPatterns.add(tag);
          patterns.push({
            pattern: tag,
            valence: PATTERN_DEFINITIONS[tag]?.valence || "negative",
            contributingChoices: [choiceId],
            contributingFlags: [],
          });
        } else {
          const existing = patterns.find(p => p.pattern === tag);
          if (existing) {
            existing.contributingChoices.push(choiceId);
          }
        }
      }
    }
  }

  // Add patterns from ending
  if (ending.patternOutcomes) {
    for (const pat of ending.patternOutcomes.positive) {
      if (!seenPatterns.has(pat)) {
        seenPatterns.add(pat);
        patterns.push({
          pattern: pat,
          valence: "positive",
          contributingChoices: [],
          contributingFlags: [],
        });
      }
    }
    for (const pat of ending.patternOutcomes.negative) {
      if (!seenPatterns.has(pat)) {
        seenPatterns.add(pat);
        patterns.push({
          pattern: pat,
          valence: "negative",
          contributingChoices: [],
          contributingFlags: [],
        });
      }
    }
  }

  return patterns;
}

function getTransferPrompt(ending: EndingV2, routeId: string | null, patterns: PatternDetection[]): string {
  // First check for route-specific transfer
  if (routeId && ending.transferPrompts?.byRoute?.[routeId]) {
    return ending.transferPrompts.byRoute[routeId];
  }

  // Then check for pattern-specific transfer
  for (const pattern of patterns) {
    if (ending.transferPrompts?.byPattern?.[pattern.pattern]) {
      return ending.transferPrompts.byPattern[pattern.pattern];
    }
  }

  // Fall back to default
  return ending.transferPrompts?.default || "";
}

function generateMechanismFeedback(scenario: ScenarioV2, scores: MechanismRunScore[]): MechanismFeedback[] {
  const feedback: MechanismFeedback[] = [];

  for (const mechScore of scores) {
    const coaching = scenario.llmHints?.mechanismCoaching?.[mechScore.mechanism];
    if (coaching) {
      const message = mechScore.strength === "strong" || mechScore.strength === "partial" 
        ? coaching.whenStrong 
        : coaching.whenWeak;
      feedback.push({
        mechanism: mechScore.mechanism,
        strength: mechScore.strength,
        message,
        practiceHint: mechScore.demonstrated ? null : coaching.practiceHint,
      });
    }
  }

  return feedback;
}

function generatePatternFeedback(scenario: ScenarioV2, patterns: PatternDetection[]): PatternFeedback[] {
  const feedback: PatternFeedback[] = [];

  for (const pattern of patterns) {
    const coaching = scenario.llmHints?.patternCoaching?.[pattern.pattern];
    if (coaching) {
      feedback.push({
        pattern: pattern.pattern,
        valence: pattern.valence,
        message: coaching.detected,
        nextStep: coaching.nextStep,
      });
    }
  }

  return feedback;
}
