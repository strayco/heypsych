import type { ProgressState, ScenarioProgress, PackProgress, GlobalProgress, BestRun, MasteryTier, Grade, Rank, MechanismRunScore, PatternDetection } from "./types-v2";
import type { MechanismId, PatternId, MechanismStrength, MechanismProgress, PatternHistory, PatternValence } from "./clinical-constants";
import { calculateRank, getBetterGrade, getBetterMastery, MASTERY_TIER_RANK } from "./constants";
import { MECHANISMS, PATTERNS, PATTERN_DEFINITIONS, getMechanismDemonstrated } from "./clinical-constants";

const KEY = "psychtrails_progress_v2";
const CLINICAL_KEY = "psychtrails_clinical_v1";
const VERSION = 2;

function empty(): ProgressState {
  return {
    version: VERSION,
    scenarios: {},
    routes: {},
    bestRuns: {},
    packs: {},
    achievements: [],
    unlocks: { scenarios: [], packs: [], challenges: {} },
    global: { totalXP: 0, rank: "novice", totalRuns: 0, totalScenariosCompleted: 0, totalPacksCompleted: 0, totalRoutesDiscovered: 0, firstPlayAt: Date.now(), lastPlayAt: Date.now() },
    _profileId: null,
  };
}

function emptyScenario(): ScenarioProgress {
  return { completions: 0, bestStars: 0, bestGrade: "F", bestScore: 0, masteryTier: "none", completedObjectives: [], completedChallenges: [], firstCompletedAt: 0, lastPlayedAt: 0 };
}

function emptyPack(): PackProgress {
  return { scenariosCompleted: 0, totalStars: 0, masteryTier: "none", firstCompletedAt: null };
}

export function getProgressState(): ProgressState {
  if (typeof window === "undefined") return empty();
  const s = localStorage.getItem(KEY);
  if (!s) return empty();
  try {
    const p = JSON.parse(s) as ProgressState;
    if (p.version !== VERSION) return empty();
    return p;
  } catch {
    return empty();
  }
}

