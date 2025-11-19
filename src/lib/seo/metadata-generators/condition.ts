/**
 * ConditionMetadataGenerator
 *
 * Generates SEO metadata for mental health condition pages using rules-based approach.
 *
 * Title Formula: "{Condition Name}: Symptoms, Causes, Treatment & Support | HeyPsych"
 * Description Formula: "Learn about {condition} symptoms, causes, risk factors, and evidence-based treatments..."
 */

import type { Metadata } from 'next';
import type { Entity } from '@/lib/types/database';
import { MetadataGenerator } from '../metadata-generator';
import { needsCrisisWarning } from '../config';

export class ConditionMetadataGenerator extends MetadataGenerator {
  async generate(entity: Entity): Promise<Metadata> {
    // Use SEO overrides if provided
    if (entity.seo?.title || entity.seo?.description) {
      return this.generateFromOverrides(entity);
    }

    const title = this.generateTitle(entity);
    const description = this.generateDescription(entity);
    const canonical = this.generateCanonical(entity);
    const keywords = this.extractConditionKeywords(entity);

    // Add crisis warning to metadata if needed
    const hasCrisisRisk = needsCrisisWarning(entity);

    return {
      title,
      description,
      keywords: keywords.join(', '),
      alternates: { canonical },
      openGraph: {
        ...this.generateOpenGraph(title, description, canonical, 'article'),
        ...(hasCrisisRisk && {
          'article:section': 'Crisis Resources',
          'article:tag': 'Mental Health Crisis'
        } as any)
      },
      twitter: this.generateTwitterCard(title, description),
      other: {
        'crisis-warning': hasCrisisRisk ? 'true' : 'false'
      }
    };
  }

  private generateTitle(entity: Entity): string {
    const name = entity.name;

    // Try full format first
    const fullTitle = `${name}: Symptoms, Causes, Treatment & Support | HeyPsych`;

    // If too long, use shorter version
    if (fullTitle.length > 60) {
      const shortTitle = `${name}: Symptoms, Treatment & Support | HeyPsych`;
      if (shortTitle.length > 60) {
        return this.ensureTitleLength(`${name} | HeyPsych`);
      }
      return shortTitle;
    }

    return fullTitle;
  }

  private generateDescription(entity: Entity): string {
    const name = entity.name;
    const shortName = name.replace(/\s+(Disorder|Syndrome|Disease)$/i, '').trim();

    // Base description
    let description = `Learn about ${name} symptoms, causes, risk factors, and evidence-based treatments. `;
    description += `Discover when to seek help and how to manage ${shortName} effectively.`;

    // Add crisis warning for high-risk conditions
    if (needsCrisisWarning(entity)) {
      description = description.replace(/\.$/, '');
      description += '. If experiencing a crisis, call 988 immediately.';
    }

    return this.ensureDescriptionLength(description);
  }

  private extractConditionKeywords(entity: Entity): string[] {
    const baseKeywords: string[] = [
      entity.name,
      `${entity.name} symptoms`,
      `${entity.name} treatment`,
      `${entity.name} causes`
    ];

    // Add symptoms as keywords
    const symptoms = entity.data?.symptoms?.core || [];
    symptoms.slice(0, 3).forEach((symptom: string) => {
      const cleaned = this.cleanLinkSyntax(symptom);
      if (cleaned.length < 50) { // Only short symptom phrases
        baseKeywords.push(cleaned);
      }
    });

    // Add diagnostic codes
    if (entity.data?.dsm5_code) {
      baseKeywords.push(`DSM-5 ${entity.data.dsm5_code}`);
    }
    if (entity.data?.icd10_code) {
      baseKeywords.push(`ICD-10 ${entity.data.icd10_code}`);
    }

    // Add abbreviations
    const abbrev = this.extractAbbreviation(entity.name);
    if (abbrev) {
      baseKeywords.push(abbrev);
    }

    return this.extractKeywords(entity, baseKeywords);
  }

  private extractAbbreviation(name: string): string | null {
    // Common mental health condition abbreviations
    const abbreviations: Record<string, string> = {
      'Generalized Anxiety Disorder': 'GAD',
      'Major Depressive Disorder': 'MDD',
      'Obsessive-Compulsive Disorder': 'OCD',
      'Post-Traumatic Stress Disorder': 'PTSD',
      'Attention-Deficit/Hyperactivity Disorder': 'ADHD',
      'Bipolar Disorder': 'BD',
      'Social Anxiety Disorder': 'SAD',
      'Panic Disorder': 'PD'
    };

    return abbreviations[name] || null;
  }

  protected getPath(entity: Entity): string {
    return `/conditions/${entity.slug}`;
  }
}
