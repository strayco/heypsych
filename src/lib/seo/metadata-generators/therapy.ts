/**
 * TherapyMetadataGenerator
 *
 * Generates SEO metadata for psychotherapy/treatment pages.
 *
 * Title Formula: "{Therapy Name}: What It Is, How It Works, Effectiveness | HeyPsych"
 * Description Formula: "{Therapy} is an evidence-based treatment for {conditions}. Learn how it works..."
 */

import type { Metadata } from 'next';
import type { Entity } from '@/lib/types/database';
import { MetadataGenerator } from '../metadata-generator';

export class TherapyMetadataGenerator extends MetadataGenerator {
  async generate(entity: Entity): Promise<Metadata> {
    // Use SEO overrides if provided
    if (entity.seo?.title || entity.seo?.description) {
      return this.generateFromOverrides(entity);
    }

    const title = this.generateTitle(entity);
    const description = this.generateDescription(entity);
    const canonical = this.generateCanonical(entity);
    const keywords = this.extractTherapyKeywords(entity);

    return {
      title,
      description,
      keywords: keywords.join(', '),
      alternates: { canonical },
      openGraph: this.generateOpenGraph(title, description, canonical, 'article'),
      twitter: this.generateTwitterCard(title, description)
    };
  }

  private generateTitle(entity: Entity): string {
    const name = entity.name;

    // Full format
    const fullTitle = `${name}: What It Is, How It Works, Effectiveness | HeyPsych`;

    // If too long, use shorter version
    if (fullTitle.length > 60) {
      const shortTitle = `${name}: How It Works & Effectiveness | HeyPsych`;
      if (shortTitle.length > 60) {
        return this.ensureTitleLength(`${name} Therapy | HeyPsych`);
      }
      return shortTitle;
    }

    return fullTitle;
  }

  private generateDescription(entity: Entity): string {
    const name = entity.name;
    const abbrev = this.extractAbbreviation(name);
    const displayName = abbrev || name;

    // Primary conditions treated
    const conditions = this.extractPrimaryConditions(entity);

    let description = `${displayName} is an evidence-based treatment for ${conditions}. `;
    description += `Learn how ${displayName} works, what to expect in sessions, `;
    description += `and research on effectiveness.`;

    return this.ensureDescriptionLength(description);
  }

  private extractAbbreviation(name: string): string | null {
    const abbreviations: Record<string, string> = {
      'Cognitive Behavioral Therapy': 'CBT',
      'Dialectical Behavior Therapy': 'DBT',
      'Acceptance and Commitment Therapy': 'ACT',
      'Eye Movement Desensitization and Reprocessing': 'EMDR',
      'Mindfulness-Based Cognitive Therapy': 'MBCT',
      'Interpersonal Therapy': 'IPT',
      'Psychodynamic Therapy': 'PDT'
    };

    return abbreviations[name] || null;
  }

  private extractPrimaryConditions(entity: Entity): string {
    // From clinical_metadata.primary_indications
    const indications = entity.data?.primary_indications ||
                       entity.metadata?.clinical?.primary_indications;

    if (Array.isArray(indications) && indications.length > 0) {
      if (indications.length === 1) {
        return this.cleanLinkSyntax(indications[0]).toLowerCase();
      }

      if (indications.length === 2) {
        return `${this.cleanLinkSyntax(indications[0])} and ${this.cleanLinkSyntax(indications[1])}`.toLowerCase();
      }

      // 3+ conditions
      const first = this.cleanLinkSyntax(indications[0]);
      const second = this.cleanLinkSyntax(indications[1]);
      return `${first}, ${second}, and other mental health conditions`.toLowerCase();
    }

    // From conditions_treated
    const conditions = entity.data?.conditions_treated ||
                      entity.metadata?.clinical?.conditions_treated;

    if (Array.isArray(conditions) && conditions.length > 0) {
      return this.cleanLinkSyntax(conditions[0]).toLowerCase();
    }

    // Fallback
    return 'mental health conditions';
  }

  private extractTherapyKeywords(entity: Entity): string[] {
    const baseKeywords: string[] = [
      entity.name
    ];

    // Abbreviation
    const abbrev = this.extractAbbreviation(entity.name);
    if (abbrev) {
      baseKeywords.push(abbrev);
      baseKeywords.push(`${abbrev} therapy`);
    }

    // Conditions treated
    const conditions = entity.data?.conditions_treated ||
                      entity.metadata?.clinical?.conditions_treated;

    if (Array.isArray(conditions)) {
      conditions.slice(0, 3).forEach((condition: string) => {
        baseKeywords.push(this.cleanLinkSyntax(condition));
      });
    }

    // Therapy-specific keywords
    baseKeywords.push(
      `${entity.name} therapy`,
      `${entity.name} treatment`,
      `${entity.name} effectiveness`
    );

    if (abbrev) {
      baseKeywords.push(
        `${abbrev} for depression`,
        `${abbrev} for anxiety`
      );
    }

    return this.extractKeywords(entity, baseKeywords);
  }

  protected getPath(entity: Entity): string {
    return `/treatments/${entity.slug}`;
  }
}
