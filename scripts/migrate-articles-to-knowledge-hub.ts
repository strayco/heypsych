#!/usr/bin/env ts-node
/**
 * Migration script: Articles & Blogs → Knowledge Hub
 * Transforms and reorganizes article JSONs into new 5-pillar IA
 *
 * Usage:
 *   npm run migrate:content:dry  (preview only)
 *   npm run migrate:content       (execute migration)
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ArticleSchema, type Article } from '../src/lib/schemas/article';

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

const DRY_RUN = process.argv.includes('--dry');
const SOURCE_DIR = path.join(process.cwd(), 'data/resources/knowledge-hub');
const TARGET_BASE = path.join(process.cwd(), 'content/knowledge-hub');
const REDIRECTS_FILE = path.join(process.cwd(), '_redirects/map.json');
const REPORT_FILE = path.join(process.cwd(), 'migration-report.md');

interface MigrationStats {
  total: number;
  migrated: number;
  unsorted: number;
  errors: string[];
  warnings: string[];
  fieldEdits: Map<string, number>;
  redirects: Array<{ from: string; to: string }>;
  unsortedItems: Array<{ file: string; reason: string; suggested: string }>;
}

const stats: MigrationStats = {
  total: 0,
  migrated: 0,
  unsorted: 0,
  errors: [],
  warnings: [],
  fieldEdits: new Map(),
  redirects: [],
  unsortedItems: [],
};

// ════════════════════════════════════════════════════════════════════════════
// MAPPING LOGIC
// ════════════════════════════════════════════════════════════════════════════

interface PillarMapping {
  pillar: string;
  subcategory: string;
}

function determinePillarAndSubcategory(
  legacyPath: string,
  metadata: any,
  topics: string[]
): PillarMapping | null {
  const articleType = metadata?.article_type;

  // Research articles
  if (articleType === 'research' || legacyPath.includes('/research/')) {
    return {
      pillar: 'research-and-science',
      subcategory: 'psychology',
    };
  }

  // Lived experience / personal stories
  if (articleType === 'lived-experience' || legacyPath.includes('/lived-experience/')) {
    return {
      pillar: 'community-and-stories',
      subcategory: 'personal-stories',
    };
  }

  // Latest → reassign to trends
  if (articleType === 'latest' || legacyPath.includes('/latest/')) {
    return {
      pillar: 'research-and-science',
      subcategory: 'mental-health-trends',
    };
  }

  // How-to articles - determine subcategory from topics/content
  if (articleType === 'how-to' || legacyPath.includes('/how-to/')) {
    const slug = path.basename(legacyPath, '.json');

    if (slug.includes('insurance') || topics.some(t => t.includes('insurance'))) {
      return { pillar: 'how-to-guides', subcategory: 'insurance' };
    }
    if (slug.includes('therapist') || slug.includes('therapy') || topics.some(t => t.includes('therapy'))) {
      return { pillar: 'how-to-guides', subcategory: 'therapy-access' };
    }
    if (slug.includes('doctor') || slug.includes('medication')) {
      return { pillar: 'how-to-guides', subcategory: 'health-systems' };
    }

    // Default how-to
    return { pillar: 'how-to-guides', subcategory: 'health-systems' };
  }

  // Root-level guides
  const slug = path.basename(legacyPath, '.json');
  if (slug === 'finding-a-therapist' || slug === 'understanding-therapy-types') {
    return { pillar: 'how-to-guides', subcategory: 'therapy-access' };
  }
  if (slug === 'insurance-navigation') {
    return { pillar: 'how-to-guides', subcategory: 'insurance' };
  }

  return null; // Unsorted
}

// ════════════════════════════════════════════════════════════════════════════
// CONTENT TRANSFORMATION
// ════════════════════════════════════════════════════════════════════════════

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractReadingMinutes(readTime: string | undefined): number | undefined {
  if (!readTime) return undefined;
  const match = readTime.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

function generateSummary(content: any, description?: string, summary?: string): string {
  // Prefer existing summary or description
  if (summary) return summary;
  if (description) return description;

  // Generate from introduction or first section
  const intro = content?.introduction || content?.sections?.[0]?.text || content?.sections?.[0]?.content || '';
  const words = intro.split(/\s+/).slice(0, 30).join(' ');
  return words + (words.length > 0 ? '...' : 'No summary available');
}

function convertContentToBlocks(content: any, sections: any[]): any[] {
  const blocks: any[] = [];

  // Handle "content.sections" pattern (blog-style)
  if (content?.sections) {
    content.sections.forEach((section: any) => {
      if (section.heading) {
        blocks.push({ type: 'h2', text: section.heading });
      }
      if (section.content) {
        // Split by paragraphs
        const paragraphs = section.content.split('\n\n').filter((p: string) => p.trim());
        paragraphs.forEach((p: string) => {
          blocks.push({ type: 'p', text: p.trim() });
        });
      }
    });
  }

  // Handle "sections" pattern (guide-style)
  if (sections && sections.length > 0 && !content?.sections) {
    sections.forEach((section: any) => {
      if (section.title) {
        blocks.push({ type: 'h2', text: section.title });
      }
      if (section.text) {
        blocks.push({ type: 'p', text: section.text });
      }
    });
  }

  // Add introduction if exists
  if (content?.introduction) {
    blocks.unshift({ type: 'p', text: content.introduction });
  }

  // Add conclusion if exists
  if (content?.conclusion) {
    blocks.push({ type: 'p', text: content.conclusion });
  }

  return blocks.length > 0 ? blocks : [{ type: 'p', text: 'Content unavailable' }];
}

function transformArticle(raw: any, filePath: string): Article {
  const metadata = raw.metadata || {};
  const topics = metadata.topics || raw.topics || [];
  const author = raw.author || 'HeyPsych Team';

  // Determine pillar/subcategory
  const mapping = determinePillarAndSubcategory(filePath, metadata, topics);
  if (!mapping) {
    throw new Error('Unable to determine pillar/subcategory');
  }

  // Build canonical URL
  const canonical = `/resources/knowledge-hub/${mapping.pillar}/${mapping.subcategory}/${raw.slug}`;

  // Transform to new schema
  const article: Article = {
    title: raw.name || raw.title || 'Untitled',
    slug: normalizeSlug(raw.slug),
    pillar: mapping.pillar as any,
    subcategory: mapping.subcategory,
    summary: generateSummary(raw.content, raw.description, raw.summary),
    coverImage: raw.coverImage || raw.cover_image,
    authors: Array.isArray(author) ? author : [author],
    publishedAt: metadata.published_date
      ? new Date(metadata.published_date).toISOString()
      : new Date().toISOString(),
    readingMinutes: extractReadingMinutes(metadata.read_time || raw.reading_time),
    tags: topics.map(normalizeSlug),
    audience: raw.target_populations?.map(normalizeSlug) || raw.audience,
    format: (raw.format === 'guide' ? 'article' : raw.format) || 'article',
    seo: {
      title: raw.seo?.title || `${raw.name} | Knowledge Hub`,
      description: raw.seo?.description || generateSummary(raw.content, raw.description, raw.summary).slice(0, 155),
      canonical,
    },
    body: convertContentToBlocks(raw.content, raw.sections),
  };

  // Track field edits
  if (!raw.authors) stats.fieldEdits.set('author→authors', (stats.fieldEdits.get('author→authors') || 0) + 1);
  if (!raw.publishedAt) stats.fieldEdits.set('add publishedAt', (stats.fieldEdits.get('add publishedAt') || 0) + 1);
  if (!raw.summary) stats.fieldEdits.set('generate summary', (stats.fieldEdits.get('generate summary') || 0) + 1);
  if (!raw.seo) stats.fieldEdits.set('add seo', (stats.fieldEdits.get('add seo') || 0) + 1);
  if (raw.content?.sections) stats.fieldEdits.set('convert content→body', (stats.fieldEdits.get('convert content→body') || 0) + 1);

  return article;
}

// ════════════════════════════════════════════════════════════════════════════
// FILE OPERATIONS
// ════════════════════════════════════════════════════════════════════════════

async function findAllArticles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

function computeHash(obj: any): string {
  const json = JSON.stringify(obj, null, 2);
  return crypto.createHash('sha256').update(json).digest('hex');
}

async function writeIfChanged(targetPath: string, content: any): Promise<boolean> {
  const json = JSON.stringify(content, null, 2);
  const newHash = computeHash(content);

  try {
    const existing = await fs.readFile(targetPath, 'utf-8');
    const existingHash = computeHash(JSON.parse(existing));
    if (existingHash === newHash) {
      return false; // No change
    }
  } catch {
    // File doesn't exist, will write
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, json, 'utf-8');
  return true;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN MIGRATION LOGIC
// ════════════════════════════════════════════════════════════════════════════

async function migrateArticle(sourcePath: string): Promise<void> {
  stats.total++;

  try {
    // Load source
    const rawJson = await fs.readFile(sourcePath, 'utf-8');
    const raw = JSON.parse(rawJson);

    // Transform
    const article = transformArticle(raw, sourcePath);

    // Validate
    const validation = ArticleSchema.safeParse(article);
    if (!validation.success) {
      stats.errors.push(`${sourcePath}: Validation failed - ${validation.error.message}`);
      return;
    }

    // Determine target path
    const targetPath = path.join(
      TARGET_BASE,
      article.pillar,
      article.subcategory || '',
      `${article.slug}.json`
    );

    // Compute old URL for redirect
    const relativePath = path.relative(SOURCE_DIR, sourcePath).replace('.json', '');
    const oldUrl = `/resources/articles-guides/${relativePath}`;
    const newUrl = article.seo?.canonical || '';

    if (DRY_RUN) {
      console.log(`\n📄 ${path.basename(sourcePath)}`);
      console.log(`   Old: ${oldUrl}`);
      console.log(`   New: ${newUrl}`);
      console.log(`   Pillar: ${article.pillar} / ${article.subcategory}`);
      console.log(`   Authors: ${article.authors.join(', ')}`);
      console.log(`   Tags: ${article.tags?.join(', ') || 'none'}`);
    } else {
      const changed = await writeIfChanged(targetPath, article);
      if (changed) {
        console.log(`✅ Migrated: ${path.basename(sourcePath)} → ${path.relative(process.cwd(), targetPath)}`);
      } else {
        console.log(`⏭️  Skipped (unchanged): ${path.basename(sourcePath)}`);
      }
    }

    stats.redirects.push({ from: oldUrl, to: newUrl });
    stats.migrated++;

  } catch (error: any) {
    if (error.message.includes('Unable to determine pillar')) {
      stats.unsorted++;
      stats.unsortedItems.push({
        file: path.basename(sourcePath),
        reason: 'Unable to determine pillar/subcategory',
        suggested: 'Review content and assign manually',
      });

      if (!DRY_RUN) {
        const raw = JSON.parse(await fs.readFile(sourcePath, 'utf-8'));
        const unsortedPath = path.join(TARGET_BASE, '_unsorted', path.basename(sourcePath));
        await writeIfChanged(unsortedPath, raw);
        console.log(`⚠️  Moved to _unsorted: ${path.basename(sourcePath)}`);
      }
    } else {
      stats.errors.push(`${sourcePath}: ${error.message}`);
    }
  }
}

async function generateTaxonomy(articles: Article[]): Promise<void> {
  const taxonomyDir = path.join(TARGET_BASE, '_taxonomy');
  await fs.mkdir(taxonomyDir, { recursive: true });

  // Collect unique values
  const topics = new Set<string>();
  const audiences = new Set<string>();
  const formats = new Set<string>();
  const authors = new Set<string>();

  articles.forEach(article => {
    article.tags?.forEach(t => topics.add(t));
    article.audience?.forEach(a => audiences.add(a));
    if (article.format) formats.add(article.format);
    article.authors.forEach(a => authors.add(a));
  });

  // Write taxonomy files
  const sortedTopics = Array.from(topics).sort().map(slug => ({ slug, name: slug }));
  const sortedAudiences = Array.from(audiences).sort().map(slug => ({ slug, name: slug }));
  const sortedFormats = Array.from(formats).sort().map(slug => ({ slug, name: slug }));
  const sortedAuthors = Array.from(authors).sort().map(slug => ({ slug, name: slug }));

  if (!DRY_RUN) {
    await fs.writeFile(path.join(taxonomyDir, 'topics.json'), JSON.stringify(sortedTopics, null, 2));
    await fs.writeFile(path.join(taxonomyDir, 'audiences.json'), JSON.stringify(sortedAudiences, null, 2));
    await fs.writeFile(path.join(taxonomyDir, 'formats.json'), JSON.stringify(sortedFormats, null, 2));
    await fs.writeFile(path.join(taxonomyDir, 'authors.json'), JSON.stringify(sortedAuthors, null, 2));
    console.log(`\n📚 Generated taxonomy files (${sortedTopics.length} topics, ${sortedAuthors.length} authors)`);
  }
}

async function saveRedirects(): Promise<void> {
  if (DRY_RUN) return;

  const redirectMap: Record<string, string> = {};
  stats.redirects.forEach(({ from, to }) => {
    redirectMap[from] = to;
  });

  await fs.mkdir(path.dirname(REDIRECTS_FILE), { recursive: true });
  await fs.writeFile(REDIRECTS_FILE, JSON.stringify(redirectMap, null, 2));
  console.log(`\n🔀 Saved ${stats.redirects.length} redirects to ${path.relative(process.cwd(), REDIRECTS_FILE)}`);
}

async function generateReport(): Promise<void> {
  const lines: string[] = [];

  lines.push('# Knowledge Hub Migration Report\n');
  lines.push(`**Date:** ${new Date().toISOString()}\n`);
  lines.push('## Summary\n');
  lines.push(`- Total articles processed: ${stats.total}`);
  lines.push(`- Successfully migrated: ${stats.migrated}`);
  lines.push(`- Moved to _unsorted: ${stats.unsorted}`);
  lines.push(`- Errors: ${stats.errors.length}`);
  lines.push(`- Warnings: ${stats.warnings.length}\n`);

  lines.push('## Field Transformations\n');
  stats.fieldEdits.forEach((count, field) => {
    lines.push(`- ${field}: ${count} files`);
  });
  lines.push('');

  if (stats.unsortedItems.length > 0) {
    lines.push('## Unsorted Items (Manual Review Required)\n');
    stats.unsortedItems.forEach(item => {
      lines.push(`- **${item.file}**`);
      lines.push(`  - Reason: ${item.reason}`);
      lines.push(`  - Suggested: ${item.suggested}\n`);
    });
  }

  if (stats.errors.length > 0) {
    lines.push('## Errors\n');
    stats.errors.forEach(err => lines.push(`- ${err}`));
    lines.push('');
  }

  if (stats.warnings.length > 0) {
    lines.push('## Warnings\n');
    stats.warnings.forEach(warn => lines.push(`- ${warn}`));
    lines.push('');
  }

  const report = lines.join('\n');

  if (!DRY_RUN) {
    await fs.writeFile(REPORT_FILE, report);
    console.log(`\n📋 Generated migration report: ${path.relative(process.cwd(), REPORT_FILE)}`);
  }

  console.log('\n' + report);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Knowledge Hub Migration');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'COMMIT (will write files)'}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Find all articles
  const sourceFiles = await findAllArticles(SOURCE_DIR);
  console.log(`Found ${sourceFiles.length} article files in ${SOURCE_DIR}\n`);

  // Migrate each article
  for (const file of sourceFiles) {
    await migrateArticle(file);
  }

  // Load all migrated articles for taxonomy
  if (!DRY_RUN) {
    const migratedFiles = await findAllArticles(TARGET_BASE);
    const articles: Article[] = [];
    for (const file of migratedFiles) {
      if (file.includes('/_taxonomy/') || file.includes('/_unsorted/')) continue;
      try {
        const content = JSON.parse(await fs.readFile(file, 'utf-8'));
        articles.push(content);
      } catch {}
    }
    await generateTaxonomy(articles);
    await saveRedirects();
  }

  // Generate report
  await generateReport();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(DRY_RUN
    ? '  ✅ Dry run complete. Review output above and run without --dry to commit.'
    : '  ✅ Migration complete!'
  );
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(stats.errors.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
