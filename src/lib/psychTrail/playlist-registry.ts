/**
 * PsychTrails Playlist Registry
 *
 * Manages university-ready playlists for counseling, wellness,
 * student success, orientation, and re-entry workflows.
 */

import type { Playlist } from "./institutional-types";
import type { MechanismId } from "./clinical-constants";

// Extended playlist type with ready flag
export interface PlaylistWithStatus extends Playlist {
  isReady: boolean;
}

// ============================================================================
// LAUNCH PLAYLISTS
// Built by HeyPsych for university deployment
// ============================================================================

export const LAUNCH_PLAYLISTS: PlaylistWithStatus[] = [
  // -------------------------------------------------------------------------
  // LIVE PILOT PLAYLIST: Dining Hall Practice
  // Single-scenario playlist for university pilot
  // -------------------------------------------------------------------------
  {
    id: "dining-hall-practice",
    institutionId: null,
    title: "Dining Hall Practice",
    description: "Practice navigating a crowded dining hall with social anxiety.",
    supportContext: "For students avoiding campus meals or feeling anxious in social eating situations",
    scenarioIds: ["dining_hall"],
    targetMechanisms: ["distress_tolerance", "interpretation", "self_compassion"] as MechanismId[],
    estimatedMinutes: 10,
    difficulty: "beginner",
    createdBy: null,
    createdAt: Date.now(),
    isReady: true,
  },

  // -------------------------------------------------------------------------
  // LIVE PILOT PLAYLIST: Morning Activation Practice
  // Single-scenario playlist for activation/depression focus
  // -------------------------------------------------------------------------
  {
    id: "morning-activation-practice",
    institutionId: null,
    title: "Morning Activation Practice",
    description: "Practice getting moving when depression makes everything feel too hard.",
    supportContext: "For students struggling to get out of bed and start their day",
    scenarioIds: ["depression_morning_bed"],
    targetMechanisms: ["activation", "threshold_lowering", "self_compassion"] as MechanismId[],
    estimatedMinutes: 12,
    difficulty: "beginner",
    createdBy: null,
    createdAt: Date.now(),
    isReady: true,
  },

  // -------------------------------------------------------------------------
  // FUTURE PLAYLISTS (not ready - scenarios not built)
  // -------------------------------------------------------------------------
  {
    id: "morning-activation",
    institutionId: null,
    title: "Morning Activation",
    description: "Practice getting started when everything feels too hard.",
    supportContext: "For students struggling to get out of bed and make it to class",
    scenarioIds: ["depression_morning_bed", "getting_to_first_class", "making_it_through_the_day"],
    targetMechanisms: ["activation", "threshold_lowering", "persistence"] as MechanismId[],
    estimatedMinutes: 25,
    difficulty: "beginner",
    createdBy: null,
    createdAt: Date.now(),
    isReady: false,
  },
  {
    id: "asking-for-help",
    institutionId: null,
    title: "Asking for Help",
    description: "Practice reaching out when you need support.",
    supportContext: "For students avoiding office hours, professor contact, or accommodations",
    scenarioIds: ["office_hours_visit", "emailing_your_professor", "requesting_accommodations"],
    targetMechanisms: ["support_seeking", "directness", "distress_tolerance"] as MechanismId[],
    estimatedMinutes: 30,
    difficulty: "intermediate",
    createdBy: null,
    createdAt: Date.now(),
    isReady: false,
  },
  {
    id: "first-counseling-visit",
    institutionId: null,
    title: "First Counseling Visit",
    description: "Practice what it's like to start counseling.",
    supportContext: "For students preparing for their first counseling appointment",
    scenarioIds: ["scheduling_the_appointment", "walking_into_counseling", "first_session"],
    targetMechanisms: ["support_seeking", "activation", "self_compassion"] as MechanismId[],
    estimatedMinutes: 25,
    difficulty: "beginner",
    createdBy: null,
    createdAt: Date.now(),
    isReady: false,
  },
  {
    id: "re-entry-after-avoidance",
    institutionId: null,
    title: "Re-Entry After Avoidance",
    description: "Practice coming back after falling behind.",
    supportContext: "For students recovering from missed classes, unanswered messages, or withdrawal",
    scenarioIds: ["replying_after_silence", "going_back_after_missing", "facing_the_backlog"],
    targetMechanisms: ["recovery", "threshold_lowering", "self_compassion"] as MechanismId[],
    estimatedMinutes: 30,
    difficulty: "intermediate",
    createdBy: null,
    createdAt: Date.now(),
    isReady: false,
  },
  {
    id: "social-adjustment",
    institutionId: null,
    title: "Social Adjustment",
    description: "Practice navigating social situations on campus.",
    supportContext: "For students struggling with social belonging and campus integration",
    scenarioIds: ["dining_hall", "first_week_residence_hall", "finding_your_people"],
    targetMechanisms: ["distress_tolerance", "interpretation", "flexibility"] as MechanismId[],
    estimatedMinutes: 30,
    difficulty: "beginner",
    createdBy: null,
    createdAt: Date.now(),
    isReady: false,
  },
  {
    id: "shame-recovery",
    institutionId: null,
    title: "Shame Recovery",
    description: "Practice moving forward after things go wrong.",
    supportContext: "For students stuck in shame spirals after failure or withdrawal",
    scenarioIds: ["after_the_failure", "facing_people_again", "starting_over"],
    targetMechanisms: ["self_compassion", "recovery", "interpretation"] as MechanismId[],
    estimatedMinutes: 30,
    difficulty: "intermediate",
    createdBy: null,
    createdAt: Date.now(),
    isReady: false,
  },
];

// ============================================================================
// PLAYLIST REGISTRY
// ============================================================================