export function saveProgressState(s: ProgressState): void {
  if (typeof window === "undefined") return;
  s.global.lastPlayAt = Date.now();
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearAllProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function getScenarioProgress(id: string): ScenarioProgress | null {
  return getProgressState().scenarios[id] || null;
}

export function updateScenarioProgress(
  id: string,
  u: { stars: 0 | 1 | 2 | 3; grade: Grade; score: number; masteryTier: MasteryTier; completedObjectives: string[]; challengeId: string | null; challengeCompleted: boolean; routeId: string | null }
): ProgressState {
  const s = getProgressState();
  const e = s.scenarios[id] || emptyScenario();
  const first = e.completions === 0;
  const updated: ScenarioProgress = {
    completions: e.completions + 1,
    bestStars: Math.max(e.bestStars, u.stars) as 0 | 1 | 2 | 3,
    bestGrade: getBetterGrade(e.bestGrade, u.grade),
    bestScore: Math.max(e.bestScore, u.score),
    masteryTier: getBetterMastery(e.masteryTier, u.masteryTier),
    completedObjectives: merge(e.completedObjectives, u.completedObjectives),
    completedChallenges: u.challengeCompleted && u.challengeId ? merge(e.completedChallenges, [u.challengeId]) : e.completedChallenges,
    firstCompletedAt: e.firstCompletedAt || Date.now(),
    lastPlayedAt: Date.now(),
  };
  s.scenarios[id] = updated;
  if (u.routeId) {
    const r = s.routes[id] || [];
    if (!r.includes(u.routeId)) {
      s.routes[id] = [...r, u.routeId];
      s.global.totalRoutesDiscovered++;
    }
  }
  if (u.score > (s.bestRuns[id]?.score ?? 0)) {
    s.bestRuns[id] = { score: u.score, grade: u.grade, stars: u.stars, routeId: u.routeId, objectivesCompleted: u.completedObjectives, challengeId: u.challengeId, timestamp: Date.now() };
  }
  s.global.totalRuns++;
  if (first) s.global.totalScenariosCompleted++;
  saveProgressState(s);
  return s;
}

export function getPackProgress(id: string): PackProgress {
  return getProgressState().packs[id] || emptyPack();
}

export function updatePackProgress(id: string, scenarioIds: string[]): PackProgress {
  const s = getProgressState();
  let done = 0, stars = 0, lowest: MasteryTier = "platinum";
  for (const sid of scenarioIds) {
    const p = s.scenarios[sid];
    if (p && p.completions > 0) {
      done++;
      stars += p.bestStars;
      if (MASTERY_TIER_RANK[p.masteryTier] < MASTERY_TIER_RANK[lowest]) lowest = p.masteryTier;
    }
  }
  if (done === 0) lowest = "none";
  const e = s.packs[id] || emptyPack();
  const isNew = e.scenariosCompleted < scenarioIds.length && done === scenarioIds.length;
  const up: PackProgress = { scenariosCompleted: done, totalStars: stars, masteryTier: lowest, firstCompletedAt: done === scenarioIds.length ? (e.firstCompletedAt || Date.now()) : null };
  s.packs[id] = up;
  if (isNew) s.global.totalPacksCompleted++;
  saveProgressState(s);
  return up;
}

export function addAchievements(ids: string[]): void {
  const s = getProgressState();
  s.achievements = merge(s.achievements, ids);
  saveProgressState(s);
}

export function isAchievementUnlocked(id: string): boolean {
  return getProgressState().achievements.includes(id);
}

export function addXP(amount: number): { newTotal: number; newRank: Rank; rankChanged: boolean } {
  const s = getProgressState();
  const old = s.global.rank;
  s.global.totalXP += amount;
  s.global.rank = calculateRank(s.global.totalXP);
  saveProgressState(s);
  return { newTotal: s.global.totalXP, newRank: s.global.rank, rankChanged: old !== s.global.rank };
}

export function getDiscoveredRoutes(id: string): string[] {
  return getProgressState().routes[id] || [];
}

export function getBestRun(id: string): BestRun | null {
  return getProgressState().bestRuns[id] || null;
}

export function setProfileId(id: string): void {
  const s = getProgressState();
  s._profileId = id;
  saveProgressState(s);
}

export function getProfileId(): string | null {
  return getProgressState()._profileId;
}

export function exportProgress(): ProgressState {
  return getProgressState();
}

export function importProgress(s: ProgressState): void {
  saveProgressState(s);
}

function merge<T>(a: T[], b: T[]): T[] {
  return Array.from(new Set([...a, ...b]));
}

// ============================================================================
// CLINICAL PROGRESS STATE
// ============================================================================

export interface ClinicalProgressState {
  version: number;
  mechanisms: Record<MechanismId, MechanismProgress>;
  patterns: Record<PatternId, PatternHistory>;
  transferLog: TransferLogEntry[];
  lastUpdated: number;
}

export interface TransferLogEntry {
  runId: string;
  scenarioId: string;
  transferPrompt: string;
  timestamp: number;
  completed: boolean;
  reflection?: string;
}

function emptyClinicalProgress(): ClinicalProgressState {
  const mechanisms: Record<string, MechanismProgress> = {};
  for (const mech of MECHANISMS) {
    mechanisms[mech] = {
      mechanism: mech,
      totalReps: 0,
      strongReps: 0,
      lastPracticed: 0,
      scenariosContributed: [],
      trend: "stable",
    };
  }

  const patterns: Record<string, PatternHistory> = {};
  for (const pat of PATTERNS) {
    patterns[pat] = {
      pattern: pat,
      occurrences: 0,
      lastOccurred: 0,
      recentRuns: [],
      trend: "stable",
    };
  }

  return {
    version: 1,
    mechanisms: mechanisms as Record<MechanismId, MechanismProgress>,
    patterns: patterns as Record<PatternId, PatternHistory>,
    transferLog: [],
    lastUpdated: Date.now(),
  };
}

export function getClinicalProgress(): ClinicalProgressState {
  if (typeof window === "undefined") return emptyClinicalProgress();
  const s = localStorage.getItem(CLINICAL_KEY);
  if (!s) return emptyClinicalProgress();
  try {
    const p = JSON.parse(s) as ClinicalProgressState;
    if (p.version !== 1) return emptyClinicalProgress();
    return p;
  } catch {
    return emptyClinicalProgress();
  }
}

export function saveClinicalProgress(s: ClinicalProgressState): void {
  if (typeof window === "undefined") return;
  s.lastUpdated = Date.now();
  localStorage.setItem(CLINICAL_KEY, JSON.stringify(s));
}

export function updateMechanismProgress(
  scenarioId: string,
  runId: string,
  mechanismScores: MechanismRunScore[]
): ClinicalProgressState {
  const s = getClinicalProgress();
  const now = Date.now();

  for (const score of mechanismScores) {
    const mech = s.mechanisms[score.mechanism];
    if (!mech) continue;

    const wasDemonstrated = getMechanismDemonstrated(score.strength);
    if (wasDemonstrated) {
      mech.totalReps++;
      if (score.strength === "strong") {
        mech.strongReps++;
      }
      mech.lastPracticed = now;
      if (!mech.scenariosContributed.includes(scenarioId)) {
        mech.scenariosContributed.push(scenarioId);
      }
    }

    // Calculate trend based on recent performance
    const recentStrongRatio = mech.totalReps > 0 ? mech.strongReps / mech.totalReps : 0;
    if (mech.totalReps >= 3) {
      if (recentStrongRatio > 0.6) {
        mech.trend = "improving";
      } else if (recentStrongRatio < 0.3) {
        mech.trend = "declining";
      } else {
        mech.trend = "stable";
      }
    }
  }

  saveClinicalProgress(s);
  return s;
}

export function updatePatternProgress(
  scenarioId: string,
  runId: string,
  patternsDetected: PatternDetection[]
): ClinicalProgressState {
  const s = getClinicalProgress();
  const now = Date.now();

  for (const detection of patternsDetected) {
    const pat = s.patterns[detection.pattern];
    if (!pat) continue;

    pat.occurrences++;
    pat.lastOccurred = now;
    pat.recentRuns.push({
      scenarioId,
      runId,
      timestamp: now,
    });

    // Keep only last 10 runs
    if (pat.recentRuns.length > 10) {
      pat.recentRuns = pat.recentRuns.slice(-10);
    }

    // Calculate trend based on recent frequency
    const recentCount = pat.recentRuns.filter(r => r.timestamp > now - 7 * 24 * 60 * 60 * 1000).length;
    const olderCount = pat.recentRuns.filter(r => r.timestamp <= now - 7 * 24 * 60 * 60 * 1000).length;
    
    if (recentCount > olderCount + 1) {
      pat.trend = "increasing";
    } else if (recentCount < olderCount - 1) {
      pat.trend = "decreasing";
    } else {
      pat.trend = "stable";
    }
  }

  saveClinicalProgress(s);
  return s;
}

export function addTransferLogEntry(entry: Omit<TransferLogEntry, "completed" | "reflection">): void {
  const s = getClinicalProgress();
  s.transferLog.push({
    ...entry,
    completed: false,
  });
  
  // Keep only last 50 entries
  if (s.transferLog.length > 50) {
    s.transferLog = s.transferLog.slice(-50);
  }
  
  saveClinicalProgress(s);
}

export function markTransferCompleted(runId: string, reflection?: string): void {
  const s = getClinicalProgress();
  const entry = s.transferLog.find(e => e.runId === runId);
  if (entry) {
    entry.completed = true;
    if (reflection) {
      entry.reflection = reflection;
    }
    saveClinicalProgress(s);
  }
}

export function getMechanismProgress(mechanism: MechanismId): MechanismProgress | null {
  const s = getClinicalProgress();
  return s.mechanisms[mechanism] || null;
}

export function getPatternHistory(pattern: PatternId): PatternHistory | null {
  const s = getClinicalProgress();
  return s.patterns[pattern] || null;
}

export function getTransferLog(): TransferLogEntry[] {
  return getClinicalProgress().transferLog;
}

export function getPendingTransfers(): TransferLogEntry[] {
  return getClinicalProgress().transferLog.filter(e => !e.completed);
}

export function getTopMechanisms(count: number = 3): MechanismProgress[] {
  const s = getClinicalProgress();
  return Object.values(s.mechanisms)
    .sort((a, b) => b.strongReps - a.strongReps)
    .slice(0, count);
}

export function getFrequentPatterns(valence: PatternValence, count: number = 3): PatternHistory[] {
  const s = getClinicalProgress();
  return Object.values(s.patterns)
    .filter(p => PATTERN_DEFINITIONS[p.pattern].valence === valence)
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, count);
}

