#!/usr/bin/env tsx
/**
 * Generate Missing Treatment JSON Files
 *
 * Creates treatment JSON files for database entries that don't have local files.
 * This ensures the sitemap only contains renderable URLs.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TREATMENTS_DIR = path.join(process.cwd(), 'data/treatments');

// Map database types to directory names
const TYPE_TO_DIR: Record<string, string> = {
  medication: 'medications',
  therapy: 'therapy',
  interventional: 'interventional',
  supplement: 'supplements',
  alternative: 'alternative',
  investigational: 'investigational',
  treatment: 'therapy', // fallback
};

// Get all treatment slugs from JSON files
function getAllJsonSlugs(): Set<string> {
  const modalityDirs = ['medications', 'therapy', 'interventional', 'investigational', 'supplements', 'alternative'];
  const slugs = new Set<string>();

  for (const modality of modalityDirs) {
    const dir = path.join(TREATMENTS_DIR, modality);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.includes('.legacy.'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        const data = JSON.parse(content);
        const slug = data.identity?.slug || data.slug;
        if (slug) slugs.add(slug);
      } catch {
        // Skip files that can't be parsed
      }
    }
  }
  return slugs;
}

// Generate a treatment JSON file from database entry
function generateTreatmentJson(entry: {
  slug: string;
  title: string;
  type: string;
  description: string;
}): object {
  // Extract brand name if present in title like "Name (Brand)"
  const brandMatch = entry.title.match(/^(.+?)\s*\(([^)]+)\)$/);
  const genericName = brandMatch ? brandMatch[1].trim() : entry.title;
  const brandName = brandMatch ? brandMatch[2].trim() : null;

  // Generate tags from the type and common keywords in description
  const tags: string[] = [entry.type];
  const descLower = entry.description.toLowerCase();

  if (descLower.includes('antidepressant')) tags.push('antidepressant');
  if (descLower.includes('antipsychotic')) tags.push('antipsychotic');
  if (descLower.includes('anxiolytic') || descLower.includes('anxiety')) tags.push('anxiety');
  if (descLower.includes('sedative') || descLower.includes('hypnotic')) tags.push('sedative');
  if (descLower.includes('anticonvulsant') || descLower.includes('seizure')) tags.push('anticonvulsant');
  if (descLower.includes('benzodiazepine')) tags.push('benzodiazepine');
  if (descLower.includes('barbiturate')) tags.push('barbiturate');
  if (descLower.includes('opioid')) tags.push('opioid');
  if (descLower.includes('stimulant')) tags.push('stimulant');
  if (descLower.includes('adhd')) tags.push('ADHD');
  if (descLower.includes('schizophrenia') || descLower.includes('psychosis')) tags.push('psychosis');
  if (descLower.includes('bipolar')) tags.push('bipolar');
  if (descLower.includes('depression')) tags.push('depression');
  if (descLower.includes('insomnia') || descLower.includes('sleep')) tags.push('sleep');
  if (descLower.includes('ptsd') || descLower.includes('trauma')) tags.push('PTSD');
  if (descLower.includes('cognitive')) tags.push('cognitive');
  if (descLower.includes('nicotine') || descLower.includes('smoking')) tags.push('smoking-cessation');
  if (descLower.includes('alcohol')) tags.push('alcohol-use-disorder');

  // Generate a summary (first 200 chars of description)
  const summary = entry.description.length > 200
    ? entry.description.slice(0, 200).replace(/\s+\S*$/, '') + '...'
    : entry.description;

  return {
    kind: 'treatment',
    slug: entry.slug,
    type: entry.type,
    name: genericName,
    summary,
    description: entry.description,
    category: `${TYPE_TO_DIR[entry.type] || 'therapy'}/psychiatry`,
    tags: [...new Set(tags)], // Remove duplicates
    metadata: {
      drug_classes: [],
      therapeutic_categories: ['Psychiatry'],
      mechanism_categories: [],
      administration_routes: entry.type === 'medication' ? ['Oral'] : [],
      prescription_status: entry.type === 'medication' ? 'Prescription only' : 'N/A',
      controlled_substance: descLower.includes('controlled') || descLower.includes('schedule'),
      generic_available: entry.type === 'medication',
      brand_names: brandName ? [brandName] : [],
      age_groups: ['Adult'],
      treatment_duration: [],
      specialty_areas: ['Psychiatry'],
    },
    clinical_metadata: {
      primary_indications: [],
      off_label_uses: [],
      contraindications: [],
      monitoring_required: [],
      efficacy_rating: {},
    },
    search_metadata: {
      searchable_terms: [
        genericName.toLowerCase(),
        ...(brandName ? [brandName.toLowerCase()] : []),
      ],
      synonyms: brandName ? [brandName] : [],
      common_misspellings: [],
    },
    sections: [
      {
        type: 'overview',
        title: 'Overview',
        content: entry.description,
      },
    ],
  };
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: treatments } = await supabase
    .from('entities')
    .select('slug, title, type, description')
    .in('type', ['medication', 'therapy', 'treatment', 'interventional', 'alternative', 'supplement', 'investigational'])
    .eq('status', 'active')
    .order('title');

  if (!treatments) {
    console.error('No treatments found');
    return;
  }

  const jsonSlugs = getAllJsonSlugs();
  const missing = treatments.filter(t => !jsonSlugs.has(t.slug));

  console.log(`Found ${missing.length} missing treatments to create\n`);

  let created = 0;
  let errors = 0;

  for (const entry of missing) {
    try {
      const dirName = TYPE_TO_DIR[entry.type] || 'therapy';
      const dir = path.join(TREATMENTS_DIR, dirName);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filePath = path.join(dir, `${entry.slug}.json`);

      // Don't overwrite existing files
      if (fs.existsSync(filePath)) {
        console.log(`SKIP: ${filePath} already exists`);
        continue;
      }

      const json = generateTreatmentJson(entry);
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
      console.log(`CREATED: ${filePath}`);
      created++;
    } catch (err) {
      console.error(`ERROR creating ${entry.slug}:`, err);
      errors++;
    }
  }

  console.log(`\nDone! Created ${created} files, ${errors} errors`);
}

main().catch(console.error);
