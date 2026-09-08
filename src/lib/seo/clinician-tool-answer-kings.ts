/**
 * Clinician Tool Answer Kings Registry
 *
 * Registers canonical authority pages for clinician tool topic clusters.
 * Answer kings are the definitive page for a topic and receive
 * preferential treatment in indexation and internal linking.
 *
 * SEO Strategy:
 * 1. Each cluster has ONE answer king that targets the main query
 * 2. Related pages link TO the answer king with consistent anchor text
 * 3. Answer king consolidates PageRank from the cluster
 * 4. Answer king gets priority for featured snippets and PAA
 */

import { registerAnswerKing } from "./index-decision-service";

/**
 * Initialize clinician tool answer king registrations
 *
 * Call this during app startup alongside medical answer kings.
 */
export function initializeClinicianToolAnswerKings(): void {
  // ============================================================================
  // EHR / Practice Management Clusters
  // ============================================================================

  // Best EHR for therapists - HIGHEST VOLUME query in category
  registerAnswerKing(
    "/tools/best-for/therapists",
    "best-ehr-therapists",
    [
      "/tools/for-clinicians/ehr-practice-management",
      "/best-ehr-for-therapists",
      "/therapy-ehr-comparison",
    ]
  );

  // Best EHR for psychiatrists
  registerAnswerKing(
    "/tools/best-for/psychiatrists",
    "best-ehr-psychiatrists",
    [
      "/tools/for-clinicians/prescribing-erx",
      "/best-ehr-for-psychiatrists",
      "/psychiatry-ehr-comparison",
    ]
  );

  // Best EHR for PMHNPs
  registerAnswerKing(
    "/tools/best-for/pmhnps",
    "best-ehr-pmhnps",
    [
      "/tools/for-clinicians/ehr-practice-management",
      "/best-ehr-for-pmhnp",
      "/pmhnp-ehr-comparison",
    ]
  );

  // Best EHR for solo practice
  registerAnswerKing(
    "/tools/best-for/solo-practice",
    "best-ehr-solo",
    [
      "/tools/for-practices/solo-therapist",
      "/best-ehr-for-solo-therapists",
      "/solo-practice-software",
    ]
  );

  // Best EHR for group practice
  registerAnswerKing(
    "/tools/best-for/group-practice",
    "best-ehr-group",
    [
      "/tools/for-practices/therapy-group",
      "/best-ehr-for-group-practice",
      "/group-practice-software",
    ]
  );

  // ============================================================================
  // AI Scribe Clusters
  // ============================================================================

  // Best AI scribe for therapists - HIGH VOLUME emerging query
  registerAnswerKing(
    "/tools/best-for/ai-scribe-therapists",
    "best-ai-scribe-therapists",
    [
      "/tools/for-clinicians/ai-scribes-documentation",
      "/best-ai-scribe-for-therapists",
      "/therapy-ai-notes",
    ]
  );

  // AI scribe comparison (Freed vs Mentalyc)
  registerAnswerKing(
    "/tools/compare/freed-vs-mentalyc",
    "freed-vs-mentalyc",
    [
      "/freed-vs-mentalyc",
      "/mentalyc-vs-freed",
      "/ai-scribe-comparison",
    ]
  );

  // HIPAA AI scribe
  registerAnswerKing(
    "/tools/best-for/hipaa-ai-scribe",
    "hipaa-ai-scribe",
    [
      "/hipaa-compliant-ai-scribe",
      "/secure-ai-documentation",
    ]
  );

  // ============================================================================
  // Product-Specific Answer Kings
  // ============================================================================

  // SimplePractice - most searched product
  registerAnswerKing(
    "/tools/for-clinicians/ehr-practice-management/simplepractice",
    "simplepractice",
    [
      "/simplepractice-review",
      "/simplepractice-pricing",
      "/is-simplepractice-hipaa-compliant",
    ]
  );

  // TherapyNotes - second most searched
  registerAnswerKing(
    "/tools/for-clinicians/ehr-practice-management/therapynotes",
    "therapynotes",
    [
      "/therapynotes-review",
      "/therapynotes-pricing",
      "/therapynotes-vs-simplepractice",
    ]
  );

  // Freed AI
  registerAnswerKing(
    "/tools/for-clinicians/ai-scribes-documentation/freed",
    "freed-ai",
    [
      "/freed-ai-review",
      "/freed-pricing",
      "/is-freed-hipaa-compliant",
    ]
  );

  // ============================================================================
  // Pricing Comparison Clusters
  // ============================================================================

  registerAnswerKing(
    "/tools/pricing/mental-health-ehr",
    "mental-health-ehr-pricing",
    [
      "/ehr-pricing-comparison",
      "/therapy-ehr-cost",
      "/how-much-does-simplepractice-cost",
    ]
  );

  registerAnswerKing(
    "/tools/pricing/ai-scribe",
    "ai-scribe-pricing",
    [
      "/ai-scribe-pricing-comparison",
      "/how-much-do-ai-scribes-cost",
      "/freed-vs-mentalyc-pricing",
    ]
  );

  // ============================================================================
  // Stack/Guide Clusters
  // ============================================================================

  registerAnswerKing(
    "/tools/stacks/therapy-practice",
    "therapy-practice-software-stack",
    [
      "/software-for-therapy-practice",
      "/what-software-do-therapists-need",
      "/starting-therapy-practice-software",
    ]
  );

  registerAnswerKing(
    "/tools/stacks/psychiatry-practice",
    "psychiatry-practice-software-stack",
    [
      "/software-for-psychiatrists",
      "/what-software-do-psychiatrists-need",
    ]
  );
}

