/**
 * PsychTrails - Tile Management
 *
 * Handles loading tiles and checking unlock status
 */

import type { Tile, LifeStage, TileProgress } from "./types";
import teenTiles from "./data/tiles-teen.json";
import collegeTiles from "./data/tiles-college.json";

// Import tile data
const TILES_BY_LIFE_STAGE: Record<LifeStage, Tile[]> = {
  teen: teenTiles as Tile[],
  college: collegeTiles as Tile[],
  parent: [], // Empty for MVP (coming soon)
};

/**
 * Get all tiles for a life stage
 */
export function getTilesByLifeStage(lifeStage: LifeStage): Tile[] {
  return TILES_BY_LIFE_STAGE[lifeStage] ?? [];
}

/**
 * Get a specific tile by ID
 */
export function getTileById(tileId: string): Tile | null {
  for (const tiles of Object.values(TILES_BY_LIFE_STAGE)) {
    const tile = tiles.find((t) => t.id === tileId);
    if (tile) return tile;
  }
  return null;
}

/**
 * Check if a tile is unlocked based on prerequisites and progress
 * Checks both hardcoded 'unlocked' field AND completion-based prerequisites
 */
export function isTileUnlocked(
  tile: Tile,
  progressMap: Record<string, TileProgress>
): boolean {
  // If hardcoded as unlocked, it's unlocked
  if (tile.unlocked) {
    return true;
  }

  // If no prerequisites, tile is only unlocked if hardcoded
  if (tile.prerequisiteTileIds.length === 0) {
    return false;
  }

  // Check if all prerequisite tiles have been completed at least once
  const allPrereqsComplete = tile.prerequisiteTileIds.every(
    (prereqId) => (progressMap[prereqId]?.completions ?? 0) > 0
  );

  return allPrereqsComplete;
}

/**
 * Get unlock reason text (for locked tiles)
 */
export function getUnlockReason(tile: Tile): string {
  if (tile.unlocked) {
    return "";
  }

  if (tile.prerequisiteTileIds.length === 0) {
    return "Coming soon";
  }

  // Show first prerequisite
  const firstPrereq = tile.prerequisiteTileIds[0];
  const prereqTile = getTileById(firstPrereq);
  const prereqName = prereqTile?.title ?? "another tile";

  if (tile.prerequisiteTileIds.length === 1) {
    return `Complete "${prereqName}" first`;
  }

  return `Complete "${prereqName}" and ${tile.prerequisiteTileIds.length - 1} more`;
}
