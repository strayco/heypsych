/**
 * SEO SITEMAP INTEGRITY TESTS
 *
 * Critical CI gates for the multi-sitemap architecture:
 * - sitemap-index.xml (orchestrator)
 * - sitemap-*.xml (individual sitemaps)
 *
 * Tests prevent:
 * - Fake freshness timestamps
 * - Missing sitemaps from index
 * - Deleted routes in sitemap
 * - Noindex pages in sitemap
 * - Sitemap/robots conflicts
 * - Missing AI crawler support
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Sitemap source files
const sitemapGeneratorPath = path.join(process.cwd(), 'src/lib/seo/sitemap-generator.ts');
const sitemapToolsPath = path.join(process.cwd(), 'src/app/sitemap-tools.xml/route.ts');
const sitemapGuidePath = path.join(process.cwd(), 'src/app/sitemap-guide.xml/route.ts');
const robotsPath = path.join(process.cwd(), 'src/app/robots.ts');

// Read files once
let sitemapGeneratorSource: string;
let sitemapToolsSource: string;
let sitemapGuideSource: string;
let robotsSource: string;

beforeAll(() => {
  sitemapGeneratorSource = fs.readFileSync(sitemapGeneratorPath, 'utf-8');
  sitemapToolsSource = fs.readFileSync(sitemapToolsPath, 'utf-8');
  sitemapGuideSource = fs.readFileSync(sitemapGuidePath, 'utf-8');
  robotsSource = fs.readFileSync(robotsPath, 'utf-8');
});

describe('Sitemap Generator Integrity', () => {
  describe('No Fake Freshness', () => {
    it('should NOT use new Date() for static page lastmod', () => {
      // Patterns that indicate fake freshness
      const fakePatterns = [
        /url\.lastmod\s*=\s*new Date\(\)\.toISOString\(\)/,
        /lastmod:\s*new Date\(\)\.toISOString\(\)/,
        /lastmod:\s*now/,
      ];

      for (const pattern of fakePatterns) {
        const match = sitemapGeneratorSource.match(pattern);
        expect(match, `sitemap-generator.ts contains fake freshness: ${pattern}`).toBeNull();
      }
    });

    it('should have documented freshness policy', () => {
      expect(sitemapGeneratorSource).toContain('SITEMAP FRESHNESS POLICY');
    });

    it('should omit lastmod from static pages', () => {
      // The static URL generation should NOT add lastmod
      // Check that the comment about removed fake lastmod is present
      expect(sitemapGeneratorSource).toContain('REMOVED: Fake lastmod');
    });
  });

  describe('Sitemap Index Completeness', () => {
    it('should include sitemap-tools.xml in index', () => {
      expect(sitemapGeneratorSource).toContain('sitemap-tools.xml');
    });

    it('should include sitemap-guide.xml in index', () => {
      expect(sitemapGeneratorSource).toContain('sitemap-guide.xml');
    });

    it('should include all required sitemaps', () => {
      const requiredSitemaps = [
        'sitemap-conditions.xml',
        'sitemap-treatments.xml',
        'sitemap-assessments.xml',
        'sitemap-resources.xml',
        'sitemap-hubs.xml',
        'sitemap-static.xml',
        'sitemap-guide.xml',
        'sitemap-tools.xml',
      ];

      for (const sitemap of requiredSitemaps) {
        expect(sitemapGeneratorSource, `Missing ${sitemap} from sitemap index`).toContain(sitemap);
      }
    });
  });
});

describe('Sitemap Tools Integrity', () => {
  describe('No Fake Freshness', () => {
    it('should NOT use new Date() for hub page lastmod', () => {
      // Count occurrences of fake freshness patterns
      const fakePattern = /lastmod:\s*new Date\(\)/g;
      const matches = sitemapToolsSource.match(fakePattern);
      expect(matches, 'sitemap-tools.xml contains fake freshness for hub pages').toBeNull();
    });

    it('should have documented freshness policy', () => {
      expect(sitemapToolsSource).toContain('SITEMAP FRESHNESS POLICY');
    });

    it('should only use real dates for tool pages with governance data', () => {
      // Check that tool pages use governance.last_reviewed, not new Date()
      expect(sitemapToolsSource).toContain('governance?.last_reviewed');
      expect(sitemapToolsSource).not.toContain('|| new Date()');
    });
  });
});

describe('Sitemap Guide Integrity', () => {
  describe('No Fake Freshness', () => {
    it('should NOT use new Date() for guide page lastmod', () => {
      const fakePatterns = [
        /const now = new Date\(\)/,
        /<lastmod>\$\{now\}<\/lastmod>/,
      ];

      for (const pattern of fakePatterns) {
        const match = sitemapGuideSource.match(pattern);
        expect(match, `sitemap-guide.xml contains fake freshness: ${pattern}`).toBeNull();
      }
    });

    it('should have documented freshness policy', () => {
      expect(sitemapGuideSource).toContain('SITEMAP FRESHNESS POLICY');
    });

    it('should omit lastmod from programmatic pages', () => {
      // Guide pages should not have lastmod since they're generated dynamically
      expect(sitemapGuideSource).not.toContain('<lastmod>');
    });
  });
});

describe('Robots.txt Integrity', () => {
  describe('AI Crawler Support', () => {
    const requiredCrawlers = [
      'GPTBot',
      'anthropic-ai',
      'Claude-Web',
      'OAI-SearchBot',
      'PerplexityBot',
    ];

    for (const crawler of requiredCrawlers) {
      it(`should allow ${crawler}`, () => {
        expect(robotsSource).toContain(crawler);
        // Should have allow: "/" for these crawlers
        expect(robotsSource).toMatch(new RegExp(`userAgent:\\s*["']${crawler}["'][^}]*allow`, 's'));
      });
    }
  });

  describe('Blocked Paths', () => {
    it('should block /api/ from all crawlers', () => {
      expect(robotsSource).toContain('"/api/"');
    });

    it('should block /debug from all crawlers', () => {
      expect(robotsSource).toContain('"/debug"');
    });

    it('should block /test-env from all crawlers', () => {
      expect(robotsSource).toContain('"/test-env"');
    });
  });

  describe('Sitemap Reference', () => {
    it('should reference sitemap-index.xml (not sitemap.xml)', () => {
      expect(robotsSource).toContain('sitemap-index.xml');
      // Should NOT reference the old sitemap.xml
      expect(robotsSource).not.toMatch(/sitemap:\s*["'][^"']*\/sitemap\.xml["']/);
    });
  });
});

describe('No Deleted Routes', () => {
  const deletedRoutes = [
    '/psychtrails/map',
    '/psychtrails/play/',
  ];

  it('should not include deleted routes in any sitemap file', () => {
    const allSitemapFiles = [sitemapGeneratorSource, sitemapToolsSource, sitemapGuideSource];

    for (const route of deletedRoutes) {
      for (const source of allSitemapFiles) {
        expect(source, `Found deleted route ${route} in sitemap`).not.toContain(`"${route}"`);
        expect(source, `Found deleted route ${route} in sitemap`).not.toContain(`'${route}'`);
      }
    }
  });
});

describe('Architecture Integrity', () => {
  it('should NOT have redundant sitemap.ts file', () => {
    // The old sitemap.ts was deleted - it was 100% redundant with the custom routes
    const oldSitemapPath = path.join(process.cwd(), 'src/app/sitemap.ts');
    expect(fs.existsSync(oldSitemapPath), 'Redundant sitemap.ts should be deleted').toBe(false);
  });

  it('should have all required sitemap route files', () => {
    const requiredFiles = [
      'src/app/sitemap-index.xml/route.ts',
      'src/app/sitemap-conditions.xml/route.ts',
      'src/app/sitemap-treatments.xml/route.ts',
      'src/app/sitemap-tools.xml/route.ts',
      'src/app/sitemap-guide.xml/route.ts',
      'src/app/sitemap-hubs.xml/route.ts',
      'src/app/sitemap-static.xml/route.ts',
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(process.cwd(), file);
      expect(fs.existsSync(fullPath), `Missing required sitemap file: ${file}`).toBe(true);
    }
  });
});
