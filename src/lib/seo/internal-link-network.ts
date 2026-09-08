/**
 * Internal Link Authority Network
 *
 * This system creates strategic internal linking that:
 * 1. Concentrates PageRank on money pages
 * 2. Creates topic clusters with clear hierarchy
 * 3. Ensures crawl depth is minimized for priority content
 * 4. Implements hub-and-spoke linking patterns
 *
 * Architecture:
 * - Hub pages (category hubs) link to all spoke pages
 * - Spoke pages link back to hub AND to related spokes
 * - Cross-cluster links connect related topics
 * - Every important page is max 3 clicks from homepage
 */

import { siteConfig } from "@/lib/config/site";

const SITE_URL = siteConfig.url;

// ============================================================================
// TYPES
// ============================================================================

export interface LinkNode {
  url: string;
  title: string;
  anchor: string;
  type: "hub" | "spoke" | "product" | "guide" | "tool" | "comparison";
  priority: number; // 1-10, higher = more important
}

export interface TopicCluster {
  name: string;
  slug: string;
  hubUrl: string;
  hubTitle: string;
  hubAnchor: string;
  spokes: LinkNode[];
}

export interface ContextualLink {
  anchor: string;
  url: string;
  rel?: "nofollow" | "sponsored";
  priority: number;
}

// ============================================================================
// TOPIC CLUSTERS
// ============================================================================

export const TOPIC_CLUSTERS: TopicCluster[] = [
  // EHR & Practice Management - Primary Money Cluster
  {
    name: "EHR & Practice Management",
    slug: "ehr-practice-management",
    hubUrl: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/`,
    hubTitle: "Mental Health EHR Software",
    hubAnchor: "all EHR software",
    spokes: [
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/best-ehr-for-therapists/`,
        title: "Best EHR for Therapists",
        anchor: "best EHR for therapists",
        type: "guide",
        priority: 10,
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/best-ehr-for-psychiatrists/`,
        title: "Best EHR for Psychiatrists",
        anchor: "best EHR for psychiatrists",
        type: "guide",
        priority: 9,
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/best-ehr-for-solo-practice/`,
        title: "Best EHR for Solo Practice",
        anchor: "best solo practice EHR",
        type: "guide",
        priority: 9,
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/best-ehr-for-group-practice/`,
        title: "Best EHR for Group Practice",
        anchor: "best group practice EHR",
        type: "guide",
        priority: 8,
      },
      {
        url: `${SITE_URL}/tools/pricing/therapy-ehr/`,
        title: "Therapy EHR Pricing",
        anchor: "EHR pricing comparison",
        type: "guide",
        priority: 8,
      },
      {
        url: `${SITE_URL}/tools/compare/simplepractice-vs-therapynotes/`,
        title: "SimplePractice vs TherapyNotes",
        anchor: "SimplePractice vs TherapyNotes",
        type: "comparison",
        priority: 9,
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/simplepractice/`,
        title: "SimplePractice",
        anchor: "SimplePractice review",
        type: "product",
        priority: 8,
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/therapynotes/`,
        title: "TherapyNotes",
        anchor: "TherapyNotes review",
        type: "product",
        priority: 8,
      },
      {
        url: `${SITE_URL}/tools/alternatives/simplepractice/`,
        title: "SimplePractice Alternatives",
        anchor: "SimplePractice alternatives",
        type: "guide",
        priority: 7,
      },
    ],
  },

  // AI Documentation - Growing Cluster
  {
    name: "AI Documentation",
    slug: "ai-documentation",
    hubUrl: `${SITE_URL}/tools/for-clinicians/ai-documentation/`,
    hubTitle: "AI Scribes for Mental Health",
    hubAnchor: "all AI scribes",
    spokes: [
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/best-ai-scribe-for-therapists/`,
        title: "Best AI Scribe for Therapists",
        anchor: "best AI scribe for therapists",
        type: "guide",
        priority: 10,
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/guides/best-ai-scribe-for-psychiatrists/`,
        title: "Best AI Scribe for Psychiatrists",
        anchor: "AI scribe for psychiatrists",
        type: "guide",
        priority: 9,
      },
      {
        url: `${SITE_URL}/tools/pricing/ai-scribe/`,
        title: "AI Scribe Pricing",
        anchor: "AI scribe pricing",
        type: "guide",
        priority: 8,
      },
      {
        url: `${SITE_URL}/tools/compare/freed-vs-mentalyc/`,
        title: "Freed vs Mentalyc",
        anchor: "Freed vs Mentalyc",
        type: "comparison",
        priority: 9,
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ai-documentation/freed/`,
        title: "Freed",
        anchor: "Freed review",
        type: "product",
        priority: 8,
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/ai-documentation/mentalyc/`,
        title: "Mentalyc",
        anchor: "Mentalyc review",
        type: "product",
        priority: 8,
      },
    ],
  },

  // Provider Networks
  {
    name: "Provider Networks",
    slug: "provider-networks",
    hubUrl: `${SITE_URL}/tools/for-clinicians/provider-networks/`,
    hubTitle: "Provider Networks & Insurance Panels",
    hubAnchor: "provider networks",
    spokes: [
      {
        url: `${SITE_URL}/tools/compare/alma-vs-headway/`,
        title: "Alma vs Headway",
        anchor: "Alma vs Headway",
        type: "comparison",
        priority: 10,
      },
      {
        url: `${SITE_URL}/tools/alternatives/headway/`,
        title: "Headway Alternatives",
        anchor: "Headway alternatives",
        type: "guide",
        priority: 8,
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/provider-networks/headway/`,
        title: "Headway",
        anchor: "Headway review",
        type: "product",
        priority: 8,
      },
      {
        url: `${SITE_URL}/tools/for-clinicians/provider-networks/alma/`,
        title: "Alma",
        anchor: "Alma review",
        type: "product",
        priority: 8,
      },
    ],
  },

  // Software Stacks
  {
    name: "Software Stacks",
    slug: "software-stacks",
    hubUrl: `${SITE_URL}/tools/stacks/`,
    hubTitle: "Practice Software Stacks",
    hubAnchor: "software stack guides",
    spokes: [
      {
        url: `${SITE_URL}/tools/stacks/therapy-practice/`,
        title: "Therapy Practice Stack",
        anchor: "therapy practice stack",
        type: "guide",
        priority: 8,
      },
      {
        url: `${SITE_URL}/tools/stacks/psychiatry-practice/`,
        title: "Psychiatry Practice Stack",
        anchor: "psychiatry practice stack",
        type: "guide",
        priority: 8,
      },
      {
        url: `${SITE_URL}/tools/stacks/group-practice/`,
        title: "Group Practice Stack",
        anchor: "group practice stack",
        type: "guide",
        priority: 7,
      },
      {
        url: `${SITE_URL}/architect/`,
        title: "Practice Architect",
        anchor: "Practice Architect tool",
        type: "tool",
        priority: 9,
      },
    ],
  },
];

