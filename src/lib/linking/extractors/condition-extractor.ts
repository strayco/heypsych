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
import { parseEntityNames, generateValidatedLinks, parseLinkSyntax } from '../utils';

export class ConditionLinkExtractor implements LinkExtractor {
  entityType = 'condition' as const;
  id = 'condition-extractor';

  async extract(entity: Entity, allEntities: Entity[] = []): Promise<CandidateLink[]> {
    const links: CandidateLink[]  = [];

    // Extract treatment links (now async with validation)
    const treatmentLinks = await this.extractTreatmentLinks(entity, allEntities);
    links.push(...treatmentLinks);

    // Extract related condition links (now async with validation)
    const relatedLinks = await this.extractRelatedConditionLinks(entity, allEntities);
    links.push(...relatedLinks);

    // Extract comorbidity links (now async with validation)
    const comorbidityLinks = await this.extractComorbidityLinks(entity, allEntities);
    links.push(...comorbidityLinks);

    // Extract assessment links (now async with validation)
    const assessmentLinks = await this.extractAssessmentLinks(entity, allEntities);
    links.push(...assessmentLinks);

    return links;
  }

  /**
   * Extract treatment links from treatment_approaches
   * Parses complex medication strings and validates each entity exists
   */
  private async extractTreatmentLinks(entity: Entity, allEntities: Entity[]): Promise<CandidateLink[]> {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    // Medications
    const medications = data.treatment_approaches?.medications || [];
    for (const med of medications) {
      const medText = this.extractName(med);
      if (!medText) continue;

      // Parse to extract individual medication names
      const medNames = parseEntityNames(medText);

      // Generate validated links (only for entities that exist)
      const validatedLinks = await generateValidatedLinks({
        sourceEntity: entity,
        targetNames: medNames,
        targetType: 'medication',
        linkType: 'condition_to_treatment',
        contextPrefix: 'treatment_approaches.medications',
        priority: getLinkTypePriority('condition_to_treatment'),
        extractorId: this.id,
        category: 'medication',
      });

      links.push(...validatedLinks);
    }

    // Psychotherapy
    const therapies = data.treatment_approaches?.psychotherapy || [];
    for (const therapy of therapies) {
      const therapyText = this.extractName(therapy);
      if (!therapyText) continue;

      // Parse therapy names (handles lists like "CBT, DBT, ACT")
      const therapyNames = parseEntityNames(therapyText);

      const validatedLinks = await generateValidatedLinks({
        sourceEntity: entity,
        targetNames: therapyNames,
        targetType: 'therapy',
        linkType: 'condition_to_treatment',
        contextPrefix: 'treatment_approaches.psychotherapy',
        priority: getLinkTypePriority('condition_to_treatment'),
        extractorId: this.id,
        category: 'therapy',
      });

      links.push(...validatedLinks);
    }

    // Interventional treatments
    const interventions = data.treatment_approaches?.interventional || [];
    for (const intervention of interventions) {
      const interventionText = this.extractName(intervention);
      if (!interventionText) continue;

      const interventionNames = parseEntityNames(interventionText);

      const validatedLinks = await generateValidatedLinks({
        sourceEntity: entity,
        targetNames: interventionNames,
        targetType: 'interventional',
        linkType: 'condition_to_treatment',
        contextPrefix: 'treatment_approaches.interventional',
        priority: getLinkTypePriority('condition_to_treatment'),
        extractorId: this.id,
        category: 'interventional',
      });

      links.push(...validatedLinks);
    }

    return links;
  }

  /**
   * Extract related condition links
   * Validates each condition exists before creating link
   */
  private async extractRelatedConditionLinks(entity: Entity, allEntities: Entity[]): Promise<CandidateLink[]> {
    const data = entity.data || {};
    const relatedConditions = data.related_conditions || [];

    const conditionNames = relatedConditions
      .map((related: any) => this.extractName(related))
      .filter((name: string | null): name is string => Boolean(name));

    return await generateValidatedLinks({
      sourceEntity: entity,
      targetNames: conditionNames,
      targetType: 'condition',
      linkType: 'condition_to_related_condition',
      contextPrefix: 'related_conditions',
      priority: getLinkTypePriority('condition_to_related_condition'),
      extractorId: this.id,
    });
  }

  /**
   * Extract comorbidity links
   * Validates each comorbid condition exists before creating link
   */
  private async extractComorbidityLinks(entity: Entity, allEntities: Entity[]): Promise<CandidateLink[]> {
    const data = entity.data || {};
    const comorbidities = data.comorbidities || [];

    const comorbidityNames = comorbidities
      .map((comorbidity: any) => this.extractName(comorbidity))
      .filter((name: string | null): name is string => Boolean(name));

    return await generateValidatedLinks({
      sourceEntity: entity,
      targetNames: comorbidityNames,
      targetType: 'condition',
      linkType: 'condition_to_comorbidity',
      contextPrefix: 'comorbidities',
      priority: getLinkTypePriority('condition_to_comorbidity'),
      extractorId: this.id,
    });
  }

  /**
   * Extract assessment/screener links
   * Validates each assessment exists before creating link
   */
  private async extractAssessmentLinks(entity: Entity, allEntities: Entity[]): Promise<CandidateLink[]> {
    const links: CandidateLink[] = [];
    const data = entity.data || {};

    // From evaluation.screening_tools
    const screeningTools = data.evaluation?.screening_tools || [];
    const screeningToolNames = screeningTools
      .map((tool: any) => this.extractName(tool))
      .filter((name: string | null): name is string => Boolean(name));

    const screeningLinks = await generateValidatedLinks({
      sourceEntity: entity,
      targetNames: screeningToolNames,
      targetType: 'resource',
      linkType: 'condition_to_assessment',
      contextPrefix: 'evaluation.screening_tools',
      priority: getLinkTypePriority('condition_to_assessment'),
      extractorId: this.id,
      category: 'assessments-screeners',
    });

    links.push(...screeningLinks);

    // From dedicated assessments array if it exists
    const assessments = data.assessments || [];
    const assessmentNames = assessments
      .map((assessment: any) => this.extractName(assessment))
      .filter((name: string | null): name is string => Boolean(name));

    const assessmentLinks = await generateValidatedLinks({
      sourceEntity: entity,
      targetNames: assessmentNames,
      targetType: 'resource',
      linkType: 'condition_to_assessment',
      contextPrefix: 'assessments',
      priority: getLinkTypePriority('condition_to_assessment'),
      extractorId: this.id,
      category: 'assessments-screeners',
    });

    links.push(...assessmentLinks);

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
