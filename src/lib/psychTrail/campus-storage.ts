/**
 * PsychTrails Campus Storage
 *
 * Client-side storage for campus context and transfer commitments.
 * Preserves consumer experience as primary; campus mode is overlay only.
 */

import type {
  CampusContext,
  TransferCommitment,
  PlaylistProgress,
  TransferActionType,
  AnonymousRunRecord,
  FollowUpRequest,
} from "./institutional-types";
import {
  CAMPUS_CONTEXT_STORAGE_KEY,
  TRANSFER_COMMITMENTS_STORAGE_KEY,
  PLAYLIST_PROGRESS_STORAGE_KEY,
  FOLLOWUP_REQUESTS_STORAGE_KEY,
} from "./institutional-types";
import type { MechanismId, MechanismStrength, PatternId, PatternValence } from "./clinical-constants";
import type { Grade } from "./types-v2";

// ============================================================================
// CAMPUS CONTEXT
// ============================================================================

/**
 * Get current campus context if any.
 * Returns null if student is using consumer product directly.
 */
export function getCampusContext(): CampusContext | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CAMPUS_CONTEXT_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CampusContext;
  } catch {
    return null;
  }
}

/**
 * Set campus context when entering via institutional link.
 */
export function setCampusContext(context: CampusContext): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CAMPUS_CONTEXT_STORAGE_KEY, JSON.stringify(context));
}

/**
 * Clear campus context (opt out of institutional mode).
 */
export function clearCampusContext(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CAMPUS_CONTEXT_STORAGE_KEY);
}

/**
 * Check if currently in campus mode.
 */
export function isInCampusMode(): boolean {
  return getCampusContext() !== null;
}

// ============================================================================
// TRANSFER COMMITMENTS
// ============================================================================

const MAX_COMMITMENTS = 100;

export function getTransferCommitments(): TransferCommitment[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(TRANSFER_COMMITMENTS_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as TransferCommitment[];
  } catch {
    return [];
  }
}

export function addTransferCommitment(commitment: TransferCommitment): void {
  if (typeof window === "undefined") return;
  const commitments = getTransferCommitments();
  commitments.push(commitment);
  // Keep only last N commitments
  const trimmed = commitments.slice(-MAX_COMMITMENTS);
  localStorage.setItem(TRANSFER_COMMITMENTS_STORAGE_KEY, JSON.stringify(trimmed));
}

export function getRecentCommitments(count: number = 10): TransferCommitment[] {
  return getTransferCommitments().slice(-count);
}

export function getPendingCommitments(): TransferCommitment[] {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  return getTransferCommitments().filter(
    (c) => c.selectedAction === "commit_24h" && c.timestamp > twentyFourHoursAgo
  );
}

export function getCommitmentsByScenario(scenarioId: string): TransferCommitment[] {
  return getTransferCommitments().filter((c) => c.scenarioId === scenarioId);
}

// ============================================================================
// PLAYLIST PROGRESS
// ============================================================================

function getPlaylistProgressMap(): Record<string, PlaylistProgress> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(PLAYLIST_PROGRESS_STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored) as Record<string, PlaylistProgress>;
  } catch {
    return {};
  }
}

function savePlaylistProgressMap(map: Record<string, PlaylistProgress>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYLIST_PROGRESS_STORAGE_KEY, JSON.stringify(map));
}

export function getPlaylistProgress(playlistId: string): PlaylistProgress | null {
  const map = getPlaylistProgressMap();
  return map[playlistId] || null;
}

export function startPlaylist(playlistId: string): PlaylistProgress {
  const map = getPlaylistProgressMap();
  const existing = map[playlistId];
  if (existing) {
    existing.lastPlayedAt = Date.now();
    savePlaylistProgressMap(map);
    return existing;
  }
  const progress: PlaylistProgress = {
    playlistId,
    scenariosCompleted: [],
    currentScenarioIndex: 0,
    startedAt: Date.now(),
    lastPlayedAt: Date.now(),
    transferCommitments: [],
  };
  map[playlistId] = progress;
  savePlaylistProgressMap(map);
  return progress;
}

