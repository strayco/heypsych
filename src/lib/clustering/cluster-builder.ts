/**
 * Content Cluster Builder
 *
 * Analyzes entities and builds topical content clusters for SEO.
 * Creates hub page structures and optimizes internal linking strategy.
 */

import type { Entity, EntityType } from "@/lib/types/database";
import type {
  ContentCluster,
  ClusterCandidate,
  ClusterAnalysisResult,
  ClusterBuilderConfig,
  ClusterCategory,
} from "./types";
import { LinkEngine } from "@/lib/linking/link-engine";

const DEFAULT_CONFIG: Required<ClusterBuilderConfig> = {
  min_cluster_size: 3,
  max_cluster_size: 20,
  min_cluster_strength: 30,
  allow_overlap: false,
  include_entity_types: ['condition', 'medication', 'therapy', 'treatment', 'resource'],
  exclude_entity_types: [],
};

export class ClusterBuilder {
  private config: Required<ClusterBuilderConfig>;
  private linkEngine: LinkEngine;

  constructor(config?: ClusterBuilderConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.linkEngine = LinkEngine.getInstance();
  }

  /**
   * Analyze all entities and build content clusters
   */
  async analyze(entities: Entity[]): Promise<ClusterAnalysisResult> {
    // Filter entities based on config
    const filteredEntities = this.filterEntities(entities);

    // Find cluster candidates
    const candidates = await this.findClusterCandidates(filteredEntities);

    // Validate and build clusters
    const clusters = await this.buildClusters(candidates, filteredEntities);

    // Identify orphans and overlaps
    const orphans = this.findOrphans(filteredEntities, clusters);
    const overlaps = this.findOverlaps(clusters);

    // Calculate statistics
    const stats = this.calculateStats(clusters, filteredEntities);

    return {
      clusters,
      orphans,
      overlaps,
      stats,
    };
  }

  /**
   * Get cluster by ID
   */
  getClusterById(clusters: ContentCluster[], id: string): ContentCluster | null {
    return clusters.find((c) => c.id === id) || null;
  }

  /**
   * Get clusters by category
   */
  getClustersByCategory(
    clusters: ContentCluster[],
    category: ClusterCategory
  ): ContentCluster[] {
    return clusters.filter((c) => c.category === category);
  }

  /**
   * Get clusters containing entity
   */
  getClustersForEntity(clusters: ContentCluster[], entityId: string): ContentCluster[] {
    return clusters.filter(
      (c) =>
        c.pillar.id === entityId ||
        c.supporting.some((e) => e.id === entityId)
    );
  }

  /**
   * Filter entities based on configuration
   */
  private filterEntities(entities: Entity[]): Entity[] {
    return entities.filter((entity) => {
      // Skip entities without a type
      if (!entity.type) {
        return false;
      }

      // Exclude by type
      if (this.config.exclude_entity_types.includes(entity.type)) {
        return false;
      }

      // Include only specified types
      if (
        this.config.include_entity_types.length > 0 &&
        !this.config.include_entity_types.includes(entity.type)
      ) {
        return false;
      }

      // Must be active
      if (entity.status !== 'active') {
        return false;
      }

      return true;
    });
  }

  /**
   * Find potential cluster candidates
   */
  private async findClusterCandidates(entities: Entity[]): Promise<ClusterCandidate[]> {
    const candidates: ClusterCandidate[] = [];

    for (const entity of entities) {
      // Condition-based clusters
      if (entity.type === 'condition') {
        const candidate = await this.buildConditionCluster(entity, entities);
        if (candidate) candidates.push(candidate);
      }

      // Drug class clusters (for medications)
      if (entity.type === 'medication') {
        const candidate = await this.buildDrugClassCluster(entity, entities);
        if (candidate) candidates.push(candidate);
      }

      // Therapy modality clusters
      if (entity.type === 'therapy') {
        const candidate = await this.buildTherapyCluster(entity, entities);
        if (candidate) candidates.push(candidate);
      }

      // Assessment category clusters
      if (entity.type === 'resource') {
        const candidate = await this.buildAssessmentCluster(entity, entities);
        if (candidate) candidates.push(candidate);
      }
    }

    return candidates;
  }

