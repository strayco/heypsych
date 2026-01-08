/**
 * PsychTrails - Renderer Abstraction
 *
 * CRITICAL ARCHITECTURE BOUNDARY:
 * - Engine decides outcomes (state transitions, scoring, unlocks, endings)
 * - Renderer decides words (text shown to user)
 *
 * This abstraction allows AI to generate text later WITHOUT changing game logic.
 */

import type { Node, Choice, Ending, GameEvent, RunState } from "./types";

/**
 * Renderer interface - all text output must go through this
 */
export interface IRenderer {
  /**
   * Render the text displayed at a node
   */
  renderNodeText(node: Node, state: RunState): string;

  /**
   * Render the text for a choice button
   */
  renderChoiceText(choice: Choice, state: RunState): string;

  /**
   * Render the optional description shown after selecting a choice (before continuing)
   */
  renderChoiceDescription(choice: Choice, state: RunState): string | null;

  /**
   * Render the result text shown after a choice is made (after continuing)
   */
  renderChoiceResult(choice: Choice, state: RunState): string | null;

  /**
   * Render an ending's text
   */
  renderEndingText(ending: Ending, state: RunState): string;

  /**
   * Render an ending's title
   */
  renderEndingTitle(ending: Ending, state: RunState): string;

  /**
   * Render an event's text
   */
  renderEventText(event: GameEvent, state: RunState): string;
}
