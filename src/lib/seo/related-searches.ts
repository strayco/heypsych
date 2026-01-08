/**
 * Related Searches Generator
 * 
 * Generates "Related Searches" sections that match Google's actual
 * related search patterns. This captures long-tail traffic and
 * signals topical authority.
 */

export interface RelatedSearch {
  query: string;
  url: string;
  type: "condition" | "treatment" | "comparison" | "resource";
}

/**
 * Condition-related search patterns
 * These match what Google actually shows as "Related searches"
 */
export const CONDITION_RELATED_PATTERNS = [
  "{condition} symptoms",
  "{condition} treatment",
  "{condition} medication",
  "{condition} therapy",
  "{condition} causes",
  "{condition} vs {related_condition}",
  "{condition} in adults",
  "{condition} in children",
  "{condition} test",
  "{condition} self help",
  "how to deal with {condition}",
  "living with {condition}",
  "best medication for {condition}",
  "natural remedies for {condition}",
];

/**
 * Treatment-related search patterns
 */
export const TREATMENT_RELATED_PATTERNS = [
  "{treatment} side effects",
  "{treatment} reviews",
  "{treatment} for {condition}",
  "{treatment} vs {alternative}",
  "{treatment} dosage",
  "{treatment} cost",
  "{treatment} near me",
  "how does {treatment} work",
  "is {treatment} effective",
  "{treatment} success rate",
  "best {treatment} providers",
];

/**
 * Generate related searches for a condition
 */
export function generateConditionRelatedSearches(
  conditionName: string,
  conditionSlug: string,
  relatedConditions: string[] = [],
  treatments: string[] = []
): RelatedSearch[] {
  const searches: RelatedSearch[] = [];
  const conditionLower = conditionName.toLowerCase();

  // Core condition searches
  searches.push({
    query: `${conditionLower} symptoms`,
    url: `/conditions/${conditionSlug}#symptoms`,
    type: "condition",
  });

  searches.push({
    query: `${conditionLower} treatment options`,
    url: `/conditions/${conditionSlug}#treatment`,
    type: "condition",
  });

  searches.push({
    query: `${conditionLower} causes`,
    url: `/conditions/${conditionSlug}#causes`,
    type: "condition",
  });

  // Treatment-related searches
  if (treatments.length > 0) {
    const topTreatment = treatments[0];
    searches.push({
      query: `best medication for ${conditionLower}`,
      url: `/conditions/${conditionSlug}#medications`,
      type: "treatment",
    });

    searches.push({
      query: `${topTreatment.toLowerCase()} for ${conditionLower}`,
      url: `/treatments/${slugify(topTreatment)}`,
      type: "treatment",
    });
  }

  // Comparison searches with related conditions
  if (relatedConditions.length > 0) {
    const related = relatedConditions[0];
    searches.push({
      query: `${conditionLower} vs ${related.toLowerCase()}`,
      url: `/conditions/${conditionSlug}#differential-diagnosis`,
      type: "comparison",
    });
  }

  // Self-help searches
  searches.push({
    query: `how to cope with ${conditionLower}`,
    url: `/conditions/${conditionSlug}#self-help`,
    type: "resource",
  });

  searches.push({
    query: `${conditionLower} support groups`,
    url: `/resources/support-community`,
    type: "resource",
  });

  return searches.slice(0, 8); // Limit to 8 related searches
}

/**
 * Generate related searches for a treatment
 */
export function generateTreatmentRelatedSearches(
  treatmentName: string,
  treatmentSlug: string,
  drugClass?: string,
  conditions: string[] = [],
  alternatives: string[] = []
): RelatedSearch[] {
  const searches: RelatedSearch[] = [];
  const treatmentLower = treatmentName.toLowerCase();

  // Core treatment searches
  searches.push({
    query: `${treatmentLower} side effects`,
    url: `/treatments/${treatmentSlug}#side-effects`,
    type: "treatment",
  });

  searches.push({
    query: `${treatmentLower} dosage`,
    url: `/treatments/${treatmentSlug}#dosing`,
    type: "treatment",
  });

  searches.push({
    query: `how does ${treatmentLower} work`,
    url: `/treatments/${treatmentSlug}#mechanism`,
    type: "treatment",
  });

  // Condition-related searches
  if (conditions.length > 0) {
    const topCondition = conditions[0];
    searches.push({
      query: `${treatmentLower} for ${topCondition.toLowerCase()}`,
      url: `/treatments/${treatmentSlug}#indications`,
      type: "treatment",
    });
  }

  // Comparison searches
  if (alternatives.length > 0) {
    const alt = alternatives[0];
    const comparisonSlug = createComparisonSlug(treatmentName, alt);
    searches.push({
      query: `${treatmentLower} vs ${alt.toLowerCase()}`,
      url: `/treatments/compare/${comparisonSlug}`,
      type: "comparison",
    });
  }

  // Drug class searches
  if (drugClass) {
    searches.push({
      query: `${drugClass.toLowerCase()} medications`,
      url: `/treatments/medications`,
      type: "treatment",
    });
  }

  // Safety searches
  searches.push({
    query: `is ${treatmentLower} safe`,
    url: `/treatments/${treatmentSlug}#warnings`,
    type: "treatment",
  });

  searches.push({
    query: `${treatmentLower} withdrawal`,
    url: `/treatments/${treatmentSlug}#discontinuation`,
    type: "treatment",
  });

  return searches.slice(0, 8);
}

/**
 * Helper to create URL-safe slugs
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Create comparison slug (alphabetical order)
 */
function createComparisonSlug(a: string, b: string): string {
  const slugA = slugify(a);
  const slugB = slugify(b);
  return [slugA, slugB].sort().join("-vs-");
}

/**
 * Get trending/high-volume searches for mental health
 * These are actual high-volume queries from search data
 */
export const TRENDING_MENTAL_HEALTH_SEARCHES = [
  { query: "depression symptoms", volume: "high" },
  { query: "anxiety attack symptoms", volume: "high" },
  { query: "ADHD in adults", volume: "high" },
  { query: "bipolar disorder signs", volume: "high" },
  { query: "PTSD symptoms", volume: "high" },
  { query: "OCD treatment", volume: "high" },
  { query: "panic attack vs anxiety attack", volume: "high" },
  { query: "social anxiety disorder", volume: "high" },
  { query: "depression medication", volume: "high" },
  { query: "therapy near me", volume: "high" },
  { query: "Lexapro vs Zoloft", volume: "high" },
  { query: "CBT therapy", volume: "high" },
  { query: "mental health assessment", volume: "medium" },
  { query: "free anxiety test", volume: "medium" },
  { query: "how to find a therapist", volume: "medium" },
];


