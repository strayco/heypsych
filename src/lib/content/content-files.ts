/**
 * Reading content JSON files into entity rows.
 *
 * One implementation shared by:
 *  - the site (src/lib/data/local-entities.ts), which serves conditions,
 *    resources and treatment records straight from data/, and
 *  - scripts/sync-json-to-db.ts, which mirrors the same rows into Supabase
 *    for search.
 *
 * Because both use this module, a page and its database copy can never
 * interpret a file differently. Plain Node (fs/path); no Next.js imports, so
 * the sync script can use it too.
 */

import fs from "fs";
import path from "path";

/** data/ subdirectory → the content type it holds */
export const CONTENT_DIRS = {
  treatments: "treatments",
  conditions: "conditions",
  resources: "resources",
} as const;

export type ContentDirKey = keyof typeof CONTENT_DIRS;

export interface ContentFile {
  path: string;
  content: any;
}

/** The shape stored in the `entities` table (minus id and timestamps). */
export interface ContentEntityRow {
  slug: string;
  type: string;
  title: string;
  description: string | null;
  content: any;
  metadata: Record<string, any>;
  status: string;
}

export const VALID_ENTITY_TYPES = [
  "condition",
  "medication",
  "therapy",
  "treatment",
  "interventional",
  "investigational",
  "alternative",
  "supplement",
  "resource",
  "provider",
] as const;

/**
 * Recursively read every content JSON file in a directory.
 * Skips backups, taxonomies, index.json, templates (_*.json), and older
 * versions of a record when a -v2 file exists next to it.
 */
export function readJsonFiles(
  dir: string,
  onParseError?: (filePath: string, error: unknown) => void
): ContentFile[] {
  const files: ContentFile[] = [];
  const v2Files = new Set<string>(); // base paths that have a -v2 version

  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    // Stable order regardless of filesystem
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith("-v2.json")) {
        v2Files.add(path.join(currentDir, entry.name.replace(/-v2\.json$/, "")));
      }
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name.startsWith("_backup") || entry.name === "taxonomies") continue;
        traverse(fullPath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      if (entry.name.includes(".backup") || entry.name === "index.json" || entry.name.startsWith("_")) continue;

      // Legacy and plain files are superseded by a -v2 file with the same base name
      if (entry.name.endsWith(".legacy.json")) {
        if (v2Files.has(path.join(currentDir, entry.name.replace(/\.legacy\.json$/, "")))) continue;
      } else if (!entry.name.endsWith("-v2.json")) {
        if (v2Files.has(path.join(currentDir, entry.name.replace(/\.json$/, "")))) continue;
      }

      try {
        files.push({ path: fullPath, content: JSON.parse(fs.readFileSync(fullPath, "utf-8")) });
      } catch (error) {
        onParseError?.(fullPath, error);
      }
    }
  }

  traverse(dir);
  return files;
}

/** Entity type from the record's own `type`, else from its folder. */
export function determineEntityType(filePath: string, content: any): string {
  if (content.type) {
    // Legacy values from older data
    if (content.type === "digital-tool" || content.type === "hotline") return "resource";
    return content.type;
  }
  const p = filePath.split(path.sep).join("/");
  if (p.includes("/treatments/medications/")) return "medication";
  if (p.includes("/treatments/therapy/")) return "therapy";
  if (p.includes("/treatments/interventional/")) return "interventional";
  if (p.includes("/treatments/investigational/")) return "investigational";
  if (p.includes("/treatments/alternative/")) return "alternative";
  if (p.includes("/treatments/supplements/")) return "supplement";
  if (p.includes("/treatments/")) return "treatment";
  if (p.includes("/conditions/")) return "condition";
  if (p.includes("/resources/")) return "resource";
  return "unknown";
}

