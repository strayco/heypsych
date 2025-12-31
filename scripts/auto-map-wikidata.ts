/**
 * Automatic Wikidata QID Mapping Script
 *
 * Automatically searches Wikidata for QIDs and updates entity JSON files.
 *
 * Usage:
 *   npm run map:wikidata              # Map all unmapped entities
 *   npm run map:wikidata -- --dry-run # Preview changes without writing
 *   npm run map:wikidata -- --type conditions  # Only map conditions
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { searchWikidataQID } from '../src/lib/seo/auto-entity-mapper';

interface EntityFile {
  path: string;
  slug: string;
  data: any;
  type: 'condition' | 'treatment' | 'resource';
}

const DELAY_MS = 1000; // 1 second delay between API calls to respect rate limits

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadEntityFiles(type: 'conditions' | 'treatments' | 'resources'): Promise<EntityFile[]> {
  const pattern = `data/${type}/**/*.json`;
  const files = glob.sync(pattern);

  return files.map(filePath => {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const slug = path.basename(filePath, '.json');
    const entityType = type === 'conditions' ? 'condition' : type === 'treatments' ? 'treatment' : 'resource';

    return {
      path: filePath,
      slug,
      data,
      type: entityType,
    };
  });
}

async function mapEntitiesAutomatically(
  entities: EntityFile[],
  dryRun: boolean
): Promise<{ mapped: number; skipped: number; failed: number }> {
  let mapped = 0;
  let skipped = 0;
  let failed = 0;

  for (const entity of entities) {
    // Skip if already has Wikidata QID
    if (entity.data.metadata?.wikidata_qid) {
      console.log(`⏭️  Skipping ${entity.slug} (already mapped: ${entity.data.metadata.wikidata_qid})`);
      skipped++;
      continue;
    }

    // Search Wikidata
    console.log(`🔍 Searching for: ${entity.data.name || entity.slug}...`);

    try {
      const qid = await searchWikidataQID(entity.data.name || entity.slug, entity.type);

      if (qid) {
        console.log(`✅ Found QID: ${qid} for ${entity.slug}`);

        if (!dryRun) {
          // Update the JSON file
          if (!entity.data.metadata) {
            entity.data.metadata = {};
          }
          entity.data.metadata.wikidata_qid = qid;

          fs.writeFileSync(entity.path, JSON.stringify(entity.data, null, 2) + '\n');
          console.log(`   📝 Updated ${entity.path}`);
        } else {
          console.log(`   📋 [DRY RUN] Would update ${entity.path} with QID: ${qid}`);
        }

        mapped++;
      } else {
        console.log(`❌ No QID found for ${entity.slug}`);
        failed++;
      }

      // Respect API rate limits
      await sleep(DELAY_MS);
    } catch (error) {
      console.error(`❌ Error mapping ${entity.slug}:`, error);
      failed++;
    }
  }

  return { mapped, skipped, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const typeFilter = args.find(arg => arg.startsWith('--type='))?.split('=')[1];

  console.log('🤖 Automatic Wikidata QID Mapping\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no files will be modified)' : 'LIVE'}`);
  console.log(`Filter: ${typeFilter || 'all types'}\n`);

  const types: Array<'conditions' | 'treatments' | 'resources'> = typeFilter
    ? [typeFilter as any]
    : ['conditions', 'treatments', 'resources'];

  let totalMapped = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const type of types) {
    console.log(`\n📂 Processing ${type}...`);
    const entities = await loadEntityFiles(type);
    console.log(`   Found ${entities.length} ${type}`);

    const stats = await mapEntitiesAutomatically(entities, dryRun);

    totalMapped += stats.mapped;
    totalSkipped += stats.skipped;
    totalFailed += stats.failed;

    console.log(`\n   ✅ Mapped: ${stats.mapped}`);
    console.log(`   ⏭️  Skipped: ${stats.skipped}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 FINAL STATISTICS');
  console.log('═══════════════════════════════════════');
  console.log(`Total mapped: ${totalMapped}`);
  console.log(`Total skipped: ${totalSkipped}`);
  console.log(`Total failed: ${totalFailed}`);

  if (dryRun) {
    console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✨ Mapping complete! Files have been updated.');
    console.log('\n💡 Next steps:');
    console.log('   1. Review the changes: git diff data/');
    console.log('   2. Run the sync script: npm run sync:content');
    console.log('   3. Commit the changes: git add data/ && git commit');
  }
}

main().catch(console.error);
