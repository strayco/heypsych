/**
 * Psych Trail - Public API
 *
 * Main entry point for the simulation engine.
 */

export * from "./types";
export * from "./engine";
export * from "./schemas";
export { SeededRNG, generateSeed } from "./rng";

// Import and validate scenario packs
import firstPsychAppointmentRaw from "./scenarios/first-psych-appointment.json";
import { ScenarioSchema } from "./schemas";
import type { Scenario } from "./types";

// Validate and cast scenarios at import time
const firstPsychAppointment = ScenarioSchema.parse(firstPsychAppointmentRaw) as Scenario;

export const scenarios = {
  firstPsychAppointment,
};

// Export scenario metadata for directory
export function getAllScenarios(): Scenario[] {
  return Object.values(scenarios);
}
