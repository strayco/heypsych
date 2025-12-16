/**
 * SEO Configuration System
 *
 * Centralized configuration for all SEO-related behavior including:
 * - Link limits per template type
 * - Metadata rules and defaults
 * - Schema.org settings
 * - Sitemap priorities and change frequencies
 */

import type { EntityType } from '@/lib/types/database';

/**
 * Site-wide SEO constants
 */
export const SITE_CONFIG = {
  name: 'HeyPsych',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.heypsych.com',
  description: 'Evidence-based mental health treatment information and resources',
  locale: 'en_US',
  twitter: '@heypsych',
  logo: '/images/logo.png',  // PNG for schema.org compatibility with Google
  logoSvg: '/logo.svg',       // SVG for browser display
  // TODO: Create proper 1200x630 OG image at /og-image.png for optimal social sharing
  defaultOGImage: '/android-chrome-512x512.png',  // Using existing image temporarily
} as const;

/**
 * Internal link limits by template/entity type
 *
 * Purpose: Prevent spammy link density while ensuring rich internal linking
 */
export const LINK_LIMITS: Record<EntityType | 'default', {
  body: number;        // Max links in main content
  sidebar: number;     // Max links in sidebar/related content
  footer: number;      // Max links in footer (global)
  total: number;       // Max total links per page
}> = {
  condition: {
    body: 40,
    sidebar: 12,
    footer: 100,
    total: 75
  },
  medication: {
    body: 35,
    sidebar: 10,
    footer: 100,
    total: 70
  },
  therapy: {
    body: 35,
    sidebar: 10,
    footer: 100,
    total: 70
  },
  interventional: {
    body: 30,
    sidebar: 8,
    footer: 100,
    total: 65
  },
  investigational: {
    body: 30,
    sidebar: 8,
    footer: 100,
    total: 65
  },
  alternative: {
    body: 30,
    sidebar: 8,
    footer: 100,
    total: 65
  },
  supplement: {
    body: 30,
    sidebar: 8,
    footer: 100,
    total: 65
  },
  treatment: {
    body: 35,
    sidebar: 10,
    footer: 100,
    total: 70
  },
  resource: {
    body: 30,
    sidebar: 8,
    footer: 100,
    total: 60
  },
  provider: {
    body: 20,
    sidebar: 6,
    footer: 100,
    total: 50
  },
  default: {
    body: 30,
    sidebar: 10,
    footer: 100,
    total: 60
  }
};

/**
 * Get link limits for a specific entity type
 */
export function getLinkLimits(entityType?: EntityType) {
  return LINK_LIMITS[entityType || 'default'];
}

/**
 * Metadata character limits for SEO optimization
 */
export const METADATA_LIMITS = {
  title: {
    min: 30,
    max: 60,
    ideal: 55
  },
  description: {
    min: 70,
    max: 160,
    ideal: 155
  },
  keywords: {
    min: 3,
    max: 15,
    ideal: 10
  }
} as const;

/**
 * Sitemap configuration
 */
export const SITEMAP_CONFIG = {
  // Change frequencies
  changeFreq: {
    homepage: 'daily' as const,
    hubs: 'weekly' as const,
    entities: 'monthly' as const,
    static: 'yearly' as const
  },

  // Priority values (0.0 - 1.0)
  priority: {
    homepage: 1.0,
    categoryHubs: 0.9,
    assessments: 0.9,
    conditions: 0.8,
    therapies: 0.75,
    medications: 0.7,
    resources: 0.7,
    interventional: 0.65,
    supplements: 0.65,
    alternative: 0.65,
    investigational: 0.6,
    providers: 0.8,
    static: 0.5
  },

  // Multi-sitemap thresholds
  splitThreshold: 1000, // Split into multiple sitemaps if >1000 pages
  maxURLsPerSitemap: 50000 // Google's limit
} as const;

/**
 * Get sitemap priority for entity type
 */
export function getSitemapPriority(entityType: EntityType): number {
  switch (entityType) {
    case 'condition': return SITEMAP_CONFIG.priority.conditions;
    case 'medication': return SITEMAP_CONFIG.priority.medications;
    case 'therapy': return SITEMAP_CONFIG.priority.therapies;
    case 'interventional': return SITEMAP_CONFIG.priority.interventional;
    case 'investigational': return SITEMAP_CONFIG.priority.investigational;
    case 'alternative': return SITEMAP_CONFIG.priority.alternative;
    case 'supplement': return SITEMAP_CONFIG.priority.supplements;
    case 'resource': return SITEMAP_CONFIG.priority.resources;
    case 'provider': return SITEMAP_CONFIG.priority.providers;
    default: return SITEMAP_CONFIG.priority.static;
  }
}

