/**
 * Symptom Quality Gate
 *
 * Validates symptom entities before they can be indexed.
 * An entity must pass all quality checks to have a page generated.
 */

import type { SymptomEntity, QualityGateResult } from "./types";
import { SYMPTOM_REGISTRY, getSymptomBySlug } from "./registry";

/**
 * Minimum requirements for an indexable symptom entity
 */
const QUALITY_THRESHOLDS = {
  /** Minimum length for short definition */
  minDefinitionLength: 50,
  /** Maximum length for short definition */
  maxDefinitionLength: 300,
  /** Minimum number of examples */
  minExamples: 2,
  /** Minimum number of condition relationships */
  minConditionRelationships: 1,
  /** Minimum number of aliases */
  minAliases: 2,
};

/**
 * Validate a single symptom entity
 */
export function validateSymptomEntity(
  symptom: SymptomEntity
): QualityGateResult {
  const failures: string[] = [];
  const warnings: string[] = [];

  // Check required fields exist
  if (!symptom.slug) {
    failures.push("Missing slug");
  } else if (!/^[a-z0-9-]+$/.test(symptom.slug)) {
    failures.push("Slug contains invalid characters");
  }

  if (!symptom.name || symptom.name.length < 3) {
    failures.push("Missing or too short name");
  }

  // Check definition quality
  if (!symptom.shortDefinition) {
    failures.push("Missing short definition");
  } else {
    if (symptom.shortDefinition.length < QUALITY_THRESHOLDS.minDefinitionLength) {
      failures.push(
        `Short definition too short (${symptom.shortDefinition.length} chars, min ${QUALITY_THRESHOLDS.minDefinitionLength})`
      );
    }
    if (symptom.shortDefinition.length > QUALITY_THRESHOLDS.maxDefinitionLength) {
      warnings.push(
        `Short definition quite long (${symptom.shortDefinition.length} chars)`
      );
    }
  }

  // Check examples
  if (!symptom.examples || symptom.examples.length < QUALITY_THRESHOLDS.minExamples) {
    failures.push(
      `Insufficient examples (${symptom.examples?.length || 0}, min ${QUALITY_THRESHOLDS.minExamples})`
    );
  }

  // Check condition relationships
  if (
    !symptom.conditionRelationships ||
    symptom.conditionRelationships.length < QUALITY_THRESHOLDS.minConditionRelationships
  ) {
    failures.push(
      `Insufficient condition relationships (${symptom.conditionRelationships?.length || 0}, min ${QUALITY_THRESHOLDS.minConditionRelationships})`
    );
  } else {
    // Verify condition relationships have context
    const missingContext = symptom.conditionRelationships.filter(
      (rel) => !rel.context
    );
    if (missingContext.length > 0) {
      warnings.push(
        `${missingContext.length} condition relationship(s) missing context`
      );
    }
  }

  // Check aliases
  if (!symptom.aliases || symptom.aliases.length < QUALITY_THRESHOLDS.minAliases) {
    warnings.push(
      `Few aliases (${symptom.aliases?.length || 0}, recommended ${QUALITY_THRESHOLDS.minAliases}+)`
    );
  }

  // Check category
  if (!symptom.category) {
    failures.push("Missing category");
  }

  // Check related symptoms exist
  if (symptom.relatedSymptoms && symptom.relatedSymptoms.length > 0) {
    const missingRelated = symptom.relatedSymptoms.filter(
      (slug) => !getSymptomBySlug(slug)
    );
    if (missingRelated.length > 0) {
      failures.push(
        `Related symptom(s) not found in registry: ${missingRelated.join(", ")}`
      );
    }
  }

  // Check for review status
  if (!symptom.reviewed) {
    failures.push("Not marked as reviewed");
  }

  // Check for review date if reviewed
  if (symptom.reviewed && !symptom.lastReviewed) {
    warnings.push("Marked as reviewed but missing lastReviewed date");
  }

  // Check for duplicate content with other symptoms
  const duplicateCheck = checkForDuplicates(symptom);
  if (duplicateCheck.hasDuplicates) {
    failures.push(
      `Potential duplicate of: ${duplicateCheck.similarTo.join(", ")}`
    );
  }

  // Check for prohibited diagnostic language
  const diagnosticLanguageCheck = checkForDiagnosticLanguage(symptom);
  if (diagnosticLanguageCheck.hasProhibited) {
    failures.push(
      `Contains prohibited diagnostic language: ${diagnosticLanguageCheck.phrases.join(", ")}`
    );
  }

  return {
    passes: failures.length === 0 && symptom.indexable,
    failures,
    warnings,
  };
}

/**
 * Check for duplicate or overly similar content
 */