export function updatePlaylistProgress(
  playlistId: string,
  scenarioId: string,
  commitment: TransferCommitment | null
): PlaylistProgress | null {
  const map = getPlaylistProgressMap();
  const progress = map[playlistId];
  if (!progress) return null;

  if (!progress.scenariosCompleted.includes(scenarioId)) {
    progress.scenariosCompleted.push(scenarioId);
    progress.currentScenarioIndex = progress.scenariosCompleted.length;
  }
  if (commitment) {
    progress.transferCommitments.push(commitment);
  }
  progress.lastPlayedAt = Date.now();
  savePlaylistProgressMap(map);
  return progress;
}

export function isPlaylistComplete(playlistId: string, totalScenarios: number): boolean {
  const progress = getPlaylistProgress(playlistId);
  if (!progress) return false;
  return progress.scenariosCompleted.length >= totalScenarios;
}

// ============================================================================
// ANONYMOUS AGGREGATE RECORD CREATION
// For sending to institutional reporting (no PII)
// ============================================================================

export interface CreateAnonymousRecordParams {
  scenarioId: string;
  completed: boolean;
  isReplay: boolean;
  grade: Grade;
  mechanismsScored: Array<{ mechanism: MechanismId; strength: MechanismStrength }>;
  patternsDetected: Array<{ pattern: PatternId; valence: PatternValence }>;
  transferActionType: TransferActionType | null;
  resourceClicked: string | null;
}

/**
 * Create anonymous aggregate record for institutional reporting.
 * Only called when campus context is active.
 * Contains NO student identity.
 */
export function createAnonymousRunRecord(
  params: CreateAnonymousRecordParams
): AnonymousRunRecord | null {
  const context = getCampusContext();
  if (!context) return null;

  return {
    institutionId: context.institutionId,
    cohortId: context.cohortId,
    playlistId: context.playlistId,
    scenarioId: params.scenarioId,
    timestamp: Date.now(),
    completed: params.completed,
    isReplay: params.isReplay,
    grade: params.grade,
    mechanismsScored: params.mechanismsScored,
    patternsDetected: params.patternsDetected,
    transferActionType: params.transferActionType,
    resourceClicked: params.resourceClicked,
  };
}

// ============================================================================
// OPT-IN FOLLOW-UP REQUEST CREATION
// Only when student explicitly requests support
// ============================================================================

export interface CreateFollowUpRequestParams {
  studentIdentifier: string;
  scenarioId: string;
  scenarioTitle: string;
  transferPrompt: string;
  selectedAction: TransferActionType;
  smallestBetterMove: string | null;
}

/**
 * Create follow-up request when student opts into support mode.
 * Student provides their own identifier (not system-generated).
 * Saves to localStorage for later retrieval/export.
 */
export function createFollowUpRequest(
  params: CreateFollowUpRequestParams
): FollowUpRequest | null {
  if (typeof window === "undefined") return null;
  const context = getCampusContext();
  if (!context) return null;

  const request: FollowUpRequest = {
    id: generateId(),
    institutionId: context.institutionId,
    cohortId: context.cohortId,
    staffReferralId: context.staffReferralId,
    studentIdentifier: params.studentIdentifier,
    scenarioId: params.scenarioId,
    scenarioTitle: params.scenarioTitle,
    transferPrompt: params.transferPrompt,
    selectedAction: params.selectedAction,
    smallestBetterMove: params.smallestBetterMove,
    timestamp: Date.now(),
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
    resolvedNotes: null,
  };

  // Save to localStorage
  const stored = localStorage.getItem(FOLLOWUP_REQUESTS_STORAGE_KEY);
  const requests: FollowUpRequest[] = stored ? JSON.parse(stored) : [];
  requests.push(request);
  localStorage.setItem(FOLLOWUP_REQUESTS_STORAGE_KEY, JSON.stringify(requests));

  return request;
}

/**
 * Get all follow-up requests from localStorage.
 */
export function getFollowUpRequests(): FollowUpRequest[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(FOLLOWUP_REQUESTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// ============================================================================
// HELPERS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// CAMPUS MODE INFO FOR UI
// ============================================================================

export interface CampusModeInfo {
  isActive: boolean;
  institutionName: string | null;
  playlistId: string | null;
  isStaffReferred: boolean;
}

export function getCampusModeInfo(): CampusModeInfo {
  const context = getCampusContext();
  if (!context) {
    return {
      isActive: false,
      institutionName: null,
      playlistId: null,
      isStaffReferred: false,
    };
  }
  return {
    isActive: true,
    institutionName: context.institutionName,
    playlistId: context.playlistId,
    isStaffReferred: context.staffReferralId !== null,
  };
}