/** Folder directly under the content type, e.g. "medications", "anxiety-fear". */
export function extractCategory(filePath: string): string | null {
  const match = filePath.split(path.sep).join("/").match(/data\/(\w+)\/([\w-]+)\//);
  return match ? match[2] : null;
}

/**
 * Turn one content file into an entity row. Throws if the file is not a
 * valid record (unknown type, no slug, no name).
 */
export function normalizeToEntity(
  filePath: string,
  content: any,
  options: { rootDir?: string } = {}
): ContentEntityRow {
  const type = determineEntityType(filePath, content);
  const category = extractCategory(filePath);

  if (!(VALID_ENTITY_TYPES as readonly string[]).includes(type)) {
    throw new Error(
      `Invalid entity type "${type}" for ${filePath}. Must be one of: ${VALID_ENTITY_TYPES.join(", ")}`
    );
  }

  // v3 records (schema_version 3) keep slug/name/brands under `identity`.
  const identity = content.identity ?? {};
  const slug: string | undefined = content.slug ?? identity.slug;
  const name: string | undefined = content.name ?? content.title ?? identity.name;
  const brandNames = content.brand_names ?? identity.brand_names;

  if (!slug) throw new Error("Missing required field: slug (or identity.slug)");
  if (!name) throw new Error("Missing required field: name or title (or identity.name)");

  const metadata: Record<string, any> = {
    category: category || content.category || content.metadata?.category,
    source: "json-file",
    file_path: path.relative(options.rootDir ?? process.cwd(), filePath).split(path.sep).join("/"),
  };
  if (content.metadata) Object.assign(metadata, content.metadata);
  if (type === "medication" && brandNames) metadata.brand_names = brandNames;
  if (type === "condition") {
    if (content.dsm5_code) metadata.dsm5_code = content.dsm5_code;
    if (content.icd10_code) metadata.icd10_code = content.icd10_code;
  }
  if (type === "resource" && content.pillar) metadata.pillar = content.pillar;

  return {
    slug,
    type,
    title: name,
    description: content.description || content.summary || null,
    content,
    metadata,
    status: content.status || "active",
  };
}

function filePriority(filePath: string): number {
  if (filePath.includes("-v2.json")) return 2;
  if (filePath.includes(".legacy.json")) return 0;
  return 1;
}

/**
 * One row per type+slug. When two files produce the same record, keep the
 * -v2 file, then a plain file, then a .legacy file (first seen wins ties).
 */
export function dedupeEntities<T extends { type: string; slug: string }>(
  items: Array<{ entity: T; filePath: string }>,
  onSkip?: (skippedPath: string, keptPath: string) => void
): Array<{ entity: T; filePath: string }> {
  const seen = new Map<string, number>();
  const out: Array<{ entity: T; filePath: string }> = [];
  for (const item of items) {
    const key = `${item.entity.type}:${item.entity.slug}`;
    const idx = seen.get(key);
    if (idx === undefined) {
      seen.set(key, out.length);
      out.push(item);
    } else if (filePriority(item.filePath) > filePriority(out[idx].filePath)) {
      onSkip?.(out[idx].filePath, item.filePath);
      out[idx] = item;
    } else {
      onSkip?.(item.filePath, out[idx].filePath);
    }
  }
  return out;
}

/**
 * Read and normalize every record in one content directory.
 * Returns deduplicated rows plus the files that could not be used.
 */
export function loadContentDir(
  dataDir: string,
  dirKey: ContentDirKey,
  options: { rootDir?: string } = {}
): {
  rows: Array<{ entity: ContentEntityRow; filePath: string }>;
  errors: Array<{ file: string; error: string }>;
  fileCount: number;
} {
  const dir = path.join(dataDir, CONTENT_DIRS[dirKey]);
  const errors: Array<{ file: string; error: string }> = [];
  if (!fs.existsSync(dir)) return { rows: [], errors, fileCount: 0 };

  const files = readJsonFiles(dir, (file, error) =>
    errors.push({ file, error: `Failed to parse: ${error instanceof Error ? error.message : String(error)}` })
  );
  const normalized: Array<{ entity: ContentEntityRow; filePath: string }> = [];
  for (const file of files) {
    try {
      normalized.push({ entity: normalizeToEntity(file.path, file.content, options), filePath: file.path });
    } catch (error) {
      errors.push({ file: file.path, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { rows: dedupeEntities(normalized), errors, fileCount: files.length };
}
