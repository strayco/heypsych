// src/lib/tools/taxonomy-service.ts
// Loads and manages taxonomy data from JSON files

import type { HubSlug, ClinicianHubSlug } from "@/lib/schemas/digital-tool-v3";

// Import taxonomy data - these are loaded at build time
// Using relative imports from workspace root
import hubsData from "../../../data/resources/tools/taxonomies/hubs.json";
import toolTypesData from "../../../data/resources/tools/taxonomies/tool-types.json";
import conditionsData from "../../../data/resources/tools/taxonomies/conditions.json";
import aiAttributesData from "../../../data/resources/tools/taxonomies/ai-attributes.json";
import synonymsData from "../../../data/resources/tools/taxonomies/synonyms.json";
import clinicianHubsData from "../../../data/resources/tools/taxonomies/clinician-hubs.json";
import clinicianWorkflowsData from "../../../data/resources/tools/taxonomies/clinician-workflows.json";
import clinicianSynonymsData from "../../../data/resources/tools/taxonomies/clinician-synonyms.json";

// ============================================================================
// TYPES
// ============================================================================

export interface HubConfig {
  slug: string;
  url: string;
  display_name: string;
  seo_title: string;
  meta_description: string;
  direct_answer: string;
  intro: string;
  top_picks: string[];
  icon: string;
  color: string;
  sub_hubs?: string[];
  faqs: Array<{ q: string; a: string }>;
}

export interface SubHubConfig {
  slug: string;
  parent_hub: string;
  url: string;
  display_name: string;
  seo_title: string;
  meta_description: string;
  direct_answer: string;
  intro: string;
  top_picks: string[];
  tool_type_filter: string;
  faqs: Array<{ q: string; a: string }>;
}

export interface ToolTypeConfig {
  slug: string;
  display_name: string;
  description: string;
  icon: string;
  filter_label: string;
}

export interface ConditionConfig {
  slug: string;
  display_name: string;
  short_name: string;
  synonyms: string[];
  indexable: boolean;
  hub_associations: string[];
}

export interface AIAttributeConfig {
  slug: string;
  display_name: string;
  description: string;
  badge_text: string | null;
  badge_color: string | null;
}

export interface ClinicianHubConfig {
  slug: string;
  url: string;
  display_name: string;
  seo_title: string;
  meta_description: string;
  direct_answer: string;
  intro: string;
  top_picks: string[];
  workflow?: string;
  icon?: string;
  color?: string;
  faqs: Array<{ q: string; a: string }>;
}

export interface ClinicianLandingConfig {
  slug: string;
  url: string;
  display_name: string;
  seo_title: string;
  meta_description: string;
  direct_answer: string;
  intro: string;
  top_picks: string[];
  faqs: Array<{ q: string; a: string }>;
}

export interface ClinicianWorkflowConfig {
  slug: string;
  display_name: string;
  description: string;
  hub: string;
  icon: string;
  chip_label: string;
}

// ============================================================================
// TAXONOMY SERVICE
// ============================================================================

export class TaxonomyService {
  // Cache parsed data
  private static hubsCache: Map<string, HubConfig> | null = null;
  private static subHubsCache: Map<string, SubHubConfig> | null = null;
  private static toolTypesCache: Map<string, ToolTypeConfig> | null = null;
  private static conditionsCache: Map<string, ConditionConfig> | null = null;
  private static synonymsCache: Map<string, string> | null = null;
  private static clinicianHubsCache: Map<string, ClinicianHubConfig> | null = null;
  private static clinicianWorkflowsCache: Map<string, ClinicianWorkflowConfig> | null = null;

  // ============================================================================
  // HUBS
  // ============================================================================

  static getAllHubs(): HubConfig[] {
    return hubsData.hubs as HubConfig[];
  }

  static getHub(slug: string): HubConfig | null {
    if (!this.hubsCache) {
      this.hubsCache = new Map();
      for (const hub of hubsData.hubs) {
        this.hubsCache.set(hub.slug, hub as HubConfig);
      }
    }
    return this.hubsCache.get(slug) ?? null;
  }

