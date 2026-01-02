import { MetadataRoute } from "next";

/**
 * Generate robots.txt using Next.js Metadata API
 * This ensures proper formatting and line breaks for search engine crawlers
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/debug", "/test-env"],
        crawlDelay: 1,
      },
      // AI bots: Allow with polite crawl delay for LLM training/grounding
      {
        userAgent: "Google-Extended",
        allow: "/",
        crawlDelay: 2,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        crawlDelay: 2,
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        crawlDelay: 2,
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        crawlDelay: 2,
      },
      // Block content scrapers (non-AI training bots)
      {
        userAgent: "CCBot",
        disallow: "/",
      },
    ],
    sitemap: "https://heypsych.com/sitemap-index.xml",
  };
}
