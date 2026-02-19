// src/lib/tools/tool-service.ts
// Service for loading and querying digital tools from /data/tools/

import type { DigitalToolV3, HubSlug, ToolType, ClinicianHubSlug, ClinicianWorkflow } from "@/lib/schemas/digital-tool-v3";
import { TaxonomyService } from "./taxonomy-service";

// ============================================================================
// FILE SYSTEM LOADER (Server-side only)
// ============================================================================

// Cache for loaded tools
let toolsCache: Map<string, DigitalToolV3> | null = null;
let allToolsCache: DigitalToolV3[] | null = null;

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
 * Load all tools from /data/tools/ directory
 */
async function loadToolsFromFiles(): Promise<DigitalToolV3[]> {
  if (allToolsCache) {
    return allToolsCache;
  }

  const fs = loadServerModule("fs");
  const path = loadServerModule("path");

  if (!fs || !path) {
    console.warn("File system not available - returning empty tools list");
    return [];
  }

  try {
    const toolsDir = path.join(process.cwd(), "data/resources/tools");
    const files = fs.readdirSync(toolsDir).filter((f: string) => 
      f.endsWith(".json") && !f.startsWith(".")
    );

    const tools: DigitalToolV3[] = [];
    toolsCache = new Map();

    for (const file of files) {
      try {
        const filePath = path.join(toolsDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);

        // Only load v3 tools
        if (data.schema_version === "3.0" && data.kind === "tool") {
          tools.push(data as DigitalToolV3);
          toolsCache.set(data.slug, data as DigitalToolV3);
        }
      } catch (err) {
        console.error(`Error loading tool file ${file}:`, err);
      }
    }

    // Sort by order, then by name
    tools.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });

    allToolsCache = tools;
    return tools;
  } catch (error) {
    console.error("Error loading tools from files:", error);
    return [];
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface ToolFilters {
  hub?: HubSlug;
  subHub?: string;
  conditions?: string[];
  toolTypes?: ToolType[];
  pricingModel?: string;
  privacyGrade?: string;
  platforms?: ("ios" | "android" | "web")[];
  aiAttributes?: string[];
  featured?: boolean;
  // Clinician-specific filters
  clinicianHub?: ClinicianHubSlug;
  clinicianWorkflows?: ClinicianWorkflow[];
  isClinicianRelevant?: boolean;
}

export interface ToolSearchResult {
  tools: DigitalToolV3[];
  total: number;
  filters: ToolFilters;
}

// ============================================================================
// TOOL SERVICE
// ============================================================================

export class ToolService {
  /**
   * Get a single tool by slug
   */
  static async getBySlug(slug: string): Promise<DigitalToolV3 | null> {
    // Check cache first
    if (toolsCache?.has(slug)) {
      return toolsCache.get(slug)!;
    }

    // Load all tools to populate cache
    await loadToolsFromFiles();
    return toolsCache?.get(slug) ?? null;
  }

  /**
   * Get all tools
   */
  static async getAll(): Promise<DigitalToolV3[]> {
    return loadToolsFromFiles();
  }

  /**
   * Get tools for a specific hub
   */
  static async getByHub(hubSlug: HubSlug): Promise<DigitalToolV3[]> {
    const allTools = await this.getAll();
    return allTools.filter((tool) => tool.primary_hubs.includes(hubSlug));
  }

  /**
   * Get tools for a sub-hub (filtered by tool type)
   */
  static async getBySubHub(subHubSlug: string): Promise<DigitalToolV3[]> {
    const subHub = TaxonomyService.getSubHub(subHubSlug);
    if (!subHub) return [];

    const allTools = await this.getAll();
    return allTools.filter((tool) => 
      tool.tool_types.includes(subHub.tool_type_filter as ToolType)
    );
  }

  /**
   * Get tools by condition
   */
  static async getByCondition(conditionSlug: string): Promise<DigitalToolV3[]> {
    const allTools = await this.getAll();
    return allTools.filter((tool) => tool.conditions.includes(conditionSlug));
  }

  /**
   * Get tools by tool type
   */
  static async getByType(toolType: ToolType): Promise<DigitalToolV3[]> {
    const allTools = await this.getAll();
    return allTools.filter((tool) => tool.tool_types.includes(toolType));
  }

  /**
   * Get top picks for a hub
   */
  static async getTopPicks(hubSlug: string): Promise<DigitalToolV3[]> {
    const hub = TaxonomyService.getHub(hubSlug);
    if (!hub) return [];

    const topPickSlugs = hub.top_picks;
    const tools: DigitalToolV3[] = [];

    for (const slug of topPickSlugs) {
      const tool = await this.getBySlug(slug);
      if (tool) {
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * Get related tools for a tool
   */
  static async getRelated(toolSlug: string, limit = 4): Promise<DigitalToolV3[]> {
    const tool = await this.getBySlug(toolSlug);
    if (!tool) return [];

    // First, try explicit related tools
    const related: DigitalToolV3[] = [];
    if (tool.related_tools?.length) {
      for (const relSlug of tool.related_tools.slice(0, limit)) {
        const relTool = await this.getBySlug(relSlug);
        if (relTool) {
          related.push(relTool);
        }
      }
    }

    if (related.length >= limit) {
      return related.slice(0, limit);
    }

    // Fill with tools from same hub
    const hubTools = await this.getByHub(tool.primary_hubs[0]);
    for (const hubTool of hubTools) {
      if (hubTool.slug !== toolSlug && !related.some((r) => r.slug === hubTool.slug)) {
        related.push(hubTool);
        if (related.length >= limit) break;
      }
    }

    return related.slice(0, limit);
  }

  /**
   * Get featured tools
   */
  static async getFeatured(limit = 6): Promise<DigitalToolV3[]> {
    const allTools = await this.getAll();
    return allTools
      .filter((t) => t.featured)
      .sort((a, b) => (a.order || 999) - (b.order || 999))
      .slice(0, limit);
  }

  /**
   * Get clinician-relevant tools
   */
  static async getClinicianTools(): Promise<DigitalToolV3[]> {
    const allTools = await this.getAll();
    return allTools.filter((t) => t.clinician?.is_clinician_relevant);
  }

  /**
   * Get tools for a specific clinician hub
   */
  static async getByClinicianHub(clinicianHubSlug: ClinicianHubSlug): Promise<DigitalToolV3[]> {
    const allTools = await this.getAll();
    return allTools.filter((t) => 
      t.clinician?.is_clinician_relevant && 
      t.clinician?.primary_clinician_hubs.includes(clinicianHubSlug)
    );
  }

  /**
   * Get tools by clinician workflow
   */
  static async getByClinicianWorkflow(workflow: ClinicianWorkflow): Promise<DigitalToolV3[]> {
    const allTools = await this.getAll();
    return allTools.filter((t) =>
      t.clinician?.is_clinician_relevant &&
      t.clinician?.clinician_workflows.includes(workflow)
    );
  }

  /**
   * Get top picks for a clinician hub
   */
  static async getClinicianTopPicks(hubSlug: string): Promise<DigitalToolV3[]> {
    const hub = TaxonomyService.getClinicianHub(hubSlug);
    if (!hub) {
      // Try clinician landing
      const landing = TaxonomyService.getClinicianLanding();
      if (landing.slug === hubSlug || hubSlug === "for-clinicians") {
        const topPickSlugs = landing.top_picks;
        const tools: DigitalToolV3[] = [];
        for (const slug of topPickSlugs) {
          const tool = await this.getBySlug(slug);
          if (tool) tools.push(tool);
        }
        return tools;
      }
      return [];
    }

    const topPickSlugs = hub.top_picks;
    const tools: DigitalToolV3[] = [];

    for (const slug of topPickSlugs) {
      const tool = await this.getBySlug(slug);
      if (tool) {
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * Search tools with filters
   */
  static async search(query: string, filters?: ToolFilters): Promise<ToolSearchResult> {
    let tools = await this.getAll();

    // Apply text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      tools = tools.filter((tool) =>
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.short_description.toLowerCase().includes(lowerQuery) ||
        tool.one_liner.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply filters
    if (filters) {
      if (filters.hub) {
        tools = tools.filter((t) => t.primary_hubs.includes(filters.hub!));
      }
      if (filters.conditions?.length) {
        tools = tools.filter((t) =>
          filters.conditions!.some((c) => t.conditions.includes(c))
        );
      }
      if (filters.toolTypes?.length) {
        tools = tools.filter((t) =>
          filters.toolTypes!.some((tt) => t.tool_types.includes(tt))
        );
      }
      if (filters.pricingModel) {
        tools = tools.filter((t) => t.pricing.model === filters.pricingModel);
      }
      if (filters.privacyGrade) {
        tools = tools.filter((t) => t.privacy.grade === filters.privacyGrade);
      }
      if (filters.platforms?.length) {
        tools = tools.filter((t) =>
          filters.platforms!.some((p) => t.platforms[p])
        );
      }
      if (filters.aiAttributes?.length) {
        tools = tools.filter((t) =>
          filters.aiAttributes!.some((a) => t.ai_attributes.includes(a as any))
        );
      }
      if (filters.featured !== undefined) {
        tools = tools.filter((t) => t.featured === filters.featured);
      }
      // Clinician-specific filters
      if (filters.isClinicianRelevant !== undefined) {
        tools = tools.filter((t) => 
          t.clinician?.is_clinician_relevant === filters.isClinicianRelevant
        );
      }
      if (filters.clinicianHub) {
        tools = tools.filter((t) =>
          t.clinician?.is_clinician_relevant &&
          t.clinician?.primary_clinician_hubs.includes(filters.clinicianHub!)
        );
      }
      if (filters.clinicianWorkflows?.length) {
        tools = tools.filter((t) =>
          t.clinician?.is_clinician_relevant &&
          filters.clinicianWorkflows!.some((wf) => t.clinician?.clinician_workflows.includes(wf))
        );
      }
    }

    return {
      tools,
      total: tools.length,
      filters: filters || {},
    };
  }

  /**
   * Get all tool slugs (for static generation)
   */
  static async getAllSlugs(): Promise<string[]> {
    const tools = await this.getAll();
    return tools.map((t) => t.slug);
  }

  /**
   * Clear cache (useful for development)
   */
  static clearCache(): void {
    toolsCache = null;
    allToolsCache = null;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const getToolBySlug = ToolService.getBySlug.bind(ToolService);
export const getAllTools = ToolService.getAll.bind(ToolService);
export const getToolsByHub = ToolService.getByHub.bind(ToolService);
export const getToolsByCondition = ToolService.getByCondition.bind(ToolService);
export const searchTools = ToolService.search.bind(ToolService);
export const getClinicianTools = ToolService.getClinicianTools.bind(ToolService);
export const getToolsByClinicianHub = ToolService.getByClinicianHub.bind(ToolService);
export const getToolsByClinicianWorkflow = ToolService.getByClinicianWorkflow.bind(ToolService);
export const getClinicianTopPicks = ToolService.getClinicianTopPicks.bind(ToolService);