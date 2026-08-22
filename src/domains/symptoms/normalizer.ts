/**
 * Condition Symptom Normalizer
 *
 * Extracts and normalizes symptoms from condition JSON files.
 * This is a server-safe, deterministic normalization layer that:
 * - Recursively flattens symptom objects and arrays
 * - Preserves provenance (condition slug, name, subgroup, original text)
 * - Handles missing, malformed, nested, or unexpected fields safely
 * - Does NOT mutate original condition JSON
 * - Produces deterministic output suitable for static generation
 */

import type { ExtractedSymptom } from "./types";

// Only import fs modules on server side
let fs: typeof import("fs") | null = null;
let path: typeof import("path") | null = null;

/**
 * Webpack-safe server module loader
 */
function loadServerModule(moduleName: string): any {
  if (typeof window !== "undefined") return null;
  try {
    // eslint-disable-next-line no-eval
    return eval("require")(moduleName);
  } catch {
    return null;
  }
}

/**
 * Ensure fs modules are loaded (server-side only)
 */
function ensureFsModulesSync(): boolean {
  if (typeof window !== "undefined") return false;
  if (fs && path) return true;

  try {
    fs = loadServerModule("fs");
    path = loadServerModule("path");
    return !!(fs && path);
  } catch {
    return false;
  }
}

/**
 * Known symptom subgroup keys found in condition JSON
 */
const SYMPTOM_SUBGROUP_KEYS = [
  "core",
  "associated",
  "emotional",
  "cognitive",
  "emotional_cognitive",
  "physical",
  "physical_neurovegetative",
  "behavioral",
  "psychological",
  "social",
  "somatic",
  "motor",
  "vocal",
  "primary",
  "secondary",
  "positive",
  "negative",
  "disorganized",
  "manic",
  "depressive",
  "anxious",
  "obsessive",
  "compulsive",
  "avoidance",
  "intrusive",
  "hyperarousal",
  "dissociative",
  "eating",
  "body_image",
  "sleep",
  "attention",
  "impulse",
];

/**
 * Fields in condition JSON that contain symptom-like content
 */
const SYMPTOM_SOURCE_FIELDS = [
  "symptoms",
  "warning_signs",
  "key_features",
  "common_symptoms",
];

/**
 * Clean a symptom string by removing markdown links and extra whitespace
 */
function cleanSymptomText(text: string): string {
  if (!text || typeof text !== "string") return "";

  return (
    text
      // Remove markdown links [[text|slug]] -> text
      .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, "$1")
      // Remove markdown links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove **bold** markers
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      // Remove *italic* markers
      .replace(/\*([^*]+)\*/g, "$1")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Recursively extract symptoms from a nested structure
 */
function extractSymptomsRecursive(
  obj: unknown,
  conditionSlug: string,
  conditionName: string,
  currentPath: string,
  currentSubgroup: string,
  results: ExtractedSymptom[]
): void {
  if (obj === null || obj === undefined) {
    return;
  }

  // Handle string (base case)
  if (typeof obj === "string") {
    const cleaned = cleanSymptomText(obj);
    if (cleaned.length > 0 && cleaned.length < 500) {
      results.push({
        text: cleaned,
        conditionSlug,
        conditionName,
        subgroup: currentSubgroup,
        sourcePath: currentPath,
      });
    }
    return;
  }

  // Handle array
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      extractSymptomsRecursive(
        item,
        conditionSlug,
        conditionName,
        `${currentPath}[${index}]`,
        currentSubgroup,
        results
      );
    });
    return;
  }

  // Handle object
  if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;

    for (const key of Object.keys(record)) {
      const value = record[key];
      const newPath = currentPath ? `${currentPath}.${key}` : key;

      // Check if this key is a known symptom subgroup
      const isSubgroup = SYMPTOM_SUBGROUP_KEYS.includes(key.toLowerCase());
      const newSubgroup = isSubgroup ? key : currentSubgroup;

      extractSymptomsRecursive(
        value,
        conditionSlug,
        conditionName,
        newPath,
        newSubgroup,
        results
      );
    }
  }
}

/**
 * Extract symptoms from a single condition JSON object
 */
export function extractSymptomsFromCondition(
  condition: Record<string, unknown>
): ExtractedSymptom[] {
  const results: ExtractedSymptom[] = [];

  const slug = (condition.slug as string) || "unknown";
  const name = (condition.name as string) || "Unknown Condition";
  const content = condition.content as Record<string, unknown> | undefined;

  if (!content || typeof content !== "object") {
    return results;
  }

  // Extract from known symptom source fields
  for (const field of SYMPTOM_SOURCE_FIELDS) {
    const fieldValue = content[field];
    if (fieldValue) {
      extractSymptomsRecursive(
        fieldValue,
        slug,
        name,
        `content.${field}`,
        field,
        results
      );
    }
  }

  // Also extract from warning_signs if present
  if (content.warning_signs) {
    extractSymptomsRecursive(
      content.warning_signs,
      slug,
      name,
      "content.warning_signs",
      "warning_signs",
      results
    );
  }

  return results;
}

