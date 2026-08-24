/**
 * Architect Lifecycle & Capability Registry
 *
 * Defines the canonical mental-health practice lifecycle stages and capabilities.
 * Capabilities are data-driven and extensible via registry pattern.
 */

import { z } from "zod";

// ============================================================================
// LIFECYCLE STAGES
// ============================================================================

export const LifecycleStageIdZ = z.enum([
  "grow",
  "access",
  "engage",
  "care",
  "revenue",
  "operate",
]);

export type LifecycleStageId = z.infer<typeof LifecycleStageIdZ>;

export interface LifecycleStageDefinition {
  id: LifecycleStageId;
  name: string;
  description: string;
  order: number;
}

export const LIFECYCLE_STAGES: Record<LifecycleStageId, LifecycleStageDefinition> = {
  grow: {
    id: "grow",
    name: "Grow",
    description: "Patient acquisition and referral management",
    order: 1,
  },
  access: {
    id: "access",
    name: "Access",
    description: "Intake, scheduling, and patient access",
    order: 2,
  },
  engage: {
    id: "engage",
    name: "Engage",
    description: "Patient communication and engagement",
    order: 3,
  },
  care: {
    id: "care",
    name: "Care",
    description: "Clinical documentation and care delivery",
    order: 4,
  },
  revenue: {
    id: "revenue",
    name: "Revenue",
    description: "Billing, coding, and revenue cycle",
    order: 5,
  },
  operate: {
    id: "operate",
    name: "Operate",
    description: "Practice operations and compliance",
    order: 6,
  },
};

// ============================================================================
// CAPABILITY SLUGS
// ============================================================================

/**
 * All capability slugs for the Architect lifecycle.
 * These are stable identifiers used in data and persistence.
 */
export const CapabilityIdZ = z.enum([
  // GROW
  "patient-acquisition",
  "referral-management",
  "crm-lead-management",
  "reputation-reviews",

  // ACCESS
  "intake",
  "screening-triage",
  "eligibility-verification",
  "provider-matching",
  "scheduling",
  "waitlist-management",

  // ENGAGE
  "patient-portal",
  "secure-messaging",
  "phone-contact-center",
  "appointment-reminders",
  "forms-e-signature",

  // CARE
  "ehr-clinical-record",
  "clinical-documentation",
  "ai-documentation-scribe",
  "treatment-planning",
  "telehealth",
  "prescribing-erx",
  "epcs",
  "assessments-mbc",
  "care-coordination",
  "referrals-transitions",

  // REVENUE
  "coding",
  "claims-submission",
  "clearinghouse",
  "billing-rcm",
  "denial-management",
  "patient-payments",
  "patient-financing",
  "credentialing-payer-enrollment",

  // OPERATE
  "analytics-bi",
  "workforce-management",
  "payroll-compensation",
  "accounting",
  "compliance-security",
  "clinical-supervision",
  "quality-assurance",
]);

export type CapabilityId = z.infer<typeof CapabilityIdZ>;

// ============================================================================
// CAPABILITY DEFINITION
// ============================================================================

export interface CapabilityDefinition {
  id: CapabilityId;
  stageId: LifecycleStageId;
  name: string;
  description: string;
  order: number;
  /** V4 capability slugs that map to this Architect capability */
  v4CapabilityMappings?: string[];
}

/**
 * The canonical capability registry.
 * Order within stage determines display order.
 */
