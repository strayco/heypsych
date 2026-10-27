/**
 * World Object Registry
 *
 * The authoritative mapping between illustrated objects and practice
 * capabilities.
 *
 * Objects are presentation entities. They are deliberately bound to capability
 * IDs and never to vendor slugs, so the catalog can change completely without
 * touching the scene. An object represents a *function* the practice needs, not
 * a product it must buy; one product may light up several objects.
 *
 * Scene coordinates are expressed in the logical 1440x900 reference space
 * defined in `scene.ts`. No component positions objects with ad-hoc CSS.
 */

import type { CapabilityId } from "../schemas/lifecycle";
import type { PracticeProfile } from "../schemas/practice-project";
import { isCapabilityApplicable } from "../adapters/profile-to-fingerprint";

// ============================================================================
// ZONES
// ============================================================================

/**
 * The four visual zones of the practice. These organize the scene; they are not
 * separate pages or separate recommendation scopes.
 */
export type WorldZoneId = "welcome" | "clinical" | "operations" | "specialist";

export interface WorldZone {
  id: WorldZoneId;
  name: string;
  /** Short description used by the accessible list view. */
  description: string;
  order: number;
}

export const WORLD_ZONES: Record<WorldZoneId, WorldZone> = {
  welcome: {
    id: "welcome",
    name: "Welcome",
    description: "How people find you, book with you, and complete paperwork",
    order: 1,
  },
  clinical: {
    id: "clinical",
    name: "Clinical Care",
    description: "Where you document, meet, and treat",
    order: 2,
  },
  operations: {
    id: "operations",
    name: "Operations",
    description: "Getting paid and running the business",
    order: 3,
  },
  specialist: {
    id: "specialist",
    name: "Specialist",
    description: "Capabilities specific to the services you offer",
    order: 4,
  },
};

export function getOrderedZones(): WorldZone[] {
  return Object.values(WORLD_ZONES).sort((a, b) => a.order - b.order);
}

// ============================================================================
// OBJECT DEFINITIONS
// ============================================================================

export type WorldObjectId =
  | "practice_sign"
  | "reception_calendar"
  | "intake_tablet"
  | "clinical_computer"
  | "ai_scribe"
  | "clinical_cabinet"
  | "telehealth_display"
  | "assessment_kit"
  | "prescribing_station"
  | "payment_terminal"
  | "billing_ledger"
  | "insurance_frame"
  | "accounting_folder"
  | "communication_phone"
  | "team_workspace";

/**
 * How an object decides whether it belongs in this practice's scene.
 *
 * - `always`      : every practice needs this function
 * - `capability`  : applicable when at least one mapped capability applies
 * - `group`       : only for practices with more than one provider
 */
export type ApplicabilityRule = "always" | "capability" | "group";

export interface WorldObjectDefinition {
  objectId: WorldObjectId;

  /** Asset identifier. Resolved by the scene renderer, not by product data. */
  assetId: string;

  zone: WorldZoneId;

  /** Short user-facing label shown in the tooltip and list view. */
  name: string;

  /** One plain-language sentence explaining the function. No vendor claims. */
  description: string;

  /**
   * Capabilities this object represents. Opening the object recommends
   * products across this whole set.
   */
  capabilityIds: CapabilityId[];

  applicabilityRule: ApplicabilityRule;

  /** Logical scene coordinates of the object's anchor point. */
  defaultAnchor: { x: number; y: number };

  /** Logical bounding box, used for layout and hit-area generation. */
  bounds: { width: number; height: number };

  /** Paint order within the scene. Higher draws later. */
  zOrder: number;

  /** Accessible name announced by screen readers. */
  accessibleName: string;

  /**
   * True when the function is normally fulfilled outside the software catalog
   * (for example malpractice insurance). These objects offer guidance and an
   * "already handled" action rather than product recommendations.
   */
  isExternal?: boolean;
}

/**
 * The object registry.
 *
 * Anchors are hand-placed in the 1440x900 reference scene so the room reads as
 * a coherent space: entrance and welcome desk at the left, clinical area in the
 * visually dominant centre, operations at the right, specialist equipment along
 * the back wall.
 */