/**
 * Extract examples from a condition that might illustrate symptoms
 * Returns objects that can be used as SymptomExample sources
 */
export function extractExamplesFromCondition(
  condition: Record<string, unknown>
): Array<{
  text: string;
  conditionSlug: string;
  conditionName: string;
  sourcePath: string;
}> {
  const results: Array<{
    text: string;
    conditionSlug: string;
    conditionName: string;
    sourcePath: string;
  }> = [];

  const slug = (condition.slug as string) || "unknown";
  const name = (condition.name as string) || "Unknown Condition";
  const content = condition.content as Record<string, unknown> | undefined;

  if (!content || typeof content !== "object") {
    return results;
  }

  // Extract from what_it_can_look_like_in_real_life (array of strings)
  const realLifeExamples = content.what_it_can_look_like_in_real_life;
  if (Array.isArray(realLifeExamples)) {
    realLifeExamples.forEach((example, index) => {
      if (typeof example === "string" && example.length > 0) {
        results.push({
          text: example,
          conditionSlug: slug,
          conditionName: name,
          sourcePath: `content.what_it_can_look_like_in_real_life[${index}]`,
        });
      }
    });
  }

  // Extract from lived_experience.first_person_statements
  const livedExperience = content.lived_experience as Record<string, unknown> | undefined;
  if (livedExperience?.first_person_statements) {
    const statements = livedExperience.first_person_statements;
    if (Array.isArray(statements)) {
      statements.forEach((statement, index) => {
        if (typeof statement === "string" && statement.length > 0) {
          results.push({
            text: statement,
            conditionSlug: slug,
            conditionName: name,
            sourcePath: `content.lived_experience.first_person_statements[${index}]`,
          });
        }
      });
    }
  }

  return results;
}

/**
 * Load all condition JSON files from the data directory
 * Server-side only
 */
export function loadAllConditions(): Record<string, unknown>[] {
  if (!ensureFsModulesSync() || !fs || !path) {
    console.warn("loadAllConditions: fs modules not available (client-side?)");
    return [];
  }

  const conditions: Record<string, unknown>[] = [];
  const conditionsDir = path.join(process.cwd(), "data", "conditions");

  if (!fs.existsSync(conditionsDir)) {
    console.warn("Conditions directory not found:", conditionsDir);
    return [];
  }

  // Get all category directories
  const categories = fs
    .readdirSync(conditionsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const category of categories) {
    const categoryDir = path.join(conditionsDir, category);
    const files = fs
      .readdirSync(categoryDir)
      .filter((file) => file.endsWith(".json"));

    for (const file of files) {
      try {
        const filePath = path.join(categoryDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const condition = JSON.parse(content);
        conditions.push(condition);
      } catch (error) {
        console.error(`Error loading condition file ${file}:`, error);
      }
    }
  }

  return conditions;
}

/**
 * Extract all symptoms from all conditions
 * Returns deduplicated list with provenance
 */
export function extractAllSymptoms(): ExtractedSymptom[] {
  const conditions = loadAllConditions();
  const allSymptoms: ExtractedSymptom[] = [];

  for (const condition of conditions) {
    const symptoms = extractSymptomsFromCondition(condition);
    allSymptoms.push(...symptoms);
  }

  return allSymptoms;
}

/**
 * Group extracted symptoms by normalized text
 * Useful for seeing which symptoms appear across multiple conditions
 */
export function groupSymptomsByText(
  symptoms: ExtractedSymptom[]
): Map<string, ExtractedSymptom[]> {
  const groups = new Map<string, ExtractedSymptom[]>();

  for (const symptom of symptoms) {
    // Normalize for grouping
    const normalized = symptom.text.toLowerCase().trim();

    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(symptom);
  }

  return groups;
}

/**
 * Get unique symptom texts sorted by frequency across conditions
 */
export function getSymptomFrequency(
  symptoms: ExtractedSymptom[]
): Array<{ text: string; count: number; conditions: string[] }> {
  const groups = groupSymptomsByText(symptoms);

  const frequencies: Array<{
    text: string;
    count: number;
    conditions: string[];
  }> = [];

  for (const [normalized, symptomList] of groups.entries()) {
    const conditions = [
      ...new Set(symptomList.map((s) => s.conditionSlug)),
    ];
    frequencies.push({
      text: symptomList[0].text, // Use first occurrence's casing
      count: conditions.length,
      conditions,
    });
  }

  // Sort by frequency (most common first)
  frequencies.sort((a, b) => b.count - a.count);

  return frequencies;
}

/**
 * Normalize a symptom text for matching
 * Used to map raw symptoms to canonical entities
 */
export function normalizeSymptomText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Create a mapping from condition slugs to their extracted symptoms
 */
export function getSymptomsByCondition(): Map<string, ExtractedSymptom[]> {
  const allSymptoms = extractAllSymptoms();
  const byCondition = new Map<string, ExtractedSymptom[]>();

  for (const symptom of allSymptoms) {
    if (!byCondition.has(symptom.conditionSlug)) {
      byCondition.set(symptom.conditionSlug, []);
    }
    byCondition.get(symptom.conditionSlug)!.push(symptom);
  }

  return byCondition;
}
