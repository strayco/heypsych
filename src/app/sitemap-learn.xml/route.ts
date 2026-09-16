/**
 * Learn Articles Sitemap Route
 *
 * Serves sitemap for all learn articles.
 * https://heypsych.com/sitemap-learn.xml
 */

import { NextResponse } from 'next/server';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { generateSitemapXml, type SitemapUrl } from '@/lib/seo/sitemap-generator';
import { SITE_CONFIG } from '@/lib/seo/config';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

interface LearnArticle {
  slug: string;
  title: string;
  publishedAt?: string;
  updatedAt?: string;
  featured?: boolean;
}

function getLearnArticles(): LearnArticle[] {
  const learnPath = join(process.cwd(), 'data/learn');
  const articles: LearnArticle[] = [];

  try {
    const files = readdirSync(learnPath).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      try {
        const content = JSON.parse(readFileSync(join(learnPath, file), 'utf-8'));
        articles.push({
          slug: content.slug || file.replace('.json', ''),
          title: content.title || '',
          publishedAt: content.publishedAt,
          updatedAt: content.updatedAt,
          featured: content.featured,
        });
      } catch {
        // Skip invalid files
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return articles;
}

export async function GET() {
  try {
    const articles = getLearnArticles();
    const baseUrl = SITE_CONFIG.url.trim().replace(/\/+$/, '');

    const urls: SitemapUrl[] = articles.map((article) => {
      const url: SitemapUrl = {
        loc: `${baseUrl}/learn/${article.slug}`,
        changefreq: 'monthly',
        priority: article.featured ? 0.8 : 0.7,
      };

      // Use updatedAt or publishedAt for lastmod
      if (article.updatedAt) {
        url.lastmod = article.updatedAt;
      } else if (article.publishedAt) {
        url.lastmod = article.publishedAt;
      }

      return url;
    });

    // Add the hub page
    urls.unshift({
      loc: `${baseUrl}/learn`,
      changefreq: 'weekly',
      priority: 0.8,
    });

    const xml = generateSitemapXml(urls);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate learn sitemap:', error);
    return new NextResponse('Failed to generate learn sitemap', {
      status: 500,
    });
  }
}