  /**
   * Build condition-based cluster
   */
  private async buildConditionCluster(
    condition: Entity,
    allEntities: Entity[]
  ): Promise<ClusterCandidate | null> {
    const data = condition.data || {};

    // Find related treatments
    const relatedTreatments: Entity[] = [];

    // Extract treatment references from condition data
    const treatmentNames = [
      ...(data.treatment_approaches?.medications || []),
      ...(data.treatment_approaches?.psychotherapy || []),
      ...(data.treatment_approaches?.interventional || []),
    ];

    for (const treatmentName of treatmentNames) {
      const treatment = allEntities.find(
        (e) =>
          (e.type === 'medication' || e.type === 'therapy' || e.type === 'treatment') &&
          e.name.toLowerCase().includes(treatmentName.toLowerCase())
      );
      if (treatment) {
        relatedTreatments.push(treatment);
      }
    }

    // Find related assessments
    const assessments = allEntities.filter(
      (e) =>
        e.type === 'resource' &&
        (e.data?.conditions?.includes(condition.name) ||
          e.data?.screens_for?.includes(condition.name))
    );

    const related = [...relatedTreatments, ...assessments];

    if (related.length < this.config.min_cluster_size) {
      return null;
    }

    return {
      pillar_entity: condition,
      related_entities: related,
      category: 'condition_cluster',
      score: this.calculateClusterScore(condition, related),
      reason: `Condition with ${relatedTreatments.length} treatments and ${assessments.length} assessments`,
    };
  }

  /**
   * Build drug class cluster
   */
  private async buildDrugClassCluster(
    medication: Entity,
    allEntities: Entity[]
  ): Promise<ClusterCandidate | null> {
    const drugClass = medication.data?.drug_class || medication.data?.class;
    if (!drugClass) return null;

    // Find other medications in same class
    const sameDrugClass = allEntities.filter(
      (e) =>
        e.id !== medication.id &&
        e.type === 'medication' &&
        (e.data?.drug_class === drugClass || e.data?.class === drugClass)
    );

    if (sameDrugClass.length < this.config.min_cluster_size - 1) {
      return null;
    }

    return {
      pillar_entity: medication,
      related_entities: sameDrugClass,
      category: 'drug_class_cluster',
      score: this.calculateClusterScore(medication, sameDrugClass),
      reason: `Drug class '${drugClass}' with ${sameDrugClass.length + 1} medications`,
    };
  }

  /**
   * Build therapy modality cluster
   */
  private async buildTherapyCluster(
    therapy: Entity,
    allEntities: Entity[]
  ): Promise<ClusterCandidate | null> {
    const modality = therapy.data?.modality || therapy.data?.type;
    if (!modality) return null;

    // Find related therapies
    const relatedTherapies = allEntities.filter(
      (e) =>
        e.id !== therapy.id &&
        e.type === 'therapy' &&
        (e.data?.modality === modality ||
          e.data?.type === modality ||
          e.name.toLowerCase().includes(modality.toLowerCase()))
    );

    if (relatedTherapies.length < this.config.min_cluster_size - 1) {
      return null;
    }

    return {
      pillar_entity: therapy,
      related_entities: relatedTherapies,
      category: 'therapy_cluster',
      score: this.calculateClusterScore(therapy, relatedTherapies),
      reason: `Therapy modality '${modality}' with ${relatedTherapies.length + 1} variants`,
    };
  }

  /**
   * Build assessment category cluster
   */
  private async buildAssessmentCluster(
    resource: Entity,
    allEntities: Entity[]
  ): Promise<ClusterCandidate | null> {
    const category = resource.data?.category;
    if (category !== 'assessments-screeners') return null;

    // Find assessments for same conditions
    const conditions = resource.data?.conditions || resource.data?.screens_for || [];
    if (conditions.length === 0) return null;

    const relatedAssessments = allEntities.filter(
      (e) =>
        e.id !== resource.id &&
        e.type === 'resource' &&
        e.data?.category === 'assessments-screeners' &&
        conditions.some(
          (c: string) =>
            e.data?.conditions?.includes(c) || e.data?.screens_for?.includes(c)
        )
    );

    if (relatedAssessments.length < this.config.min_cluster_size - 1) {
      return null;
    }

    return {
      pillar_entity: resource,
      related_entities: relatedAssessments,
      category: 'assessment_cluster',
      score: this.calculateClusterScore(resource, relatedAssessments),
      reason: `Assessment tools for ${conditions.join(', ')}`,
    };
  }

