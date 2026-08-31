/**
 * Practice Areas Configuration
 *
 * Maps the 6 visual practice areas to underlying capabilities.
 * This provides a simpler mental model for clinicians while
 * preserving the detailed capability system underneath.
 */

import type { CapabilityId, RelevanceLevel, PracticeFingerprint } from "@/domains/architect/schemas";
import type { RelevanceResult } from "@/domains/architect/engines/relevance-engine";

export type PracticeAreaId =
  | "foundation"
  | "front-door"
  | "care"
  | "money"
  | "back-office"
  | "growth";

export interface PracticeAreaItem {
  id: string;
  name: string;
  description: string;
  capabilities: CapabilityId[];
  isFoundational?: boolean; // Non-software items like malpractice
  icon: string; // Lucide icon name
}

export interface PracticeArea {
  id: PracticeAreaId;
  name: string;
  description: string;
  icon: string;
  color: string; // Tailwind color class
  items: PracticeAreaItem[];
}

/**
 * Practice areas with their items and capability mappings
 */
export const PRACTICE_AREAS: Record<PracticeAreaId, PracticeArea> = {
  foundation: {
    id: "foundation",
    name: "Foundation",
    description: "Legal, licensing, and protection essentials",
    icon: "Shield",
    color: "slate",
    items: [
      {
        id: "malpractice",
        name: "Malpractice Insurance",
        description: "Professional liability coverage",
        capabilities: [],
        isFoundational: true,
        icon: "ShieldCheck",
      },
      {
        id: "business-setup",
        name: "Business Setup",
        description: "Entity formation, EIN, contracts",
        capabilities: [],
        isFoundational: true,
        icon: "Building",
      },
      {
        id: "licensure",
        name: "Licensure & NPIs",
        description: "State licenses, NPI numbers, DEA (if prescribing)",
        capabilities: [],
        isFoundational: true,
        icon: "BadgeCheck",
      },
      {
        id: "compliance",
        name: "Privacy & Compliance",
        description: "HIPAA compliance, BAAs, security",
        capabilities: ["compliance-security"],
        icon: "Lock",
      },
    ],
  },

  "front-door": {
    id: "front-door",
    name: "Front Door",
    description: "How clients find and reach you",
    icon: "DoorOpen",
    color: "blue",
    items: [
      {
        id: "website",
        name: "Practice Website",
        description: "Online presence and information",
        capabilities: ["patient-acquisition"],
        icon: "Globe",
      },
      {
        id: "scheduling",
        name: "Scheduling",
        description: "Online booking and calendar",
        capabilities: ["scheduling", "waitlist-management"],
        icon: "Calendar",
      },
      {
        id: "intake",
        name: "Intake & Forms",
        description: "New client paperwork and consent",
        capabilities: ["intake", "forms-e-signature", "screening-triage"],
        icon: "ClipboardList",
      },
      {
        id: "eligibility",
        name: "Eligibility Check",
        description: "Insurance verification before first visit",
        capabilities: ["eligibility-verification"],
        icon: "CreditCard",
      },
      {
        id: "portal",
        name: "Client Portal",
        description: "Self-service for existing clients",
        capabilities: ["patient-portal", "secure-messaging", "appointment-reminders"],
        icon: "Layout",
      },
    ],
  },

  care: {
    id: "care",
    name: "Care",
    description: "Clinical tools for delivering treatment",
    icon: "Heart",
    color: "rose",
    items: [
      {
        id: "ehr",
        name: "EHR / Clinical Record",
        description: "Electronic health records and charts",
        capabilities: ["ehr-clinical-record", "clinical-documentation"],
        icon: "FileText",
      },
      {
        id: "telehealth",
        name: "Telehealth",
        description: "Video sessions and virtual care",
        capabilities: ["telehealth"],
        icon: "Video",
      },
      {
        id: "documentation",
        name: "Notes & Documentation",
        description: "Progress notes and treatment plans",
        capabilities: ["clinical-documentation", "treatment-planning", "ai-documentation-scribe"],
        icon: "PenTool",
      },
      {
        id: "assessments",
        name: "Assessments & Outcomes",
        description: "Standardized measures and tracking",
        capabilities: ["assessments-mbc"],
        icon: "LineChart",
      },
      {
        id: "prescribing",
        name: "Prescribing",
        description: "E-prescribing and EPCS for controlled substances",
        capabilities: ["prescribing-erx", "epcs"],
        icon: "Pill",
      },
      {
        id: "coordination",
        name: "Care Coordination",
        description: "Referrals and care transitions",
        capabilities: ["care-coordination", "referrals-transitions"],
        icon: "Users",
      },
    ],
  },

  money: {
    id: "money",
    name: "Money",
    description: "Getting paid for your services",
    icon: "DollarSign",
    color: "emerald",
    items: [
      {
        id: "payments",
        name: "Client Payments",
        description: "Credit card processing and receipts",
        capabilities: ["patient-payments", "patient-financing"],
        icon: "CreditCard",
      },
      {
        id: "billing",
        name: "Billing & Claims",
        description: "Insurance claims and follow-up",
        capabilities: ["claims-submission", "billing-rcm", "clearinghouse", "coding"],
        icon: "Receipt",
      },
      {
        id: "denials",
        name: "Denial Management",
        description: "Appealing rejected claims",
        capabilities: ["denial-management"],
        icon: "AlertCircle",
      },
      {
        id: "credentialing",
        name: "Credentialing",
        description: "Insurance panel enrollment",
        capabilities: ["credentialing-payer-enrollment"],
        icon: "Award",
      },
    ],
  },

  "back-office": {
    id: "back-office",
    name: "Back Office",
    description: "Running the business side",
    icon: "Briefcase",
    color: "amber",
    items: [
      {
        id: "accounting",
        name: "Accounting",
        description: "Bookkeeping and financial tracking",
        capabilities: ["accounting"],
        icon: "Calculator",
      },
      {
        id: "payroll",
        name: "Payroll & HR",
        description: "Team compensation and benefits",
        capabilities: ["payroll-compensation", "workforce-management"],
        icon: "Users",
      },
      {
        id: "supervision",
        name: "Supervision",
        description: "Clinical oversight and training",
        capabilities: ["clinical-supervision", "quality-assurance"],
        icon: "GraduationCap",
      },
      {
        id: "analytics",
        name: "Analytics & Reports",
        description: "Practice performance insights",
        capabilities: ["analytics-bi"],
        icon: "BarChart",
      },
    ],
  },

  growth: {
    id: "growth",
    name: "Growth",
    description: "Building and expanding your practice",
    icon: "TrendingUp",
    color: "purple",
    items: [
      {
        id: "marketing",
        name: "Marketing",
        description: "Attracting new clients",
        capabilities: ["patient-acquisition"],
        icon: "Megaphone",
      },
      {
        id: "referrals",
        name: "Referral Management",
        description: "Tracking and nurturing referral sources",
        capabilities: ["referral-management", "crm-lead-management"],
        icon: "Share2",
      },
      {
        id: "reviews",
        name: "Reviews & Reputation",
        description: "Online presence and testimonials",
        capabilities: ["reputation-reviews"],
        icon: "Star",
      },
    ],
  },
};