export const CAPABILITY_REGISTRY: Record<CapabilityId, CapabilityDefinition> = {
  // GROW
  "patient-acquisition": {
    id: "patient-acquisition",
    stageId: "grow",
    name: "Patient acquisition",
    description: "Marketing, SEO, and patient outreach tools",
    order: 1,
  },
  "referral-management": {
    id: "referral-management",
    stageId: "grow",
    name: "Referral management",
    description: "Tracking and managing incoming referrals",
    order: 2,
  },
  "crm-lead-management": {
    id: "crm-lead-management",
    stageId: "grow",
    name: "CRM / lead management",
    description: "Managing prospective patient relationships",
    order: 3,
  },
  "reputation-reviews": {
    id: "reputation-reviews",
    stageId: "grow",
    name: "Reputation / reviews",
    description: "Online reputation and review management",
    order: 4,
  },

  // ACCESS
  "intake": {
    id: "intake",
    stageId: "access",
    name: "Intake",
    description: "New patient intake and onboarding",
    order: 1,
  },
  "screening-triage": {
    id: "screening-triage",
    stageId: "access",
    name: "Screening / triage",
    description: "Initial patient screening and triage",
    order: 2,
  },
  "eligibility-verification": {
    id: "eligibility-verification",
    stageId: "access",
    name: "Eligibility verification",
    description: "Insurance eligibility and benefits verification",
    order: 3,
    v4CapabilityMappings: ["eligibility-verification"],
  },
  "provider-matching": {
    id: "provider-matching",
    stageId: "access",
    name: "Provider matching",
    description: "Matching patients to appropriate providers",
    order: 4,
  },
  "scheduling": {
    id: "scheduling",
    stageId: "access",
    name: "Scheduling",
    description: "Appointment scheduling and calendar management",
    order: 5,
    v4CapabilityMappings: ["appointment-scheduling"],
  },
  "waitlist-management": {
    id: "waitlist-management",
    stageId: "access",
    name: "Waitlist management",
    description: "Managing patient waitlists",
    order: 6,
  },

  // ENGAGE
  "patient-portal": {
    id: "patient-portal",
    stageId: "engage",
    name: "Patient portal",
    description: "Self-service patient portal",
    order: 1,
    v4CapabilityMappings: ["patient-portal"],
  },
  "secure-messaging": {
    id: "secure-messaging",
    stageId: "engage",
    name: "Secure messaging",
    description: "HIPAA-compliant messaging with patients",
    order: 2,
    v4CapabilityMappings: ["secure-messaging"],
  },
  "phone-contact-center": {
    id: "phone-contact-center",
    stageId: "engage",
    name: "Phone / contact center",
    description: "Phone system and contact center",
    order: 3,
  },
  "appointment-reminders": {
    id: "appointment-reminders",
    stageId: "engage",
    name: "Appointment reminders",
    description: "Automated appointment reminders",
    order: 4,
  },
  "forms-e-signature": {
    id: "forms-e-signature",
    stageId: "engage",
    name: "Forms / e-signature",
    description: "Digital forms and e-signature",
    order: 5,
  },

  // CARE
  "ehr-clinical-record": {
    id: "ehr-clinical-record",
    stageId: "care",
    name: "EHR / clinical record",
    description: "Electronic health records and clinical documentation",
    order: 1,
    v4CapabilityMappings: ["clinical-notes", "document-management"],
  },
  "clinical-documentation": {
    id: "clinical-documentation",
    stageId: "care",
    name: "Clinical documentation",
    description: "Clinical note writing and documentation",
    order: 2,
    v4CapabilityMappings: ["clinical-notes"],
  },
  "ai-documentation-scribe": {
    id: "ai-documentation-scribe",
    stageId: "care",
    name: "AI documentation / scribe",
    description: "AI-powered clinical documentation assistance",
    order: 3,
    v4CapabilityMappings: ["note-generation", "ambient-listening", "voice-transcription", "clinical-summarization"],
  },
  "treatment-planning": {
    id: "treatment-planning",
    stageId: "care",
    name: "Treatment planning",
    description: "Treatment plan creation and management",
    order: 4,
    v4CapabilityMappings: ["treatment-planning"],
  },
  "telehealth": {
    id: "telehealth",
    stageId: "care",
    name: "Telehealth",
    description: "Video visits and virtual care delivery",
    order: 5,
    v4CapabilityMappings: ["video-sessions", "waiting-room"],
  },
  "prescribing-erx": {
    id: "prescribing-erx",
    stageId: "care",
    name: "Prescribing / eRx",
    description: "Electronic prescribing",
    order: 6,
    v4CapabilityMappings: ["e-prescribing"],
  },
  "epcs": {
    id: "epcs",
    stageId: "care",
    name: "EPCS",
    description: "Electronic prescribing for controlled substances",
    order: 7,
    v4CapabilityMappings: ["epcs-controlled", "pdmp-integration"],
  },
  "assessments-mbc": {
    id: "assessments-mbc",
    stageId: "care",
    name: "Assessments / MBC",
    description: "Measurement-based care and standardized assessments",
    order: 8,
    v4CapabilityMappings: ["outcome-tracking", "phq9-gad7", "custom-assessments", "progress-monitoring"],
  },
  "care-coordination": {
    id: "care-coordination",
    stageId: "care",
    name: "Care coordination",
    description: "Coordinating care across providers",
    order: 9,
  },
  "referrals-transitions": {
    id: "referrals-transitions",
    stageId: "care",
    name: "Referrals / transitions",
    description: "Managing referrals and care transitions",
    order: 10,
  },

  // REVENUE
  "coding": {
    id: "coding",
    stageId: "revenue",
    name: "Coding",
    description: "Medical coding and code suggestions",
    order: 1,
    v4CapabilityMappings: ["coding-assistance"],
  },
  "claims-submission": {
    id: "claims-submission",
    stageId: "revenue",
    name: "Claims submission",
    description: "Electronic claims submission",
    order: 2,
    v4CapabilityMappings: ["claims-submission"],
  },
  "clearinghouse": {
    id: "clearinghouse",
    stageId: "revenue",
    name: "Clearinghouse",
    description: "Claims clearinghouse services",
    order: 3,
  },
  "billing-rcm": {
    id: "billing-rcm",
    stageId: "revenue",
    name: "Billing / RCM",
    description: "Revenue cycle management and billing",
    order: 4,
  },
  "denial-management": {
    id: "denial-management",
    stageId: "revenue",
    name: "Denial management",
    description: "Managing and appealing claim denials",
    order: 5,
    v4CapabilityMappings: ["denial-management"],
  },
  "patient-payments": {
    id: "patient-payments",
    stageId: "revenue",
    name: "Patient payments",
    description: "Patient payment collection and processing",
    order: 6,
    v4CapabilityMappings: ["payment-processing"],
  },
  "patient-financing": {
    id: "patient-financing",
    stageId: "revenue",
    name: "Patient financing",
    description: "Patient financing and payment plans",
    order: 7,
  },
  "credentialing-payer-enrollment": {
    id: "credentialing-payer-enrollment",
    stageId: "revenue",
    name: "Credentialing / payer enrollment",
    description: "Provider credentialing and payer enrollment",
    order: 8,
  },

  // OPERATE
  "analytics-bi": {
    id: "analytics-bi",
    stageId: "operate",
    name: "Analytics / BI",
    description: "Business intelligence and reporting",
    order: 1,
    v4CapabilityMappings: ["reporting-dashboards"],
  },
  "workforce-management": {
    id: "workforce-management",
    stageId: "operate",
    name: "Workforce management",
    description: "Staff scheduling and workforce management",
    order: 2,
  },
  "payroll-compensation": {
    id: "payroll-compensation",
    stageId: "operate",
    name: "Payroll / compensation",
    description: "Payroll and provider compensation",
    order: 3,
  },
  "accounting": {
    id: "accounting",
    stageId: "operate",
    name: "Accounting",
    description: "Financial accounting and bookkeeping",
    order: 4,
  },
  "compliance-security": {
    id: "compliance-security",
    stageId: "operate",
    name: "Compliance / security",
    description: "HIPAA compliance and security management",
    order: 5,
    v4CapabilityMappings: ["hipaa-compliant", "audit-logging", "consent-management"],
  },
  "clinical-supervision": {
    id: "clinical-supervision",
    stageId: "operate",
    name: "Clinical supervision",
    description: "Clinical supervision and oversight",
    order: 6,
  },
  "quality-assurance": {
    id: "quality-assurance",
    stageId: "operate",
    name: "Quality assurance",
    description: "Quality assurance and outcome tracking",
    order: 7,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get capabilities for a specific stage, ordered by display order
 */
export function getCapabilitiesForStage(stageId: LifecycleStageId): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY)
    .filter((cap) => cap.stageId === stageId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get all stages ordered by display order
 */
export function getOrderedStages(): LifecycleStageDefinition[] {
  return Object.values(LIFECYCLE_STAGES).sort((a, b) => a.order - b.order);
}

/**
 * Get all capabilities ordered by stage then by order within stage
 */
export function getAllCapabilitiesOrdered(): CapabilityDefinition[] {
  const stages = getOrderedStages();
  const result: CapabilityDefinition[] = [];

  for (const stage of stages) {
    result.push(...getCapabilitiesForStage(stage.id));
  }

  return result;
}

/**
 * Get stage for a capability
 */
export function getStageForCapability(capabilityId: CapabilityId): LifecycleStageDefinition {
  const capability = CAPABILITY_REGISTRY[capabilityId];
  return LIFECYCLE_STAGES[capability.stageId];
}

/**
 * Validate a capability ID
 */
export function isValidCapabilityId(id: string): id is CapabilityId {
  return id in CAPABILITY_REGISTRY;
}

/**
 * Get capability by ID (with type guard)
 */
export function getCapability(id: CapabilityId): CapabilityDefinition {
  return CAPABILITY_REGISTRY[id];
}

/**
 * Total capability count
 */
export const TOTAL_CAPABILITY_COUNT = Object.keys(CAPABILITY_REGISTRY).length;
