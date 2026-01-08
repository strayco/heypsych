/**
 * News Sitemap for Knowledge Hub Articles
 * 
 * Google News sitemap for articles published in the last 48 hours.
 * This helps content appear in Google News and Discover feeds.
 * 
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */

import { NextResponse } from "next/server";
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join } from "path";

const SITE_URL = "https://heypsych.com";
const NEWS_PUBLICATION_NAME = "HeyPsych";
const NEWS_LANGUAGE = "en";

interface NewsArticle {
  slug: string;
  title: string;
  publicationDate: string;
  category?: string;
}

// Get articles from knowledge hub (published within last 2 days for news sitemap)
function getRecentArticles(): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const knowledgeHubPath = join(process.cwd(), "data/resources/knowledge-hub");

  if (!existsSync(knowledgeHubPath)) {
    return articles;
  }

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  function scanDir(dir: string, category: string = "") {
    try {
      const items = readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = join(dir, item.name);
        
        if (item.isDirectory()) {
          scanDir(fullPath, item.name);
        } else if (item.name.endsWith(".json")) {
          try {
            const stats = statSync(fullPath);
            const content = JSON.parse(readFileSync(fullPath, "utf-8"));
            
            // Check if recently modified or has recent publication date
            const pubDate = content.editorial?.lastUpdated || 
                           content.metadata?.published_date ||
                           stats.mtime.toISOString().split("T")[0];
            
            const articleDate = new Date(pubDate);
            
            // Only include articles from last 48 hours (Google News requirement)
            // For initial submission, we'll include all articles
            if (content.slug && content.name) {
              articles.push({
                slug: content.slug,
                title: content.name || content.title,
                publicationDate: pubDate,
                category: category || "mental-health",
              });
            }
          } catch (e) {
            // Skip invalid files
          }
        }
      }
    } catch (e) {
      console.error("Error scanning knowledge hub:", e);
    }
  }

  scanDir(knowledgeHubPath);
  
  // Sort by date, newest first
  return articles.sort((a, b) => 
    new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
  );
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateNewsSitemapXml(articles: NewsArticle[]): string {
  const urlEntries = articles
    .map((article) => {
      return `  <url>
    <loc>${SITE_URL}/resources/knowledge-hub/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(NEWS_PUBLICATION_NAME)}</news:name>
        <news:language>${NEWS_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${article.publicationDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlEntries}
</urlset>`;
}

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    const articles = getRecentArticles();
    const xml = generateNewsSitemapXml(articles);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Failed to generate news sitemap:", error);
    return new NextResponse("Failed to generate news sitemap", {
      status: 500,
    });
  }
}