// ============================================================================
// CROSS-CLUSTER RELATIONSHIPS
// ============================================================================

/**
 * Define how clusters relate to each other
 */
const CLUSTER_RELATIONSHIPS: Record<string, string[]> = {
  "ehr-practice-management": ["ai-documentation", "software-stacks", "provider-networks"],
  "ai-documentation": ["ehr-practice-management", "software-stacks"],
  "provider-networks": ["ehr-practice-management"],
  "software-stacks": ["ehr-practice-management", "ai-documentation"],
};

// ============================================================================
// LINK GENERATION
// ============================================================================

/**
 * Get all links that should appear on a hub page
 */
export function getHubLinks(clusterSlug: string): ContextualLink[] {
  const cluster = TOPIC_CLUSTERS.find((c) => c.slug === clusterSlug);
  if (!cluster) return [];

  return cluster.spokes
    .sort((a, b) => b.priority - a.priority)
    .map((spoke) => ({
      anchor: spoke.anchor,
      url: spoke.url,
      priority: spoke.priority,
    }));
}

/**
 * Get links for a spoke page (guide, comparison, product)
 */
export function getSpokeLinks(
  pageUrl: string,
  options: { maxLinks?: number } = {}
): ContextualLink[] {
  const { maxLinks = 8 } = options;
  const links: ContextualLink[] = [];

  // Find which cluster this page belongs to
  let myCluster: TopicCluster | undefined;
  let mySpoke: LinkNode | undefined;

  for (const cluster of TOPIC_CLUSTERS) {
    const spoke = cluster.spokes.find((s) => s.url === pageUrl);
    if (spoke) {
      myCluster = cluster;
      mySpoke = spoke;
      break;
    }
  }

  if (!myCluster) return [];

  // 1. Link back to hub (highest priority)
  links.push({
    anchor: myCluster.hubAnchor,
    url: myCluster.hubUrl,
    priority: 10,
  });

  // 2. Link to sibling spokes (same cluster)
  const siblings = myCluster.spokes
    .filter((s) => s.url !== pageUrl)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);

  for (const sibling of siblings) {
    links.push({
      anchor: sibling.anchor,
      url: sibling.url,
      priority: sibling.priority,
    });
  }

  // 3. Link to related clusters
  const relatedSlugs = CLUSTER_RELATIONSHIPS[myCluster.slug] || [];
  for (const relatedSlug of relatedSlugs.slice(0, 2)) {
    const relatedCluster = TOPIC_CLUSTERS.find((c) => c.slug === relatedSlug);
    if (relatedCluster) {
      links.push({
        anchor: relatedCluster.hubAnchor,
        url: relatedCluster.hubUrl,
        priority: 6,
      });
    }
  }

  return links.sort((a, b) => b.priority - a.priority).slice(0, maxLinks);
}

