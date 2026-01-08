/**
 * PsychTrails - AI Renderer (Stub)
 *
 * Future: This will call an AI service to generate contextual text.
 * For now: Falls back to HardcodedRenderer and logs where AI would be used.
 *
 * IMPORTANT: AI can only change text, never game logic.
 * - AI cannot change choices available
 * - AI cannot change effects or scoring
 * - AI cannot change next nodes or endings
 * - AI can only make text more contextual/personalized
 */

import type { IRenderer } from "../renderer";
import type { Node, Choice, Ending, GameEvent, RunState } from "../types";
import { HardcodedRenderer } from "./HardcodedRenderer";

export class AiRenderer implements IRenderer {
  private fallback: HardcodedRenderer;

  constructor() {
    this.fallback = new HardcodedRenderer();
  }

  renderNodeText(node: Node, state: RunState): string {
    // TODO: Call AI service with node.text as base + state context
    // AI would personalize based on metrics, flags, history
    // If AI fails or times out, fallback to hardcoded
    if (process.env.NODE_ENV === "development") {
      console.log("[AI Renderer] Would generate personalized text for node:", node.id);
    }
    return this.fallback.renderNodeText(node, state);
  }

  renderChoiceText(choice: Choice, state: RunState): string {
    // TODO: AI could make choice text more contextual
    return this.fallback.renderChoiceText(choice, state);
  }

  renderChoiceDescription(choice: Choice, state: RunState): string | null {
    // TODO: AI could expand on why this choice matters
    return this.fallback.renderChoiceDescription(choice, state);
  }

  renderChoiceResult(choice: Choice, state: RunState): string | null {
    // TODO: AI could make result text more dynamic
    return this.fallback.renderChoiceResult(choice, state);
  }

  renderEndingText(ending: Ending, state: RunState): string {
    // TODO: AI could personalize ending based on journey
    return this.fallback.renderEndingText(ending, state);
  }

  renderEndingTitle(ending: Ending, state: RunState): string {
    // TODO: AI could make title more contextual
    return this.fallback.renderEndingTitle(ending, state);
  }

  renderEventText(event: GameEvent, state: RunState): string {
    // TODO: AI could make events feel more personal
    return this.fallback.renderEventText(event, state);
  }
}
