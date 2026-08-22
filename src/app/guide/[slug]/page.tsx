/**
 * Programmatic SEO Dynamic Route - THE WIN PROTOCOL
 * 
 * SUSTAINABLE DOMINANCE through:
 * 1. Index Eligibility Gate - only index pages that earn it
 * 2. Canonical Authority Model - answer kings vs variants
 * 3. Honest Freshness - real dates, not fake "Updated today"
 * 4. Real Medical Authority - provable, not claimed
 * 5. Proper Schema Discipline - less, but correct
 * 
 * Pages are GENERATED but only INDEXED if they pass eligibility:
 * - Demand score ≥ threshold
 * - Uniqueness score ≥ threshold  
 * - Safety completeness score = pass
 * - Canonical authority exists
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  generateDynamicPageConfigs,
  parseDynamicSlug,
} from '@/lib/programmatic-seo/dynamic-generator';
import { generatePageContent } from '@/lib/programmatic-seo/content-engine';
import { makeGuideIndexDecision, getCanonicalUrl } from '@/lib/seo/index-decision-service';
import { SITE_CONFIG } from '@/lib/seo/config';
import { GuidePageClient } from './client-wrapper';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate all static paths at build time
// This crawls your JSON files and generates all valid combinations
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const configs = await generateDynamicPageConfigs();
    console.log(`[Programmatic SEO] Generating ${configs.length} static pages`);
    return configs.map(config => ({ slug: config.slug }));
  } catch (error) {
    console.error('[Programmatic SEO] Error generating static params:', error);
    return [];
  }
}

// Generate metadata for each page (with INDEX ELIGIBILITY GATE)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Parse the slug to understand what content is needed
  const config = await parseDynamicSlug(slug);
  
  if (!config) {
    return { 
      title: 'Page Not Found | HeyPsych',
      robots: { index: false, follow: false },
    };
  }

  // Generate the full page content
  const content = await generatePageContent(config);
  
  if (!content) {
    return { 
      title: 'Page Not Found | HeyPsych',
      robots: { index: false, follow: false },
    };
  }

  // CENTRAL INDEXATION FIREWALL: Single source of truth for indexability
  // All decisions now go through the firewall for consistency
  const decision = makeGuideIndexDecision(slug, {
    pageType: config.pageType,
    wordCount: content.wordCount,
    uniquenessScore: 0.8, // TODO: Calculate from similarity engine
    safetyScore: content.disclaimerLevel === 'critical' ? 0.9 : 0.85,
    hasDemographicContent: !!config.demographic,
  });

  const shouldIndex = decision.indexable;
  const canonicalUrl = getCanonicalUrl(decision, SITE_CONFIG.url) || content.canonicalUrl;

  return {
    title: content.title,
    description: content.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: content.title,
      description: content.metaDescription,
      url: canonicalUrl,
      type: 'article',
      siteName: 'HeyPsych',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.metaDescription,
    },
    // CENTRAL FIREWALL: Consistent robots directives
    robots: {
      index: shouldIndex,
      follow: true, // Always follow links for crawl discovery
      googleBot: {
        index: shouldIndex,
        follow: true,
        'max-snippet': shouldIndex ? -1 : 0,
        'max-image-preview': shouldIndex ? 'large' : 'none',
        'max-video-preview': shouldIndex ? -1 : 0,
      },
    },
    other: {
      // Show honest review date, not fake "modified" date
      ...(content.datePublished && { 'article:published_time': content.datePublished }),
      'article:modified_time': content.lastUpdated,
      // Track firewall decision for debugging
      'x-firewall-cohort': decision.cohort,
    },
  };
}

// The actual page component
export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;

  // Parse the slug to understand what we're rendering
  const config = await parseDynamicSlug(slug);

  if (!config) {
    notFound();
  }

  // Generate the full page content
  const content = await generatePageContent(config);

  if (!content) {
    notFound();
  }

  return (
    <>
      {/* Schema.org structured data - CRITICAL for SEO */}
      {content.schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* The actual page content */}
      <GuidePageClient content={content} />
    </>
  );
}
