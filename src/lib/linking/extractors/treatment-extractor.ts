/**
 * Treatment Link Extractor
 *
 * Extracts links from treatment entities (medications, therapies, etc.) to:
 * - Conditions they treat
 * - Related treatments (same drug class, similar modality)
 * - Alternative treatments
 */

import type { Entity } from '@/lib/types/database';
import type { LinkExtractor, CandidateLink } from '../types';
import { getLinkTypePriority } from '../config';
import {
  matchEntityByName,
  extractDrugClass,
  extractTherapyModality,
  cleanLinkSyntax,
} from '../utils';

export class TreatmentLinkExtractor implements LinkExtractor {
  entityType = 'medication' as const; // Also handles therapy, treatment, etc.
  id = 'treatment-extractor';

  async extract(entity: Entity, allEntities: Entity[] = []): Promise<CandidateLink[]> {
    const links: CandidateLink[] = [];

    // Extract condition links (what this treats)
    links.push(...this.extractConditionLinks(entity, allEntities));

    // Extract related treatment links
    links.push(...this.extractRelatedTreatmentLinks(entity, allEntities));

    // Extract drug class links
    links.push(...this.extractDrugClassLinks(entity, allEntities));

    // Extract alternative treatment links
    links.push(...this.extractAlternativeLinks(entity, allEntities));

    return links;
  }

  /**
   * Extract condition links from primary_indications
   */
  private extractConditionLinks(entity: Entity, allEntities: Entity[]): CandidateLink[] {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    // Primary indications
    const indications =
      data.primary_indications ||
      entity.metadata?.clinical?.primary_indications ||
      entity.metadata?.primary_indications ||
      [];

    indications.forEach((indication: any, index: number) => {
      const name = this.extractName(indication);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, ['condition']);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: entity.type || 'treatment',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: 'condition',
        linkType: 'treatment_to_condition',
        context: `primary_indications[${index}]`,
        priority: getLinkTypePriority('treatment_to_condition'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          extractorId: this.id,
        },
      });
    });

    // Off-label uses (lower priority)
    const offLabel = data.off_label_uses || [];
    offLabel.forEach((use: any, index: number) => {
      const name = this.extractName(use);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, ['condition']);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: entity.type || 'treatment',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: 'condition',
        linkType: 'treatment_to_condition',
        context: `off_label_uses[${index}]`,
        priority: 'medium', // Lower than primary indications
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          extractorId: this.id,
          category: 'off-label',
        },
      });
    });

    // Conditions treated (for therapies)
    const conditionsTreated = data.conditions_treated || [];
    conditionsTreated.forEach((condition: any, index: number) => {
      const name = this.extractName(condition);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, ['condition']);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: entity.type || 'therapy',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: 'condition',
        linkType: 'treatment_to_condition',
        context: `conditions_treated[${index}]`,
        priority: getLinkTypePriority('treatment_to_condition'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          extractorId: this.id,
        },
      });
    });

    // Explicit linked conditions (slug-based, highest reliability)
    const linkedConditions =
      data.linked_conditions ||
      data.clinical_metadata?.linked_conditions ||
      [];
    linkedConditions.forEach((linked: any, index: number) => {
      if (!linked.slug) return;

      // Find by exact slug match
      const targetEntity = allEntities.find(
        (e) => e.type === 'condition' && e.slug === linked.slug
      );
      if (!targetEntity) return;

      const priority =
        linked.relationship === 'primary_treatment'
          ? getLinkTypePriority('treatment_to_condition')
          : 'medium';

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: entity.type || 'treatment',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: 'condition',
        linkType: 'treatment_to_condition',
        context: `linked_conditions[${index}]`,
        priority,
        anchorOptions: [targetEntity.name || linked.slug],
        metadata: {
          extractorId: this.id,
          relationship: linked.relationship,
          linkContext: linked.context,
        },
      });
    });

    return links;
  }

  /**
   * Extract related treatment links (same category/modality)
   */
  private extractRelatedTreatmentLinks(
    entity: Entity,
    allEntities: Entity[]
  ): CandidateLink[] {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    // Explicit related treatments
    const related = data.related_treatments || [];
    related.forEach((rel: any, index: number) => {
      const name = this.extractName(rel);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, [
        'medication',
        'therapy',
        'treatment',
        'interventional',
        'alternative',
        'supplement',
      ]);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: entity.type || 'treatment',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: targetEntity.type || 'treatment',
        linkType: 'treatment_to_related_treatment',
        context: `related_treatments[${index}]`,
        priority: getLinkTypePriority('treatment_to_related_treatment'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          extractorId: this.id,
        },
      });
    });

    return links;
  }

  /**
   * Extract drug class links (for medications)
   */
  private extractDrugClassLinks(entity: Entity, allEntities: Entity[]): CandidateLink[] {
    const links: CandidateLink[] = [];

    // Only for medications
    if (entity.type !== 'medication' && entity.type !== 'treatment') {
      return links;
    }

    const drugClass = extractDrugClass(entity);
    if (!drugClass) return links;

    // Find other medications in same drug class
    const sameDrugClass = allEntities.filter((e) => {
      if (e.id === entity.id) return false;
      if (e.type !== 'medication' && e.type !== 'treatment') return false;

      const otherClass = extractDrugClass(e);
      return otherClass === drugClass;
    });

    // Link to up to 5 related medications in same class
    sameDrugClass.slice(0, 5).forEach((related, index) => {
      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'medication',
        targetId: related.id,
        targetSlug: related.slug,
        targetType: related.type || 'medication',
        linkType: 'treatment_to_drug_class',
        context: `drug_class:${drugClass}`,
        priority: getLinkTypePriority('treatment_to_drug_class'),
        anchorOptions: this.generateAnchorOptions(related.name, related),
        metadata: {
          category: drugClass,
          extractorId: this.id,
        },
      });
    });

    return links;
  }

  /**
   * Extract alternative treatment links
   */
  private extractAlternativeLinks(entity: Entity, allEntities: Entity[]): CandidateLink[] {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    const alternatives = data.alternatives || [];
    alternatives.forEach((alt: any, index: number) => {
      const name = this.extractName(alt);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, [
        'alternative',
        'treatment',
        'therapy',
      ]);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: entity.type || 'treatment',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: targetEntity.type || 'alternative',
        linkType: 'treatment_to_alternative',
        context: `alternatives[${index}]`,
        priority: getLinkTypePriority('treatment_to_alternative'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          extractorId: this.id,
        },
      });
    });

    return links;
  }

  /**
   * Extract name from various data structures
   */
  private extractName(item: any): string | null {
    if (typeof item === 'string') {
      return cleanLinkSyntax(item);
    }

    if (typeof item === 'object' && item !== null) {
      return item.name || item.title || item.label || null;
    }

    return null;
  }

  /**
   * Generate anchor text variations
   */
  private generateAnchorOptions(extractedName: string, targetEntity: Entity): string[] {
    const options: string[] = [];

    options.push(targetEntity.name);

    if (extractedName !== targetEntity.name) {
      options.push(extractedName);
    }

    const abbrev = targetEntity.data?.abbreviation || targetEntity.metadata?.abbreviation;
    if (abbrev && !options.includes(abbrev)) {
      options.push(abbrev);
    }

    const altNames = targetEntity.data?.alternative_names || [];
    altNames.slice(0, 2).forEach((alt: string) => {
      if (!options.includes(alt)) {
        options.push(alt);
      }
    });

    return options.slice(0, 5);
  }
}
