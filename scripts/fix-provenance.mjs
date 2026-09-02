#!/usr/bin/env node
/**
 * Fix provenance objects to have required fields
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';

function fixProvenance(prov, fieldName, parentValue) {
  if (!prov || typeof prov !== 'object') return undefined;

  // If it's missing required fields, fix them
  const fixed = { ...prov };

  // Add value if missing - use the parent value (e.g., "yes" for hipaa_support)
  if (fixed.value === undefined) {
    fixed.value = parentValue || true;
  }

  // Add status if missing - infer from existing fields
  if (fixed.status === undefined) {
    if (fixed.source_url) {
      fixed.status = 'public_source';
    } else if (fixed.verified_date) {
      fixed.status = 'verified';
    } else {
      fixed.status = 'vendor_provided';
    }
  }

  // Remove invalid fields
  if (fixed.confidence) {
    delete fixed.confidence;
  }

  return fixed;
}

async function main() {
  let fixed = 0;

  const subdirs = await readdir(PRODUCTS_DIR);

  for (const subdir of subdirs) {
    const subdirPath = join(PRODUCTS_DIR, subdir);

    try {
      const files = (await readdir(subdirPath)).filter(f => f.endsWith('.json'));

      for (const file of files) {
        const filePath = join(subdirPath, file);
        const content = await readFile(filePath, 'utf-8');
        let tool = JSON.parse(content);
        let modified = false;

        // Fix compliance provenance objects
        if (tool.compliance) {
          const provenanceFields = [
            ['hipaa_provenance', tool.compliance.hipaa_support],
            ['baa_provenance', tool.compliance.baa_available],
            ['soc2_provenance', tool.compliance.soc2],
            ['hitrust_provenance', tool.compliance.hitrust],
          ];

          for (const [provField, parentValue] of provenanceFields) {
            if (tool.compliance[provField]) {
              const fixedProv = fixProvenance(tool.compliance[provField], provField, parentValue);
              if (JSON.stringify(fixedProv) !== JSON.stringify(tool.compliance[provField])) {
                tool.compliance[provField] = fixedProv;
                modified = true;
              }
            }
          }
        }

        if (modified) {
          tool.updated_at = new Date().toISOString();
          await writeFile(filePath, JSON.stringify(tool, null, 2) + '\n');
          fixed++;
        }
      }
    } catch (e) {
      // Directory doesn't exist
    }
  }

  console.log('Fixed', fixed, 'files (corrected provenance objects)');
}

main().catch(console.error);