export function getMechanismsNeedingPractice(): MechanismProgress[] {
  const s = getClinicalProgress();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  return Object.values(s.mechanisms)
    .filter(m => {
      // Never practiced or not practiced recently
      if (m.totalReps === 0) return true;
      if (m.lastPracticed < oneWeekAgo) return true;
      // Declining trend
      if (m.trend === "declining") return true;
      return false;
    })
    .slice(0, 5);
}

export function clearClinicalProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLINICAL_KEY);
}

// ============================================================================
// RETURNING USER HELPERS
// ============================================================================

/**
 * Get the last played scenario ID based on most recent lastPlayedAt timestamp.
 */
export function getLastPlayedScenarioId(): string | null {
  const state = getProgressState();
  let lastScenarioId: string | null = null;
  let lastTimestamp = 0;

  for (const [scenarioId, progress] of Object.entries(state.scenarios)) {
    if (progress.lastPlayedAt > lastTimestamp) {
      lastTimestamp = progress.lastPlayedAt;
      lastScenarioId = scenarioId;
    }
  }

  return lastScenarioId;
}

/**
 * Get returning user context for the PsychTrails landing page.
 * Returns null if user has no progress.
 */
export interface ReturningUserContext {
  lastPlayedScenarioId: string;
  lastPlayedProgress: ScenarioProgress;
  routesDiscovered: number;
  routesTotal: number; // Will be filled in by caller with scenario data
  canImprove: boolean; // Has room for improvement
  suggestedAction: "replay" | "continue" | "explore";
}

