import type { ScenarioV2, RunStateV2, EndingV2, Challenge, EndOfRunResult, ProgressState, Pack } from "./types-v2";
import { PsychTrailEngineV2 } from "./engine-v2";
import { ScoringEngine } from "./engines/scoring-engine";
import { RouteTracker } from "./engines/route-tracker";
import { ObjectiveEngine } from "./engines/objective-engine";
import { ChallengeEngine } from "./engines/challenge-engine";
import { MasteryEngine } from "./engines/mastery-engine";
import { AchievementEngine } from "./engines/achievement-engine";
import { UnlockEngine } from "./engines/unlock-engine";
import { RewardEngine } from "./engines/reward-engine";
import { generateRunSummary } from "./run-summary";
import { getProgressState, updateScenarioProgress, addXP, addAchievements, getDiscoveredRoutes, getBestRun, getScenarioProgress } from "./storage-v2";
import { calculateStars } from "./constants";

export class GameOrchestrator {
  private scenario: ScenarioV2;
  private engine: PsychTrailEngineV2;
  private scoring: ScoringEngine;
  private routes: RouteTracker;
  private objectives: ObjectiveEngine;
  private challenges: ChallengeEngine;
  private mastery: MasteryEngine;
  private achievements: AchievementEngine;
  private unlocks: UnlockEngine;
  private rewards: RewardEngine;

  constructor(scenario: ScenarioV2) {
    this.scenario = scenario;
    this.engine = new PsychTrailEngineV2(scenario);
    this.scoring = new ScoringEngine(scenario);
    this.routes = new RouteTracker(scenario);
    this.objectives = new ObjectiveEngine(scenario);
    this.challenges = new ChallengeEngine(scenario);
    this.mastery = new MasteryEngine(scenario);
    this.achievements = new AchievementEngine();
    this.unlocks = new UnlockEngine();
    this.rewards = new RewardEngine(scenario);
  }

  getEngine(): PsychTrailEngineV2 { return this.engine; }

  createInitialState(seed?: number, challengeId?: string): RunStateV2 {
    return this.engine.createInitialState(seed, challengeId);
  }

  processEndOfRun(state: RunStateV2, allScenarios: ScenarioV2[] = [], allPacks: Pack[] = []): EndOfRunResult {
    const ending = this.engine.getEnding(state.endingId!)!;
    const progressBefore = getProgressState();
    const scenarioProgressBefore = getScenarioProgress(this.scenario.id);
    const discoveredBefore = getDiscoveredRoutes(this.scenario.id);
    const bestBefore = getBestRun(this.scenario.id);
    const masteryBefore = scenarioProgressBefore?.masteryTier || "none";
    const isFirst = !scenarioProgressBefore || scenarioProgressBefore.completions === 0;
    const attempt = (scenarioProgressBefore?.completions || 0) + 1;

    const objResults = this.objectives.evaluateAllObjectives(state);
    const completedIds = objResults.filter((r) => r.completed).map((r) => r.objective.id);

    const routeResult = this.routes.processRouteDiscovery(state, discoveredBefore);

    const score = this.scoring.calculateRunScore(state, ending, completedIds, routeResult.isNewDiscovery, routeResult.isHidden, isFirst);

    const starsEarned = calculateStars(ending.starContribution.baseStars, ending.starContribution.requiresObjectives, completedIds);

    const challenge = this.engine.getActiveChallenge();
    let challengeCompleted = false;
    if (challenge) {
      const v = this.challenges.validate(state, challenge, score.grade);
      challengeCompleted = v.valid;
    }

    const routesAfter = routeResult.routeId && !discoveredBefore.includes(routeResult.routeId) ? [...discoveredBefore, routeResult.routeId] : discoveredBefore;

    const newMasteryTier = this.mastery.calculateTier(
      { ...scenarioProgressBefore!, bestStars: starsEarned, bestGrade: score.grade, completedObjectives: completedIds, completedChallenges: challenge && challengeCompleted ? [challenge.id] : [] } as any,
      routesAfter
    );

    const progressAfter = updateScenarioProgress(this.scenario.id, {
      stars: starsEarned,
      grade: score.grade,
      score: score.totalScore,
      masteryTier: newMasteryTier,
      completedObjectives: completedIds,
      challengeId: challenge?.id || null,
      challengeCompleted,
      routeId: routeResult.routeId,
    });

    const masteryProgress = this.mastery.getMasteryProgress(progressAfter.scenarios[this.scenario.id], routesAfter, masteryBefore);

    const summary = generateRunSummary(this.scenario, state, ending, score, objResults, routeResult, masteryBefore, masteryProgress.currentTier, score.totalScore > (bestBefore?.score || 0), attempt, challenge, challengeCompleted);

    const newAchievements = this.achievements.evaluateNew(summary, progressBefore, progressAfter);
    if (newAchievements.length) addAchievements(newAchievements.map((a) => a.id));

    const newUnlocks = this.unlocks.evaluateNewUnlocks(progressBefore, progressAfter, allScenarios, allPacks);

    const { rewards: rewardGrants, totalXP } = this.rewards.calculate(state, ending, score, objResults, routeResult, masteryProgress, newAchievements, newUnlocks, challengeCompleted, challenge, isFirst);

    addXP(totalXP);

    const isPersonalBest = score.totalScore > (bestBefore?.score || 0);

    return {
      ending,
      score,
      starsEarned,
      objectives: objResults,
      route: routeResult,
      mastery: masteryProgress,
      rewards: rewardGrants,
      totalXPEarned: totalXP,
      achievementsUnlocked: newAchievements,
      newUnlocks,
      isPersonalBest,
      previousBest: bestBefore,
      challengeCompleted,
      structuredSummary: summary,
      clinical: {
        mechanismScores: summary.mechanismScores,
        patternsDetected: summary.patternsDetected,
        transferPrompt: summary.transferPrompt,
        reflectionPrompts: summary.reflectionPrompts,
        mechanismFeedback: summary.mechanismFeedback,
        patternFeedback: summary.patternFeedback,
        smallestBetterMove: summary.smallestBetterMove,
        interpretation: summary.interpretation,
      },
    };
  }

