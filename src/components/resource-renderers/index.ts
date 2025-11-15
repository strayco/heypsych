// src/components/resource-renderers/index.ts
import { AssessmentRenderer } from "./AssessmentRenderer";
import { SupportRenderer } from "./SupportRenderer";
import { ArticleRenderer } from "./ArticleRenderer";
import { CrisisRenderer } from "./CrisisRenderer";
import { EducationRenderer } from "./EducationRenderer";
import { DigitalToolRenderer } from "./DigitalToolRenderer";
import { GenericRenderer } from "./GenericRenderer";

import type { AnyResource } from "@/lib/types/resource";

export interface ResourceRendererProps {
  resource: any; // Changed from AnyResource to any
}

export type ResourceRenderer = React.ComponentType<ResourceRendererProps>;

export const resourceRenderers: Record<string, ResourceRenderer> = {
  "assessments-screeners": AssessmentRenderer,
  "support-community": SupportRenderer,
  "knowledge-hub": ArticleRenderer,
  "crisis-helplines": CrisisRenderer,
  "education-guides": EducationRenderer,
  "digital-tools": DigitalToolRenderer,
};

export function getRenderer(category?: string): ResourceRenderer {
  if (!category) return GenericRenderer;
  return resourceRenderers[category] || GenericRenderer;
}

export { GenericRenderer };

// Engine system
export function runEngine(data: any, answers: Record<string, any>) {
  const engines = require("@/lib/assessments/engines").engines;
  const engineKey = data.scoring?.engine || "sum";
  const engine = engines[engineKey];
  if (!engine) {
    throw new Error(`Unknown engine: ${engineKey}`);
  }
  return engine(data, answers);
}