  /**
   * Calculate cluster strength score (0-100)
   */
  private calculateClusterScore(pillar: Entity, supporting: Entity[]): number {
    let score = 0;

    // Size factor (0-30 points)
    const sizeScore = Math.min(30, (supporting.length / this.config.max_cluster_size) * 30);
    score += sizeScore;

    // Entity type diversity (0-20 points)
    const uniqueTypes = new Set(supporting.map((e) => e.type)).size;
    const diversityScore = Math.min(20, uniqueTypes * 5);
    score += diversityScore;

    // Pillar quality (0-30 points)
    const pillarHasDescription = pillar.data?.description ? 10 : 0;
    const pillarHasMetadata = (pillar as any).metadata ? 10 : 0;
    const pillarQualityScore = pillarHasDescription + pillarHasMetadata + 10;
    score += pillarQualityScore;

    // Supporting entity quality (0-20 points)
    const withDescription = supporting.filter((e) => e.data?.description).length;
    const qualityRatio = withDescription / supporting.length;
    const supportingQualityScore = qualityRatio * 20;
    score += supportingQualityScore;

    return Math.round(score);
  }

  /**
   * Build validated clusters from candidates
   */
  private async buildClusters(
    candidates: ClusterCandidate[],
    allEntities: Entity[]
  ): Promise<ContentCluster[]> {
    const clusters: ContentCluster[] = [];
    const usedEntities = new Set<string>();

    // Sort candidates by score (highest first)
    const sortedCandidates = [...candidates].sort((a, b) => b.score - a.score);

    for (const candidate of sortedCandidates) {
      // Skip if pillar already used (unless overlap allowed)
      if (!this.config.allow_overlap && usedEntities.has(candidate.pillar_entity.id)) {
        continue;
      }

      // Filter out already-used supporting entities (unless overlap allowed)
      let supporting = candidate.related_entities;
      if (!this.config.allow_overlap) {
        supporting = supporting.filter((e) => !usedEntities.has(e.id));
      }

      // Check if still meets minimum size
      if (supporting.length < this.config.min_cluster_size - 1) {
        continue;
      }

      // Check if meets minimum strength
      const finalScore = this.calculateClusterScore(candidate.pillar_entity, supporting);
      if (finalScore < this.config.min_cluster_strength) {
        continue;
      }

      // Build cluster
      const cluster: ContentCluster = {
        id: `cluster-${candidate.pillar_entity.slug}`,
        name: `${candidate.pillar_entity.name} Cluster`,
        slug: `${candidate.pillar_entity.slug}-cluster`,
        pillar: candidate.pillar_entity,
        supporting,
        category: candidate.category,
        strength: finalScore,
        metadata: {
          entity_count: supporting.length + 1,
          internal_link_count: 0, // TODO: calculate from link engine
          avg_link_depth: 1, // TODO: calculate
          entity_type_distribution: this.calculateEntityTypeDistribution([
            candidate.pillar_entity,
            ...supporting,
          ]),
          keywords: this.extractKeywords(candidate.pillar_entity, supporting),
        },
      };

      clusters.push(cluster);

      // Mark entities as used
      usedEntities.add(candidate.pillar_entity.id);
      supporting.forEach((e) => usedEntities.add(e.id));
    }

    return clusters;
  }

  /**
   * Calculate entity type distribution
   */
  private calculateEntityTypeDistribution(entities: Entity[]): Record<EntityType, number> {
    const distribution: Record<string, number> = {};

    for (const entity of entities) {
      if (entity.type) {
        distribution[entity.type] = (distribution[entity.type] || 0) + 1;
      }
    }

    return distribution as Record<EntityType, number>;
  }