class PlaylistRegistry {
  private playlists: Map<string, PlaylistWithStatus> = new Map();

  constructor() {
    for (const playlist of LAUNCH_PLAYLISTS) {
      this.playlists.set(playlist.id, playlist);
    }
  }

  /**
   * Get all available playlists.
   */
  getAllPlaylists(): PlaylistWithStatus[] {
    return Array.from(this.playlists.values());
  }

  /**
   * Get only ready playlists (for campus mode UI).
   */
  getReadyPlaylists(): PlaylistWithStatus[] {
    return this.getAllPlaylists().filter((p) => p.isReady);
  }

  /**
   * Get playlist by ID.
   */
  getPlaylist(id: string): PlaylistWithStatus | null {
    return this.playlists.get(id) || null;
  }

  /**
   * Get playlists by target mechanism.
   */
  getPlaylistsByMechanism(mechanism: MechanismId): PlaylistWithStatus[] {
    return this.getAllPlaylists().filter((p) => p.targetMechanisms.includes(mechanism));
  }

  /**
   * Get playlists suitable for specific support contexts.
   */
  getPlaylistsForWorkflow(
    workflow: "counseling" | "wellness" | "orientation" | "re-entry" | "student-success"
  ): PlaylistWithStatus[] {
    const readyOnly = this.getReadyPlaylists();
    switch (workflow) {
      case "counseling":
        return readyOnly.filter((p) =>
          ["first-counseling-visit", "shame-recovery", "morning-activation-practice", "dining-hall-practice"].includes(p.id)
        );
      case "wellness":
        return readyOnly.filter((p) =>
          ["morning-activation-practice", "social-adjustment", "shame-recovery", "dining-hall-practice"].includes(p.id)
        );
      case "orientation":
        return readyOnly.filter((p) =>
          ["social-adjustment", "asking-for-help", "morning-activation-practice", "dining-hall-practice"].includes(p.id)
        );
      case "re-entry":
        return readyOnly.filter((p) =>
          ["re-entry-after-avoidance", "shame-recovery", "asking-for-help", "morning-activation-practice", "dining-hall-practice"].includes(p.id)
        );
      case "student-success":
        return readyOnly.filter((p) =>
          ["morning-activation-practice", "asking-for-help", "re-entry-after-avoidance", "dining-hall-practice"].includes(p.id)
        );
      default:
        return readyOnly;
    }
  }

  /**
   * Register a custom institution playlist.
   */
  registerPlaylist(playlist: PlaylistWithStatus): void {
    this.playlists.set(playlist.id, playlist);
  }

  /**
   * Check if a scenario is in any playlist.
   */
  getPlaylistsContainingScenario(scenarioId: string): PlaylistWithStatus[] {
    return this.getAllPlaylists().filter((p) => p.scenarioIds.includes(scenarioId));
  }

  /**
   * Get next scenario in playlist sequence.
   */
  getNextScenarioInPlaylist(playlistId: string, currentScenarioId: string): string | null {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) return null;
    const currentIndex = playlist.scenarioIds.indexOf(currentScenarioId);
    if (currentIndex === -1 || currentIndex === playlist.scenarioIds.length - 1) {
      return null;
    }
    return playlist.scenarioIds[currentIndex + 1];
  }

  /**
   * Get playlist progress info.
   */
  getPlaylistProgressInfo(
    playlistId: string,
    completedScenarios: string[]
  ): { total: number; completed: number; nextScenarioId: string | null } {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) {
      return { total: 0, completed: 0, nextScenarioId: null };
    }
    const completed = playlist.scenarioIds.filter((id) => completedScenarios.includes(id)).length;
    const nextScenarioId = playlist.scenarioIds.find((id) => !completedScenarios.includes(id)) || null;
    return {
      total: playlist.scenarioIds.length,
      completed,
      nextScenarioId,
    };
  }
}

// Singleton instance
let registryInstance: PlaylistRegistry | null = null;

export function getPlaylistRegistry(): PlaylistRegistry {
  if (!registryInstance) {
    registryInstance = new PlaylistRegistry();
  }
  return registryInstance;
}

// ============================================================================
// PLAYLIST URL GENERATION
// ============================================================================

export interface PlaylistLinkParams {
  playlistId: string;
  institutionSlug: string;
  cohortId?: string;
  staffReferralId?: string;
}

/**
 * Generate a playlist recommendation link.
 */
export function generatePlaylistLink(params: PlaylistLinkParams): string {
  const base = `/psychtrails/for-campuses/${params.institutionSlug}/playlist/${params.playlistId}`;
  const queryParams: string[] = [];
  if (params.cohortId) {
    queryParams.push(`cohort=${encodeURIComponent(params.cohortId)}`);
  }
  if (params.staffReferralId) {
    queryParams.push(`ref=${encodeURIComponent(params.staffReferralId)}`);
  }
  return queryParams.length > 0 ? `${base}?${queryParams.join("&")}` : base;
}

/**
 * Generate a single scenario recommendation link.
 */
export function generateScenarioLink(params: {
  scenarioId: string;
  institutionSlug: string;
  cohortId?: string;
  staffReferralId?: string;
}): string {
  const base = `/psychtrails/play/${params.scenarioId}`;
  const queryParams: string[] = [];
  queryParams.push(`campus=${encodeURIComponent(params.institutionSlug)}`);
  if (params.cohortId) {
    queryParams.push(`cohort=${encodeURIComponent(params.cohortId)}`);
  }
  if (params.staffReferralId) {
    queryParams.push(`ref=${encodeURIComponent(params.staffReferralId)}`);
  }
  return `${base}?${queryParams.join("&")}`;
}
