/**
 * PsychTrails - Hardcoded Renderer
 *
 * Uses text directly from JSON scenario files.
 * This is the MVP renderer - simple and deterministic.
 */

import type { IRenderer } from "../renderer";
import type { Node, Choice, Ending, GameEvent, RunState } from "../types";

export class HardcodedRenderer implements IRenderer {
  renderNodeText(node: Node, _state: RunState): string {
    return node.text;
  }

  renderChoiceText(choice: Choice, _state: RunState): string {
    return choice.text;
  }

  renderChoiceDescription(choice: Choice, _state: RunState): string | null {
    return choice.description ?? null;
  }

  renderChoiceResult(choice: Choice, _state: RunState): string | null {
    return choice.resultText ?? null;
  }

  renderEndingText(ending: Ending, _state: RunState): string {
    return ending.text;
  }

  renderEndingTitle(ending: Ending, _state: RunState): string {
    return ending.title;
  }

  renderEventText(event: GameEvent, _state: RunState): string {
    return event.text;
  }
}
