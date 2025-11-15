// src/lib/content.ts
/**
 * Knowledge Hub content loading utilities
 * Provides functions to read and query articles from the file system
 */

import fs from 'fs/promises';
import path from 'path';
import { ArticleSchema, type Article } from './schemas/article';

const CONTENT_BASE = path.join(process.cwd(), 'content/knowledge-hub');

/**
 * Read a single article by its path components
 * @param parts - Path components [pillar, subcategory?, slug]
 * @returns Validated article or null if not found
 *
 * @example
 * ```ts
 * const article = await readArticleByPath(['how-to-guides', 'therapy-access', 'finding-a-therapist']);
 * ```
 */
export async function readArticleByPath(parts: string[]): Promise<Article | null> {
  try {
    // Build file path
    const fileName = `${parts[parts.length - 1]}.json`;
    const filePath = path.join(CONTENT_BASE, ...parts.slice(0, -1), fileName);

    // Read and parse
    const content = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(content);

    // Validate
    const validation = ArticleSchema.safeParse(json);
    if (!validation.success) {
      console.error(`Invalid article at ${filePath}:`, validation.error);
      return null;
    }

    return validation.data;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null; // File not found
    }
    throw error;
  }
}

/**
 * Find all article files recursively
 */
async function findAllArticleFiles(dir: string = CONTENT_BASE): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // Skip special directories
        if (entry.name === '_taxonomy' || entry.name === '_unsorted' || entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.name.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  await walk(dir);
  return files;
}

/**
 * List all articles with optional filtering
 * @param options - Filtering options
 * @returns Array of validated articles
 *
 * @example
 * ```ts
 * const articles = await listArticles({ pillar: 'how-to-guides' });
 * const featuredArticles = await listArticles({ limit: 10 });
 * ```
 */
export async function listArticles(options?: {
  pillar?: string;
  subcategory?: string;
  tag?: string;
  author?: string;
  limit?: number;
}): Promise<Article[]> {
  const files = await findAllArticleFiles();
  const articles: Article[] = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const json = JSON.parse(content);

      const validation = ArticleSchema.safeParse(json);
      if (validation.success) {
        const article = validation.data;

        // Apply filters
        if (options?.pillar && article.pillar !== options.pillar) continue;
        if (options?.subcategory && article.subcategory !== options.subcategory) continue;
        if (options?.tag && !article.tags?.includes(options.tag)) continue;
        if (options?.author && !article.authors.includes(options.author)) continue;

        articles.push(article);
      } else {
        console.error(`Invalid article at ${file}:`, validation.error);
      }
    } catch (error: any) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }

  // Apply limit
  if (options?.limit && options.limit > 0) {
    return articles.slice(0, options.limit);
  }

  return articles;
}

/**
 * List latest articles sorted by date
 * @param limit - Maximum number of articles to return (default: 12)
 * @returns Articles sorted by most recent first
 *
 * @example
 * ```ts
 * const latest = await listLatest(5);
 * ```
 */
export async function listLatest(limit: number = 12): Promise<Article[]> {
  const articles = await listArticles();

  // Sort by updatedAt or publishedAt, descending
  const sorted = articles.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.publishedAt);
    const dateB = new Date(b.updatedAt || b.publishedAt);
    return dateB.getTime() - dateA.getTime();
  });

  return sorted.slice(0, limit);
}

/**
 * Get articles by pillar
 * @param pillar - The pillar name
 * @returns Articles in that pillar
 */
export async function getArticlesByPillar(pillar: string): Promise<Article[]> {
  return listArticles({ pillar });
}

/**
 * Get articles by tag
 * @param tag - The tag to filter by
 * @returns Articles with that tag
 */
export async function getArticlesByTag(tag: string): Promise<Article[]> {
  return listArticles({ tag });
}

/**
 * Search articles by query (simple text search in title and summary)
 * @param query - Search query
 * @returns Matching articles
 */
export async function searchArticles(query: string): Promise<Article[]> {
  const allArticles = await listArticles();
  const lowerQuery = query.toLowerCase();

  return allArticles.filter(article => {
    const titleMatch = article.title.toLowerCase().includes(lowerQuery);
    const summaryMatch = article.summary.toLowerCase().includes(lowerQuery);
    const tagMatch = article.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));

    return titleMatch || summaryMatch || tagMatch;
  });
}
