/**
 * Condition Link Extractor
 *
 * Extracts links from condition entities to:
 * - Treatments (medications, therapies)
 * - Related conditions
 * - Comorbidities
 * - Assessments/screeners
 */

import type { Entity } from '@/lib/types/database';
import type { LinkExtractor, CandidateLink } from '../types';
import { getLinkTypePriority } from '../config';
import { parseLinkSyntax, slugify, matchEntityByName } from '../utils';

export class ConditionLinkExtractor implements LinkExtractor {
  entityType = 'condition' as const;
  id = 'condition-extractor';

  async extract(entity: Entity, allEntities: Entity[] = []): Promise<CandidateLink[]> {
    const links: CandidateLink[] = [];

    // Extract treatment links
    links.push(...this.extractTreatmentLinks(entity, allEntities));

    // Extract related condition links
    links.push(...this.extractRelatedConditionLinks(entity, allEntities));

    // Extract comorbidity links
    links.push(...this.extractComorbidityLinks(entity, allEntities));

    // Extract assessment links
    links.push(...this.extractAssessmentLinks(entity, allEntities));

    return links;
  }

  /**
   * Extract treatment links from treatment_approaches
   */
  private extractTreatmentLinks(entity: Entity, allEntities: Entity[]): CandidateLink[] {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    // Medications
    const medications = data.treatment_approaches?.medications || [];
    medications.forEach((med: any, index: number) => {
      const medName = this.extractName(med);
      if (!medName) return;

      const targetEntity = matchEntityByName(medName, allEntities, ['medication', 'treatment']);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'condition',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: targetEntity.type || 'medication',
        linkType: 'condition_to_treatment',
        context: `treatment_approaches.medications[${index}]`,
        priority: getLinkTypePriority('condition_to_treatment'),
        anchorOptions: this.generateAnchorOptions(medName, targetEntity),
        metadata: {
          category: 'medication',
          extractorId: this.id,
        },
      });
    });

    // Psychotherapy
    const therapies = data.treatment_approaches?.psychotherapy || [];
    therapies.forEach((therapy: any, index: number) => {
      const therapyName = this.extractName(therapy);
      if (!therapyName) return;

      const targetEntity = matchEntityByName(therapyName, allEntities, ['therapy', 'treatment']);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'condition',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: targetEntity.type || 'therapy',
        linkType: 'condition_to_treatment',
        context: `treatment_approaches.psychotherapy[${index}]`,
        priority: getLinkTypePriority('condition_to_treatment'),
        anchorOptions: this.generateAnchorOptions(therapyName, targetEntity),
        metadata: {
          category: 'therapy',
          extractorId: this.id,
        },
      });
    });

    // Interventional treatments
    const interventions = data.treatment_approaches?.interventional || [];
    interventions.forEach((intervention: any, index: number) => {
      const name = this.extractName(intervention);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, [
        'interventional',
        'treatment',
      ]);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'condition',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: targetEntity.type || 'interventional',
        linkType: 'condition_to_treatment',
        context: `treatment_approaches.interventional[${index}]`,
        priority: getLinkTypePriority('condition_to_treatment'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          category: 'interventional',
          extractorId: this.id,
        },
      });
    });

    return links;
  }

  /**
   * Extract related condition links
   */
  private extractRelatedConditionLinks(entity: Entity, allEntities: Entity[]): CandidateLink[] {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    const relatedConditions = data.related_conditions || [];
    relatedConditions.forEach((related: any, index: number) => {
      const name = this.extractName(related);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, ['condition']);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'condition',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: 'condition',
        linkType: 'condition_to_related_condition',
        context: `related_conditions[${index}]`,
        priority: getLinkTypePriority('condition_to_related_condition'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          extractorId: this.id,
        },
      });
    });

    return links;
  }

  /**
   * Extract comorbidity links
   */
  private extractComorbidityLinks(entity: Entity, allEntities: Entity[]): CandidateLink[] {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    const comorbidities = data.comorbidities || [];
    comorbidities.forEach((comorbidity: any, index: number) => {
      const name = this.extractName(comorbidity);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, ['condition']);
      if (!targetEntity) return;

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'condition',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: 'condition',
        linkType: 'condition_to_comorbidity',
        context: `comorbidities[${index}]`,
        priority: getLinkTypePriority('condition_to_comorbidity'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          extractorId: this.id,
        },
      });
    });

    return links;
  }

  /**
   * Extract assessment/screener links
   */
  private extractAssessmentLinks(entity: Entity, allEntities: Entity[]): CandidateLink[] {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    // From evaluation.screening_tools
    const screeningTools = data.evaluation?.screening_tools || [];
    screeningTools.forEach((tool: any, index: number) => {
      const name = this.extractName(tool);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, ['resource']);
      if (!targetEntity) return;

      // Verify it's actually an assessment
      if (
        targetEntity.data?.category !== 'assessments-screeners' &&
        targetEntity.metadata?.category !== 'assessments-screeners'
      ) {
        return;
      }

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'condition',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: 'resource',
        linkType: 'condition_to_assessment',
        context: `evaluation.screening_tools[${index}]`,
        priority: getLinkTypePriority('condition_to_assessment'),
        anchorOptions: this.generateAnchorOptions(name, targetEntity),
        metadata: {
          category: 'assessments-screeners',
          extractorId: this.id,
        },
      });
    });

    // From dedicated assessments array if it exists
    const assessments = data.assessments || [];
    assessments.forEach((assessment: any, index: number) => {
      const name = this.extractName(assessment);
      if (!name) return;

      const targetEntity = matchEntityByName(name, allEntities, ['resource']);
      if (!targetEntity) return;

      if (
        targetEntity.data?.category !== 'assessments-screeners' &&
        targetEntity.metadata?.category !== 'assessments-screeners'
      ) {
        return;
      }

      links.push({
        sourceId: entity.id,
        sourceSlug: entity.slug,
        sourceType: 'condition',
        targetId: targetEntity.id,
        targetSlug: targetEntity.slug,
        targetType: 'resource',
        linkType: 'condition_to_assessment',
        context: `assessments[${index}]`,
        priority: getLinkTypePriority('condition_to_assessment'),
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
      // Handle {link:type:slug} syntax
      const parsed = parseLinkSyntax(item);
      if (parsed) {
        return parsed.text || parsed.slug;
      }
      return item;
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

    // Primary: Entity name
    options.push(targetEntity.name);

    // Secondary: Extracted name if different
    if (extractedName !== targetEntity.name) {
      options.push(extractedName);
    }

    // Tertiary: Abbreviations
    const abbrev = targetEntity.data?.abbreviation || targetEntity.metadata?.abbreviation;
    if (abbrev && !options.includes(abbrev)) {
      options.push(abbrev);
    }

    // Quaternary: Alternative names
    const altNames = targetEntity.data?.alternative_names || [];
    altNames.slice(0, 2).forEach((alt: string) => {
      if (!options.includes(alt)) {
        options.push(alt);
      }
    });

    return options.slice(0, 5); // Max 5 variations
  }
}