  static getHubSlugs(): HubSlug[] {
    return hubsData.hubs.map((h) => h.slug) as HubSlug[];
  }

  static isValidHub(slug: string): boolean {
    return this.getHub(slug) !== null;
  }

  // ============================================================================
  // SUB-HUBS
  // ============================================================================

  static getAllSubHubs(): SubHubConfig[] {
    return hubsData.sub_hubs as SubHubConfig[];
  }

  static getSubHub(slug: string): SubHubConfig | null {
    if (!this.subHubsCache) {
      this.subHubsCache = new Map();
      for (const subHub of hubsData.sub_hubs) {
        this.subHubsCache.set(subHub.slug, subHub as SubHubConfig);
      }
    }
    return this.subHubsCache.get(slug) ?? null;
  }

  static getSubHubsForHub(hubSlug: string): SubHubConfig[] {
    return hubsData.sub_hubs.filter((sh) => sh.parent_hub === hubSlug) as SubHubConfig[];
  }

  static isValidSubHub(slug: string): boolean {
    return this.getSubHub(slug) !== null;
  }

  // ============================================================================
  // TOOL TYPES
  // ============================================================================

  static getAllToolTypes(): ToolTypeConfig[] {
    return toolTypesData.tool_types as ToolTypeConfig[];
  }

  static getToolType(slug: string): ToolTypeConfig | null {
    if (!this.toolTypesCache) {
      this.toolTypesCache = new Map();
      for (const tt of toolTypesData.tool_types) {
        this.toolTypesCache.set(tt.slug, tt as ToolTypeConfig);
      }
    }
    return this.toolTypesCache.get(slug) ?? null;
  }

  static isValidToolType(slug: string): boolean {
    return this.getToolType(slug) !== null;
  }

  // ============================================================================
  // CONDITIONS
  // ============================================================================

  static getAllConditions(): ConditionConfig[] {
    return conditionsData.conditions as ConditionConfig[];
  }

  static getCondition(slug: string): ConditionConfig | null {
    if (!this.conditionsCache) {
      this.conditionsCache = new Map();
      for (const cond of conditionsData.conditions) {
        this.conditionsCache.set(cond.slug, cond as ConditionConfig);
      }
    }
    return this.conditionsCache.get(slug) ?? null;
  }

  static getConditionsForHub(hubSlug: string): ConditionConfig[] {
    return conditionsData.conditions.filter((c) =>
      c.hub_associations.includes(hubSlug)
    ) as ConditionConfig[];
  }

  static getIndexableConditions(): ConditionConfig[] {
    return conditionsData.conditions.filter((c) => c.indexable) as ConditionConfig[];
  }

  // ============================================================================
  // AI ATTRIBUTES
  // ============================================================================

  static getAllAIAttributes(): AIAttributeConfig[] {
    return aiAttributesData.ai_attributes as AIAttributeConfig[];
  }

  static getAIAttribute(slug: string): AIAttributeConfig | null {
    const attr = aiAttributesData.ai_attributes.find((a) => a.slug === slug);
    return attr ? (attr as AIAttributeConfig) : null;
  }

  static getDisplayableAIAttributes(): AIAttributeConfig[] {
    const excludeList = aiAttributesData.display_rules.exclude_from_badge;
    return aiAttributesData.ai_attributes.filter(
      (a) => !excludeList.includes(a.slug)
    ) as AIAttributeConfig[];
  }

  // ============================================================================
  // SYNONYMS
  // ============================================================================

  static resolveHubSynonym(input: string): string | null {
    if (!this.synonymsCache) {
      this.synonymsCache = new Map();
      for (const [phrase, target] of Object.entries(synonymsData.synonyms)) {
        this.synonymsCache.set(phrase.toLowerCase(), target);
      }
    }
    return this.synonymsCache.get(input.toLowerCase()) ?? null;
  }

  static resolveConditionSynonym(input: string): string | null {
    const synonyms = synonymsData.condition_synonyms as Record<string, string>;
    return synonyms[input.toLowerCase()] ?? null;
  }