export function getReturningUserContext(): ReturningUserContext | null {
  const state = getProgressState();
  const lastScenarioId = getLastPlayedScenarioId();

  if (!lastScenarioId) return null;

  const progress = state.scenarios[lastScenarioId];
  if (!progress) return null;

  const routes = state.routes[lastScenarioId] || [];
  const canImprove = progress.bestGrade !== "S" || progress.bestStars < 3 || progress.masteryTier !== "platinum";

  // Determine suggested action
  let suggestedAction: "replay" | "continue" | "explore" = "replay";
  if (progress.masteryTier === "platinum" && progress.bestGrade === "S") {
    suggestedAction = "explore"; // Fully mastered, explore other scenarios
  } else if (progress.completions >= 3 && canImprove) {
    suggestedAction = "continue"; // Played enough, try something new but can come back
  }

  return {
    lastPlayedScenarioId: lastScenarioId,
    lastPlayedProgress: progress,
    routesDiscovered: routes.length,
    routesTotal: 0, // Filled in by caller
    canImprove,
    suggestedAction,
  };
}

/**
 * Get scenarios sorted by most recent play time.
 */
export function getRecentlyPlayedScenarios(limit: number = 5): Array<{ scenarioId: string; progress: ScenarioProgress }> {
  const state = getProgressState();
  const entries = Object.entries(state.scenarios)
    .filter(([, progress]) => progress.completions > 0)
    .sort(([, a], [, b]) => b.lastPlayedAt - a.lastPlayedAt)
    .slice(0, limit)
    .map(([scenarioId, progress]) => ({ scenarioId, progress }));

  return entries;
}

/**
 * Check if user qualifies as "returning" (has meaningful progress).
 */
export function isReturningUser(): boolean {
  const state = getProgressState();
  return state.global.totalRuns >= 1;
}

// ============================================================================
// INTERVENTION TRACKING
// Tracks when interventions are shown and selected across runs
// ============================================================================

const INTERVENTION_KEY = "psychtrails_interventions_v1";

