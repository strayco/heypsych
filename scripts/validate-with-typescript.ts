/**
 * TypeScript validation using actual schema and adapters
 * Run with: npx tsx scripts/validate-with-typescript.ts
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { ClinicianToolV4Z, isPublishReady } from "../src/lib/schemas/clinician-tool-v4";
import { deriveArchitectMetadata } from "../src/domains/architect/adapters/v4-product-adapter";

const PRODUCTS_DIR = "./data/tools-v4/products";

async function main() {
  console.log("================================================================");
  console.log("TYPESCRIPT VALIDATION WITH ACTUAL SCHEMA & ADAPTERS");
  console.log("================================================================\n");

  let total = 0;
  let schemaValid = 0;
  let schemaInvalid = 0;
  let publishReady = 0;
  let architectCompatible = 0;
  const errors: { file: string; error: string }[] = [];
  const architectErrors: { file: string; error: string }[] = [];

  const subdirs = await readdir(PRODUCTS_DIR);

  for (const subdir of subdirs.sort()) {
    const subdirPath = join(PRODUCTS_DIR, subdir);
    try {
      const files = (await readdir(subdirPath)).filter((f) => f.endsWith(".json"));

      for (const file of files) {
        total++;
        const filePath = join(subdirPath, file);

        try {
          const content = await readFile(filePath, "utf-8");
          const rawTool = JSON.parse(content);

          // Validate with Zod schema
          const result = ClinicianToolV4Z.safeParse(rawTool);

          if (result.success) {
            schemaValid++;
            const tool = result.data;

            // Check publish ready
            if (isPublishReady(tool)) {
              publishReady++;
            }

            // Test architect adapter
            try {
              const metadata = deriveArchitectMetadata(tool);
              if (metadata && metadata.productSlug) {
                architectCompatible++;
              }
            } catch (adapterErr: any) {
              architectErrors.push({
                file: `${subdir}/${file}`,
                error: adapterErr.message,
              });
            }
          } else {
            schemaInvalid++;
            const errorMessages = result.error.issues
              .slice(0, 3)
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ");
            errors.push({
              file: `${subdir}/${file}`,
              error: errorMessages,
            });
          }
        } catch (parseErr: any) {
          schemaInvalid++;
          errors.push({
            file: `${subdir}/${file}`,
            error: `JSON parse error: ${parseErr.message}`,
          });
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  console.log("================================================================");
  console.log("RESULTS");
  console.log("================================================================");
  console.log(`Total files:           ${total}`);
  console.log(`Schema valid:          ${schemaValid} (${((schemaValid / total) * 100).toFixed(1)}%)`);
  console.log(`Schema invalid:        ${schemaInvalid}`);
  console.log(`Publish ready:         ${publishReady} (${((publishReady / total) * 100).toFixed(1)}%)`);
  console.log(`Architect compatible:  ${architectCompatible} (${((architectCompatible / total) * 100).toFixed(1)}%)`);
  console.log("================================================================\n");

  if (errors.length > 0) {
    console.log("SCHEMA ERRORS:");
    errors.slice(0, 20).forEach(({ file, error }) => {
      console.log(`  ❌ ${file}: ${error}`);
    });
    if (errors.length > 20) {
      console.log(`  ... and ${errors.length - 20} more`);
    }
    console.log();
  }

  if (architectErrors.length > 0) {
    console.log("ARCHITECT ADAPTER ERRORS:");
    architectErrors.slice(0, 10).forEach(({ file, error }) => {
      console.log(`  ⚠️ ${file}: ${error}`);
    });
    if (architectErrors.length > 10) {
      console.log(`  ... and ${architectErrors.length - 10} more`);
    }
    console.log();
  }

  if (schemaValid === total && publishReady === total && architectCompatible === total) {
    console.log("✅ ALL PRODUCTS PASS ALL VALIDATIONS!");
    console.log("   - Schema valid: 100%");
    console.log("   - Publish ready: 100%");
    console.log("   - Architect compatible: 100%");
  }

  return {
    total,
    schemaValid,
    schemaInvalid,
    publishReady,
    architectCompatible,
    errors,
    architectErrors,
  };
}

main().catch(console.error);
