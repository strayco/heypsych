/**
 * Assessment Link Extractor
 *
 * Extracts links from assessment/screener entities to:
 * - Conditions they screen for
 * - Related treatments
 */

import type { Entity } from '@/lib/types/database';
import type { LinkExtractor, CandidateLink } from '../types';
import { getLinkTypePriority } from '../config';
import { matchEntityByName, cleanLinkSyntax } from '../utils';

export class AssessmentLinkExtractor implements LinkExtractor {
  entityType = 'resource' as const;
  id = 'assessment-extractor';

  async extract(entity: Entity, allEntities: Entity[] = []): Promise<CandidateLink[]> {
    // Only process assessments/screeners
    const category = entity.data?.category || entity.metadata?.category;
    if (category !== 'assessments-screeners') {
      return [];
    }

    const links: CandidateLink[] = [];

    // Extract condition links
    links.push(...this.extractConditionLinks(entity, allEntities));

    // Extract treatment links (if assessment mentions specific treatments)
    links.push(...this.extractTreatmentLinks(entity, allEntities));

    return links;
  }

  /**
   * Extract condition links from conditions array
   */
  private extractConditionLinks(entity: Entity, allEntities: Entity[]): CandidateLink[] {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    // Conditions array (what this assessment screens for)
    const conditions = data.conditions || [];
    conditions.forEach((condition: any, index: number) => {
      const name = this.extractName(condition);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, ['condition']);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'resource',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: 'condition',
        linkType: 'assessment_to_condition',
        context: `conditions[${index}]`,
        priority: getLinkTypePriority('assessment_to_condition'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          category: 'assessments-screeners',
          extractorId: this.id,
        },
      });
    });

    // Screens_for field (alternative location)
    const screensFor = data.screens_for || [];
    screensFor.forEach((condition: any, index: number) => {
      const name = this.extractName(condition);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, ['condition']);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'resource',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: 'condition',
        linkType: 'assessment_to_condition',
        context: `screens_for[${index}]`,
        priority: getLinkTypePriority('assessment_to_condition'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          category: 'assessments-screeners',
          extractorId: this.id,
        },
      });
    });

    return links;
  }

  /**
   * Extract treatment links (if mentioned in assessment context)
   */
  private extractTreatmentLinks(entity: Entity, allEntities: Entity[]): CandidateLink[] {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    // Related treatments (if assessment provides treatment guidance)
    const relatedTreatments = data.related_treatments || [];
    relatedTreatments.forEach((treatment: any, index: number) => {
      const name = this.extractName(treatment);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, [
        'medication',
        'therapy',
        'treatment',
      ]);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'resource',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: targetEntity.type || 'treatment',
        linkType: 'assessment_to_treatment',
        context: `related_treatments[${index}]`,
        priority: getLinkTypePriority('assessment_to_treatment'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          category: 'assessments-screeners',
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

    return options.slice(0, 5);
  }
}