/**
 * Schema.org configuration
 */
export const SCHEMA_CONFIG = {
  // Organization schema (site-wide)
  organization: {
    '@type': 'MedicalOrganization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
    description: SITE_CONFIG.description,
    medicalSpecialty: 'Psychiatry',
    sameAs: [
      // Add social media profiles here when available
    ]
  },

  // Enable/disable specific schema types
  enabled: {
    medicalCondition: true,
    drug: true,
    medicalTherapy: true,
    medicalWebPage: true,
    breadcrumbList: true,
    person: true,
    faqPage: true,
    organization: true
  }
} as const;

/**
 * E-A-T (Expertise, Authoritativeness, Trustworthiness) configuration
 */
export const EAT_CONFIG = {
  // Review frequency (days)
  reviewFrequency: {
    highRisk: 180,     // 6 months for high-risk content (suicide, crisis)
    clinical: 365,     // 1 year for standard clinical content
    general: 730       // 2 years for general content
  },

  // Crisis risk indicators (used to trigger crisis banners)
  crisisKeywords: [
    'suicide',
    'suicidal ideation',
    'self-harm',
    'crisis',
    'emergency'
  ],

  // Required E-A-T signals by entity type
  required: {
    condition: {
      author: true,
      medicalReviewer: true,
      dates: true,
      citations: false // Nice to have
    },
    medication: {
      author: true,
      medicalReviewer: true,
      dates: true,
      citations: false
    },
    therapy: {
      author: true,
      medicalReviewer: false, // Not always required for therapy
      dates: true,
      citations: false
    },
    resource: {
      author: false,
      medicalReviewer: false,
      dates: false,
      citations: false
    }
  }
} as const;

/**
 * Check if entity needs crisis warning banner
 */
export function needsCrisisWarning(entity: { tags?: string[]; data?: any }): boolean {
  const tags = entity.tags || [];
  const data = entity.data || {};

  // Check tags
  const hasRiskTag = tags.some(tag =>
    EAT_CONFIG.crisisKeywords.some(keyword =>
      tag.toLowerCase().includes(keyword)
    )
  );

  // Check data fields
  const hasSuicidalityRisk = data.suicidality_risk === 'high';

  return hasRiskTag || hasSuicidalityRisk;
}

/**
 * Metadata keyword extraction configuration
 */
export const KEYWORD_CONFIG = {
  // Stopwords to exclude from automatic keyword extraction
  stopwords: [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
  ],

  // Minimum word length for keywords
  minLength: 3,

  // Maximum keywords per page
  max: 15
} as const;

/**
 * Link extraction priorities (for ranking/sorting links)
 */
export const LINK_PRIORITY = {
  // Conditions
  firstLineTreatment: 10,
  secondLineTreatment: 7,
  adjunctiveTreatment: 4,
  relatedCondition: 6,
  assessment: 8,

  // Treatments
  primaryIndication: 10,
  secondaryIndication: 7,
  offLabelUse: 4,
  sameDrugClass: 5,
  sameCategory: 5,

  // Resources
  relatedArticle: 5,
  crisisResource: 9
} as const;

/**
 * OpenGraph image generation settings (if implementing dynamic OG images)
 */
export const OG_IMAGE_CONFIG = {
  width: 1200,
  height: 630,
  format: 'png' as const,
  quality: 90,

  // Template settings
  template: 'default',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  accentColor: '#4F46E5' // Indigo-600
} as const;

/**
 * Performance and caching configuration
 */
export const PERFORMANCE_CONFIG = {
  // Entity cache TTL (milliseconds)
  entityCacheTTL: 5 * 60 * 1000, // 5 minutes

  // Schema generation cache
  schemaCacheTTL: 60 * 60 * 1000, // 1 hour

  // Link extraction cache
  linkCacheTTL: 10 * 60 * 1000, // 10 minutes

  // ISR revalidation (seconds)
  revalidate: 86400 // 24 hours
} as const;
