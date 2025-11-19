/**
 * MedicationMetadataGenerator
 *
 * Generates SEO metadata for psychiatric medication pages.
 *
 * Title Formula: "{Medication Name} ({Brand}): Uses, Side Effects, Dosage | HeyPsych"
 * Description Formula: "{Name} ({Brand}) is used to treat {condition}. Learn about dosing, side effects..."
 */

import type { Metadata } from 'next';
import type { Entity } from '@/lib/types/database';
import { MetadataGenerator } from '../metadata-generator';

export class MedicationMetadataGenerator extends MetadataGenerator {
  async generate(entity: Entity): Promise<Metadata> {
    // Use SEO overrides if provided
    if (entity.seo?.title || entity.seo?.description) {
      return this.generateFromOverrides(entity);
    }

    const title = this.generateTitle(entity);
    const description = this.generateDescription(entity);
    const canonical = this.generateCanonical(entity);
    const keywords = this.extractMedicationKeywords(entity);

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
    const brandName = this.extractBrandName(entity);

    // Format: "Sertraline (Zoloft): Uses, Side Effects, Dosage | HeyPsych"
    const brandSuffix = brandName ? ` (${brandName})` : '';
    const fullTitle = `${name}${brandSuffix}: Uses, Side Effects, Dosage | HeyPsych`;

    // If too long, try shorter version
    if (fullTitle.length > 60) {
      const shortTitle = `${name}${brandSuffix}: Uses & Dosage | HeyPsych`;
      if (shortTitle.length > 60) {
        return this.ensureTitleLength(`${name} | HeyPsych`);
      }
      return shortTitle;
    }

    return fullTitle;
  }

  private generateDescription(entity: Entity): string {
    const name = entity.name;
    const brandName = this.extractBrandName(entity);
    const brandText = brandName ? ` (${brandName})` : '';

    // Primary use/indication
    const primaryUse = this.extractPrimaryIndication(entity);

    // Drug class
    const drugClass = this.extractDrugClass(entity);

    let description = `${name}${brandText} is used to treat ${primaryUse}. `;
    description += `Learn about dosing, side effects, interactions, and what to expect `;
    description += `from this ${drugClass} medication.`;

    return this.ensureDescriptionLength(description);
  }

  private extractBrandName(entity: Entity): string | null {
    // From metadata.brand_names array
    const brandNames = entity.data?.brand_names || entity.metadata?.brand_names;

    if (Array.isArray(brandNames) && brandNames.length > 0) {
      return brandNames[0];
    }

    // From name parsing (e.g., "Sertraline (Zoloft)")
    const match = entity.name.match(/\(([^)]+)\)/);
    if (match) {
      return match[1];
    }

    return null;
  }

  private extractPrimaryIndication(entity: Entity): string {
    // From clinical_metadata.primary_indications
    const primaryIndications = entity.data?.primary_indications ||
                              entity.clinical_metadata?.primary_indications;

    if (Array.isArray(primaryIndications) && primaryIndications.length > 0) {
      const indication = this.cleanLinkSyntax(primaryIndications[0]);
      return indication.toLowerCase();
    }

    // From clinical_metadata.conditions_treated
    const conditionsTreated = entity.data?.conditions_treated ||
                             entity.clinical_metadata?.conditions_treated;

    if (Array.isArray(conditionsTreated) && conditionsTreated.length > 0) {
      const condition = this.cleanLinkSyntax(conditionsTreated[0]);
      return condition.toLowerCase();
    }

    // Fallback
    return 'mental health conditions';
  }

  private extractDrugClass(entity: Entity): string {
    // From metadata.drug_classes
    const drugClasses = entity.data?.drug_classes || entity.metadata?.drug_classes;

    if (Array.isArray(drugClasses) && drugClasses.length > 0) {
      return drugClasses[0].toLowerCase();
    }

    // Fallback
    return 'psychiatric';
  }

  private extractMedicationKeywords(entity: Entity): string[] {
    const baseKeywords: string[] = [
      entity.name
    ];

    // Brand names
    const brandNames = entity.data?.brand_names || entity.metadata?.brand_names;
    if (Array.isArray(brandNames)) {
      baseKeywords.push(...brandNames);
    }

    // Drug classes
    const drugClasses = entity.data?.drug_classes || entity.metadata?.drug_classes;
    if (Array.isArray(drugClasses)) {
      baseKeywords.push(...drugClasses);
    }

    // Conditions treated
    const conditions = entity.data?.conditions_treated ||
                      entity.clinical_metadata?.conditions_treated;
    if (Array.isArray(conditions)) {
      conditions.slice(0, 3).forEach((condition: string) => {
        baseKeywords.push(this.cleanLinkSyntax(condition));
      });
    }

    // Medication-specific keywords
    baseKeywords.push(
      `${entity.name} side effects`,
      `${entity.name} dosage`,
      `${entity.name} uses`
    );

    return this.extractKeywords(entity, baseKeywords);
  }

  protected getPath(entity: Entity): string {
    return `/treatments/${entity.slug}`;
  }
}
