// src/lib/types/resource.ts
export type ResourceCategory =
  | "assessments-screeners"
  | "support-community"
  | "crisis-helplines"
  | "education-guides"
  | "digital-tools";

export interface ResourceBase {
  kind: "resource";
  slug: string;
  name: string;
  summary?: string;
  description?: string;
  tags?: string[];
  metadata?: { category?: ResourceCategory; [k: string]: unknown };
  // any other common fields you store (featured, order, seo, etc.)
  [k: string]: unknown; // keep extensible
}

/** Assessments — add questions + scoring */
export interface AssessmentResource extends ResourceBase {
  metadata: { category: "assessments-screeners"; [k: string]: unknown };
  questions?: Array<{
    number: number;
    text: string;
    // optional per-question scoring
    weight?: number;
    options?: Array<{ value: number; label: string }>;
  }>;
  scoring?: {
    type: "sum" | "weighted-sum" | "custom";
    range?: string;
    interpretation?: Record<string, string>;
    // optional custom scoring key to look up in a registry
    engineKey?: string;
  };
}

/** Other categories can extend as needed */
export interface SupportCommunityResource extends ResourceBase {
  metadata: { category: "support-community"; [k: string]: unknown };
}

export interface CrisisHelplinesResource extends ResourceBase {
  metadata: { category: "crisis-helplines"; [k: string]: unknown };
}

export interface EducationGuidesResource extends ResourceBase {
  metadata: { category: "education-guides"; [k: string]: unknown };
}

export interface DigitalToolsResource extends ResourceBase {
  metadata: { category: "digital-tools"; [k: string]: unknown };
}

export type AnyResource =
  | AssessmentResource
  | SupportCommunityResource
  | CrisisHelplinesResource
  | EducationGuidesResource
  | DigitalToolsResource;
