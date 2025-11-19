/**
 * Content Clustering Types
 *
 * Types for building topical content clusters for SEO.
 * Clusters group related entities for hub pages and internal linking strategy.
 */

import type { Entity, EntityType } from "@/lib/types/database";

/**
 * Content cluster - a group of related entities around a central topic
 */
export interface ContentCluster {
  /** Unique identifier for the cluster */
  id: string;

  /** Cluster name (e.g., "Depression Treatment", "Anxiety Disorders") */
  name: string;

  /** SEO-friendly slug */
  slug: string;

  /** Pillar entity (the main/hub page for this cluster) */
  pillar: Entity;

  /** Supporting entities (related content) */
  supporting: Entity[];

  /** Cluster category/type */
  category: ClusterCategory;

  /** Cluster strength score (0-100) */
  strength: number;

  /** Metadata */
  metadata: {
    /** Total entities in cluster */
    entity_count: number;

    /** Internal link count between entities */
    internal_link_count: number;

    /** Average link depth from pillar */
    avg_link_depth: number;

    /** Entity type distribution */
    entity_type_distribution: Record<EntityType, number>;

    /** Keywords/topics */
    keywords: string[];
  };
}

/**
 * Cluster categories
 */
export type ClusterCategory =
  | 'condition_cluster' // e.g., "Major Depressive Disorder" with related treatments
  | 'treatment_cluster' // e.g., "SSRI Medications" with individual SSRIs
  | 'symptom_cluster' // e.g., "Panic Symptoms" with related conditions
  | 'drug_class_cluster' // e.g., "Benzodiazepines" with individual drugs
  | 'therapy_cluster' // e.g., "Cognitive Behavioral Therapy" with CBT variants
  | 'assessment_cluster'; // e.g., "Depression Screening" with related tools

/**
 * Cluster candidate - potential cluster before validation
 */
export interface ClusterCandidate {
  pillar_entity: Entity;
  related_entities: Entity[];
  category: ClusterCategory;
  score: number;
  reason: string;
}

/**
 * Cluster analysis result
 */
export interface ClusterAnalysisResult {
  /** All identified clusters */
  clusters: ContentCluster[];

  /** Orphan entities (not in any cluster) */
  orphans: Entity[];

  /** Overlapping entities (in multiple clusters) */
  overlaps: {
    entity: Entity;
    clusters: string[]; // cluster IDs
  }[];

  /** Cluster statistics */
  stats: {
    total_clusters: number;
    avg_cluster_size: number;
    largest_cluster: string; // cluster ID
    smallest_cluster: string; // cluster ID
    coverage_percentage: number; // % of entities in clusters
  };
}

/**
 * Cluster builder configuration
 */
export interface ClusterBuilderConfig {
  /** Minimum entities required for a cluster */
  min_cluster_size?: number;

  /** Maximum entities allowed in a cluster */
  max_cluster_size?: number;

  /** Minimum strength score to consider a cluster valid */
  min_cluster_strength?: number;

  /** Allow entity overlap between clusters */
  allow_overlap?: boolean;

  /** Entity types to include in clustering */
  include_entity_types?: EntityType[];

  /** Entity types to exclude from clustering */
  exclude_entity_types?: EntityType[];
}
