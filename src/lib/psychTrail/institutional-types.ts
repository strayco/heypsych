/**
 * PsychTrails Institutional Types
 *
 * University-ready layer built on top of consumer product.
 * Two explicit data modes:
 * - Anonymous Campus Mode: aggregate-only, no student identity
 * - Student-Opt-In Support Mode: limited visibility when student requests follow-up
 */

import type { MechanismId, PatternId, MechanismStrength, PatternValence } from "./clinical-constants";
import type { Grade, MasteryTier, ScenarioDifficulty } from "./types-v2";

// ============================================================================
// INSTITUTION
// ============================================================================

export interface Institution {
  id: string;
  slug: string; // URL-friendly: "state-u"
  name: string;
  logoUrl: string | null;
  resourceMappings: ResourceMapping[];
  createdAt: number;
}

export interface ResourceMapping {
  type: "counseling" | "advising" | "accessibility" | "wellness" | "crisis" | "custom";
  label: string;
  url: string;
}

// ============================================================================
// STAFF (Admin/Config layer - not core daily surface)
// ============================================================================

export type StaffRole = "counselor" | "wellness" | "admin";

export interface StaffMember {
  id: string;
  institutionId: string;
  email: string;
  name: string;
  role: StaffRole;
  createdAt: number;
}

// ============================================================================
// COHORT
// ============================================================================

export interface Cohort {
  id: string;
  institutionId: string;
  name: string;
  description: string;
  createdAt: number;
  createdBy: string; // staffId
}

// ============================================================================
// PLAYLIST
// ============================================================================

export interface Playlist {
  id: string;
  institutionId: string | null; // null = HeyPsych-created
  title: string;
  description: string;
  supportContext: string; // "For students struggling to get to class"
  scenarioIds: string[];
  targetMechanisms: MechanismId[];
  estimatedMinutes: number;
  difficulty: ScenarioDifficulty;
  createdBy: string | null; // staffId or null for HeyPsych
  createdAt: number;
}

export interface PlaylistAssignment {
  id: string;
  playlistId: string;
  cohortId: string | null;
  staffReferralId: string | null;
  createdAt: number;
}

// ============================================================================
// CAMPUS CONTEXT (Client-side, stored in localStorage)
// ============================================================================

export interface CampusContext {
  institutionId: string;
  institutionSlug: string;
  institutionName: string;
  cohortId: string | null;
  playlistId: string | null;
  staffReferralId: string | null;
  enteredAt: number;
}

// ============================================================================
// DATA MODE 1: ANONYMOUS CAMPUS MODE
// Aggregate-only, no student identity
// ============================================================================

/**
 * Anonymous aggregate record sent for institutional reporting.
 * Contains NO student identity. Only aggregate-friendly data.
 */
export interface AnonymousRunRecord {
  // Context
  institutionId: string;
  cohortId: string | null;
  playlistId: string | null;
  scenarioId: string;
  timestamp: number;

  // Engagement (aggregate-friendly)
  completed: boolean;
  isReplay: boolean;
  grade: Grade;

  // Clinical (aggregate-friendly)
  mechanismsScored: AnonymousMechanismScore[];
  patternsDetected: AnonymousPatternRecord[];

  // Transfer (aggregate-friendly)
  transferActionType: TransferActionType | null;
  resourceClicked: string | null; // resource type, not full URL

  // NO student identity fields
  // NO run transcript
  // NO choice sequence
  // NO metric values
}

export interface AnonymousMechanismScore {
  mechanism: MechanismId;
  strength: MechanismStrength;
}

export interface AnonymousPatternRecord {
  pattern: PatternId;
  valence: PatternValence;
}

export type TransferActionType =
  | "commit_24h"      // "I'll do this in the next 24 hours"
  | "smaller_step"    // "I need a smaller step first"
  | "talk_to_someone" // "I want to talk to someone about this"
  | "practice_only";  // "Just practicing for now"

// ============================================================================
// DATA MODE 2: STUDENT-OPT-IN SUPPORT MODE
// Limited individual visibility ONLY when student explicitly requests
// ============================================================================

/**
 * Follow-up request created ONLY when student opts in.
 * Contains limited context for staff follow-up conversation.
 */
export interface FollowUpRequest {
  id: string;
  institutionId: string;
  cohortId: string | null;
  staffReferralId: string | null;

  // Student-provided identifier (student chooses what to share)
  studentIdentifier: string;

  // Limited context for follow-up
  scenarioId: string;
  scenarioTitle: string;
  transferPrompt: string;
  selectedAction: TransferActionType;
  smallestBetterMove: string | null;

  // Timestamps
  timestamp: number;

  // Resolution tracking
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: number | null;
  resolvedNotes: string | null;
}

/**
 * Shared commitment created when student explicitly shares with staff.
 * More detailed than follow-up request, but still limited.
 */
export interface SharedCommitment {
  id: string;
  institutionId: string;
  staffReferralId: string | null;

  // Student-provided
  studentIdentifier: string;
  studentNote: string | null;

  // Commitment details
  scenarioId: string;
  scenarioTitle: string;
  transferPrompt: string;
  selectedAction: TransferActionType;
  concreteCommitment: string; // What student committed to do

  // Limited clinical context (what staff needs for conversation)
  primaryMechanismPracticed: MechanismId | null;
  mechanismStrength: MechanismStrength | null;

  timestamp: number;
}

