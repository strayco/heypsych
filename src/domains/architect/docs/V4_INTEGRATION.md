# V4 Clinician Tools → Architect Integration

## Overview

This document describes how the existing V4 clinician tools infrastructure integrates with the new Architect stack builder domain.

## Data Architecture

### Current State

```
ClinicianToolV4 (887 tools)
├── Identity: id, slug, name, company_name
├── Classification: primary_category, capabilities[]
├── Audiences: clinician_roles, practice_settings, organization_sizes
├── Pricing: model, starting_price, free_tier
├── Compliance: hipaa, baa, soc2
├── Integrations: name, category, integration_type
└── Governance: last_reviewed, data_quality_score
```

```
ProductArchitectureMetadata (Architect extension)
├── productSlug: links to ClinicianToolV4.slug
├── capabilities[]: CapabilityId with strength & provenance
├── integrations[]: product-to-product compatibility
├── fitEvidence: practice type/size/role fit
└── pricing: structured for cost calculations
```

### Integration Strategy

**Option A: Layered Data (Recommended)**
- V4 JSON files remain canonical for product display
- Architect metadata stored separately in `/data/architect-metadata/`
- Runtime adapter merges V4 + Architect data
- Pros: Clean separation, V4 tools work without Architect
- Cons: Two files per product

**Option B: Extended V4 Schema**
- Add `architect_metadata` field to V4 JSON
- Single source of truth per product
- Pros: Single file
- Cons: V4 schema grows, tight coupling

## Capability Mapping

### V4 CapabilitySlug → Architect CapabilityId

```typescript
const V4_TO_ARCHITECT_CAPABILITY_MAP: Record<string, CapabilityId[]> = {
  // EHR Capabilities
  "clinical-notes": ["clinical-documentation"],
  "treatment-planning": ["treatment-planning"],
  "appointment-scheduling": ["scheduling"],
  "patient-portal": ["patient-portal"],
  "document-management": ["forms-e-signature"],
  "lab-integration": ["care-coordination"],

  // Billing/RCM Capabilities
  "claims-submission": ["claims-submission"],
  "eligibility-verification": ["eligibility-verification"],
  "prior-authorization": ["eligibility-verification"],
  "payment-processing": ["patient-payments"],
  "denial-management": ["denial-management"],
  "coding-assistance": ["coding"],

  // Telehealth Capabilities
  "video-sessions": ["telehealth"],
  "secure-messaging": ["secure-messaging"],
  "async-video": ["telehealth"],
  "mobile-app": ["patient-portal"],
  "waiting-room": ["telehealth"],

  // AI Capabilities
  "ambient-listening": ["ai-documentation-scribe"],
  "note-generation": ["ai-documentation-scribe"],
  "clinical-summarization": ["ai-documentation-scribe"],
  "voice-transcription": ["ai-documentation-scribe"],
  "ai-suggestions": ["ai-documentation-scribe"],

  // Measurement/Outcomes
  "outcome-tracking": ["assessments-mbc"],
  "phq9-gad7": ["assessments-mbc"],
  "patient-surveys": ["assessments-mbc"],

  // Prescribing
  "e-prescribing": ["prescribing-erx"],
  "epcs": ["epcs"],
  "pdmp-integration": ["epcs"],

  // Compliance
  "hipaa-compliance": ["compliance-security"],
  "audit-logging": ["compliance-security"],
};
```

### Audience Mapping

```typescript
// V4 PracticeSetting → Architect PracticeType
const SETTING_TO_PRACTICE_TYPE: Record<PracticeSetting, PracticeType> = {
  "solo-practice": "solo-clinician",
  "group-practice": "therapy-group",
  "community-mental-health": "community-behavioral-health",
  "hospital-inpatient": "iop-php",
  "telehealth-only": "telehealth-first",
  "multi-site-enterprise": "therapy-group",
  "integrated-care": "therapy-plus-psychiatry",
  "residential-treatment": "iop-php",
};

// V4 OrganizationSize → Architect PracticeSizeBucket
const SIZE_TO_BUCKET: Record<OrganizationSize, PracticeSizeBucket> = {
  "solo": "solo",
  "small-2-10": "2-5",  // or "6-10"
  "medium-11-50": "11-25", // or "26-50"
  "large-51-200": "51-100",
  "enterprise-200-plus": "101-plus",
};

// V4 ClinicianRole → Architect ClinicalRole
const ROLE_MAP: Record<ClinicianRole, ClinicalRole> = {
  "psychiatrist": "psychiatrist",
  "psychologist": "psychologist",
  "therapist-lcsw-lmft": "therapist",
  "psychiatric-np-pa": "psychiatric-np",
  "practice-administrator": "administrator",
  "billing-specialist": "biller",
  "care-coordinator": "care-coordinator",
  "medical-director": "psychiatrist",
};
```

## Product Metadata Adapter

