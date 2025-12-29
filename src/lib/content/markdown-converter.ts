/**
 * Markdown Converter for LLM Ingestion
 *
 * Converts entity data to clean Markdown format for efficient LLM processing.
 * Markdown is preferred by LLMs because:
 * 1. Lower token cost than HTML
 * 2. Better semantic structure recognition
 * 3. Faster processing (no HTML parsing required)
 *
 * Used by Markdown API routes (/api/markdown/*)
 */

import type { Entity } from '@/lib/types/database';

/**
 * Convert a condition entity to Markdown
 */
export function conditionToMarkdown(entity: Entity): string {
  const data = entity.data || {};
  const metadata = entity.metadata || {};

  let markdown = `# ${entity.name}\n\n`;

  // Short definition (Golden Answer)
  // Use shortDefinition if available, otherwise use first sentence of description
  let shortDef = data.shortDefinition || data.short_definition;
  if (!shortDef && data.description) {
    // Extract first sentence (up to first period followed by space or end of string)
    const match = cleanText(data.description).match(/^[^.]+\./);
    shortDef = match ? match[0] : null;
  }
  if (shortDef) {
    markdown += `> **To define ${entity.name}:** ${shortDef}\n\n`;
  }

  // Description
  if (data.description) {
    markdown += `## Overview\n\n${cleanText(data.description)}\n\n`;
  }

  // Medical codes
  if (metadata.dsm5_code || metadata.icd10_code) {
    markdown += `## Diagnostic Codes\n\n`;
    if (metadata.dsm5_code) markdown += `- **DSM-5**: ${metadata.dsm5_code}\n`;
    if (metadata.icd10_code) markdown += `- **ICD-10**: ${metadata.icd10_code}\n`;
    markdown += `\n`;
  }

  // Prevalence
  if (data.prevalence) {
    markdown += `## Prevalence\n\n${cleanText(data.prevalence)}\n\n`;
  }

  // Age of onset
  if (data.age_of_onset) {
    markdown += `## Age of Onset\n\n${cleanText(data.age_of_onset)}\n\n`;
  }

  // Symptoms
  if (data.symptoms) {
    markdown += `## Symptoms\n\n`;
    if (Array.isArray(data.symptoms)) {
      data.symptoms.forEach((symptom: string) => {
        markdown += `- ${cleanText(symptom)}\n`;
      });
    } else if (data.symptoms.core) {
      markdown += `### Core Symptoms\n\n`;
      data.symptoms.core.forEach((symptom: string) => {
        markdown += `- ${cleanText(symptom)}\n`;
      });
      if (data.symptoms.associated) {
        markdown += `\n### Associated Symptoms\n\n`;
        data.symptoms.associated.forEach((symptom: string) => {
          markdown += `- ${cleanText(symptom)}\n`;
        });
      }
    }
    markdown += `\n`;
  }

  // Risk factors
  if (data.risk_factors && Array.isArray(data.risk_factors)) {
    markdown += `## Risk Factors\n\n`;
    data.risk_factors.forEach((factor: string) => {
      markdown += `- ${cleanText(factor)}\n`;
    });
    markdown += `\n`;
  }

  // Treatment approaches
  if (data.treatment_approaches) {
    markdown += `## Treatment Options\n\n`;

    if (data.treatment_approaches.psychotherapy && Array.isArray(data.treatment_approaches.psychotherapy)) {
      markdown += `### Psychotherapy\n\n`;
      data.treatment_approaches.psychotherapy.forEach((therapy: string) => {
        markdown += `- ${cleanText(therapy)}\n`;
      });
      markdown += `\n`;
    }

    if (data.treatment_approaches.medications && Array.isArray(data.treatment_approaches.medications)) {
      markdown += `### Medications\n\n`;
      data.treatment_approaches.medications.forEach((med: string) => {
        markdown += `- ${cleanText(med)}\n`;
      });
      markdown += `\n`;
    }

    if (data.treatment_approaches.lifestyle && Array.isArray(data.treatment_approaches.lifestyle)) {
      markdown += `### Lifestyle Interventions\n\n`;
      data.treatment_approaches.lifestyle.forEach((lifestyle: string) => {
        markdown += `- ${cleanText(lifestyle)}\n`;
      });
      markdown += `\n`;
    }
  }

  // Prognosis
  if (data.prognosis) {
    markdown += `## Prognosis\n\n${cleanText(data.prognosis)}\n\n`;
  }

  // Footer
  markdown += `---\n\n`;
  markdown += `*Source: HeyPsych.com - Evidence-based mental health information*\n`;
  markdown += `*URL: https://www.heypsych.com/conditions/${entity.slug}*\n`;

  return markdown;
}