  static resolveAnyTag(input: string): { type: "hub" | "condition"; slug: string } | null {
    const hubResult = this.resolveHubSynonym(input);
    if (hubResult) {
      return { type: "hub", slug: hubResult };
    }

    const condResult = this.resolveConditionSynonym(input);
    if (condResult) {
      return { type: "condition", slug: condResult };
    }

    // Check if input is already a valid slug
    if (this.isValidHub(input)) {
      return { type: "hub", slug: input };
    }

    if (this.getCondition(input)) {
      return { type: "condition", slug: input };
    }

    return null;
  }

  // ============================================================================
  // CLINICIAN HUBS
  // ============================================================================

  static getClinicianLanding(): ClinicianLandingConfig {
    return clinicianHubsData.clinician_landing as ClinicianLandingConfig;
  }

  static getAllClinicianHubs(): ClinicianHubConfig[] {
    return clinicianHubsData.hubs as ClinicianHubConfig[];
  }

  static getClinicianHub(slug: string): ClinicianHubConfig | null {
    if (!this.clinicianHubsCache) {
      this.clinicianHubsCache = new Map();
      for (const hub of clinicianHubsData.hubs) {
        this.clinicianHubsCache.set(hub.slug, hub as ClinicianHubConfig);
      }
    }
    return this.clinicianHubsCache.get(slug) ?? null;
  }

  static getClinicianHubSlugs(): ClinicianHubSlug[] {
    return clinicianHubsData.hubs.map((h) => h.slug) as ClinicianHubSlug[];
  }

  static isValidClinicianHub(slug: string): boolean {
    return this.getClinicianHub(slug) !== null;
  }

  // ============================================================================
  // CLINICIAN WORKFLOWS
  // ============================================================================

  static getAllClinicianWorkflows(): ClinicianWorkflowConfig[] {
    return clinicianWorkflowsData.workflows as ClinicianWorkflowConfig[];
  }

  static getClinicianWorkflow(slug: string): ClinicianWorkflowConfig | null {
    if (!this.clinicianWorkflowsCache) {
      this.clinicianWorkflowsCache = new Map();
      for (const wf of clinicianWorkflowsData.workflows) {
        this.clinicianWorkflowsCache.set(wf.slug, wf as ClinicianWorkflowConfig);
      }
    }
    return this.clinicianWorkflowsCache.get(slug) ?? null;
  }

  // ============================================================================
  // CLINICIAN SYNONYMS
  // ============================================================================

  static resolveClinicianSynonym(input: string): string | null {
    const synonyms = clinicianSynonymsData.synonyms as Record<string, string>;
    return synonyms[input.toLowerCase()] ?? null;
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  static clearCache(): void {
    this.hubsCache = null;
    this.subHubsCache = null;
    this.toolTypesCache = null;
    this.conditionsCache = null;
    this.synonymsCache = null;
    this.clinicianHubsCache = null;
    this.clinicianWorkflowsCache = null;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const getHub = TaxonomyService.getHub.bind(TaxonomyService);
export const getAllHubs = TaxonomyService.getAllHubs.bind(TaxonomyService);
export const getSubHub = TaxonomyService.getSubHub.bind(TaxonomyService);
export const getAllSubHubs = TaxonomyService.getAllSubHubs.bind(TaxonomyService);
export const getToolType = TaxonomyService.getToolType.bind(TaxonomyService);
export const getAllToolTypes = TaxonomyService.getAllToolTypes.bind(TaxonomyService);
export const getCondition = TaxonomyService.getCondition.bind(TaxonomyService);
export const getAllConditions = TaxonomyService.getAllConditions.bind(TaxonomyService);
export const getClinicianLanding = TaxonomyService.getClinicianLanding.bind(TaxonomyService);
export const getAllClinicianHubs = TaxonomyService.getAllClinicianHubs.bind(TaxonomyService);
export const getClinicianHub = TaxonomyService.getClinicianHub.bind(TaxonomyService);
export const getAllClinicianWorkflows = TaxonomyService.getAllClinicianWorkflows.bind(TaxonomyService);
export const getClinicianWorkflow = TaxonomyService.getClinicianWorkflow.bind(TaxonomyService);