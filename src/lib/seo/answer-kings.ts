/**
 * Answer King Registry Initialization
 *
 * Registers canonical authority pages for topic clusters.
 * Answer kings are the definitive page for a topic and receive
 * preferential treatment in indexation decisions.
 *
 * Other pages in the cluster can link to the answer king and
 * may defer to it for canonical signals.
 *
 * @see index-decision-service.ts for usage
 */

import { registerAnswerKing } from "./index-decision-service";

/**
 * Initialize all answer king registrations
 *
 * Call this during app startup to populate the answer king registry.
 */
export function initializeAnswerKings(): void {
  // NOTE: Evidence Matrix QUARANTINED until claims verified
  // Previously registered as answer king for "treatment-evidence-comparison"
  // Removed 2026-08-21 pending row-level claim verification

  // Condition hub pages - authority for condition overview queries
  registerAnswerKing("/conditions", "mental-health-conditions", [
    "/conditions/overview",
    "/mental-health-conditions",
  ]);

  // Treatment hub pages - authority for treatment overview queries
  registerAnswerKing("/treatments", "mental-health-treatments", [
    "/treatments/overview",
    "/mental-health-treatments",
  ]);

  // Depression pages - most common mental health query
  registerAnswerKing("/conditions/major-depressive-disorder", "depression", [
    "/conditions/clinical-depression",
    "/depression",
  ]);

  // Anxiety pages - second most common mental health query
  registerAnswerKing("/conditions/generalized-anxiety-disorder", "anxiety", [
    "/conditions/anxiety",
    "/anxiety",
  ]);

  // SSRIs comparison - common medication query
  registerAnswerKing(
    "/treatments/compare/lexapro-vs-zoloft",
    "ssri-comparison",
    [
      "/compare/lexapro-zoloft",
      "/lexapro-vs-zoloft",
    ]
  );

  // CBT - most searched therapy type
  registerAnswerKing("/treatments/cognitive-behavioral-therapy", "cbt", [
    "/treatments/cbt",
    "/cbt",
    "/cognitive-behavioral-therapy",
  ]);
}

/**
 * Topic clusters and their canonical authorities
 *
 * For documentation and CI validation
 */
export const TOPIC_CLUSTERS = {
  "treatment-evidence-comparison": {
    answerKing: null, // QUARANTINED: /evidence-matrix pending claim verification
    quarantined: true,
    quarantineDate: "2026-08-21",
    description: "Comprehensive evidence-based treatment comparison",
    queries: [
      "best treatment for depression",
      "antidepressant comparison",
      "therapy vs medication",
      "which antidepressant is most effective",
    ],
  },
  depression: {
    answerKing: "/conditions/major-depressive-disorder",
    description: "Authority page for depression-related queries",
    queries: [
      "what is depression",
      "depression symptoms",
      "major depressive disorder",
    ],
  },
  anxiety: {
    answerKing: "/conditions/generalized-anxiety-disorder",
    description: "Authority page for anxiety-related queries",
    queries: [
      "what is anxiety",
      "anxiety symptoms",
      "generalized anxiety disorder",
    ],
  },
  "ssri-comparison": {
    answerKing: "/treatments/compare/lexapro-vs-zoloft",
    description: "Head-to-head SSRI comparison",
    queries: [
      "lexapro vs zoloft",
      "escitalopram vs sertraline",
      "best ssri for anxiety",
    ],
  },
  cbt: {
    answerKing: "/treatments/cognitive-behavioral-therapy",
    description: "Authority page for CBT queries",
    queries: [
      "what is cbt",
      "cognitive behavioral therapy",
      "how does cbt work",
    ],
  },
} as const;