export const WORLD_OBJECTS: Record<WorldObjectId, WorldObjectDefinition> = {
  practice_sign: {
    objectId: "practice_sign",
    assetId: "practice-sign",
    zone: "welcome",
    name: "Practice presence",
    description:
      "How prospective clients find you: your website and directory listings.",
    capabilityIds: ["patient-acquisition", "reputation-reviews"],
    applicabilityRule: "always",
    defaultAnchor: { x: 888, y: 278 },
    bounds: { width: 132, height: 104 },
    zOrder: 20,
    accessibleName: "Practice presence: website and directory listings",
  },

  reception_calendar: {
    objectId: "reception_calendar",
    assetId: "reception-calendar",
    zone: "welcome",
    name: "Scheduling",
    description:
      "Online booking, your calendar, and appointment reminders.",
    capabilityIds: [
      "scheduling",
      "waitlist-management",
      "appointment-reminders",
    ],
    applicabilityRule: "always",
    defaultAnchor: { x: 680, y: 356 },
    bounds: { width: 118, height: 116 },
    zOrder: 40,
    accessibleName: "Scheduling: online booking and reminders",
  },

  intake_tablet: {
    objectId: "intake_tablet",
    assetId: "intake-tablet",
    zone: "welcome",
    name: "Intake",
    description:
      "New client paperwork, consent forms, and signatures.",
    capabilityIds: ["intake", "forms-e-signature", "screening-triage"],
    applicabilityRule: "always",
    defaultAnchor: { x: 712, y: 376 },
    bounds: { width: 92, height: 72 },
    zOrder: 42,
    accessibleName: "Intake: client paperwork and consent forms",
  },

  communication_phone: {
    objectId: "communication_phone",
    assetId: "communication-phone",
    zone: "welcome",
    name: "Client communication",
    description:
      "Secure messaging and the phone line clients reach you on.",
    capabilityIds: ["secure-messaging", "phone-contact-center", "patient-portal"],
    applicabilityRule: "capability",
    defaultAnchor: { x: 712, y: 396 },
    bounds: { width: 68, height: 60 },
    zOrder: 44,
    accessibleName: "Client communication: secure messaging and phone",
  },

  clinical_computer: {
    objectId: "clinical_computer",
    assetId: "clinical-computer",
    zone: "clinical",
    name: "Clinical records",
    description:
      "Your health record: notes, documentation, and treatment plans.",
    capabilityIds: [
      "ehr-clinical-record",
      "clinical-documentation",
      "treatment-planning",
    ],
    applicabilityRule: "always",
    defaultAnchor: { x: 784, y: 462 },
    bounds: { width: 150, height: 128 },
    zOrder: 46,
    accessibleName: "Clinical records: notes, documentation, treatment plans",
  },

  ai_scribe: {
    objectId: "ai_scribe",
    assetId: "ai-scribe",
    zone: "clinical",
    name: "AI note-taking",
    description:
      "Drafts session notes from a recording or a dictated summary, for you to review and sign.",
    capabilityIds: ["ai-documentation-scribe"],
    applicabilityRule: "capability",
    defaultAnchor: { x: 724, y: 486 },
    bounds: { width: 44, height: 44 },
    zOrder: 47,
    accessibleName: "AI note-taking: drafts session notes for you to review",
  },

  telehealth_display: {
    objectId: "telehealth_display",
    assetId: "telehealth-display",
    zone: "clinical",
    name: "Telehealth",
    description: "Video sessions with clients.",
    capabilityIds: ["telehealth"],
    applicabilityRule: "capability",
    defaultAnchor: { x: 992, y: 340 },
    bounds: { width: 116, height: 108 },
    zOrder: 22,
    accessibleName: "Telehealth: video sessions",
  },

  clinical_cabinet: {
    objectId: "clinical_cabinet",
    assetId: "clinical-cabinet",
    zone: "clinical",
    name: "Records security",
    description:
      "Keeping records private: access controls, audit logs, and secure storage.",
    capabilityIds: ["compliance-security"],
    applicabilityRule: "capability",
    defaultAnchor: { x: 1000, y: 450 },
    bounds: { width: 108, height: 132 },
    zOrder: 30,
    accessibleName: "Records security: access controls and secure storage",
  },

  assessment_kit: {
    objectId: "assessment_kit",
    assetId: "assessment-kit",
    zone: "specialist",
    name: "Assessments",
    description:
      "Administering and scoring measures, and tracking outcomes over time.",
    capabilityIds: ["assessments-mbc"],
    applicabilityRule: "capability",
    defaultAnchor: { x: 1000, y: 428 },
    bounds: { width: 96, height: 84 },
    zOrder: 32,
    accessibleName: "Assessments: measures and outcome tracking",
  },

  prescribing_station: {
    objectId: "prescribing_station",
    assetId: "prescribing-station",
    zone: "specialist",
    name: "Prescribing",
    description:
      "Electronic prescribing, including controlled substances where you are authorized.",
    capabilityIds: ["prescribing-erx", "epcs"],
    applicabilityRule: "capability",
    defaultAnchor: { x: 840, y: 490 },
    bounds: { width: 104, height: 116 },
    zOrder: 52,
    accessibleName: "Prescribing: electronic prescribing workflow",
  },

  payment_terminal: {
    objectId: "payment_terminal",
    assetId: "payment-terminal",
    zone: "operations",
    name: "Payments",
    description: "Taking card payments and handling client balances.",
    capabilityIds: ["patient-payments", "patient-financing"],
    applicabilityRule: "always",
    defaultAnchor: { x: 996, y: 486 },
    bounds: { width: 80, height: 76 },
    zOrder: 50,
    accessibleName: "Payments: card processing and client balances",
  },

  billing_ledger: {
    objectId: "billing_ledger",
    assetId: "billing-ledger",
    zone: "operations",
    name: "Billing and claims",
    description:
      "Coding, claims, clearinghouse submission, and chasing denials.",
    capabilityIds: [
      "billing-rcm",
      "claims-submission",
      "clearinghouse",
      "coding",
      "denial-management",
      "eligibility-verification",
    ],
    applicabilityRule: "capability",
    defaultAnchor: { x: 988, y: 510 },
    bounds: { width: 96, height: 86 },
    zOrder: 54,
    accessibleName: "Billing and claims: coding, claims, and denials",
  },

  accounting_folder: {
    objectId: "accounting_folder",
    assetId: "accounting-folder",
    zone: "operations",
    name: "Accounting",
    description: "Bookkeeping, taxes, and business financials.",
    capabilityIds: ["accounting"],
    applicabilityRule: "always",
    defaultAnchor: { x: 976, y: 528 },
    bounds: { width: 78, height: 72 },
    zOrder: 56,
    accessibleName: "Accounting: bookkeeping and business financials",
  },

  insurance_frame: {
    objectId: "insurance_frame",
    assetId: "insurance-frame",
    zone: "operations",
    name: "Malpractice cover",
    description:
      "Professional liability insurance. Arranged with an insurer, not software.",
    capabilityIds: [],
    applicabilityRule: "always",
    defaultAnchor: { x: 1096, y: 382 },
    bounds: { width: 92, height: 86 },
    zOrder: 24,
    accessibleName: "Malpractice cover: professional liability insurance",
    isExternal: true,
  },

  team_workspace: {
    objectId: "team_workspace",
    assetId: "team-workspace",
    zone: "specialist",
    name: "Team operations",
    description:
      "Managing other clinicians: credentialing, supervision, and permissions.",
    capabilityIds: [
      "credentialing-payer-enrollment",
      "clinical-supervision",
      "workforce-management",
    ],
    applicabilityRule: "group",
    defaultAnchor: { x: 540, y: 500 },
    bounds: { width: 148, height: 108 },
    zOrder: 48,
    accessibleName: "Team operations: credentialing, supervision, permissions",
  },
};

