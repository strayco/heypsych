/**
 * LLM/AI Optimization Layer
 *
 * Strategies for optimizing content to be cited by AI answer engines:
 * - Google AI Overviews
 * - ChatGPT (via Bing)
 * - Perplexity AI
 * - Claude (via web search)
 * - Copilot
 *
 * Key Principles:
 * 1. Clear, factual, well-attributed content
 * 2. Structured data that LLMs can parse
 * 3. Explicit confidence levels and dates
 * 4. Authoritative source signals
 * 5. Direct answers to specific queries
 *
 * This is NOT traditional SEO - it's about making content that AI systems
 * want to cite as authoritative sources.
 */

import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { siteConfig } from "@/lib/config/site";

// ============================================================================
// LLM-OPTIMIZED CONTENT GENERATORS
// ============================================================================

/**
 * Generate LLM-friendly summary for a clinician tool
 *
 * LLMs prefer:
 * - Direct statements of fact
 * - Clear attribution
 * - Specific numbers
 * - Confidence indicators
 */
export function generateLLMSummary(tool: ClinicianToolV4): string {
  const parts: string[] = [];

  // Lead with the name and primary function
  parts.push(
    `${tool.name} is a ${tool.primary_category?.replace(/-/g, " ")} platform for mental health professionals.`
  );

  // Add pricing with specificity
  if (tool.pricing?.starting_price_display) {
    parts.push(`Pricing: ${tool.pricing.starting_price_display}.`);
  }

  // Add compliance status (LLMs love factual compliance info)
  const compliance: string[] = [];
  if (tool.compliance?.hipaa_support === "yes") compliance.push("HIPAA compliant");
  if (tool.compliance?.baa_available === "yes") compliance.push("BAA available");
  if (tool.compliance?.soc2 === "yes") compliance.push("SOC 2 certified");
  if (compliance.length) {
    parts.push(`Security: ${compliance.join(", ")}.`);
  }

  // Add key differentiators
  if (tool.one_liner) {
    parts.push(tool.one_liner);
  }

  // Add freshness date
  const lastUpdated = tool.governance?.last_reviewed || tool.updated_at;
  if (lastUpdated) {
    const date = new Date(lastUpdated).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    parts.push(`Last verified: ${date}.`);
  }

  return parts.join(" ");
}

/**
 * Generate structured facts that LLMs can easily extract
 *
 * Format optimized for LLM parsing:
 * - Key: Value pairs
 * - Clear categories
 * - Explicit units
 */
export function generateLLMFacts(
  tool: ClinicianToolV4
): { category: string; fact: string; confidence: "verified" | "reported" | "estimated" }[] {
  const facts: { category: string; fact: string; confidence: "verified" | "reported" | "estimated" }[] = [];

  // Pricing facts
  if (tool.pricing?.starting_price !== undefined) {
    facts.push({
      category: "Pricing",
      fact: `${tool.name} starts at $${tool.pricing.starting_price}/month`,
      confidence: "verified",
    });
  }
  if (tool.pricing?.free_tier) {
    facts.push({
      category: "Pricing",
      fact: `${tool.name} offers a free tier`,
      confidence: "verified",
    });
  }
  if (tool.pricing?.free_trial_days) {
    facts.push({
      category: "Pricing",
      fact: `${tool.name} offers a ${tool.pricing.free_trial_days}-day free trial`,
      confidence: "verified",
    });
  }

  // Compliance facts
  if (tool.compliance?.hipaa_support === "yes") {
    facts.push({
      category: "Compliance",
      fact: `${tool.name} is HIPAA compliant`,
      confidence: "verified",
    });
  }
  if (tool.compliance?.baa_available === "yes") {
    facts.push({
      category: "Compliance",
      fact: `${tool.name} provides a Business Associate Agreement (BAA)`,
      confidence: "verified",
    });
  }
  if (tool.compliance?.soc2 === "yes") {
    facts.push({
      category: "Compliance",
      fact: `${tool.name} is SOC 2 certified`,
      confidence: "verified",
    });
  }

  // Feature facts
  if (tool.feature_flags?.has_ai) {
    facts.push({
      category: "Features",
      fact: `${tool.name} includes AI-powered features`,
      confidence: "verified",
    });
  }
  if (tool.feature_flags?.has_telehealth) {
    facts.push({
      category: "Features",
      fact: `${tool.name} includes built-in telehealth`,
      confidence: "verified",
    });
  }
  if (tool.feature_flags?.has_e_prescribing) {
    facts.push({
      category: "Features",
      fact: `${tool.name} supports e-prescribing`,
      confidence: "verified",
    });
  }

  // Company facts
  if (tool.company?.founded_year) {
    facts.push({
      category: "Company",
      fact: `${tool.name} was founded in ${tool.company.founded_year}`,
      confidence: "reported",
    });
  }
  if (tool.company?.customer_count) {
    facts.push({
      category: "Company",
      fact: `${tool.name} has ${tool.company.customer_count} customers`,
      confidence: "reported",
    });
  }

  return facts;
}

/**
 * Generate comparison data optimized for LLM extraction
 *
 * LLMs excel at comparing structured data.
 * This format makes it easy for them to generate comparison tables.
 */