export interface InterventionTrackingEntry {
  /** Run ID (unique per run) */
  runId: string;
  /** Scenario ID */
  scenarioId: string;
  /** The insight beat that triggered the intervention */
  beatId: string;
  /** The move ID if the beat was move-generated */
  moveId: string | null;
  /** Step number when shown */
  stepNumber: number;
  /** When shown */
  shownAt: number;
  /** Interventions that were shown */
  interventionsShown: string[];
  /** Which intervention was selected (null if dismissed without selection) */
  selectedInterventionId: string | null;
  /** When selected (null if not selected) */
  selectedAt: number | null;
}

export interface InterventionTrackingState {
  version: number;
  entries: InterventionTrackingEntry[];
  /** Summary stats */
  totalShown: number;
  totalSelected: number;
  selectionRate: number;
  /** Per-intervention selection counts */
  interventionSelections: Record<string, number>;
  /** Per-move selection counts */
  moveSelections: Record<string, number>;
  lastUpdated: number;
}

function emptyInterventionTracking(): InterventionTrackingState {
  return {
    version: 1,
    entries: [],
    totalShown: 0,
    totalSelected: 0,
    selectionRate: 0,
    interventionSelections: {},
    moveSelections: {},
    lastUpdated: Date.now(),
  };
}

export function getInterventionTracking(): InterventionTrackingState {
  if (typeof window === "undefined") return emptyInterventionTracking();
  const s = localStorage.getItem(INTERVENTION_KEY);
  if (!s) return emptyInterventionTracking();
  try {
    const p = JSON.parse(s) as InterventionTrackingState;
    if (p.version !== 1) return emptyInterventionTracking();
    return p;
  } catch {
    return emptyInterventionTracking();
  }
}

export function saveInterventionTracking(s: InterventionTrackingState): void {
  if (typeof window === "undefined") return;
  s.lastUpdated = Date.now();
  // Recalculate selection rate
  s.selectionRate = s.totalShown > 0 ? s.totalSelected / s.totalShown : 0;
  localStorage.setItem(INTERVENTION_KEY, JSON.stringify(s));
}

/**
 * Record that interventions were shown in a beat.
 */
export function recordInterventionsShown(entry: Omit<InterventionTrackingEntry, "selectedInterventionId" | "selectedAt">): void {
  const s = getInterventionTracking();
  s.entries.push({
    ...entry,
    selectedInterventionId: null,
    selectedAt: null,
  });
  s.totalShown++;

  // Keep only last 100 entries
  if (s.entries.length > 100) {
    s.entries = s.entries.slice(-100);
  }

  saveInterventionTracking(s);
}

/**
 * Record that an intervention was selected.
 */
export function recordInterventionSelected(
  runId: string,
  beatId: string,
  interventionId: string,
  moveId: string | null
): void {
  const s = getInterventionTracking();

  // Find the entry and update it
  const entry = s.entries.find(e => e.runId === runId && e.beatId === beatId);
  if (entry && entry.selectedInterventionId === null) {
    entry.selectedInterventionId = interventionId;
    entry.selectedAt = Date.now();
    s.totalSelected++;

    // Update intervention selection counts
    s.interventionSelections[interventionId] = (s.interventionSelections[interventionId] || 0) + 1;

    // Update move selection counts
    if (moveId) {
      s.moveSelections[moveId] = (s.moveSelections[moveId] || 0) + 1;
    }
  }

  saveInterventionTracking(s);
}

/**
 * Get intervention selection rate (0-1).
 */
export function getInterventionSelectionRate(): number {
  return getInterventionTracking().selectionRate;
}

/**
 * Get most selected interventions.
 */
export function getMostSelectedInterventions(count: number = 5): Array<{ interventionId: string; selections: number }> {
  const s = getInterventionTracking();
  return Object.entries(s.interventionSelections)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([interventionId, selections]) => ({ interventionId, selections }));
}

/**
 * Get intervention history for a specific move.
 */
export function getMoveInterventionHistory(moveId: string): InterventionTrackingEntry[] {
  return getInterventionTracking().entries.filter(e => e.moveId === moveId);
}

/**
 * Clear intervention tracking data.
 */
export function clearInterventionTracking(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(INTERVENTION_KEY);
}
