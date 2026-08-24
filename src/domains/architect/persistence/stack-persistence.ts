/**
 * Stack Persistence Adapter
 *
 * Handles saving and loading practice stacks from localStorage.
 * Includes schema versioning for future migrations.
 */

import {
  type PracticeStack,
  type StackPersistenceEnvelope,
  createPersistenceEnvelope,
  parsePersistenceEnvelope,
  STACK_SCHEMA_VERSION,
  createEmptyStack,
} from "../schemas";

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY_PREFIX = "heypsych-architect-stack";
const STACK_LIST_KEY = "heypsych-architect-stack-list";
const ACTIVE_STACK_KEY = "heypsych-architect-active-stack";
const MAX_SAVED_STACKS = 10;

// ============================================================================
// TYPES
// ============================================================================

export interface SavedStackInfo {
  id: string;
  name: string;
  practiceType: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersistenceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a unique stack ID
 */
function generateStackId(): string {
  return `stack-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get the storage key for a stack
 */
function getStackKey(stackId: string): string {
  return `${STORAGE_KEY_PREFIX}-${stackId}`;
}

// ============================================================================
// STACK LIST MANAGEMENT
// ============================================================================

/**
 * Get list of saved stack IDs
 */
function getStackList(): string[] {
  if (!isStorageAvailable()) return [];

  try {
    const raw = localStorage.getItem(STACK_LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/**
 * Update the stack list
 */
function setStackList(ids: string[]): void {
  if (!isStorageAvailable()) return;

  try {
    localStorage.setItem(STACK_LIST_KEY, JSON.stringify(ids));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Add stack to list (at front, maintaining max size)
 */
function addToStackList(id: string): void {
  const list = getStackList().filter((existing) => existing !== id);
  list.unshift(id);

  // Remove oldest if over limit
  while (list.length > MAX_SAVED_STACKS) {
    const removed = list.pop();
    if (removed) {
      try {
        localStorage.removeItem(getStackKey(removed));
      } catch {
        // Ignore removal errors
      }
    }
  }

  setStackList(list);
}

/**
 * Remove stack from list
 */
function removeFromStackList(id: string): void {
  const list = getStackList().filter((existing) => existing !== id);
  setStackList(list);
}

// ============================================================================
// ACTIVE STACK
// ============================================================================

/**
 * Get the active stack ID
 */
export function getActiveStackId(): string | null {
  if (!isStorageAvailable()) return null;

  try {
    return localStorage.getItem(ACTIVE_STACK_KEY);
  } catch {
    return null;
  }
}

/**
 * Set the active stack ID
 */
export function setActiveStackId(id: string | null): void {
  if (!isStorageAvailable()) return;

  try {
    if (id) {
      localStorage.setItem(ACTIVE_STACK_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_STACK_KEY);
    }
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// SAVE / LOAD OPERATIONS
// ============================================================================

/**
 * Save a stack to localStorage
 */
export function saveStack(
  stack: PracticeStack,
  name?: string
): PersistenceResult<{ id: string; info: SavedStackInfo }> {
  if (!isStorageAvailable()) {
    return { success: false, error: "localStorage not available" };
  }

  try {
    // Generate ID if new stack
    const stackId = stack.id || generateStackId();
    const now = new Date().toISOString();

    // Create stack with ID
    const stackWithId: PracticeStack = {
      ...stack,
      id: stackId,
      name: name || stack.name || `Stack ${new Date().toLocaleDateString()}`,
      updatedAt: now,
      createdAt: stack.createdAt || now,
    };

    // Create envelope
    const envelope = createPersistenceEnvelope(stackWithId);

    // Save to storage
    localStorage.setItem(getStackKey(stackId), JSON.stringify(envelope));

    // Update stack list
    addToStackList(stackId);

    // Create info
    const info: SavedStackInfo = {
      id: stackId,
      name: stackWithId.name,
      practiceType: stackWithId.fingerprint.practiceType || "unknown",
      productCount: stackWithId.selectedProducts.filter((p) => !p.isDemo).length,
      createdAt: stackWithId.createdAt,
      updatedAt: stackWithId.updatedAt,
    };

    return { success: true, data: { id: stackId, info } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save stack",
    };
  }
}

/**
 * Load a stack from localStorage by ID
 */
export function loadStack(stackId: string): PersistenceResult<PracticeStack> {
  if (!isStorageAvailable()) {
    return { success: false, error: "localStorage not available" };
  }

  try {
    const raw = localStorage.getItem(getStackKey(stackId));
    if (!raw) {
      return { success: false, error: "Stack not found" };
    }

    const envelope = JSON.parse(raw) as StackPersistenceEnvelope;
    const result = parsePersistenceEnvelope(envelope);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.envelope.stack };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load stack",
    };
  }
}

/**
 * Load the active stack (or create new if none)
 */
export function loadActiveStack(): PersistenceResult<PracticeStack> {
  const activeId = getActiveStackId();

  if (activeId) {
    const result = loadStack(activeId);
    if (result.success) {
      return result;
    }
    // Active stack not found, clear it
    setActiveStackId(null);
  }

  // Return empty stack
  return { success: true, data: createEmptyStack() };
}

/**
 * Delete a stack from localStorage
 */
export function deleteStack(stackId: string): PersistenceResult<void> {
  if (!isStorageAvailable()) {
    return { success: false, error: "localStorage not available" };
  }

  try {
    localStorage.removeItem(getStackKey(stackId));
    removeFromStackList(stackId);

    // Clear active if deleted
    if (getActiveStackId() === stackId) {
      setActiveStackId(null);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete stack",
    };
  }
}

/**
 * List all saved stacks
 */
export function listSavedStacks(): PersistenceResult<SavedStackInfo[]> {
  if (!isStorageAvailable()) {
    return { success: false, error: "localStorage not available" };
  }

  try {
    const ids = getStackList();
    const stacks: SavedStackInfo[] = [];

    for (const id of ids) {
      const result = loadStack(id);
      if (result.success && result.data) {
        stacks.push({
          id,
          name: result.data.name,
          practiceType: result.data.fingerprint.practiceType || "unknown",
          productCount: result.data.selectedProducts.filter((p) => !p.isDemo).length,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
        });
      }
    }

    return { success: true, data: stacks };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list stacks",
    };
  }
}

// ============================================================================
// AUTOSAVE
// ============================================================================

let autosaveTimeout: ReturnType<typeof setTimeout> | null = null;
const AUTOSAVE_DELAY_MS = 2000;

/**
 * Schedule an autosave (debounced)
 */
export function scheduleAutosave(stack: PracticeStack): void {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
  }

  autosaveTimeout = setTimeout(() => {
    const result = saveStack(stack);
    if (result.success && result.data) {
      setActiveStackId(result.data.id);
    }
    autosaveTimeout = null;
  }, AUTOSAVE_DELAY_MS);
}

/**
 * Cancel pending autosave
 */
export function cancelAutosave(): void {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = null;
  }
}

/**
 * Force immediate save
 */
export function saveNow(stack: PracticeStack): PersistenceResult<{ id: string; info: SavedStackInfo }> {
  cancelAutosave();
  const result = saveStack(stack);
  if (result.success && result.data) {
    setActiveStackId(result.data.id);
  }
  return result;
}

// ============================================================================
// EXPORT / IMPORT
// ============================================================================

/**
 * Export stack as JSON string for download
 */
export function exportStackJson(stack: PracticeStack): string {
  const envelope = createPersistenceEnvelope(stack);
  return JSON.stringify(envelope, null, 2);
}

/**
 * Import stack from JSON string
 */
export function importStackJson(json: string): PersistenceResult<PracticeStack> {
  try {
    const envelope = JSON.parse(json) as StackPersistenceEnvelope;
    const result = parsePersistenceEnvelope(envelope);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Generate new ID for imported stack
    const imported: PracticeStack = {
      ...result.envelope.stack,
      id: generateStackId(),
      name: `${result.envelope.stack.name} (imported)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: imported };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid JSON format",
    };
  }
}

// ============================================================================
// CLEAR ALL
// ============================================================================

/**
 * Clear all saved stacks (use with caution)
 */
export function clearAllStacks(): PersistenceResult<void> {
  if (!isStorageAvailable()) {
    return { success: false, error: "localStorage not available" };
  }

  try {
    const ids = getStackList();
    for (const id of ids) {
      localStorage.removeItem(getStackKey(id));
    }
    localStorage.removeItem(STACK_LIST_KEY);
    localStorage.removeItem(ACTIVE_STACK_KEY);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear stacks",
    };
  }
}