export const ALL_WORLD_OBJECT_IDS = Object.keys(
  WORLD_OBJECTS
) as WorldObjectId[];

// ============================================================================
// APPLICABILITY
// ============================================================================

/**
 * Whether an object belongs in this practice's scene.
 *
 * A small cash-pay solo practice should not be shown a prescribing station, a
 * billing ledger, or a team workspace. Hiding them keeps the room calm and
 * keeps the setup plan honest.
 */
export function isObjectApplicable(
  definition: WorldObjectDefinition,
  profile: PracticeProfile
): boolean {
  switch (definition.applicabilityRule) {
    case "always":
      return true;

    case "group":
      return profile.size !== undefined && profile.size !== "solo";

    case "capability":
      return definition.capabilityIds.some((id) =>
        isCapabilityApplicable(id, profile)
      );
  }
}

/**
 * The objects that make up this practice's scene, in paint order.
 */
export function getApplicableObjects(
  profile: PracticeProfile
): WorldObjectDefinition[] {
  return ALL_WORLD_OBJECT_IDS.map((id) => WORLD_OBJECTS[id])
    .filter((def) => isObjectApplicable(def, profile))
    .sort((a, b) => a.zOrder - b.zOrder);
}

/**
 * Objects grouped by zone, for the accessible list view and mobile layout.
 */
export function getApplicableObjectsByZone(
  profile: PracticeProfile
): Array<{ zone: WorldZone; objects: WorldObjectDefinition[] }> {
  const applicable = getApplicableObjects(profile);
  return getOrderedZones()
    .map((zone) => ({
      zone,
      objects: applicable.filter((o) => o.zone === zone.id),
    }))
    .filter((group) => group.objects.length > 0);
}

/**
 * Objects whose capability set includes the given capability.
 *
 * Used to light up every affected object when one product covers several
 * functions, which is how a single EHR can resolve records, scheduling, and
 * telehealth at once.
 */
export function getObjectsForCapability(
  capabilityId: CapabilityId
): WorldObjectDefinition[] {
  return ALL_WORLD_OBJECT_IDS.map((id) => WORLD_OBJECTS[id]).filter((def) =>
    def.capabilityIds.includes(capabilityId)
  );
}