  getPreRunInfo() {
    const p = getProgressState();
    const sp = getScenarioProgress(this.scenario.id);
    const dr = getDiscoveredRoutes(this.scenario.id);
    const br = getBestRun(this.scenario.id);
    return {
      objectives: this.objectives.getPreRunObjectives().map((o) => ({ id: o.id, title: o.title, description: o.description })),
      routes: { total: this.scenario.routes.length, discovered: dr.length, hiddenCount: this.routes.getHiddenRouteCount() },
      challenges: { unlocked: this.challenges.getUnlocked(p), locked: this.challenges.getLocked(p) },
      bestRun: br ? { score: br.score, grade: br.grade, stars: br.stars } : null,
      masteryTier: sp?.masteryTier || "none",
    };
  }

  getMasteryDashboard() {
    const p = getProgressState();
    const sp = getScenarioProgress(this.scenario.id);
    const dr = getDiscoveredRoutes(this.scenario.id);
    const br = getBestRun(this.scenario.id);
    const discoveredRoutes = this.scenario.routes.filter((r) => dr.includes(r.id)).map((r) => ({ id: r.id, name: r.name, description: r.description }));
    const hidden = this.scenario.routes.filter((r) => r.isHidden && !dr.includes(r.id)).map((r) => ({ hint: r.discoveryHint }));
    const completedObj = this.scenario.objectives.filter((o) => o.type === "primary" && (sp?.completedObjectives || []).includes(o.id)).map((o) => ({ id: o.id, title: o.title }));
    const remainingObj = this.scenario.objectives.filter((o) => o.type === "primary" && !(sp?.completedObjectives || []).includes(o.id)).map((o) => ({ id: o.id, title: o.title }));
    const completedCh = this.scenario.challenges.filter((c) => (sp?.completedChallenges || []).includes(c.id)).map((c) => ({ id: c.id, title: c.title }));
    const remainingCh = this.scenario.challenges.filter((c) => !(sp?.completedChallenges || []).includes(c.id)).map((c) => ({ id: c.id, title: c.title }));
    const mp = this.mastery.getMasteryProgress(sp, dr, sp?.masteryTier || "none");
    return {
      tier: mp.currentTier,
      routes: { discovered: discoveredRoutes, hidden, percentage: this.routes.getDiscoveryPercentage(dr) },
      objectives: { completed: completedObj, remaining: remainingObj },
      challenges: { completed: completedCh, remaining: remainingCh },
      bestRun: br ? { score: br.score, grade: br.grade, stars: br.stars } : null,
      nextTierRequirements: mp.nextTierRequirements,
    };
  }
}

export function createGameOrchestrator(scenario: ScenarioV2): GameOrchestrator {
  return new GameOrchestrator(scenario);
}