/**
 * Convert a treatment entity to Markdown
 */
export function treatmentToMarkdown(entity: Entity): string {
  const data = entity.data || {};

  let markdown = `# ${entity.name}\n\n`;

  // Patient summary (Golden Answer)
  const summary = data.patient_summary || data.summary;
  if (summary) {
    markdown += `> **Clinical summary for ${entity.name}:** ${cleanText(summary)}\n\n`;
  }

  // Description
  if (data.description) {
    markdown += `## Overview\n\n${cleanText(data.description)}\n\n`;
  }

  // Process sections dynamically
  const sections = data.sections || [];
  if (Array.isArray(sections)) {
    sections.forEach((section: any) => {
      const heading = section.heading || formatSectionType(section.type);

      if (section.type === 'indications' && section.items) {
        markdown += `## ${heading}\n\n`;
        section.items.forEach((item: string) => {
          markdown += `- ${cleanText(item)}\n`;
        });
        markdown += `\n`;
      } else if (section.type === 'efficacy' && section.metric) {
        markdown += `## ${heading}\n\n`;
        markdown += `**${section.metric}**: ${section.value}\n\n`;
        if (section.comparison) {
          markdown += `*Comparison*: ${section.comparison}\n\n`;
        }
      } else if (section.type === 'adverse_effects') {
        markdown += `## ${heading}\n\n`;
        if (section.common && Array.isArray(section.common)) {
          markdown += `### Common Side Effects\n\n`;
          section.common.forEach((effect: any) => {
            const symptom = typeof effect === 'string' ? effect : effect.symptom;
            const incidence = typeof effect === 'object' && effect.incidence ? ` (${effect.incidence})` : '';
            markdown += `- ${cleanText(symptom)}${incidence}\n`;
          });
          markdown += `\n`;
        }
        if (section.serious && Array.isArray(section.serious)) {
          markdown += `### Serious Side Effects\n\n`;
          section.serious.forEach((effect: any) => {
            const symptom = typeof effect === 'string' ? effect : effect.symptom;
            markdown += `- ${cleanText(symptom)}\n`;
          });
          markdown += `\n`;
        }
      } else if (section.type === 'dosage' && section.items) {
        markdown += `## ${heading}\n\n`;
        section.items.forEach((item: string) => {
          markdown += `- ${cleanText(item)}\n`;
        });
        markdown += `\n`;
      } else if (section.type === 'interactions' && section.items) {
        markdown += `## ${heading}\n\n`;
        section.items.forEach((item: string) => {
          markdown += `- ${cleanText(item)}\n`;
        });
        markdown += `\n`;
      } else if (section.type === 'warnings' && section.items) {
        markdown += `## ${heading}\n\n`;
        section.items.forEach((item: string) => {
          markdown += `- ${cleanText(item)}\n`;
        });
        markdown += `\n`;
      } else if (section.body) {
        markdown += `## ${heading}\n\n${cleanText(section.body)}\n\n`;
      }
    });
  }

  // Footer
  markdown += `---\n\n`;
  markdown += `*Source: HeyPsych.com - Evidence-based mental health information*\n`;
  markdown += `*URL: https://www.heypsych.com/treatments/${entity.slug}*\n`;

  return markdown;
}

/**
 * Clean text by removing link tokens and HTML
 */
function cleanText(text: any): string {
  if (typeof text !== 'string') return String(text || '');

  return text
    // Remove link tokens: {link:type:slug} → entity name
    .replace(/\{link:(\w+):([^}]+)\}/g, (_, type, slug) => {
      // Convert slug to readable name
      return slug
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    })
    // Remove any remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format section type to heading
 */
function formatSectionType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate table of contents for Markdown
 */
export function generateTOC(markdown: string): string {
  const lines = markdown.split('\n');
  const toc: string[] = ['## Table of Contents\n'];

  lines.forEach((line) => {
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);

    if (h2Match) {
      const title = h2Match[1];
      const anchor = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      toc.push(`- [${title}](#${anchor})`);
    } else if (h3Match) {
      const title = h3Match[1];
      const anchor = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      toc.push(`  - [${title}](#${anchor})`);
    }
  });

  return toc.join('\n') + '\n\n';
}
