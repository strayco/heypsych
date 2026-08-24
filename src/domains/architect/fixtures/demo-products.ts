/**
 * Demo Products Fixture
 *
 * Fictional products for testing and demonstration purposes.
 * These products are clearly marked as demo and never mixed with real data.
 */

import {
  type ProductArchitectureMetadata,
  type ProductArchitectureMetadataInput,
  ProductArchitectureMetadataZ,
} from "../schemas";

/**
 * Demo metadata for fictional products
 * Used for acceptance testing and demonstration
 */
export const DEMO_PRODUCT_METADATA: Record<string, ProductArchitectureMetadataInput> = {
  // ============================================================================
  // ALL-IN-ONE EHR
  // ============================================================================
  "demo-mindcare-ehr": {
    productSlug: "demo-mindcare-ehr",
    capabilityMapStatus: "reviewed-complete",
    capabilityMapLastReviewed: "2024-01-01",
    capabilities: [
      // CARE stage - core EHR functions
      {
        capabilityId: "ehr-clinical-record",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "clinical-documentation",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "treatment-planning",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "assessments-mbc",
        strength: "strong",
        provenance: "unverified",
      },
      // ACCESS stage
      {
        capabilityId: "scheduling",
        strength: "strong",
        provenance: "unverified",
      },
      {
        capabilityId: "intake",
        strength: "strong",
        provenance: "unverified",
      },
      {
        capabilityId: "forms-e-signature",
        strength: "core",
        provenance: "unverified",
      },
      // ENGAGE stage
      {
        capabilityId: "patient-portal",
        strength: "strong",
        provenance: "unverified",
      },
      {
        capabilityId: "secure-messaging",
        strength: "strong",
        provenance: "unverified",
      },
      {
        capabilityId: "appointment-reminders",
        strength: "core",
        provenance: "unverified",
      },
      // REVENUE stage
      {
        capabilityId: "claims-submission",
        strength: "partial",
        provenance: "unverified",
        limitation: "Basic claims only, complex billing requires add-on",
      },
      {
        capabilityId: "patient-payments",
        strength: "strong",
        provenance: "unverified",
      },
      // OPERATE stage
      {
        capabilityId: "analytics-bi",
        strength: "partial",
        provenance: "unverified",
      },
    ],
    integrations: [
      {
        targetSlug: "demo-therapay-billing",
        type: "api",
        direction: "bidirectional",
        provenance: "unverified",
      },
      {
        targetSlug: "demo-rxsync-prescribing",
        type: "native",
        direction: "one-way",
        provenance: "unverified",
      },
    ],
    fitEvidence: {
      practiceTypes: ["therapy-group", "solo-clinician"],
      idealSizes: ["solo", "2-5", "6-10"],
      notes: "Designed for mental health practices",
      provenance: "unverified",
    },
    pricing: {
      basis: "per-provider-month",
      minPriceCents: 9900, // $99/month
      maxPriceCents: 14900, // $149/month
      currency: "USD",
      provenance: "unverified",
      notes: "Includes core features; billing add-on extra",
    },
  },

  // ============================================================================
  // SPECIALIZED BILLING
  // ============================================================================
  "demo-therapay-billing": {
    productSlug: "demo-therapay-billing",
    capabilityMapStatus: "reviewed-complete",
    capabilityMapLastReviewed: "2024-01-01",
    capabilities: [
      // REVENUE stage - comprehensive billing
      {
        capabilityId: "claims-submission",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "billing-rcm",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "denial-management",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "clearinghouse",
        strength: "core",
        provenance: "unverified",
      },
      // ACCESS stage
      {
        capabilityId: "eligibility-verification",
        strength: "core",
        provenance: "unverified",
      },
      // REVENUE stage
      {
        capabilityId: "patient-payments",
        strength: "strong",
        provenance: "unverified",
      },
      // OPERATE stage
      {
        capabilityId: "analytics-bi",
        strength: "strong",
        provenance: "unverified",
      },
    ],
    integrations: [
      {
        targetSlug: "demo-mindcare-ehr",
        type: "api",
        direction: "bidirectional",
        provenance: "unverified",
      },
    ],
    fitEvidence: {
      practiceTypes: ["therapy-group", "solo-clinician"],
      idealSizes: ["solo", "2-5", "6-10", "11-25"],
      payerTypes: ["commercial-insurance", "mixed"],
      notes: "Specialized for behavioral health billing",
      provenance: "unverified",
    },
    pricing: {
      basis: "percentage-collections",
      minPriceCents: 300, // 3% of collections
      maxPriceCents: 600, // 6% of collections
      currency: "USD",
      provenance: "unverified",
      notes: "Percentage of collections model",
    },
  },

  // ============================================================================
  // TELEHEALTH PLATFORM
  // ============================================================================
  "demo-virtualcare-telehealth": {
    productSlug: "demo-virtualcare-telehealth",
    capabilityMapStatus: "reviewed-complete",
    capabilityMapLastReviewed: "2024-01-01",
    capabilities: [
      // CARE stage
      {
        capabilityId: "telehealth",
        strength: "core",
        provenance: "unverified",
      },
      // ENGAGE stage
      {
        capabilityId: "secure-messaging",
        strength: "strong",
        provenance: "unverified",
      },
      // ACCESS stage
      {
        capabilityId: "scheduling",
        strength: "partial",
        provenance: "unverified",
        limitation: "Basic calendar, no complex scheduling rules",
      },
    ],
    integrations: [
      {
        targetSlug: "demo-mindcare-ehr",
        type: "native",
        direction: "bidirectional",
        provenance: "unverified",
      },
    ],
    fitEvidence: {
      practiceTypes: ["solo-clinician", "therapy-group", "telehealth-first"],
      idealSizes: ["solo", "2-5", "6-10", "11-25", "26-50"],
      deliveryModels: ["telehealth", "hybrid", "in-person"],
      provenance: "unverified",
    },
    pricing: {
      basis: "per-provider-month",
      minPriceCents: 4900, // $49/month
      maxPriceCents: 7900, // $79/month
      currency: "USD",
      provenance: "unverified",
    },
  },

  // ============================================================================
  // PRESCRIBING / E-PRESCRIBING
  // ============================================================================
  "demo-rxsync-prescribing": {
    productSlug: "demo-rxsync-prescribing",
    capabilityMapStatus: "reviewed-complete",
    capabilityMapLastReviewed: "2024-01-01",
    capabilities: [
      // CARE stage
      {
        capabilityId: "prescribing-erx",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "epcs",
        strength: "core",
        provenance: "unverified",
      },
    ],
    integrations: [
      {
        targetSlug: "demo-mindcare-ehr",
        type: "native",
        direction: "one-way",
        provenance: "unverified",
      },
    ],
    fitEvidence: {
      practiceTypes: ["solo-clinician", "therapy-group", "psychiatry"],
      clinicalRoles: ["psychiatrist", "psychiatric-np"],
      prescribingLevels: ["controlled-substances-epcs", "prescribing"],
      provenance: "unverified",
    },
    pricing: {
      basis: "per-provider-month",
      minPriceCents: 7500, // $75/month
      maxPriceCents: 12500, // $125/month
      currency: "USD",
      provenance: "unverified",
      notes: "EPCS certification included",
    },
  },

  // ============================================================================
  // AI SCRIBE
  // ============================================================================
  "demo-notegenius-ai": {
    productSlug: "demo-notegenius-ai",
    capabilityMapStatus: "reviewed-complete",
    capabilityMapLastReviewed: "2024-01-01",
    capabilities: [
      // CARE stage
      {
        capabilityId: "clinical-documentation",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "ai-documentation-scribe",
        strength: "core",
        provenance: "unverified",
      },
    ],
    integrations: [
      {
        targetSlug: "demo-mindcare-ehr",
        type: "api",
        direction: "one-way",
        provenance: "unverified",
      },
    ],
    fitEvidence: {
      practiceTypes: ["solo-clinician", "therapy-group"],
      idealSizes: ["solo", "2-5", "6-10"],
      provenance: "unverified",
    },
    pricing: {
      basis: "per-provider-month",
      minPriceCents: 9900, // $99/month
      maxPriceCents: 14900, // $149/month
      currency: "USD",
      provenance: "unverified",
    },
  },

  // ============================================================================
  // PATIENT ENGAGEMENT
  // ============================================================================
  "demo-connectwell-engagement": {
    productSlug: "demo-connectwell-engagement",
    capabilityMapStatus: "reviewed-complete",
    capabilityMapLastReviewed: "2024-01-01",
    capabilities: [
      // ENGAGE stage
      {
        capabilityId: "patient-portal",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "secure-messaging",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "appointment-reminders",
        strength: "core",
        provenance: "unverified",
      },
      // ACCESS stage
      {
        capabilityId: "scheduling",
        strength: "strong",
        provenance: "unverified",
      },
    ],
    integrations: [],
    fitEvidence: {
      practiceTypes: ["solo-clinician", "therapy-group"],
      idealSizes: ["solo", "2-5", "6-10", "11-25"],
      provenance: "unverified",
    },
    pricing: {
      basis: "per-practice-month",
      minPriceCents: 4900, // $49/month
      maxPriceCents: 14900, // $149/month
      currency: "USD",
      provenance: "unverified",
    },
  },

  // ============================================================================
  // OUTCOME MEASUREMENT
  // ============================================================================
  "demo-measurely-outcomes": {
    productSlug: "demo-measurely-outcomes",
    capabilityMapStatus: "reviewed-complete",
    capabilityMapLastReviewed: "2024-01-01",
    capabilities: [
      // CARE stage
      {
        capabilityId: "assessments-mbc",
        strength: "core",
        provenance: "unverified",
      },
      // OPERATE stage
      {
        capabilityId: "analytics-bi",
        strength: "strong",
        provenance: "unverified",
      },
    ],
    integrations: [
      {
        targetSlug: "demo-mindcare-ehr",
        type: "api",
        direction: "bidirectional",
        provenance: "unverified",
      },
    ],
    fitEvidence: {
      practiceTypes: ["solo-clinician", "therapy-group"],
      idealSizes: ["solo", "2-5", "6-10", "11-25"],
      provenance: "unverified",
    },
    pricing: {
      basis: "per-provider-month",
      minPriceCents: 2900, // $29/month
      maxPriceCents: 4900, // $49/month
      currency: "USD",
      provenance: "unverified",
    },
  },

  // ============================================================================
  // MARKETING / GROW STAGE
  // ============================================================================
  "demo-growthpractice-marketing": {
    productSlug: "demo-growthpractice-marketing",
    capabilityMapStatus: "reviewed-complete",
    capabilityMapLastReviewed: "2024-01-01",
    capabilities: [
      // GROW stage
      {
        capabilityId: "patient-acquisition",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "reputation-reviews",
        strength: "strong",
        provenance: "unverified",
      },
      {
        capabilityId: "referral-management",
        strength: "partial",
        provenance: "unverified",
      },
    ],
    integrations: [],
    fitEvidence: {
      practiceTypes: ["solo-clinician", "therapy-group"],
      idealSizes: ["solo", "2-5", "6-10"],
      provenance: "unverified",
    },
    pricing: {
      basis: "per-practice-month",
      minPriceCents: 9900, // $99/month
      maxPriceCents: 29900, // $299/month
      currency: "USD",
      provenance: "unverified",
    },
  },

  // ============================================================================
  // CREDENTIAL / OPERATE STAGE
  // ============================================================================
  "demo-credentialease": {
    productSlug: "demo-credentialease",
    capabilityMapStatus: "reviewed-complete",
    capabilityMapLastReviewed: "2024-01-01",
    capabilities: [
      // REVENUE stage
      {
        capabilityId: "credentialing-payer-enrollment",
        strength: "core",
        provenance: "unverified",
      },
      // OPERATE stage
      {
        capabilityId: "compliance-security",
        strength: "strong",
        provenance: "unverified",
      },
    ],
    integrations: [],
    fitEvidence: {
      practiceTypes: ["therapy-group"],
      idealSizes: ["2-5", "6-10", "11-25", "26-50"],
      payerTypes: ["commercial-insurance", "mixed"],
      provenance: "unverified",
    },
    pricing: {
      basis: "per-provider-month",
      minPriceCents: 4900, // $49/month
      maxPriceCents: 9900, // $99/month
      currency: "USD",
      provenance: "unverified",
    },
  },

  // ============================================================================
  // COMPETING EHR (for overlap testing)
  // ============================================================================
  "demo-therapysuite-ehr": {
    productSlug: "demo-therapysuite-ehr",
    capabilityMapStatus: "reviewed-complete",
    capabilityMapLastReviewed: "2024-01-01",
    capabilities: [
      // CARE stage - similar to demo-mindcare-ehr
      {
        capabilityId: "ehr-clinical-record",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "clinical-documentation",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "treatment-planning",
        strength: "strong",
        provenance: "unverified",
      },
      // ACCESS stage
      {
        capabilityId: "scheduling",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "intake",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "forms-e-signature",
        strength: "strong",
        provenance: "unverified",
      },
      // ENGAGE stage
      {
        capabilityId: "patient-portal",
        strength: "core",
        provenance: "unverified",
      },
      {
        capabilityId: "secure-messaging",
        strength: "core",
        provenance: "unverified",
      },
      // REVENUE stage
      {
        capabilityId: "claims-submission",
        strength: "strong",
        provenance: "unverified",
      },
      {
        capabilityId: "patient-payments",
        strength: "core",
        provenance: "unverified",
      },
    ],
    integrations: [],
    fitEvidence: {
      practiceTypes: ["solo-clinician", "therapy-group"],
      idealSizes: ["solo", "2-5", "6-10"],
      provenance: "unverified",
    },
    pricing: {
      basis: "per-provider-month",
      minPriceCents: 8900, // $89/month
      maxPriceCents: 12900, // $129/month
      currency: "USD",
      provenance: "unverified",
    },
  },
};

