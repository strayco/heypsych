/**
 * Architect Domain Persistence
 *
 * Re-exports persistence utilities.
 */

export {
  // Stack operations
  saveStack,
  loadStack,
  deleteStack,
  listSavedStacks,
  loadActiveStack,

  // Active stack
  getActiveStackId,
  setActiveStackId,

  // Autosave
  scheduleAutosave,
  cancelAutosave,
  saveNow,

  // Export/Import
  exportStackJson,
  importStackJson,

  // Clear
  clearAllStacks,

  // Types
  type SavedStackInfo,
  type PersistenceResult,
} from "./stack-persistence";