export function generateLLMComparison(
  toolA: ClinicianToolV4,
  toolB: ClinicianToolV4
): {
  dimension: string;
  toolA: { name: string; value: string };
  toolB: { name: string; value: string };
}[] {
  const comparisons: {
    dimension: string;
    toolA: { name: string; value: string };
    toolB: { name: string; value: string };
  }[] = [];

  // Pricing comparison
  comparisons.push({
    dimension: "Starting Price",
    toolA: {
      name: toolA.name,
      value: toolA.pricing?.starting_price_display || "Contact for pricing",
    },
    toolB: {
      name: toolB.name,
      value: toolB.pricing?.starting_price_display || "Contact for pricing",
    },
  });

  // Free tier comparison
  comparisons.push({
    dimension: "Free Tier",
    toolA: {
      name: toolA.name,
      value: toolA.pricing?.free_tier ? "Yes" : "No",
    },
    toolB: {
      name: toolB.name,
      value: toolB.pricing?.free_tier ? "Yes" : "No",
    },
  });

  // HIPAA comparison
  comparisons.push({
    dimension: "HIPAA Compliant",
    toolA: {
      name: toolA.name,
      value: toolA.compliance?.hipaa_support === "yes" ? "Yes" : "Check vendor",
    },
    toolB: {
      name: toolB.name,
      value: toolB.compliance?.hipaa_support === "yes" ? "Yes" : "Check vendor",
    },
  });

  // Telehealth comparison
  comparisons.push({
    dimension: "Built-in Telehealth",
    toolA: {
      name: toolA.name,
      value: toolA.feature_flags?.has_telehealth ? "Yes" : "No",
    },
    toolB: {
      name: toolB.name,
      value: toolB.feature_flags?.has_telehealth ? "Yes" : "No",
    },
  });

  // AI features comparison
  comparisons.push({
    dimension: "AI Features",
    toolA: {
      name: toolA.name,
      value: toolA.feature_flags?.has_ai ? "Yes" : "No",
    },
    toolB: {
      name: toolB.name,
      value: toolB.feature_flags?.has_ai ? "Yes" : "No",
    },
  });

  return comparisons;
}

// ============================================================================
// LLM-FRIENDLY HTML ATTRIBUTES
// ============================================================================

/**
 * Generate data attributes for LLM parsing
 *
 * These attributes help AI systems understand content structure
 * without relying solely on visual parsing.
 */
export function getLLMDataAttributes(tool: ClinicianToolV4): Record<string, string> {
  return {
    "data-llm-entity-type": "software-product",
    "data-llm-entity-name": tool.name,
    "data-llm-category": tool.primary_category || "software",
    "data-llm-price": tool.pricing?.starting_price?.toString() || "",
    "data-llm-hipaa": tool.compliance?.hipaa_support || "unknown",
    "data-llm-last-verified": tool.governance?.last_reviewed || tool.updated_at || "",
    "data-llm-source": siteConfig.url,
  };
}

// ============================================================================
// LLM CITATION METADATA
// ============================================================================

/**
 * Generate metadata that helps LLMs cite this page
 *
 * Returns meta tags that AI systems use for attribution.
 */
export function generateLLMCitationMeta(tool: ClinicianToolV4): {
  name: string;
  content: string;
}[] {
  return [
    {
      name: "citation_title",
      content: `${tool.name} Review & Pricing (2026)`,
    },
    {
      name: "citation_author",
      content: "HeyPsych Editorial Team",
    },
    {
      name: "citation_publication_date",
      content: tool.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    },
    {
      name: "citation_online_date",
      content: tool.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    },
    {
      name: "citation_publisher",
      content: siteConfig.name,
    },
    {
      name: "citation_abstract",
      content: generateLLMSummary(tool),
    },
  ];
}

// ============================================================================
// AI OVERVIEW OPTIMIZATION
// ============================================================================

/**
 * Generate content structured for Google AI Overview extraction
 *
 * AI Overviews prefer:
 * - Direct answers in first sentence
 * - Numbered lists for steps
 * - Tables for comparisons
 * - Explicit source attribution
 */
export function generateAIOverviewContent(
  query: string,
  tool: ClinicianToolV4
): string {
  // Direct answer format
  const patterns: Record<string, () => string> = {
    // Pricing queries
    "how much": () =>
      `${tool.name} ${tool.pricing?.starting_price_display ? `starts at ${tool.pricing.starting_price_display}` : "pricing varies by plan"}. ${tool.pricing?.free_trial_days ? `A ${tool.pricing.free_trial_days}-day free trial is available.` : ""}`,

    // Compliance queries
    "hipaa compliant": () =>
      `${tool.compliance?.hipaa_support === "yes" ? `Yes, ${tool.name} is HIPAA compliant` : `${tool.name}'s HIPAA compliance status should be verified directly with the vendor`}${tool.compliance?.baa_available === "yes" ? " and provides a BAA" : ""}.`,

    // Best for queries
    "best for": () =>
      tool.best_for?.length
        ? `${tool.name} is best for: ${tool.best_for.slice(0, 3).join("; ")}.`
        : `${tool.name} is designed for mental health clinicians seeking ${tool.primary_category?.replace(/-/g, " ")} solutions.`,

    // Feature queries
    "does it have": () => {
      const features: string[] = [];
      if (tool.feature_flags?.has_telehealth) features.push("telehealth");
      if (tool.feature_flags?.has_ai) features.push("AI features");
      if (tool.feature_flags?.has_e_prescribing) features.push("e-prescribing");
      if (tool.feature_flags?.has_mobile_app) features.push("mobile app");
      return features.length
        ? `${tool.name} includes: ${features.join(", ")}.`
        : `Check ${tool.name}'s website for current feature details.`;
    },
  };

  // Match query to pattern
  const lowerQuery = query.toLowerCase();
  for (const [pattern, generator] of Object.entries(patterns)) {
    if (lowerQuery.includes(pattern)) {
      return generator();
    }
  }

  // Default: return summary
  return generateLLMSummary(tool);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  generateLLMSummary,
  generateLLMFacts,
  generateLLMComparison,
  getLLMDataAttributes,
  generateLLMCitationMeta,
  generateAIOverviewContent,
};