/**
 * Get all practice areas in display order
 */
export function getOrderedPracticeAreas(): PracticeArea[] {
  return [
    PRACTICE_AREAS.foundation,
    PRACTICE_AREAS["front-door"],
    PRACTICE_AREAS.care,
    PRACTICE_AREAS.money,
    PRACTICE_AREAS["back-office"],
    PRACTICE_AREAS.growth,
  ];
}

/**
 * Get practice area by ID
 */
export function getPracticeArea(id: PracticeAreaId): PracticeArea {
  return PRACTICE_AREAS[id];
}

/**
 * Get all capabilities for a practice area
 */
export function getCapabilitiesForArea(areaId: PracticeAreaId): CapabilityId[] {
  const area = PRACTICE_AREAS[areaId];
  const caps: CapabilityId[] = [];
  for (const item of area.items) {
    caps.push(...item.capabilities);
  }
  return [...new Set(caps)]; // Dedupe
}

/**
 * Get all capabilities for an item
 */
export function getCapabilitiesForItem(areaId: PracticeAreaId, itemId: string): CapabilityId[] {
  const area = PRACTICE_AREAS[areaId];
  const item = area.items.find((i) => i.id === itemId);
  return item?.capabilities || [];
}

/**
 * Practice item status for UI display
 */
export type PracticeItemStatus =
  | "ready"           // Fully covered
  | "included"        // Covered by multi-function product
  | "choose"          // Needs product selection
  | "complete"        // User marked as done (foundations)
  | "not-needed"      // Not relevant to this practice
  | "add-later"       // Relevant but deferred
  | "attention"       // Has issue (overlap, compatibility)
  | "unknown";        // No data

