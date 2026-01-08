/**
 * PsychTrails - Public API
 *
 * Main entry point for the simulation engine.
 */

export * from "./types";
export * from "./engine";
export * from "./schemas";
export * from "./renderer";
export * from "./tiles";
export * from "./storage";
export * from "./rewards";
export { SeededRNG, generateSeed } from "./rng";
export { HardcodedRenderer } from "./renderers/HardcodedRenderer";
export { PathAwareRenderer } from "./renderers/PathAwareRenderer";

// Import and validate scenario packs
import firstPsychAppointmentRaw from "./scenarios/first-psych-appointment.json";
import collegeSocialAnxietyDiningHallRaw from "./scenarios/college_social_anxiety_dining_hall_v1.json";
import collegeSocialAnxietyOfficeHoursRaw from "./scenarios/college_social_anxiety_office_hours_v1.json";
import teenSchoolAccommodationsRaw from "./scenarios/teen_social_anxiety_school_accommodations_v1.json";
import { ScenarioSchema } from "./schemas";
import type { Scenario } from "./types";

// Validate and cast scenarios at import time
const firstPsychAppointment = ScenarioSchema.parse(firstPsychAppointmentRaw) as Scenario;
const collegeSocialAnxietyDiningHall = ScenarioSchema.parse(collegeSocialAnxietyDiningHallRaw) as Scenario;
const collegeSocialAnxietyOfficeHours = ScenarioSchema.parse(collegeSocialAnxietyOfficeHoursRaw) as Scenario;
const teenSchoolAccommodations = ScenarioSchema.parse(teenSchoolAccommodationsRaw) as Scenario;

// Export scenarios by their ID for easy lookup
export const scenarios: Record<string, Scenario> = {
  "first-psych-appointment": firstPsychAppointment,
  "college_social_anxiety_dining_hall_v1": collegeSocialAnxietyDiningHall,
  "college_social_anxiety_office_hours_v1": collegeSocialAnxietyOfficeHours,
  "teen_social_anxiety_school_accommodations_v1": teenSchoolAccommodations,
};

// Export scenario metadata for directory
export function getAllScenarios(): Scenario[] {
  return Object.values(scenarios);
}