/**
 * Topic clusters with their canonical authorities
 *
 * For documentation, CI validation, and programmatic access
 */
export const CLINICIAN_TOOL_CLUSTERS = {
  "best-ehr-therapists": {
    answerKing: "/tools/best-for/therapists",
    description: "Authority page for 'best EHR for therapists' queries",
    primaryQueries: [
      "best ehr for therapists",
      "best ehr for mental health",
      "therapy practice management software",
      "best simplepractice alternative",
    ],
    secondaryQueries: [
      "ehr for counselors",
      "ehr for lcsw",
      "therapist scheduling software",
    ],
    estimatedSearchVolume: 8500,
  },
  "best-ehr-psychiatrists": {
    answerKing: "/tools/best-for/psychiatrists",
    description: "Authority page for psychiatrist EHR queries",
    primaryQueries: [
      "best ehr for psychiatrists",
      "ehr with e-prescribing",
      "psychiatry ehr software",
    ],
    estimatedSearchVolume: 3200,
  },
  "best-ai-scribe-therapists": {
    answerKing: "/tools/best-for/ai-scribe-therapists",
    description: "Authority page for therapy AI scribe queries",
    primaryQueries: [
      "best ai scribe for therapists",
      "ai note taking for therapy",
      "therapy ai documentation",
    ],
    estimatedSearchVolume: 4800,
  },
  "simplepractice": {
    answerKing: "/tools/for-clinicians/ehr-practice-management/simplepractice",
    description: "Authority page for SimplePractice product queries",
    primaryQueries: [
      "simplepractice review",
      "simplepractice pricing",
      "is simplepractice hipaa compliant",
      "simplepractice vs therapynotes",
    ],
    estimatedSearchVolume: 22000,
  },
  "freed-vs-mentalyc": {
    answerKing: "/tools/compare/freed-vs-mentalyc",
    description: "Authority page for AI scribe comparison",
    primaryQueries: [
      "freed vs mentalyc",
      "mentalyc vs freed",
      "best ai scribe comparison",
    ],
    estimatedSearchVolume: 1900,
  },
  "mental-health-ehr-pricing": {
    answerKing: "/tools/pricing/mental-health-ehr",
    description: "Authority page for EHR pricing queries",
    primaryQueries: [
      "mental health ehr pricing",
      "therapy ehr cost",
      "how much does simplepractice cost",
      "therapynotes pricing",
    ],
    estimatedSearchVolume: 5400,
  },
  "therapy-practice-software-stack": {
    answerKing: "/tools/stacks/therapy-practice",
    description: "Authority page for therapy practice software guide",
    primaryQueries: [
      "software for therapy practice",
      "what software do therapists need",
      "starting therapy practice technology",
    ],
    estimatedSearchVolume: 2100,
  },
};

/**
 * Get answer king URL for a topic cluster
 */
export function getAnswerKingForCluster(
  clusterId: keyof typeof CLINICIAN_TOOL_CLUSTERS
): string | null {
  return CLINICIAN_TOOL_CLUSTERS[clusterId]?.answerKing || null;
}

/**
 * Check if a URL is an answer king
 */
export function isAnswerKing(url: string): boolean {
  return Object.values(CLINICIAN_TOOL_CLUSTERS).some(
    (cluster) => cluster.answerKing === url
  );
}

/**
 * Get all answer kings for sitemap priority boosting
 */
export function getAllClinicianToolAnswerKings(): string[] {
  return Object.values(CLINICIAN_TOOL_CLUSTERS).map(
    (cluster) => cluster.answerKing
  );
}

/**
 * Get cluster info for a URL (if it's an answer king)
 */
export function getClusterForAnswerKing(url: string): {
  clusterId: string;
  queries: string[];
  volume: number;
} | null {
  for (const [clusterId, cluster] of Object.entries(CLINICIAN_TOOL_CLUSTERS)) {
    if (cluster.answerKing === url) {
      return {
        clusterId,
        queries: cluster.primaryQueries,
        volume: cluster.estimatedSearchVolume || 0,
      };
    }
  }
  return null;
}
