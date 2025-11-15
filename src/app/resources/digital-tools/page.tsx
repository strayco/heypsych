// src/app/resources/digital-tools/page.tsx
import { Metadata } from "next";
import { EntityService } from "@/lib/data/entity-service";
import { DigitalToolsHub } from "@/components/blocks/digital-tools-hub";
import { logger } from "@/lib/utils/logger";

export const metadata: Metadata = {
  title: "Digital Tools & Apps | HeyPsych",
  description:
    "Curated mental health apps and digital tools for mood tracking, meditation, sleep, therapy, and wellness. Evidence-based apps with privacy ratings.",
  keywords: [
    "mental health apps",
    "mood tracker",
    "meditation app",
    "therapy app",
    "mental wellness",
    "digital mental health",
    "CBT app",
    "mindfulness app",
    "sleep tracker",
  ],
};

export default async function DigitalToolsPage() {
  try {
    // Try both possible category names
    let resources = await EntityService.getByTypeAndCategory("resource", "digital-tools");

    // Fallback to 'tools' if no resources found
    if (!resources || resources.length === 0) {
      resources = await EntityService.getByTypeAndCategory("resource", "tools");
    }

    logger.debug(`✅ Loaded ${resources.length} digital tool resources`);

    return <DigitalToolsHub resources={resources} />;
  } catch (error) {
    logger.error("Error loading digital-tools", error);
    return <DigitalToolsHub resources={[]} />;
  }
}