function checkForDuplicates(symptom: SymptomEntity): {
  hasDuplicates: boolean;
  similarTo: string[];
} {
  const similarTo: string[] = [];

  // Simple check: very similar names or definitions
  for (const other of SYMPTOM_REGISTRY) {
    if (other.slug === symptom.slug) continue;

    // Check name similarity
    const nameSimilarity = calculateSimilarity(
      symptom.name.toLowerCase(),
      other.name.toLowerCase()
    );
    if (nameSimilarity > 0.9) {
      similarTo.push(other.slug);
      continue;
    }

    // Check definition similarity
    const defSimilarity = calculateSimilarity(
      symptom.shortDefinition.toLowerCase(),
      other.shortDefinition.toLowerCase()
    );
    if (defSimilarity > 0.8) {
      similarTo.push(other.slug);
    }
  }

  return {
    hasDuplicates: similarTo.length > 0,
    similarTo,
  };
}

/**
 * Simple similarity calculation (Jaccard index of words)
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  return intersection / (wordsA.size + wordsB.size - intersection);
}

/**
 * Check for prohibited diagnostic language
 */
function checkForDiagnosticLanguage(symptom: SymptomEntity): {
  hasProhibited: boolean;
  phrases: string[];
} {
  const prohibitedPhrases = [
    "you have",
    "you probably have",
    "you likely have",
    "your diagnosis is",
    "this means you have",
    "most likely condition",
    "% match",
    "% probability",
    "diagnostic score",
    "confirms diagnosis",
    "definitely have",
  ];

  const foundPhrases: string[] = [];

  // Check definition
  const defLower = symptom.shortDefinition.toLowerCase();
  for (const phrase of prohibitedPhrases) {
    if (defLower.includes(phrase)) {
      foundPhrases.push(phrase);
    }
  }

  // Check examples
  for (const example of symptom.examples) {
    const exLower = example.text.toLowerCase();
    for (const phrase of prohibitedPhrases) {
      if (exLower.includes(phrase) && !foundPhrases.includes(phrase)) {
        foundPhrases.push(phrase);
      }
    }
  }

  // Check condition relationship contexts
  for (const rel of symptom.conditionRelationships) {
    if (rel.context) {
      const ctxLower = rel.context.toLowerCase();
      for (const phrase of prohibitedPhrases) {
        if (ctxLower.includes(phrase) && !foundPhrases.includes(phrase)) {
          foundPhrases.push(phrase);
        }
      }
    }
  }

  return {
    hasProhibited: foundPhrases.length > 0,
    phrases: foundPhrases,
  };
}

/**
 * Validate all symptoms in the registry
 */
export function validateAllSymptoms(): Map<string, QualityGateResult> {
  const results = new Map<string, QualityGateResult>();

  for (const symptom of SYMPTOM_REGISTRY) {
    results.set(symptom.slug, validateSymptomEntity(symptom));
  }

  return results;
}

/**
 * Get all symptoms that pass the quality gate
 */
export function getApprovedSymptoms(): SymptomEntity[] {
  return SYMPTOM_REGISTRY.filter((symptom) => {
    const result = validateSymptomEntity(symptom);
    return result.passes;
  });
}

/**
 * Get all symptoms that fail the quality gate with reasons
 */
export function getFailingSymptoms(): Array<{
  slug: string;
  failures: string[];
}> {
  const failing: Array<{ slug: string; failures: string[] }> = [];

  for (const symptom of SYMPTOM_REGISTRY) {
    const result = validateSymptomEntity(symptom);
    if (!result.passes) {
      failing.push({
        slug: symptom.slug,
        failures: result.failures,
      });
    }
  }

  return failing;
}

/**
 * Validate that all symptom slugs are unique
 */
export function validateUniqueSlugs(): { valid: boolean; duplicates: string[] } {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const symptom of SYMPTOM_REGISTRY) {
    if (seen.has(symptom.slug)) {
      duplicates.push(symptom.slug);
    }
    seen.add(symptom.slug);
  }

  return {
    valid: duplicates.length === 0,
    duplicates,
  };
}

/**
 * Validate that all referenced condition slugs exist
 * Note: This would need integration with condition data loader
 */
export function validateConditionReferences(): {
  valid: boolean;
  missing: Array<{ symptomSlug: string; conditionSlug: string }>;
} {
  // This is a placeholder - in production, this would check against
  // actual condition data loaded from the conditions directory
  const missing: Array<{ symptomSlug: string; conditionSlug: string }> = [];

  // For now, we trust the condition slugs in the registry
  // A full implementation would load conditions and cross-reference

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Run all quality validations and return a comprehensive report
 */
export function runFullValidation(): {
  passed: number;
  failed: number;
  warnings: number;
  details: Map<string, QualityGateResult>;
  uniqueSlugs: boolean;
  summary: string;
} {
  const details = validateAllSymptoms();
  const uniqueSlugsResult = validateUniqueSlugs();

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const result of details.values()) {
    if (result.passes) {
      passed++;
    } else {
      failed++;
    }
    warnings += result.warnings.length;
  }

  const summary = `Symptom Quality Gate: ${passed} passed, ${failed} failed, ${warnings} warnings`;

  return {
    passed,
    failed,
    warnings,
    details,
    uniqueSlugs: uniqueSlugsResult.valid,
    summary,
  };
}