  /**
   * Extract keywords from cluster entities
   */
  private extractKeywords(pillar: Entity, supporting: Entity[]): string[] {
    const keywords = new Set<string>();

    // Add pillar name and key terms
    keywords.add(pillar.name.toLowerCase());

    // Extract from pillar description
    if (pillar.data?.description) {
      const desc = String(pillar.data.description).toLowerCase();
      // Simple keyword extraction (can be enhanced)
      const words = desc.split(/\W+/).filter((w) => w.length > 4);
      words.slice(0, 10).forEach((w) => keywords.add(w));
    }

    // Extract drug class, modality, etc.
    if (pillar.data?.drug_class) keywords.add(pillar.data.drug_class.toLowerCase());
    if (pillar.data?.modality) keywords.add(pillar.data.modality.toLowerCase());

    return Array.from(keywords).slice(0, 20);
  }

  /**
   * Find orphan entities (not in any cluster)
   */
  private findOrphans(allEntities: Entity[], clusters: ContentCluster[]): Entity[] {
    const clusteredEntityIds = new Set<string>();

    for (const cluster of clusters) {
      clusteredEntityIds.add(cluster.pillar.id);
      cluster.supporting.forEach((e) => clusteredEntityIds.add(e.id));
    }

    return allEntities.filter((e) => !clusteredEntityIds.has(e.id));
  }

  /**
   * Find overlapping entities (in multiple clusters)
   */
  private findOverlaps(
    clusters: ContentCluster[]
  ): { entity: Entity; clusters: string[] }[] {
    const entityClusterMap = new Map<string, string[]>();

    for (const cluster of clusters) {
      const addToMap = (entity: Entity) => {
        const existing = entityClusterMap.get(entity.id) || [];
        existing.push(cluster.id);
        entityClusterMap.set(entity.id, existing);
      };

      addToMap(cluster.pillar);
      cluster.supporting.forEach(addToMap);
    }

    const overlaps: { entity: Entity; clusters: string[] }[] = [];

    for (const [entityId, clusterIds] of entityClusterMap.entries()) {
      if (clusterIds.length > 1) {
        // Find entity from any cluster
        const entity = clusters
          .flatMap((c) => [c.pillar, ...c.supporting])
          .find((e) => e.id === entityId);

        if (entity) {
          overlaps.push({ entity, clusters: clusterIds });
        }
      }
    }

    return overlaps;
  }

  /**
   * Calculate cluster statistics
   */
  private calculateStats(
    clusters: ContentCluster[],
    allEntities: Entity[]
  ): ClusterAnalysisResult['stats'] {
    if (clusters.length === 0) {
      return {
        total_clusters: 0,
        avg_cluster_size: 0,
        largest_cluster: '',
        smallest_cluster: '',
        coverage_percentage: 0,
      };
    }

    const totalSize = clusters.reduce((sum, c) => sum + c.metadata.entity_count, 0);
    const avgSize = totalSize / clusters.length;

    const sortedBySize = [...clusters].sort(
      (a, b) => b.metadata.entity_count - a.metadata.entity_count
    );
    const largest = sortedBySize[0];
    const smallest = sortedBySize[sortedBySize.length - 1];

    const clusteredEntityIds = new Set<string>();
    for (const cluster of clusters) {
      clusteredEntityIds.add(cluster.pillar.id);
      cluster.supporting.forEach((e) => clusteredEntityIds.add(e.id));
    }

    const coverage = (clusteredEntityIds.size / allEntities.length) * 100;

    return {
      total_clusters: clusters.length,
      avg_cluster_size: Math.round(avgSize * 10) / 10,
      largest_cluster: largest.id,
      smallest_cluster: smallest.id,
      coverage_percentage: Math.round(coverage * 10) / 10,
    };
  }
}

// Singleton instance
let instance: ClusterBuilder | null = null;

export function getClusterBuilder(config?: ClusterBuilderConfig): ClusterBuilder {
  if (!instance) {
    instance = new ClusterBuilder(config);
  }
  return instance;
}