/**
 * Get contextual links for a product page
 */
export function getProductLinks(
  productSlug: string,
  categorySlug: string
): ContextualLink[] {
  const links: ContextualLink[] = [];

  // Find the cluster
  const cluster = TOPIC_CLUSTERS.find((c) => c.slug === categorySlug);
  if (cluster) {
    // Link to category hub
    links.push({
      anchor: `compare all ${cluster.name.toLowerCase()}`,
      url: cluster.hubUrl,
      priority: 9,
    });

    // Link to relevant guides
    const guides = cluster.spokes
      .filter((s) => s.type === "guide")
      .slice(0, 2);

    for (const guide of guides) {
      links.push({
        anchor: guide.anchor,
        url: guide.url,
        priority: guide.priority,
      });
    }
  }

  // Link to alternatives
  links.push({
    anchor: "see alternatives",
    url: `${SITE_URL}/tools/alternatives/${productSlug}/`,
    priority: 7,
  });

  // Link to pricing
  links.push({
    anchor: "compare pricing",
    url: `${SITE_URL}/tools/pricing/${categorySlug}/`,
    priority: 7,
  });

  return links.sort((a, b) => b.priority - a.priority);
}

// ============================================================================
// AUTO-LINKING
// ============================================================================

/**
 * Build keyword -> URL mapping for auto-linking
 */
export function buildKeywordLinkMap(): Map<string, string> {
  const map = new Map<string, string>();

  for (const cluster of TOPIC_CLUSTERS) {
    // Add cluster hub
    map.set(cluster.name.toLowerCase(), cluster.hubUrl);
    map.set(cluster.hubAnchor.toLowerCase(), cluster.hubUrl);

    // Add spokes
    for (const spoke of cluster.spokes) {
      map.set(spoke.anchor.toLowerCase(), spoke.url);
      map.set(spoke.title.toLowerCase(), spoke.url);
    }
  }

  // Add common product keywords
  const products: Record<string, string> = {
    simplepractice: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/simplepractice/`,
    therapynotes: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/therapynotes/`,
    "therapy notes": `${SITE_URL}/tools/for-clinicians/ehr-practice-management/therapynotes/`,
    "jane app": `${SITE_URL}/tools/for-clinicians/ehr-practice-management/jane-app/`,
    jane: `${SITE_URL}/tools/for-clinicians/ehr-practice-management/jane-app/`,
    freed: `${SITE_URL}/tools/for-clinicians/ai-documentation/freed/`,
    "freed ai": `${SITE_URL}/tools/for-clinicians/ai-documentation/freed/`,
    mentalyc: `${SITE_URL}/tools/for-clinicians/ai-documentation/mentalyc/`,
    upheal: `${SITE_URL}/tools/for-clinicians/ai-documentation/upheal/`,
    headway: `${SITE_URL}/tools/for-clinicians/provider-networks/headway/`,
    alma: `${SITE_URL}/tools/for-clinicians/provider-networks/alma/`,
    "grow therapy": `${SITE_URL}/tools/for-clinicians/provider-networks/grow-therapy/`,
  };

  for (const [keyword, url] of Object.entries(products)) {
    map.set(keyword, url);
  }

  return map;
}

/**
 * Auto-inject internal links into HTML content
 */