```typescript
// src/domains/architect/adapters/v4-product-adapter.ts

import { ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";
import { ProductArchitectureMetadata, CapabilityStrength } from "../schemas";

/**
 * Derive Architect metadata from V4 tool data
 * Used when explicit architect metadata is not available
 */
export function deriveArchitectMetadata(
  tool: ClinicianToolV4
): ProductArchitectureMetadata {
  return {
    productSlug: tool.slug,
    capabilityMapStatus: "unreviewed", // Not manually reviewed
    capabilities: deriveCapabilities(tool),
    integrations: deriveIntegrations(tool),
    fitEvidence: deriveFitEvidence(tool),
    pricing: derivePricing(tool),
  };
}

function deriveCapabilities(tool: ClinicianToolV4): ProductCapability[] {
  const caps: ProductCapability[] = [];

  for (const v4Cap of tool.capabilities) {
    const architectCaps = V4_TO_ARCHITECT_CAPABILITY_MAP[v4Cap];
    if (architectCaps) {
      for (const capId of architectCaps) {
        // Avoid duplicates
        if (!caps.some(c => c.capabilityId === capId)) {
          caps.push({
            capabilityId: capId,
            strength: inferStrength(tool, v4Cap),
            provenance: "vendor_provided",
          });
        }
      }
    }
  }

  // Infer from feature flags
  if (tool.feature_flags.has_ai) {
    caps.push({
      capabilityId: "ai-documentation-scribe",
      strength: "strong",
      provenance: "public_source",
    });
  }

  return caps;
}

function inferStrength(
  tool: ClinicianToolV4,
  capability: string
): CapabilityStrength {
  // Primary category match = core
  if (isCoreCategoryCapability(tool.primary_category, capability)) {
    return "core";
  }
  // Secondary category match = strong
  if (tool.secondary_categories.some(c => isCoreCategoryCapability(c, capability))) {
    return "strong";
  }
  // Feature flag match = partial
  return "partial";
}
```

## Runtime Integration

### Loading Products

```typescript
// src/domains/architect/services/product-service.ts

export async function loadProductMetadata(
  slug: string
): Promise<ProductArchitectureMetadata | null> {
  // 1. Check for explicit Architect metadata
  const explicit = await loadExplicitMetadata(slug);
  if (explicit) return explicit;

  // 2. Fall back to V4 derivation
  const v4Tool = await ClinicianToolService.getBySlug(slug);
  if (!v4Tool) return null;

  return deriveArchitectMetadata(v4Tool);
}

export async function loadProductMetadataMap(): Promise<Map<string, ProductArchitectureMetadata>> {
  const map = new Map();

  // Load all publishable V4 tools
  const tools = await ClinicianToolService.loadClinicianTools();

  for (const tool of tools) {
    const metadata = await loadProductMetadata(tool.slug);
    if (metadata) {
      map.set(tool.slug, metadata);
    }
  }

  return map;
}
```

### Display Integration

```typescript
// For UI display, we need both V4 and Architect data
interface ArchitectProduct {
  // From V4
  slug: string;
  name: string;
  logoUrl?: string;
  shortDescription?: string;
  websiteUrl?: string;
  pricing?: ClinicianPricing;
  compliance: ClinicianCompliance;

  // From Architect
  architectMetadata: ProductArchitectureMetadata;
  fitScore?: number;
  coverageContributions: CapabilityId[];
}
```

## Migration Path

### Phase 1: Demo Mode (Current)
- Use fictional demo products for testing
- No integration with real V4 tools
- Stack building works end-to-end

### Phase 2: V4 Derivation
- Derive Architect metadata from V4 tool data
- All 887 tools available in Architect
- Lower quality scores (no manual review)

### Phase 3: Manual Enrichment
- Editorial team reviews top products
- Add explicit Architect metadata files
- Track provenance and last_reviewed

### Phase 4: Full Integration
- Architect metadata becomes part of V4 editorial workflow
- Publication gate includes Architect review
- Full capability coverage tracking

## File Structure

```
/data/
├── tools-v4/
│   └── products/
│       ├── ehr/
│       │   └── simplepractice.json       # V4 tool data
│       └── ...
└── architect-metadata/
    └── products/
        └── simplepractice.architect.json  # Architect extension
```

## Schema Extension (Alternative)

If we go with Option B (extended V4 schema):

```typescript
// Add to ClinicianToolV4Z
architect_metadata: z.object({
  capabilities: z.array(ProductCapabilityZ).optional(),
  integrations: z.array(ProductIntegrationZ).optional(),
  fit_evidence: PracticeFitEvidenceZ.optional(),
  structured_pricing: StructuredPricingZ.optional(),
  capability_map_status: CapabilityMapStatusZ.optional(),
  capability_map_last_reviewed: z.string().optional(),
}).optional(),
```

## Open Questions

1. **Storage**: Layered (separate files) vs Extended (single file)?
2. **Derivation**: How aggressive should capability inference be?
3. **Publication**: Does Architect metadata affect V4 publication gate?
4. **Demo mode**: Keep demo products separate or mix with real?
