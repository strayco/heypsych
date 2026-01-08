/**
 * PsychTrails - Storage Layer
 *
 * Handles localStorage persistence for campaign progress.
 * MVP uses localStorage; can migrate to database later.
 */

import type {
  UserProfile,
  TileProgress,
  CampaignProgress,
  LifeStage,
  Lens,
  ContextTag,
} from "./types";

// Storage keys
const STORAGE_KEYS = {
  PROFILE: "psychtrails_profile",
  PROGRESS: "psychtrails_progress",
} as const;

// ============================================================================
// User Profile
// ============================================================================

/**
 * Save user's onboarding selections
 */
export function saveUserProfile(
  lifeStage: LifeStage,
  lens: Lens = "generic",
  contextTags: ContextTag[] = []
): void {
  const profile: UserProfile = {
    lifeStage,
    lens,
    contextTags,
    onboardedAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }
}

/**
 * Get user's onboarding selections
 */
export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Clear user profile (for testing/reset)
 */
export function clearUserProfile(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }
}

// ============================================================================
// Campaign Progress
// ============================================================================

/**
 * Get complete campaign progress
 */
export function getCampaignProgress(): CampaignProgress | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as CampaignProgress;
  } catch {
    return null;
  }
}

/**
 * Initialize campaign progress for a new user
 */
export function initializeCampaignProgress(profile: UserProfile): CampaignProgress {
  const progress: CampaignProgress = {
    profile,
    tiles: {},
    totalXP: 0,
    insightCardsEarned: [],
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  }

  return progress;
}

/**
 * Save complete campaign progress
 */
export function saveCampaignProgress(progress: CampaignProgress): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  }
}

// ============================================================================
// Tile Progress
// ============================================================================

/**
 * Get progress for a specific tile
 */
export function getTileProgress(tileId: string): TileProgress {
  const campaign = getCampaignProgress();

  // Return existing progress or default
  return campaign?.tiles[tileId] ?? {
    confidence: 0,
    completions: 0,
  };
}

/**
 * Update progress for a specific tile after completion
 */
export function updateTileProgress(
  tileId: string,
  confidenceGain: number,
  endingId: string
): void {
  let campaign = getCampaignProgress();

  // If no campaign progress exists, we can't update
  if (!campaign) {
    console.warn("Cannot update tile progress: no campaign progress found");
    return;
  }

  // Get current progress or initialize
  const current = campaign.tiles[tileId] ?? {
    confidence: 0,
    completions: 0,
  };

  // Update progress
  const newProgress: TileProgress = {
    confidence: Math.min(100, Math.max(0, current.confidence + confidenceGain)),
    completions: current.completions + 1,
    lastPlayedAt: Date.now(),
    bestEndingId: endingId,
  };

  // Save back
  campaign.tiles[tileId] = newProgress;
  saveCampaignProgress(campaign);
}

/**
 * Add XP to campaign total
 */
export function addXP(amount: number): void {
  let campaign = getCampaignProgress();
  if (!campaign) return;

  campaign.totalXP += amount;
  saveCampaignProgress(campaign);
}

/**
 * Add an insight card to collection
 */
export function addInsightCard(cardId: string): void {
  let campaign = getCampaignProgress();
  if (!campaign) return;

  if (!campaign.insightCardsEarned.includes(cardId)) {
    campaign.insightCardsEarned.push(cardId);
    saveCampaignProgress(campaign);
  }
}

/**
 * Clear all progress (for testing/reset)
 */
export function clearAllProgress(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }
}