/**
 * Human-friendly status labels
 */
export const PRACTICE_ITEM_STATUS_LABELS: Record<PracticeItemStatus, string> = {
  ready: "Ready",
  included: "Included",
  choose: "Choose a product",
  complete: "Complete",
  "not-needed": "Not needed",
  "add-later": "Add later",
  attention: "Needs attention",
  unknown: "Unknown",
};

/**
 * Relevance levels for practice items based on fingerprint
 */
export type ItemRelevance = "core" | "conditional" | "later" | "advanced";

/**
 * Get relevance labels
 */
export const ITEM_RELEVANCE_LABELS: Record<ItemRelevance, string> = {
  core: "Essential",
  conditional: "Recommended",
  later: "Optional",
  advanced: "Advanced",
};

/**
 * Maps capability RelevanceLevel to ItemRelevance for display
 */
function capabilityRelevanceToItemRelevance(level: RelevanceLevel): ItemRelevance {
  switch (level) {
    case "required":
      return "core";
    case "strongly-recommended":
      return "conditional";
    case "useful":
      return "conditional";
    case "optional":
      return "later";
    case "irrelevant":
      return "advanced"; // Using "advanced" for irrelevant in simple mode
  }
}

/**
 * Determine the relevance of a practice item based on its capabilities and the fingerprint.
 * Uses the highest relevance among all capabilities for the item.
 */
export function getItemRelevance(
  item: PracticeAreaItem,
  capabilityRelevanceMap: Map<CapabilityId, RelevanceResult>
): { relevance: ItemRelevance; isRelevant: boolean; highestLevel: RelevanceLevel } {
  // Foundational items (non-software) are always core
  if (item.isFoundational) {
    return { relevance: "core", isRelevant: true, highestLevel: "required" };
  }

  // If no capabilities, treat as optional
  if (item.capabilities.length === 0) {
    return { relevance: "later", isRelevant: true, highestLevel: "optional" };
  }

  // Find the highest relevance level among all capabilities
  const relevancePriority: RelevanceLevel[] = [
    "required",
    "strongly-recommended",
    "useful",
    "optional",
    "irrelevant",
  ];

  let highestLevel: RelevanceLevel = "irrelevant";
  let highestPriority = relevancePriority.length - 1;

  for (const capId of item.capabilities) {
    const result = capabilityRelevanceMap.get(capId);
    if (result) {
      const priority = relevancePriority.indexOf(result.level);
      if (priority < highestPriority) {
        highestPriority = priority;
        highestLevel = result.level;
      }
    }
  }

  // Item is relevant if any capability is not "irrelevant"
  const isRelevant = highestLevel !== "irrelevant";

  return {
    relevance: capabilityRelevanceToItemRelevance(highestLevel),
    isRelevant,
    highestLevel,
  };
}

/**
 * Get all items for an area with their relevance calculated.
 * Filters out irrelevant items unless showAll is true.
 */
export function getRelevantItemsForArea(
  areaId: PracticeAreaId,
  capabilityRelevanceMap: Map<CapabilityId, RelevanceResult>,
  options: { showAll?: boolean } = {}
): Array<PracticeAreaItem & { relevance: ItemRelevance; isRelevant: boolean }> {
  const area = PRACTICE_AREAS[areaId];

  return area.items
    .map((item) => {
      const { relevance, isRelevant } = getItemRelevance(item, capabilityRelevanceMap);
      return { ...item, relevance, isRelevant };
    })
    .filter((item) => options.showAll || item.isRelevant);
}

/**
 * Count relevant items per area based on fingerprint
 */
export function countRelevantItemsPerArea(
  capabilityRelevanceMap: Map<CapabilityId, RelevanceResult>
): Record<PracticeAreaId, { total: number; relevant: number }> {
  const result: Record<PracticeAreaId, { total: number; relevant: number }> = {} as Record<
    PracticeAreaId,
    { total: number; relevant: number }
  >;

  for (const [areaId, area] of Object.entries(PRACTICE_AREAS) as [PracticeAreaId, PracticeArea][]) {
    let relevant = 0;
    for (const item of area.items) {
      const { isRelevant } = getItemRelevance(item, capabilityRelevanceMap);
      if (isRelevant) relevant++;
    }
    result[areaId] = { total: area.items.length, relevant };
  }

  return result;
}
