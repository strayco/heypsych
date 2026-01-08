/**
 * PsychTrails - Choice List Component
 *
 * Pure renderer: displays available choices as interactive buttons.
 * No simulation logic - just fires callbacks.
 */

import type { Choice, RunState } from "@/lib/psychTrail/types";
import type { IRenderer } from "@/lib/psychTrail/renderer";
import { Button } from "@/components/ui/button";

interface ChoiceListProps {
  choices: Choice[];
  onChoiceSelect: (choiceId: string) => void;
  renderer: IRenderer;
  state: RunState;
  disabled?: boolean;
  className?: string;
}

export function ChoiceList({
  choices,
  onChoiceSelect,
  renderer,
  state,
  disabled = false,
  className = "",
}: ChoiceListProps) {
  if (choices.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
        What do you do?
      </h3>
      <div className="space-y-2">
        {choices.map((choice) => (
          <Button
            key={choice.id}
            onClick={() => onChoiceSelect(choice.id)}
            disabled={disabled}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-purple-50 hover:border-purple-300 transition-colors"
          >
            {renderer.renderChoiceText(choice, state)}
          </Button>
        ))}
      </div>
    </div>
  );
}
