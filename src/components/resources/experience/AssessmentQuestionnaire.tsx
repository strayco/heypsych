"use client";

/**
 * The questionnaire itself, unchanged: AssessmentRenderer with exactly the
 * resource ResourceDetailClient would give it. Answers live in component
 * state on this page only.
 */

import { AssessmentRenderer } from "@/components/resource-renderers/AssessmentRenderer";
import { normalizeResource } from "@/components/resources/normalize-resource";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AssessmentQuestionnaire({ entity }: { entity: any }) {
  return <AssessmentRenderer resource={normalizeResource(entity)} />;
}
