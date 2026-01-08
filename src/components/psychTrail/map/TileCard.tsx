"use client";

import Link from "next/link";
import { Lock, Play, CheckCircle2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { Tile, TileProgress } from "@/lib/psychTrail/types";
import { cn } from "@/lib/utils";

interface TileCardProps {
  tile: Tile;
  progress: TileProgress;
  unlocked: boolean;
  unlockReason: string;
}

export function TileCard({ tile, progress, unlocked, unlockReason }: TileCardProps) {
  // Get the icon component
  const IconComponent = (LucideIcons as any)[tile.icon] || LucideIcons.Circle;

  const isCompleted = progress.completions > 0;
  const confidence = progress.confidence;

  const content = (
    <div
      className={cn(
        "relative h-full rounded-xl border-2 p-6 transition-all duration-200",
        unlocked
          ? "border-neutral-200 bg-white hover:border-purple-400 hover:shadow-lg cursor-pointer"
          : "border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed"
      )}
    >
      {/* Lock badge for locked tiles */}
      {!unlocked && (
        <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
          <Lock className="h-3 w-3" />
          Locked
        </div>
      )}

      {/* Completed badge */}
      {isCompleted && unlocked && (
        <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3 w-3" />
          Completed {progress.completions}x
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg",
          unlocked ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white" : "bg-neutral-200 text-neutral-400"
        )}
      >
        <IconComponent className="h-7 w-7" />
      </div>

      {/* Title and description */}
      <h3 className="mb-2 text-xl font-bold text-neutral-900">{tile.title}</h3>
      <p className="mb-4 text-sm text-neutral-600 line-clamp-2">{tile.description}</p>

      {/* Confidence progress */}
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-700">Confidence Here</span>
          <span className="font-bold text-purple-600">{confidence}/100</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* Action button or lock reason */}
      {unlocked ? (
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-purple-600">
          <Play className="h-4 w-4" />
          <span>{isCompleted ? "Play Again" : "Start Scenario"}</span>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-neutral-500">
          <Lock className="h-4 w-4" />
          <span>{unlockReason}</span>
        </div>
      )}
    </div>
  );

  if (unlocked) {
    return <Link href={`/psychtrails/play/${tile.id}`}>{content}</Link>;
  }

  return <div>{content}</div>;
}
