/**
 * ResourceMetadataGenerator
 *
 * Generates SEO metadata for resource pages (assessments, articles, tools, etc.)
 *
 * Varies by resource category:
 * - Assessments: "{Name}: Free Online {Type} Tool & Scoring Guide | HeyPsych"
 * - Articles: "{Title} | Mental Health Articles | HeyPsych"
 * - Tools: "{App Name}: Mental Health App Review & Features | HeyPsych"
 */

import type { Metadata } from 'next';
import type { Entity } from '@/lib/types/database';
import { MetadataGenerator } from '../metadata-generator';

export class ResourceMetadataGenerator extends MetadataGenerator {
  async generate(entity: Entity): Promise<Metadata> {
    // Use SEO overrides if provided
    if (entity.seo?.title || entity.seo?.description) {
      return this.generateFromOverrides(entity);
    }

    const category = this.getResourceCategory(entity);

    const title = this.generateTitleByCategory(entity, category);
    const description = this.generateDescriptionByCategory(entity, category);
    const canonical = this.generateCanonical(entity);
    const keywords = this.extractResourceKeywords(entity, category);

    return {
      title,
      description,
      keywords: keywords.join(', '),
      alternates: { canonical },
      openGraph: this.generateOpenGraph(title, description, canonical),
      twitter: this.generateTwitterCard(title, description)
    };
  }

  private getResourceCategory(entity: Entity): string {
    return entity.data?.category || entity.metadata?.category || 'resource';
  }

  private generateTitleByCategory(entity: Entity, category: string): string {
    const name = entity.name;

    switch (category) {
      case 'assessments-screeners':
        return this.generateAssessmentTitle(entity, name);

      case 'digital-tools':
        return this.generateDigitalToolTitle(entity, name);

      case 'crisis-helplines':
        return this.generateCrisisTitle(entity, name);

      case 'knowledge-hub':
      case 'articles-blogs':
        return this.generateArticleTitle(entity, name);

      default:
        return this.ensureTitleLength(`${name} | ${SITE_CONFIG.name}`);
    }
  }

  private generateAssessmentTitle(entity: Entity, name: string): string {
    // Format: "GAD-7: Free Online Anxiety Screening Tool & Scoring Guide | HeyPsych"
    const assessmentType = this.extractAssessmentType(entity);
    const fullTitle = `${name}: Free Online ${assessmentType} Tool & Scoring Guide | HeyPsych`;

    if (fullTitle.length > 60) {
      return this.ensureTitleLength(`${name}: Free ${assessmentType} Screening | HeyPsych`);
    }

    return fullTitle;
  }

  private generateDigitalToolTitle(entity: Entity, name: string): string {
    // Format: "Headspace: Mental Health App Review & Features | HeyPsych"
    const fullTitle = `${name}: Mental Health App Review & Features | HeyPsych`;

    if (fullTitle.length > 60) {
      return this.ensureTitleLength(`${name} App Review | HeyPsych`);
    }

    return fullTitle;
  }

  private generateCrisisTitle(entity: Entity, name: string): string {
    // Format: "988 Suicide & Crisis Lifeline | 24/7 Mental Health Support"
    const fullTitle = `${name} | 24/7 Mental Health Crisis Support | HeyPsych`;

    if (fullTitle.length > 60) {
      return this.ensureTitleLength(`${name} | Crisis Support`);
    }

    return fullTitle;
  }

  private generateArticleTitle(entity: Entity, name: string): string {
    // Format: "{Article Title} | Mental Health Guide | HeyPsych"
    const fullTitle = `${name} | Mental Health Guide | HeyPsych`;

    if (fullTitle.length > 60) {
      return this.ensureTitleLength(`${name} | HeyPsych`);
    }

    return fullTitle;
  }

  private generateDescriptionByCategory(entity: Entity, category: string): string {
    const name = entity.name;
    const description = entity.description || entity.data?.description;

    // Use entity description if provided and good length
    if (description && description.length >= 70 && description.length <= 160) {
      return this.ensureDescriptionLength(description);
    }

    switch (category) {
      case 'assessments-screeners':
        return this.generateAssessmentDescription(entity, name);

      case 'digital-tools':
        return this.generateDigitalToolDescription(entity, name);

      case 'crisis-helplines':
        return this.generateCrisisDescription(entity, name);

      case 'knowledge-hub':
      case 'articles-blogs':
        return this.generateArticleDescription(entity, name, description);

      default:
        return this.ensureDescriptionLength(
          description || `Learn about ${name} on HeyPsych - evidence-based mental health information.`
        );
    }
  }

