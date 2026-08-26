/**
 * Capability Mapping: V4 → Architect
 *
 * Maps V4 ClinicianTool capability slugs to Architect lifecycle capability IDs.
 * This enables derivation of Architect metadata from existing V4 tool data.
 */

import type { CapabilityId } from "../schemas";

/**
 * Map of V4 capability slugs to Architect capability IDs.
 * Some V4 capabilities map to multiple Architect capabilities.
 * Some Architect capabilities have no V4 equivalent (new in Architect).
 */
export const V4_TO_ARCHITECT_CAPABILITY_MAP: Record<string, CapabilityId[]> = {
  // ============================================================================
  // EHR Capabilities → CARE / ACCESS
  // ============================================================================
  "clinical-notes": ["clinical-documentation"],
  "treatment-planning": ["treatment-planning"],
  "appointment-scheduling": ["scheduling"],
  "patient-portal": ["patient-portal"],
  "document-management": ["forms-e-signature"],
  "lab-integration": ["care-coordination"],

  // ============================================================================
  // Billing/RCM Capabilities → REVENUE
  // ============================================================================
  "claims-submission": ["claims-submission"],
  "eligibility-verification": ["eligibility-verification"],
  "prior-authorization": ["eligibility-verification"],
  "payment-processing": ["patient-payments"],
  "denial-management": ["denial-management"],
  "coding-assistance": ["coding"],

  // ============================================================================
  // Telehealth Capabilities → CARE / ENGAGE
  // ============================================================================
  "video-sessions": ["telehealth"],
  "secure-messaging": ["secure-messaging"],
  "async-video": ["telehealth"],
  "mobile-app": ["patient-portal"],
  "waiting-room": ["telehealth"],

  // ============================================================================
  // AI Capabilities → CARE
  // ============================================================================
  "ambient-listening": ["ai-documentation-scribe"],
  "note-generation": ["ai-documentation-scribe", "clinical-documentation"],
  "clinical-summarization": ["ai-documentation-scribe"],
  "voice-transcription": ["ai-documentation-scribe"],
  "ai-suggestions": ["ai-documentation-scribe"],

  // ============================================================================
  // Measurement/Outcomes → CARE
  // ============================================================================
  "outcome-tracking": ["assessments-mbc"],
  "phq9-gad7": ["assessments-mbc"],
  "patient-surveys": ["assessments-mbc"],
  "outcome-measures": ["assessments-mbc"],
  "custom-assessments": ["assessments-mbc"],
  "progress-monitoring": ["assessments-mbc"],
  "reporting-dashboards": ["analytics-bi"],

  // ============================================================================
  // Prescribing → CARE
  // ============================================================================
  "e-prescribing": ["prescribing-erx"],
  "epcs": ["epcs"],
  "epcs-controlled": ["epcs"],
  "pdmp-integration": ["epcs"],
  "drug-interaction-check": ["prescribing-erx"],
  "medication-history": ["prescribing-erx"],
  "medication-management": ["prescribing-erx"],

  // ============================================================================
  // Compliance → OPERATE
  // ============================================================================
  "hipaa-compliance": ["compliance-security"],
  "hipaa-compliant": ["compliance-security"],
  "baa-available": ["compliance-security"],
  "audit-logging": ["compliance-security"],
  "consent-management": ["compliance-security", "forms-e-signature"],
  "sso-authentication": ["compliance-security"],

  // ============================================================================
  // Patient Engagement → ENGAGE / ACCESS
  // ============================================================================
  "patient-reminders": ["appointment-reminders"],
  "patient-communication": ["secure-messaging"],
  "intake-forms": ["intake", "forms-e-signature"],
  "online-booking": ["scheduling"],
  "calendar-sync": ["scheduling"],

  // ============================================================================
  // Analytics → OPERATE
  // ============================================================================
  "reporting": ["analytics-bi"],
  "dashboards": ["analytics-bi"],
  "business-intelligence": ["analytics-bi"],

  // ============================================================================
  // Credentialing → REVENUE
  // ============================================================================
  "credentialing": ["credentialing-payer-enrollment"],
  "payer-enrollment": ["credentialing-payer-enrollment"],

  // ============================================================================
  // Care Coordination → CARE
  // ============================================================================
  "care-coordination": ["care-coordination"],
  "referral-tracking": ["referrals-transitions"],
  "care-team-collaboration": ["care-coordination"],

  // ============================================================================
  // Supervision → OPERATE
  // ============================================================================
  "clinical-supervision": ["clinical-supervision"],
  "supervision-platform": ["clinical-supervision"],

  // ============================================================================
  // Financial Operations → OPERATE / REVENUE
  // ============================================================================
  "accounting": ["accounting"],
  "bookkeeping": ["accounting"],
  "payroll": ["payroll-compensation"],
  "clearinghouse": ["clearinghouse"],
  "patient-financing": ["patient-financing"],
  "payment-plans": ["patient-financing"],
};

/**
 * Reverse map: Architect capability → V4 capabilities
 * Useful for finding V4 tools that cover an Architect capability
 */
export const ARCHITECT_TO_V4_CAPABILITY_MAP: Record<CapabilityId, string[]> = (() => {
  const reverseMap: Record<string, string[]> = {};

  for (const [v4Cap, architectCaps] of Object.entries(V4_TO_ARCHITECT_CAPABILITY_MAP)) {
    for (const archCap of architectCaps) {
      if (!reverseMap[archCap]) {
        reverseMap[archCap] = [];
      }
      reverseMap[archCap].push(v4Cap);
    }
  }

  return reverseMap as Record<CapabilityId, string[]>;
})();

/**
 * Architect capabilities with no V4 equivalent
 * These require explicit Architect metadata or are new concepts
 */
export const ARCHITECT_ONLY_CAPABILITIES: CapabilityId[] = [
  // GROW
  "patient-acquisition",
  "crm-lead-management",
  "reputation-reviews",

  // ACCESS
  "screening-triage",
  "provider-matching",
  "waitlist-management",

  // ENGAGE
  "phone-contact-center",

  // CARE
  "ehr-clinical-record", // Core EHR, not a feature

  // REVENUE
  "billing-rcm", // Composite

  // OPERATE
  "workforce-management",
  "quality-assurance",
];

/**
 * Get Architect capabilities from V4 capability slugs
 */
export function mapV4ToArchitectCapabilities(v4Capabilities: string[]): CapabilityId[] {
  const architectCaps = new Set<CapabilityId>();

  for (const v4Cap of v4Capabilities) {
    const mapped = V4_TO_ARCHITECT_CAPABILITY_MAP[v4Cap];
    if (mapped) {
      for (const cap of mapped) {
        architectCaps.add(cap);
      }
    }
  }

  return Array.from(architectCaps);
}

/**
 * Get V4 capabilities that cover an Architect capability
 */
export function getV4CapabilitiesForArchitect(architectCapability: CapabilityId): string[] {
  return ARCHITECT_TO_V4_CAPABILITY_MAP[architectCapability] ?? [];
}

/**
 * Check if an Architect capability has V4 equivalents
 */
export function hasV4Mapping(architectCapability: CapabilityId): boolean {
  return (
    ARCHITECT_TO_V4_CAPABILITY_MAP[architectCapability]?.length > 0 &&
    !ARCHITECT_ONLY_CAPABILITIES.includes(architectCapability)
  );
}