export function autoLinkContent(
  html: string,
  options: {
    maxLinksPerKeyword?: number;
    excludeUrls?: string[];
  } = {}
): string {
  const { maxLinksPerKeyword = 1, excludeUrls = [] } = options;

  const linkMap = buildKeywordLinkMap();
  const linkedKeywords = new Set<string>();
  let result = html;

  // Sort keywords by length (longer first) to avoid partial matches
  const keywords = Array.from(linkMap.keys()).sort((a, b) => b.length - a.length);

  for (const keyword of keywords) {
    if (linkedKeywords.size >= 10) break; // Max 10 auto-links per content block

    const url = linkMap.get(keyword);
    if (!url || excludeUrls.includes(url)) continue;
    if (linkedKeywords.has(keyword)) continue;

    // Case-insensitive word boundary match
    const regex = new RegExp(`\\b(${escapeRegex(keyword)})\\b(?![^<]*>)`, "gi");

    let matchCount = 0;
    result = result.replace(regex, (match) => {
      if (matchCount >= maxLinksPerKeyword) return match;
      matchCount++;
      linkedKeywords.add(keyword);
      return `<a href="${url}">${match}</a>`;
    });
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================================
// SITEMAP PRIORITY
// ============================================================================

/**
 * Calculate sitemap priority based on link topology
 */
export function calculatePriority(pageUrl: string): number {
  // Check if it's a hub
  for (const cluster of TOPIC_CLUSTERS) {
    if (cluster.hubUrl === pageUrl) {
      return 0.9; // Hubs are high priority
    }
  }

  // Check if it's a spoke
  for (const cluster of TOPIC_CLUSTERS) {
    const spoke = cluster.spokes.find((s) => s.url === pageUrl);
    if (spoke) {
      // Convert priority 1-10 to 0.5-0.9
      return 0.5 + (spoke.priority / 25);
    }
  }

  return 0.5; // Default
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

/**
 * Generate breadcrumb data for a page
 */
export function generateBreadcrumbs(
  pageUrl: string
): Array<{ name: string; url: string }> {
  const breadcrumbs: Array<{ name: string; url: string }> = [
    { name: "Home", url: SITE_URL },
    { name: "Tools", url: `${SITE_URL}/tools/` },
  ];

  for (const cluster of TOPIC_CLUSTERS) {
    // Check if it's the hub
    if (cluster.hubUrl === pageUrl) {
      breadcrumbs.push({
        name: cluster.hubTitle,
        url: cluster.hubUrl,
      });
      return breadcrumbs;
    }

    // Check if it's a spoke
    const spoke = cluster.spokes.find((s) => s.url === pageUrl);
    if (spoke) {
      breadcrumbs.push({
        name: cluster.hubTitle,
        url: cluster.hubUrl,
      });
      breadcrumbs.push({
        name: spoke.title,
        url: spoke.url,
      });
      return breadcrumbs;
    }
  }

  return breadcrumbs;
}

// ============================================================================
// RELATED CONTENT
// ============================================================================

/**
 * Get related pages for "You might also like" sections
 */
export function getRelatedPages(
  pageUrl: string,
  count: number = 4
): Array<{ title: string; url: string; type: string }> {
  const related: Array<{ title: string; url: string; type: string; priority: number }> = [];

  // Find current page's cluster
  let currentCluster: TopicCluster | undefined;
  let currentSpoke: LinkNode | undefined;

  for (const cluster of TOPIC_CLUSTERS) {
    const spoke = cluster.spokes.find((s) => s.url === pageUrl);
    if (spoke) {
      currentCluster = cluster;
      currentSpoke = spoke;
      break;
    }
  }

  if (!currentCluster) return [];

  // Add siblings from same cluster (different type preferred)
  for (const spoke of currentCluster.spokes) {
    if (spoke.url !== pageUrl) {
      related.push({
        title: spoke.title,
        url: spoke.url,
        type: spoke.type,
        priority: spoke.type !== currentSpoke?.type ? spoke.priority + 2 : spoke.priority,
      });
    }
  }

  // Add top items from related clusters
  const relatedSlugs = CLUSTER_RELATIONSHIPS[currentCluster.slug] || [];
  for (const relatedSlug of relatedSlugs) {
    const relatedCluster = TOPIC_CLUSTERS.find((c) => c.slug === relatedSlug);
    if (relatedCluster) {
      const topSpoke = relatedCluster.spokes[0];
      if (topSpoke) {
        related.push({
          title: topSpoke.title,
          url: topSpoke.url,
          type: topSpoke.type,
          priority: topSpoke.priority - 1,
        });
      }
    }
  }

  return related
    .sort((a, b) => b.priority - a.priority)
    .slice(0, count)
    .map(({ title, url, type }) => ({ title, url, type }));
}

// ============================================================================
// EXPORTS
// ============================================================================

export const InternalLinkNetwork = {
  TOPIC_CLUSTERS,
  getHubLinks,
  getSpokeLinks,
  getProductLinks,
  buildKeywordLinkMap,
  autoLinkContent,
  calculatePriority,
  generateBreadcrumbs,
  getRelatedPages,
};
