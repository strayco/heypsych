/**
 * Migrate Hardcoded Wikidata QIDs to JSON Metadata
 *
 * Copies QIDs from knowledge-graph-mapper.ts into entity JSON files.
 * This makes JSON files the source of truth for entity grounding.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Import the hardcoded mappings
import {
  CONDITION_WIKIDATA_MAP,
  TREATMENT_WIKIDATA_MAP,
  RESOURCE_WIKIDATA_MAP,
} from '../src/lib/seo/knowledge-graph-mapper';

interface EntityFile {
  path: string;
  slug: string;
  data: any;
}

async function loadEntityFiles(type: 'conditions' | 'treatments' | 'resources'): Promise<EntityFile[]> {
  const pattern = `data/${type}/**/*.json`;
  const files = glob.sync(pattern);

  return files.map(filePath => {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const slug = path.basename(filePath, '.json');

    return {
      path: filePath,
      slug,
      data,
    };
  });
}

async function migrateHardcodedMappings() {
  console.log('🔄 Migrating Hardcoded Wikidata QIDs to JSON Files\n');

  let totalUpdated = 0;
  let totalSkipped = 0;

  // Migrate conditions
  console.log('📂 Processing conditions...');
  const conditions = await loadEntityFiles('conditions');
  for (const entity of conditions) {
    const qid = CONDITION_WIKIDATA_MAP[entity.slug];
    if (qid) {
      // Skip if already has QID in metadata
      if (entity.data.metadata?.wikidata_qid === qid) {
        console.log(`⏭️  ${entity.slug} already has QID: ${qid}`);
        totalSkipped++;
        continue;
      }

      // Add QID to metadata
      if (!entity.data.metadata) {
        entity.data.metadata = {};
      }
      entity.data.metadata.wikidata_qid = qid;

      // Write back to file
      fs.writeFileSync(entity.path, JSON.stringify(entity.data, null, 2) + '\n');
      console.log(`✅ ${entity.slug} → ${qid}`);
      totalUpdated++;
    }
  }

  // Migrate treatments
  console.log('\n📂 Processing treatments...');
  const treatments = await loadEntityFiles('treatments');
  for (const entity of treatments) {
    const qid = TREATMENT_WIKIDATA_MAP[entity.slug];
    if (qid) {
      if (entity.data.metadata?.wikidata_qid === qid) {
        console.log(`⏭️  ${entity.slug} already has QID: ${qid}`);
        totalSkipped++;
        continue;
      }

      if (!entity.data.metadata) {
        entity.data.metadata = {};
      }
      entity.data.metadata.wikidata_qid = qid;

      fs.writeFileSync(entity.path, JSON.stringify(entity.data, null, 2) + '\n');
      console.log(`✅ ${entity.slug} → ${qid}`);
      totalUpdated++;
    }
  }

  // Migrate resources
  console.log('\n📂 Processing resources...');
  const resources = await loadEntityFiles('resources');
  for (const entity of resources) {
    const qid = RESOURCE_WIKIDATA_MAP[entity.slug];
    if (qid) {
      if (entity.data.metadata?.wikidata_qid === qid) {
        console.log(`⏭️  ${entity.slug} already has QID: ${qid}`);
        totalSkipped++;
        continue;
      }

      if (!entity.data.metadata) {
        entity.data.metadata = {};
      }
      entity.data.metadata.wikidata_qid = qid;

      fs.writeFileSync(entity.path, JSON.stringify(entity.data, null, 2) + '\n');
      console.log(`✅ ${entity.slug} → ${qid}`);
      totalUpdated++;
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 MIGRATION COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`Updated: ${totalUpdated} files`);
  console.log(`Skipped: ${totalSkipped} files (already had QID)`);
  console.log('\n💡 Next step: Run auto-mapping for remaining unmapped entities');
  console.log('   npm run map:wikidata:dry');
}

migrateHardcodedMappings().catch(console.error);
