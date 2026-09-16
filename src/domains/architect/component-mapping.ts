/**
 * Practice Architect v2 - Component Mapping
 *
 * Maps the 7 user-facing components to underlying Architect capabilities.
 * This bridges the simplified v2 model with the existing 48-capability system.
 */

import type { CapabilityId } from "./schemas/lifecycle";
import type { ComponentId, ZoneId } from "./schemas/practice-v2";
import type { ProductArchitectureMetadata } from "./schemas/product-metadata";
import {
  Globe,
  Calendar,
  ClipboardList,
  FileText,
  Video,
  Pill,
  CreditCard,
  ShieldCheck,
  Calculator,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

export interface ComponentDefinition {
  id: ComponentId;
  name: string;
  description: string;
  zone: ZoneId;
  /** Underlying Architect capabilities this component represents */
  capabilities: CapabilityId[];
  /** Icon component */
  icon: LucideIcon;
  /** Whether this is typically bundled in an EHR/practice management system */
  typicallyBundled: boolean;
  /** Whether this is an external service (not software) */
  isExternal?: boolean;
  /** External links for non-software components like malpractice */
  externalLinks?: Array<{
    name: string;
    url: string;
    description?: string;
  }>;
}

export const COMPONENT_DEFINITIONS: Record<ComponentId, ComponentDefinition> = {
  website: {
    id: "website",
    name: "Website",
    description: "Practice website to attract new patients",
    zone: "get-patients-in",
    capabilities: [], // External service, not mental health-specific software
    icon: Globe,
    typicallyBundled: false,
    isExternal: true,
    externalLinks: [
      {
        name: "Squarespace",
        url: "https://www.squarespace.com/",
        description: "Beautiful templates, easy to use",
      },
      {
        name: "Wix",
        url: "https://www.wix.com/",
        description: "Drag-and-drop website builder",
      },
      {
        name: "WordPress",
        url: "https://wordpress.com/",
        description: "Most flexible, requires more setup",
      },
      {
        name: "Psychology Today",
        url: "https://www.psychologytoday.com/us/therapists",
        description: "Therapist directory listing",
      },
    ],
  },
  scheduling: {
    id: "scheduling",
    name: "Scheduling",
    description: "Online booking and calendar management",
    zone: "get-patients-in",
    capabilities: ["scheduling", "waitlist-management", "appointment-reminders"],
    icon: Calendar,
    typicallyBundled: true,
  },
  intake: {
    id: "intake",
    name: "Intake",
    description: "New patient paperwork and consent forms",
    zone: "get-patients-in",
    capabilities: ["intake", "forms-e-signature", "screening-triage"],
    icon: ClipboardList,
    typicallyBundled: true,
  },
  "clinical-records": {
    id: "clinical-records",
    name: "Clinical Records",
    description: "Electronic health records and documentation",
    zone: "provide-care",
    capabilities: [
      "ehr-clinical-record",
      "clinical-documentation",
      "treatment-planning",
    ],
    icon: FileText,
    typicallyBundled: false, // This is the primary EHR component
  },
  visits: {
    id: "visits",
    name: "Visits",
    description: "Telehealth video sessions",
    zone: "provide-care",
    capabilities: ["telehealth"],
    icon: Video,
    typicallyBundled: true,
  },
  prescribing: {
    id: "prescribing",
    name: "Prescribing",
    description: "E-prescribing and controlled substances (EPCS)",
    zone: "provide-care",
    capabilities: ["prescribing-erx", "epcs"],
    icon: Pill,
    typicallyBundled: true,
  },
  payments: {
    id: "payments",
    name: "Payments",
    description: "Credit card processing and billing",
    zone: "get-paid",
    capabilities: ["patient-payments", "billing-rcm", "claims-submission"],
    icon: CreditCard,
    typicallyBundled: true,
  },
  malpractice: {
    id: "malpractice",
    name: "Malpractice",
    description: "Professional liability insurance",
    zone: "run-practice",
    capabilities: [], // External service, not software
    icon: ShieldCheck,
    typicallyBundled: false,
    isExternal: true,
    externalLinks: [
      {
        name: "HPSO",
        url: "https://www.hpso.com/",
        description: "Healthcare Providers Service Organization",
      },
      {
        name: "CPH & Associates",
        url: "https://www.cphins.com/",
        description: "Popular among mental health professionals",
      },
      {
        name: "American Professional Agency",
        url: "https://www.americanprofessional.com/",
        description: "Mental health malpractice specialists",
      },
    ],
  },
  accounting: {
    id: "accounting",
    name: "Accounting",
    description: "Bookkeeping and financial tracking",
    zone: "run-practice",
    capabilities: ["accounting"],
    icon: Calculator,
    typicallyBundled: false,
  },
};

// ============================================================================
// ZONE DEFINITIONS
// ============================================================================

export interface ZoneDefinition {
  id: ZoneId;
  name: string;
  components: ComponentId[];
  order: number;
  /** Tailwind color class prefix (e.g., "blue" for blue-500, blue-100, etc.) */
  color: string;
}

export const ZONE_DEFINITIONS: Record<ZoneId, ZoneDefinition> = {
  "get-patients-in": {
    id: "get-patients-in",
    name: "Get Patients In",
    components: ["website", "scheduling", "intake"],
    order: 1,
    color: "blue",
  },
  "provide-care": {
    id: "provide-care",
    name: "Provide Care",
    components: ["clinical-records", "visits", "prescribing"],
    order: 2,
    color: "rose",
  },
  "get-paid": {
    id: "get-paid",
    name: "Get Paid",
    components: ["payments"],
    order: 3,
    color: "emerald",
  },
  "run-practice": {
    id: "run-practice",
    name: "Run the Practice",
    components: ["malpractice", "accounting"],
    order: 4,
    color: "amber",
  },
};

/**
 * Get zones in display order.
 */
export function getOrderedZones(): ZoneDefinition[] {
  return Object.values(ZONE_DEFINITIONS).sort((a, b) => a.order - b.order);
}

/**
 * Get components for a zone in display order.
 */
export function getComponentsForZone(zoneId: ZoneId): ComponentDefinition[] {
  const zone = ZONE_DEFINITIONS[zoneId];
  return zone.components.map((id) => COMPONENT_DEFINITIONS[id]);
}

// ============================================================================
// PRODUCT-TO-COMPONENT MAPPING
// ============================================================================

/**
 * Capability strength thresholds.
 * Products must meet this threshold to be considered "covering" a capability.
 */
const STRENGTH_VALUES: Record<string, number> = {
  core: 1.0,
  strong: 0.8,
  partial: 0.5,
  addon: 0.35,
  "integration-only": 0.2,
};

/**
 * Check if a capability strength meets the threshold.
 */
function meetsStrengthThreshold(
  strength: string,
  threshold: "core" | "strong" | "partial" | "addon" = "strong"
): boolean {
  const strengthValue = STRENGTH_VALUES[strength] ?? 0;
  const thresholdValue = STRENGTH_VALUES[threshold] ?? 0.8;
  return strengthValue >= thresholdValue;
}

/**
 * Determine which components a product covers.
 *
 * A product "covers" a component if it has:
 * - At least 50% of the component's capabilities at "strong" or better, OR
 * - At least 2 capabilities at "strong" or better (for components with many caps)
 */
export function getProductComponentCoverage(
  product: ProductArchitectureMetadata,
  threshold: "core" | "strong" | "partial" | "addon" = "strong"
): ComponentId[] {
  const covered: ComponentId[] = [];

  for (const [componentId, def] of Object.entries(COMPONENT_DEFINITIONS)) {
    // Skip external components (malpractice)
    if (def.isExternal || def.capabilities.length === 0) {
      continue;
    }

    // Count how many of the component's capabilities this product covers
    const coveredCaps = def.capabilities.filter((capId) =>
      product.capabilities.some(
        (pc) =>
          pc.capabilityId === capId && meetsStrengthThreshold(pc.strength, threshold)
      )
    );

    // Component is covered if ≥50% of capabilities OR ≥2 capabilities
    const coverageRatio = coveredCaps.length / def.capabilities.length;
    if (coverageRatio >= 0.5 || coveredCaps.length >= 2) {
      covered.push(componentId as ComponentId);
    }
  }

  return covered;
}

/**
 * Get all components a product could potentially cover.
 * Uses a lower threshold ("partial") for showing potential coverage.
 */
export function getProductPotentialCoverage(
  product: ProductArchitectureMetadata
): ComponentId[] {
  return getProductComponentCoverage(product, "partial");
}

/**
 * Check if a product covers a specific component.
 */
export function productCoversComponent(
  product: ProductArchitectureMetadata,
  componentId: ComponentId,
  threshold: "core" | "strong" | "partial" | "addon" = "strong"
): boolean {
  const coverage = getProductComponentCoverage(product, threshold);
  return coverage.includes(componentId);
}

// ============================================================================
// RECOMMENDATION HELPERS
// ============================================================================

export interface ComponentRecommendation {
  /** Best overall fit for this component */
  recommended: ProductArchitectureMetadata | null;
  /** Lower complexity/cost option */
  simpler: ProductArchitectureMetadata | null;
  /** More features/capabilities option */
  moreCapable: ProductArchitectureMetadata | null;
}

/**
 * Get the number of components a product covers.
 * Used for sorting recommendations.
 */
export function getProductCoverageCount(
  product: ProductArchitectureMetadata
): number {
  return getProductComponentCoverage(product).length;
}

/**
 * Get component definition by ID.
 */
export function getComponent(componentId: ComponentId): ComponentDefinition {
  return COMPONENT_DEFINITIONS[componentId];
}

/**
 * Get zone definition for a component.
 */
export function getZoneForComponent(componentId: ComponentId): ZoneDefinition {
  const component = COMPONENT_DEFINITIONS[componentId];
  return ZONE_DEFINITIONS[component.zone];
}

/**
 * Get all component IDs in display order (by zone, then by position in zone).
 */
export function getAllComponentsOrdered(): ComponentId[] {
  const zones = getOrderedZones();
  const result: ComponentId[] = [];

  for (const zone of zones) {
    result.push(...zone.components);
  }

  return result;
}

/**
 * Get the total number of components.
 */
export const TOTAL_COMPONENT_COUNT = Object.keys(COMPONENT_DEFINITIONS).length;

/**
 * Get initial essential component count (all 7 are essential).
 */
export const ESSENTIAL_COMPONENT_COUNT = TOTAL_COMPONENT_COUNT;

// ============================================================================
// CAPABILITY COVERAGE HELPERS
// ============================================================================

export interface ComponentCapabilityCoverage {
  componentId: ComponentId;
  totalCapabilities: number;
  coveredCapabilities: number;
  coverageRatio: number;
  meetsThreshold: boolean;
  coveredCapabilityIds: CapabilityId[];
}

/**
 * Get detailed capability coverage for a product against a specific component.
 * Returns coverage info even for partial coverage (used for showing all products).
 */
export function getProductCapabilityCoverageForComponent(
  product: ProductArchitectureMetadata,
  componentId: ComponentId,
  threshold: "core" | "strong" | "partial" | "addon" = "strong"
): ComponentCapabilityCoverage | null {
  const def = COMPONENT_DEFINITIONS[componentId];

  // Skip external components
  if (def.isExternal || def.capabilities.length === 0) {
    return null;
  }

  // Find covered capabilities
  const coveredCapabilityIds = def.capabilities.filter((capId) =>
    product.capabilities.some(
      (pc) =>
        pc.capabilityId === capId && meetsStrengthThreshold(pc.strength, threshold)
    )
  );

  const coverageRatio = coveredCapabilityIds.length / def.capabilities.length;
  const meetsThreshold = coverageRatio >= 0.5 || coveredCapabilityIds.length >= 2;

  return {
    componentId,
    totalCapabilities: def.capabilities.length,
    coveredCapabilities: coveredCapabilityIds.length,
    coverageRatio,
    meetsThreshold,
    coveredCapabilityIds: coveredCapabilityIds as CapabilityId[],
  };
}

/**
 * Check if a product has ANY capability for a component (even add-on coverage).
 */
export function productHasAnyCapabilityForComponent(
  product: ProductArchitectureMetadata,
  componentId: ComponentId
): boolean {
  const coverage = getProductCapabilityCoverageForComponent(product, componentId, "addon");
  return coverage !== null && coverage.coveredCapabilities > 0;
}
