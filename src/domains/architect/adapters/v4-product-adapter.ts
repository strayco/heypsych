/**
 * V4 Product Adapter
 *
 * Derives ProductArchitectureMetadata from ClinicianToolV4 data.
 * Used when explicit Architect metadata is not available.
 */

import type { ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";
import {
  ProductArchitectureMetadataZ,
  type ProductArchitectureMetadata,
  type ProductArchitectureMetadataInput,
  type ProductCapability,
  type ProductCapabilityInput,
  type ProductIntegration,
  type ProductIntegrationInput,
  type PracticeFitEvidenceInput,
  type StructuredPricingInput,
  type CapabilityStrength,
  type PricingBasis,
  type PracticeType,
  type PracticeSizeBucket,
  type ClinicalRole,
} from "../schemas";
import { mapV4ToArchitectCapabilities } from "./capability-mapping";

// ============================================================================
// AUDIENCE MAPPINGS
// ============================================================================

const PRACTICE_SETTING_TO_TYPE: Record<string, PracticeType> = {
  "solo-practice": "solo-clinician",
  "group-practice": "therapy-group",
  "community-mental-health": "community-behavioral-health",
  "hospital-inpatient": "iop-php",
  "telehealth-only": "telehealth-first",
  "multi-site-enterprise": "therapy-group",
  "integrated-care": "therapy-plus-psychiatry",
  "residential-treatment": "iop-php",
};

const ORG_SIZE_TO_BUCKET: Record<string, PracticeSizeBucket[]> = {
  solo: ["solo"],
  "small-2-10": ["2-5", "6-10"],
  "medium-11-50": ["11-25", "26-50"],
  "large-51-200": ["51-100", "101-250"],
  "enterprise-200-plus": ["101-250", "250+"],
};

const CLINICIAN_ROLE_TO_CLINICAL: Record<string, ClinicalRole> = {
  psychiatrist: "psychiatrist",
  psychologist: "psychologist",
  "therapist-lcsw-lmft": "therapist",
  "psychiatric-np-pa": "psychiatric-np",
  "practice-administrator": "administrator",
  "billing-specialist": "biller",
  "care-coordinator": "care-coordinator",
  "medical-director": "psychiatrist",
};

// ============================================================================
// PRIMARY CATEGORY → CORE CAPABILITIES
// ============================================================================

/**
 * Maps V4 primary category to the core Architect capabilities
 * Products in a category should have "core" strength for these
 */
const CATEGORY_CORE_CAPABILITIES: Record<string, string[]> = {
  "ehr-practice-management": [
    "ehr-clinical-record",
    "clinical-documentation",
    "scheduling",
    "appointment-reminders", // Standard EHR feature - virtually all EHRs have this
    "intake", // Standard EHR feature - patient onboarding/intake
  ],
  "ai-scribe-documentation": ["ai-documentation-scribe", "clinical-documentation"],
  // IMPORTANT: billing-rcm-insurance is too broad - it includes:
  // - Full RCM platforms (Waystar, Cedar) - have explicit capabilities
  // - Payment processors (IvyPay, Stripe) - only do payment-processing
  // - Clearinghouses - have clearinghouse capability
  // - Denial management tools - have denial-management capability
  // Don't blanket-map; rely on explicit V4 capabilities for proper mapping
  "billing-rcm-insurance": [],
  "telehealth-communication": ["telehealth", "secure-messaging"],
  // credentialing-workforce: Most tools here handle payer credentialing
  "credentialing-workforce": ["credentialing-payer-enrollment"],
  // clinical-supervision: Supervision platforms for clinicians
  "clinical-supervision": ["clinical-supervision", "quality-assurance"],
  // Provider networks: NOT all have telehealth (e.g., Headway, Alma are credentialing platforms)
  // Telehealth is derived from feature_flags.has_telehealth instead
  "provider-network-virtual-care": [
    "patient-acquisition",
    "provider-matching",
    "credentialing-payer-enrollment",
  ],
  "measurement-outcomes-dtx": ["assessments-mbc"],
  // Digital therapeutics - FDA-cleared treatment delivery tools
  "digital-therapeutics": ["assessments-mbc", "treatment-planning"],
  "ai-copilot-clinical": ["ai-documentation-scribe"],
  // Clinical decision support tools help with diagnosis and treatment planning
  "clinical-decision-support": ["treatment-planning"],
  "patient-engagement": ["patient-portal", "secure-messaging", "appointment-reminders"],
  "intake-scheduling-forms": ["intake", "scheduling", "forms-e-signature"],
  "prescribing-erx": ["prescribing-erx", "epcs"],
  "compliance-consent-security": ["compliance-security"],
  "analytics-reporting": ["analytics-bi"],
  "care-coordination-referrals": ["care-coordination", "referrals-transitions"],
};

// ============================================================================
// DERIVATION FUNCTIONS
// ============================================================================

/**
 * Derive Architect metadata from V4 tool data
 */
export function deriveArchitectMetadata(
  tool: ClinicianToolV4
): ProductArchitectureMetadata {
  const input: ProductArchitectureMetadataInput = {
    productSlug: tool.slug,
    capabilityMapStatus: "unreviewed",
    capabilities: deriveCapabilities(tool),
    integrations: deriveIntegrations(tool),
    fitEvidence: deriveFitEvidence(tool),
    pricing: derivePricing(tool),
  };
  // Parse through Zod to apply all defaults
  return ProductArchitectureMetadataZ.parse(input);
}

/**
 * Derive capability mappings from V4 tool
 */
function deriveCapabilities(tool: ClinicianToolV4): ProductCapabilityInput[] {
  const caps: ProductCapabilityInput[] = [];
  const seenCaps = new Set<string>();

  // Get core capabilities from primary category
  const coreCaps = CATEGORY_CORE_CAPABILITIES[tool.primary_category] ?? [];
  for (const capId of coreCaps) {
    if (!seenCaps.has(capId)) {
      seenCaps.add(capId);
      caps.push({
        capabilityId: capId as ProductCapabilityInput["capabilityId"],
        strength: "core",
        provenance: "public_source",
      });
    }
  }

  // Map V4 capabilities to Architect
  const architectCaps = mapV4ToArchitectCapabilities(tool.capabilities);
  for (const capId of architectCaps) {
    if (!seenCaps.has(capId)) {
      seenCaps.add(capId);
      caps.push({
        capabilityId: capId,
        strength: inferStrength(tool, capId),
        provenance: "vendor_provided",
      });
    }
  }

  // Infer from feature flags
  if (tool.feature_flags.has_ai && !seenCaps.has("ai-documentation-scribe")) {
    caps.push({
      capabilityId: "ai-documentation-scribe",
      strength: "strong",
      provenance: "public_source",
    });
    seenCaps.add("ai-documentation-scribe");
  }

  if (tool.feature_flags.has_telehealth && !seenCaps.has("telehealth")) {
    caps.push({
      capabilityId: "telehealth",
      strength: tool.primary_category === "telehealth-communication" ? "core" : "strong",
      provenance: "public_source",
    });
    seenCaps.add("telehealth");
  }

  if (tool.feature_flags.has_patient_portal && !seenCaps.has("patient-portal")) {
    caps.push({
      capabilityId: "patient-portal",
      strength: "strong",
      provenance: "public_source",
    });
    seenCaps.add("patient-portal");
  }

  if (tool.feature_flags.has_e_prescribing && !seenCaps.has("prescribing-erx")) {
    caps.push({
      capabilityId: "prescribing-erx",
      strength: "strong",
      provenance: "public_source",
    });
    seenCaps.add("prescribing-erx");
  }

  if (tool.feature_flags.has_measurement && !seenCaps.has("assessments-mbc")) {
    caps.push({
      capabilityId: "assessments-mbc",
      strength: "strong",
      provenance: "public_source",
    });
    seenCaps.add("assessments-mbc");
  }

  // Infer EHR capability from has_ehr flag (for platforms like Blueprint, Alma that include EHR)
  if (tool.feature_flags.has_ehr && !seenCaps.has("ehr-clinical-record")) {
    caps.push({
      capabilityId: "ehr-clinical-record",
      strength: tool.primary_category === "ehr-practice-management" ? "core" : "strong",
      provenance: "public_source",
    });
    seenCaps.add("ehr-clinical-record");
  }

  // Infer clinical documentation from has_ehr (EHRs always have documentation)
  if (tool.feature_flags.has_ehr && !seenCaps.has("clinical-documentation")) {
    caps.push({
      capabilityId: "clinical-documentation",
      strength: tool.primary_category === "ehr-practice-management" ? "core" : "strong",
      provenance: "public_source",
    });
    seenCaps.add("clinical-documentation");
  }

  // Infer billing/RCM capability from has_rcm flag
  if (tool.feature_flags.has_rcm && !seenCaps.has("billing-rcm")) {
    caps.push({
      capabilityId: "billing-rcm",
      strength: tool.primary_category === "billing-rcm-insurance" ? "core" : "strong",
      provenance: "public_source",
    });
    seenCaps.add("billing-rcm");
  }

  return caps;
}

/**
 * Infer capability strength from tool context
 */
function inferStrength(
  tool: ClinicianToolV4,
  capabilityId: string
): CapabilityStrength {
  // Check if it's a core capability for the primary category
  const coreCaps = CATEGORY_CORE_CAPABILITIES[tool.primary_category] ?? [];
  if (coreCaps.includes(capabilityId)) {
    return "core";
  }

  // Check secondary categories
  for (const secondaryCat of tool.secondary_categories) {
    const secondaryCore = CATEGORY_CORE_CAPABILITIES[secondaryCat] ?? [];
    if (secondaryCore.includes(capabilityId)) {
      return "strong";
    }
  }

  // If a product explicitly has a V4 capability that maps to this architect capability,
  // it's reasonable to assume at least "strong" strength (not "partial")
  // Partial is reserved for capabilities the product barely touches
  return "strong";
}

/**
 * Derive integrations from V4 tool
 */
function deriveIntegrations(tool: ClinicianToolV4): ProductIntegrationInput[] {
  const integrations: ProductIntegrationInput[] = [];

  for (const v4Int of tool.integrations ?? []) {
    // Only include integrations with slugs (can map to products)
    if (v4Int.slug) {
      integrations.push({
        targetSlug: v4Int.slug,
        type: mapIntegrationType(v4Int.integration_type),
        direction: v4Int.bidirectional ? "bidirectional" : "one-way",
        notes: v4Int.notes,
        provenance: v4Int.verified ? "verified" : "vendor_provided",
      });
    }
  }

  return integrations;
}

/**
 * Map V4 integration type to Architect integration type
 */
function mapIntegrationType(
  v4Type?: string
): ProductIntegration["type"] {
  switch (v4Type) {
    case "native":
      return "native";
    case "api":
    case "hl7":
    case "fhir":
      return "api";
    case "zapier":
    case "partner":
      return "third-party";
    case "file-based":
      return "import-export";
    default:
      return "unknown";
  }
}

/**
 * Derive practice fit evidence from V4 audiences
 */
function deriveFitEvidence(tool: ClinicianToolV4): PracticeFitEvidenceInput {
  const practiceTypes: PracticeType[] = [];
  const idealSizes: PracticeSizeBucket[] = [];
  const clinicalRoles: ClinicalRole[] = [];

  // Map practice settings to types
  for (const setting of tool.audiences.practice_settings) {
    const practiceType = PRACTICE_SETTING_TO_TYPE[setting];
    if (practiceType && !practiceTypes.includes(practiceType)) {
      practiceTypes.push(practiceType);
    }
  }

  // Map organization sizes
  for (const size of tool.audiences.organization_sizes) {
    const buckets = ORG_SIZE_TO_BUCKET[size] ?? [];
    for (const bucket of buckets) {
      if (!idealSizes.includes(bucket)) {
        idealSizes.push(bucket);
      }
    }
  }

  // Map clinician roles
  for (const role of tool.audiences.clinician_roles) {
    const clinicalRole = CLINICIAN_ROLE_TO_CLINICAL[role];
    if (clinicalRole && !clinicalRoles.includes(clinicalRole)) {
      clinicalRoles.push(clinicalRole);
    }
  }

  // Derive notes from best_for
  const notes = tool.best_for?.join(". ") || undefined;

  return {
    practiceTypes,
    idealSizes,
    clinicalRoles,
    notes,
    provenance: "vendor_provided",
  };
}

/**
 * Derive structured pricing from V4 pricing
 */
function derivePricing(tool: ClinicianToolV4): StructuredPricingInput | undefined {
  if (!tool.pricing) return undefined;

  const basis = mapPricingBasis(tool.pricing.model);

  return {
    productSlug: tool.slug,
    basis,
    minPriceCents: tool.pricing.starting_price_cents,
    priceDisplayText: tool.pricing.starting_price_display,
    freeTierAvailable: tool.pricing.free_tier ?? false,
    freeTrialDays: tool.pricing.free_trial_days,
    requiresQuote: tool.pricing.quote_required ?? false,
    notes: tool.pricing.notes,
    provenance: tool.pricing.last_verified ? "verified" : "vendor_provided",
    lastVerified: tool.pricing.last_verified,
  };
}

/**
 * Map V4 pricing model to Architect pricing basis
 */
function mapPricingBasis(v4Model?: string): PricingBasis {
  switch (v4Model) {
    case "subscription":
    case "per-user":
      return "per-provider-month";
    case "per-claim":
    case "per-transaction":
      return "per-encounter";
    case "percentage":
      return "percentage-collections";
    case "flat-rate":
      return "flat-monthly";
    case "freemium":
      return "freemium";
    case "free":
      return "free";
    case "custom":
    case "quote":
      return "custom-quote";
    default:
      return "per-provider-month";
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PRACTICE_SETTING_TO_TYPE,
  ORG_SIZE_TO_BUCKET,
  CLINICIAN_ROLE_TO_CLINICAL,
  CATEGORY_CORE_CAPABILITIES,
};
