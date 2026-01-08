"use client";

import type { Lens } from "@/lib/psychTrail/types";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LensCardProps {
  lens: Lens;
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}

export function LensCard({
  lens,
  title,
  description,
  icon: Icon,
  selected,
  disabled,
  onSelect,
}: LensCardProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={cn(
        "relative w-full rounded-xl border-2 p-6 text-left transition-all duration-200",
        "hover:shadow-lg",
        selected && !disabled && "border-purple-500 bg-purple-50 shadow-md",
        !selected && !disabled && "border-neutral-200 bg-white hover:border-purple-300",
        disabled && "cursor-not-allowed opacity-50 bg-neutral-50 border-neutral-200"
      )}
    >
      {disabled && (
        <div className="absolute top-3 right-3 rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
          Coming Soon
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
            selected && !disabled && "bg-purple-600 text-white",
            !selected && !disabled && "bg-neutral-100 text-neutral-700",
            disabled && "bg-neutral-200 text-neutral-400"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div className="flex-1">
          <h3 className="mb-1 text-lg font-bold text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-600">{description}</p>
        </div>

        {selected && !disabled && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