/**
 * Get demo product metadata map (with defaults applied via Zod parsing)
 */
export function getDemoProductMetadataMap(): Map<string, ProductArchitectureMetadata> {
  const map = new Map<string, ProductArchitectureMetadata>();
  for (const [slug, rawMeta] of Object.entries(DEMO_PRODUCT_METADATA)) {
    const parsed = ProductArchitectureMetadataZ.parse(rawMeta);
    map.set(slug, parsed);
  }
  return map;
}

/**
 * Demo product display info (for UI)
 */
export interface DemoProductDisplay {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  isDemo: true;
}

export const DEMO_PRODUCT_DISPLAY: DemoProductDisplay[] = [
  {
    slug: "demo-mindcare-ehr",
    name: "MindCare EHR",
    tagline: "All-in-one practice management for mental health",
    category: "EHR / Practice Management",
    isDemo: true,
  },
  {
    slug: "demo-therapay-billing",
    name: "TheraPay Billing",
    tagline: "Specialized behavioral health billing",
    category: "Billing / RCM",
    isDemo: true,
  },
  {
    slug: "demo-virtualcare-telehealth",
    name: "VirtualCare Telehealth",
    tagline: "HIPAA-compliant video sessions",
    category: "Telehealth",
    isDemo: true,
  },
  {
    slug: "demo-rxsync-prescribing",
    name: "RxSync Prescribing",
    tagline: "E-prescribing with EPCS",
    category: "E-Prescribing",
    isDemo: true,
  },
  {
    slug: "demo-notegenius-ai",
    name: "NoteGenius AI",
    tagline: "AI-powered clinical documentation",
    category: "AI Scribe",
    isDemo: true,
  },
  {
    slug: "demo-connectwell-engagement",
    name: "ConnectWell Engagement",
    tagline: "Patient communication & engagement",
    category: "Patient Engagement",
    isDemo: true,
  },
  {
    slug: "demo-measurely-outcomes",
    name: "Measurely Outcomes",
    tagline: "Outcome tracking & measurement",
    category: "Outcome Measurement",
    isDemo: true,
  },
  {
    slug: "demo-growthpractice-marketing",
    name: "GrowthPractice Marketing",
    tagline: "Practice marketing & SEO",
    category: "Marketing",
    isDemo: true,
  },
  {
    slug: "demo-credentialease",
    name: "CredentialEase",
    tagline: "Provider credentialing management",
    category: "Credentialing",
    isDemo: true,
  },
  {
    slug: "demo-therapysuite-ehr",
    name: "TherapySuite EHR",
    tagline: "Comprehensive therapy practice platform",
    category: "EHR / Practice Management",
    isDemo: true,
  },
];

/**
 * Get demo product display by slug
 */
export function getDemoProductDisplay(slug: string): DemoProductDisplay | undefined {
  return DEMO_PRODUCT_DISPLAY.find((p) => p.slug === slug);
}
