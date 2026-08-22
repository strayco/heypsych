/**
 * PsychTrails - Public API (V2)
 *
 * Now with Behavioral Move Library:
 * - BEHAVIORAL_MOVES: canonical library of reusable psychological moves
 * - MoveCategory: taxonomy of move types (safety_behavior, threshold_escape, etc.)
 * - getMove, getMovesByCategory: move lookup utilities
 * - resolveMove, getBehavioralAnalysis: choice-move resolution
 * - Automatic interpretation and insight beat generation from moves
 */

export * from "./types-v2";
export * from "./constants";
export { ScenarioV2Schema, PackSchema, ProgressStateSchema, StructuredRunSummarySchema, validateScenarioV2, validatePack } from "./schemas-v2";
export { PsychTrailEngineV2 as PsychTrailEngine, createEngine } from "./engine-v2";
export { ScoringEngine, applyChallengeMultiplier } from "./engines/scoring-engine";
export { ObjectiveEngine } from "./engines/objective-engine";
export { RouteTracker } from "./engines/route-tracker";
export { ChallengeEngine } from "./engines/challenge-engine";
export { MasteryEngine } from "./engines/mastery-engine";
export { AchievementEngine } from "./engines/achievement-engine";
export { UnlockEngine } from "./engines/unlock-engine";
export { RewardEngine } from "./engines/reward-engine";
export { GameOrchestrator, createGameOrchestrator } from "./game-orchestrator";
export { generateRunSummary } from "./run-summary";
export { generateInterpretation, DEFAULT_PATTERN_LABELS, mergePatternLabels } from "./interpretation-engine";
export { evaluateInsightBeats, recordBeatShown, recordInterventionSelection, createInsightBeatRunState, DEFAULT_INSIGHT_BEAT_CONFIG } from "./insight-beats-engine";
export type { InsightBeatRunState } from "./insight-beats-engine";

// Behavioral Move Library - THE KEY TO 10/10 AUTHORING
export {
  BEHAVIORAL_MOVES,
  MOVE_CATEGORIES,
  MOVE_CATEGORY_METADATA,
  getMove,
  getMovesByCategory,
  getMovesByValence,
  getMovesByTargetState,
  getMovesWithInterventions,
  listMoveIds,
} from "./behavioral-moves";
export type { BehavioralMove, MoveCategory, MoveValence, MoveMicroIntervention } from "./behavioral-moves";

// Move Resolution - bridges moves to choices/runtime
export {
  resolveMove,
  resolveMoves,
  getBehavioralAnalysis,
  getHiddenBargain,
  getReinforcement,
  getConsequenceIfRepeated,
  generateStepInterpretationFromMove,
  generateMoveBasedStepInterpretations,
  generateInsightBeatFromMove,
  generateMoveBasedInsightBeats,
  mergeStepInterpretations,
  mergeInsightBeats,
  generateMoveLLMPayload,
  mapMoveCategoryToInsightCategory,
} from "./move-resolver";
export type { ResolvedMove, BehavioralAnalysis, MoveLLMPayload } from "./move-resolver";

// Storage (now with intervention tracking)
export {
  getProgressState,
  saveProgressState,
  clearAllProgress,
  getScenarioProgress,
  updateScenarioProgress,
  getPackProgress,
  updatePackProgress,
  addAchievements,
  isAchievementUnlocked,
  addXP,
  getDiscoveredRoutes,
  getBestRun,
  setProfileId,
  getProfileId,
  exportProgress,
  importProgress,
  // Clinical progress
  getClinicalProgress,
  saveClinicalProgress,
  updateMechanismProgress,
  updatePatternProgress,
  getMechanismProgress,
  getPatternHistory,
  getTopMechanisms,
  getFrequentPatterns,
  getMechanismsNeedingPractice,
  clearClinicalProgress,
  // Transfer log
  addTransferLogEntry,
  markTransferCompleted,
  getTransferLog,
  getPendingTransfers,
  // Returning user context
  getLastPlayedScenarioId,
  getReturningUserContext,
  getRecentlyPlayedScenarios,
  isReturningUser,
  // Intervention tracking
  getInterventionTracking,
  saveInterventionTracking,
  recordInterventionsShown,
  recordInterventionSelected,
  getInterventionSelectionRate,
  getMostSelectedInterventions,
  getMoveInterventionHistory,
  clearInterventionTracking,
} from "./storage-v2";
export type { ClinicalProgressState, TransferLogEntry, ReturningUserContext, InterventionTrackingState, InterventionTrackingEntry } from "./storage-v2";
export { ACHIEVEMENTS, getAchievement } from "./data/achievements";
export { SeededRNG, generateSeed } from "./rng";
export { PackRegistry, getPackRegistry } from "./pack-registry";
export { loadScenario, loadAllScenarios, cacheScenario, getScenarioSync, clearCache, ScenarioNotFoundError } from "./scenario-registry";

// Institutional layer (university-ready)
export * from "./institutional-types";
export { getCampusContext, setCampusContext, clearCampusContext, isInCampusMode, getTransferCommitments, addTransferCommitment, getRecentCommitments, getPendingCommitments, getPlaylistProgress, startPlaylist, updatePlaylistProgress, isPlaylistComplete, createAnonymousRunRecord, createFollowUpRequest, getCampusModeInfo } from "./campus-storage";
export { getPlaylistRegistry, generatePlaylistLink, generateScenarioLink, LAUNCH_PLAYLISTS } from "./playlist-registry";

import diningHall from "./scenarios-compiled/dining-hall.json";
import socialAnxietyPack from "./data/packs/social-anxiety-fundamentals.json";

export const scenarios = { dining_hall: diningHall };
export const packs = { "social-anxiety-fundamentals": socialAnxietyPack };