  private generateAssessmentDescription(entity: Entity, name: string): string {
    const assessmentType = this.extractAssessmentType(entity);
    const condition = this.extractConditionForAssessment(entity);

    let desc = `Free online ${name} ${assessmentType} screening tool. `;
    desc += `Assess ${condition} symptoms with instant scoring and interpretation. `;
    desc += `Learn when to seek professional help.`;

    return this.ensureDescriptionLength(desc);
  }

  private generateDigitalToolDescription(entity: Entity, name: string): string {
    const features = entity.data?.features || [];
    const platforms = entity.data?.platforms || [];

    let desc = `${name} is a mental health app`;
    if (platforms.length > 0) {
      desc += ` available on ${platforms.join(', ')}`;
    }
    desc += `. Learn about features, pricing, and user reviews to decide if it's right for you.`;

    return this.ensureDescriptionLength(desc);
  }

  private generateCrisisDescription(entity: Entity, name: string): string {
    const coverage = entity.data?.coverage_area || 'nationwide';
    const availability = entity.data?.hours || '24/7';

    let desc = `${name} provides ${availability} mental health crisis support `;
    desc += `${coverage}. Get immediate help via phone, text, or chat. `;
    desc += `Free and confidential support when you need it most.`;

    return this.ensureDescriptionLength(desc);
  }

  private generateArticleDescription(entity: Entity, name: string, description?: string): string {
    if (description) {
      return this.ensureDescriptionLength(description);
    }

    return this.ensureDescriptionLength(
      `${name} - Evidence-based information and practical guidance on mental health topics from HeyPsych.`
    );
  }

  private extractAssessmentType(entity: Entity): string {
    // From assessment metadata
    const assessmentType = entity.data?.assessment_type || entity.data?.type;

    if (assessmentType) {
      return assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1);
    }

    // Infer from name
    if (entity.name.toLowerCase().includes('depression')) return 'Depression';
    if (entity.name.toLowerCase().includes('anxiety')) return 'Anxiety';
    if (entity.name.toLowerCase().includes('adhd')) return 'ADHD';
    if (entity.name.toLowerCase().includes('substance')) return 'Substance Use';

    return 'Screening';
  }

  private extractConditionForAssessment(entity: Entity): string {
    // From conditions array
    const conditions = entity.data?.conditions;

    if (Array.isArray(conditions) && conditions.length > 0) {
      return this.cleanLinkSyntax(conditions[0]).toLowerCase();
    }

    // Infer from name
    if (entity.name.includes('GAD')) return 'anxiety';
    if (entity.name.includes('PHQ')) return 'depression';
    if (entity.name.includes('ASRS')) return 'ADHD';

    return 'mental health';
  }

  private extractResourceKeywords(entity: Entity, category: string): string[] {
    const baseKeywords: string[] = [
      entity.name
    ];

    // Category-specific keywords
    switch (category) {
      case 'assessments-screeners':
        baseKeywords.push(
          `${entity.name} screening`,
          `${entity.name} test`,
          `${entity.name} questionnaire`,
          'mental health assessment',
          'online screening tool'
        );
        break;

      case 'digital-tools':
        baseKeywords.push(
          `${entity.name} app`,
          'mental health app',
          'therapy app',
          'meditation app'
        );
        break;

      case 'crisis-helplines':
        baseKeywords.push(
          'crisis hotline',
          'suicide prevention',
          '988',
          'mental health emergency'
        );
        break;

      case 'knowledge-hub':
        baseKeywords.push(
          'mental health information',
          'psychiatric education',
          'mental health guide'
        );
        break;
    }

    // Add conditions
    const conditions = entity.data?.conditions;
    if (Array.isArray(conditions)) {
      conditions.forEach((condition: string) => {
        baseKeywords.push(this.cleanLinkSyntax(condition));
      });
    }

    return this.extractKeywords(entity, baseKeywords);
  }

  protected getPath(entity: Entity): string {
    const category = this.getResourceCategory(entity);

    if (category === 'assessments-screeners') {
      return `/resources/assessments-screeners/${entity.slug}`;
    }

    return `/resources/${entity.slug}`;
  }
}