// ============================================================================
// CLIENT-SIDE TRANSFER TRACKING
// ============================================================================

export interface TransferCommitment {
  runId: string;
  scenarioId: string;
  transferPrompt: string;
  selectedAction: TransferActionType;
  concreteCommitment: string | null;
  smallestBetterMoveSelected: boolean;
  campusResourceClicked: string | null;
  followUpRequested: boolean;
  sharedWithStaff: boolean;
  timestamp: number;
}

// ============================================================================
// AGGREGATE REPORTING (Staff Dashboard)
// ============================================================================

export interface CohortEngagementSummary {
  cohortId: string;
  cohortName: string;
  periodStart: number;
  periodEnd: number;

  // Engagement metrics
  studentsEngaged: number;
  scenariosStarted: number;
  scenariosCompleted: number;
  completionRate: number;
  replays: number;

  // Grade distribution
  gradeDistribution: Record<Grade, number>;
}

export interface CohortMechanismSummary {
  cohortId: string;
  periodStart: number;
  periodEnd: number;

  // Mechanism practice distribution
  mechanismPractice: MechanismPracticeSummary[];
}

export interface MechanismPracticeSummary {
  mechanism: MechanismId;
  totalPracticed: number;
  strengthDistribution: Record<MechanismStrength, number>;
}

export interface CohortTransferSummary {
  cohortId: string;
  periodStart: number;
  periodEnd: number;

  // Transfer patterns
  transferActionsTotal: number;
  actionDistribution: Record<TransferActionType, number>;

  // Resource engagement
  resourceClicks: ResourceClickSummary[];

  // Follow-up
  followUpRequestsCount: number;
}

export interface ResourceClickSummary {
  resourceType: string;
  clicks: number;
}

// ============================================================================
// STAFF PORTAL VIEWS (Core three surfaces)
// ============================================================================

/**
 * View 1: Assign / Recommend
 * Generate recommendation links, assign playlists
 */
export interface RecommendationLink {
  type: "scenario" | "playlist";
  targetId: string;
  targetTitle: string;
  institutionSlug: string;
  cohortId: string | null;
  staffReferralId: string;
  generatedUrl: string;
  createdAt: number;
}

/**
 * View 2: Cohort Overview
 * Aggregate-only view of cohort engagement
 */
export interface CohortOverview {
  cohort: Cohort;
  engagement: CohortEngagementSummary;
  mechanisms: CohortMechanismSummary;
  transfers: CohortTransferSummary;
}

/**
 * View 3: Follow-Up Queue
 * Students who opted into support mode
 */
export interface FollowUpQueueItem {
  request: FollowUpRequest;
  daysSinceRequest: number;
  priority: "normal" | "recent" | "overdue";
}

// ============================================================================
// PLAYLIST PROGRESS (Client-side)
// ============================================================================

export interface PlaylistProgress {
  playlistId: string;
  scenariosCompleted: string[];
  currentScenarioIndex: number;
  startedAt: number;
  lastPlayedAt: number;
  transferCommitments: TransferCommitment[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CAMPUS_CONTEXT_STORAGE_KEY = "psychtrails_campus_context";
export const TRANSFER_COMMITMENTS_STORAGE_KEY = "psychtrails_transfer_commitments";
export const PLAYLIST_PROGRESS_STORAGE_KEY = "psychtrails_playlist_progress";
export const FOLLOWUP_REQUESTS_STORAGE_KEY = "psychtrails_followup_requests";

// Student-facing labels (shown to students)
export const TRANSFER_ACTION_LABELS: Record<TransferActionType, string> = {
  commit_24h: "I'll try this tomorrow",
  smaller_step: "I need something smaller",
  talk_to_someone: "I want to talk to someone first",
  practice_only: "Just practicing for now",
};

// Staff-facing labels (shown in dashboards/reports)
export const TRANSFER_ACTION_STAFF_LABELS: Record<TransferActionType, string> = {
  commit_24h: "Committed to next step",
  smaller_step: "Requested smaller step",
  talk_to_someone: "Wants to talk first",
  practice_only: "Practice only",
};

export const RESOURCE_TYPE_LABELS: Record<ResourceMapping["type"], string> = {
  counseling: "Counseling Center",
  advising: "Academic Advising",
  accessibility: "Accessibility Services",
  wellness: "Wellness Center",
  crisis: "Crisis Support",
  custom: "Campus Resource",
};

// Staff-facing follow-up queue labels
export const FOLLOWUP_PRIORITY_LABELS: Record<FollowUpQueueItem["priority"], string> = {
  recent: "New today",
  normal: "Pending",
  overdue: "Needs attention",
};

// Cohort overview section labels
export const COHORT_SECTION_LABELS = {
  engagement: "Engagement",
  mechanisms: "Skills Practiced",
  transfers: "Next Steps",
  followUp: "Follow-Up Requests",
} as const;

// Mechanism display names for staff (clearer than clinical names)
export const MECHANISM_STAFF_LABELS: Record<string, string> = {
  activation: "Getting started",
  persistence: "Staying with it",
  recovery: "Bouncing back",
  interpretation: "Reading situations",
  self_compassion: "Self-kindness",
  directness: "Direct communication",
  distress_tolerance: "Tolerating discomfort",
  flexibility: "Adjusting approach",
  support_seeking: "Asking for help",
  threshold_lowering: "Finding smaller steps",
};
