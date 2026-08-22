/**
 * Internal Authority Graph
 *
 * Tracks internal link relationships between pages to identify
 * the most authoritative pages for each topic cluster.
 *
 * Uses a PageRank-inspired algorithm to calculate authority scores.
 *
 * @see Phase G of Wave 3 directive
 */

// ============ TYPES ============

/**
 * A node in the authority graph (represents a page)
 */
export interface AuthorityNode {
  path: string;
  entitySlug?: string;
  entityType?: string;
  topicCluster?: string;

  /** Pages that link TO this page (inbound) */
  inboundLinks: Set<string>;

  /** Pages this page links TO (outbound) */
  outboundLinks: Set<string>;

  /** Calculated authority score (0-1) */
  authorityScore: number;

  /** Is this page an answer king for its cluster? */
  isAnswerKing: boolean;

  /** Last time links were updated */
  lastUpdated: string;
}

/**
 * A link between two pages
 */
export interface AuthorityLink {
  from: string;
  to: string;
  linkType: 'navigation' | 'inline' | 'related' | 'breadcrumb' | 'footer';
  anchorText?: string;
  context?: string;
  weight: number;
}

/**
 * Topic cluster authority summary
 */
export interface ClusterAuthority {
  clusterId: string;
  answerKingPath?: string;
  topPages: Array<{ path: string; score: number }>;
  totalPages: number;
  averageAuthority: number;
}

/**
 * Graph statistics
 */
export interface GraphStats {
  totalNodes: number;
  totalLinks: number;
  averageInbound: number;
  averageOutbound: number;
  orphanPages: number;
  clusterCount: number;
}

// ============ GRAPH STATE ============

/** The authority graph */
const authorityGraph = new Map<string, AuthorityNode>();

/** Index by topic cluster */
const clusterIndex = new Map<string, Set<string>>();

/** Link registry for detailed link tracking */
const linkRegistry: AuthorityLink[] = [];

// ============ NODE MANAGEMENT ============

/**
 * Register a page in the authority graph
 */
export function registerPage(config: {
  path: string;
  entitySlug?: string;
  entityType?: string;
  topicCluster?: string;
  isAnswerKing?: boolean;
}): AuthorityNode {
  const existingNode = authorityGraph.get(config.path);
  if (existingNode) {
    // Update existing node
    if (config.topicCluster) {
      existingNode.topicCluster = config.topicCluster;
    }
    if (config.isAnswerKing !== undefined) {
      existingNode.isAnswerKing = config.isAnswerKing;
    }
    existingNode.lastUpdated = new Date().toISOString();
    return existingNode;
  }

  const node: AuthorityNode = {
    path: config.path,
    entitySlug: config.entitySlug,
    entityType: config.entityType,
    topicCluster: config.topicCluster,
    inboundLinks: new Set(),
    outboundLinks: new Set(),
    authorityScore: 0,
    isAnswerKing: config.isAnswerKing || false,
    lastUpdated: new Date().toISOString(),
  };

  authorityGraph.set(config.path, node);

  // Add to cluster index
  if (config.topicCluster) {
    if (!clusterIndex.has(config.topicCluster)) {
      clusterIndex.set(config.topicCluster, new Set());
    }
    clusterIndex.get(config.topicCluster)!.add(config.path);
  }

  return node;
}

/**
 * Get a node from the graph
 */
export function getNode(path: string): AuthorityNode | undefined {
  return authorityGraph.get(path);
}

/**
 * Get all nodes in a topic cluster
 */
export function getClusterNodes(clusterId: string): AuthorityNode[] {
  const paths = clusterIndex.get(clusterId);
  if (!paths) return [];

  return Array.from(paths)
    .map(path => authorityGraph.get(path))
    .filter((node): node is AuthorityNode => node !== undefined);
}

// ============ LINK MANAGEMENT ============

/**
 * Register a link between two pages
 */
export function registerLink(link: Omit<AuthorityLink, 'weight'>): void {
  // Ensure both pages exist in graph
  if (!authorityGraph.has(link.from)) {
    registerPage({ path: link.from });
  }
  if (!authorityGraph.has(link.to)) {
    registerPage({ path: link.to });
  }

  const fromNode = authorityGraph.get(link.from)!;
  const toNode = authorityGraph.get(link.to)!;

  // Add link relationships
  fromNode.outboundLinks.add(link.to);
  toNode.inboundLinks.add(link.from);

  // Calculate link weight based on type
  const weight = calculateLinkWeight(link.linkType);

  // Register in link registry
  linkRegistry.push({
    ...link,
    weight,
  });
}

/**
 * Calculate link weight based on type
 */
function calculateLinkWeight(linkType: AuthorityLink['linkType']): number {
  switch (linkType) {
    case 'inline':
      return 1.0;      // In-content links are most valuable
    case 'related':
      return 0.8;      // Related links are highly relevant
    case 'navigation':
      return 0.5;      // Navigation links are structural
    case 'breadcrumb':
      return 0.3;      // Breadcrumbs are hierarchical
    case 'footer':
      return 0.2;      // Footer links are site-wide
    default:
      return 0.5;
  }
}

/**
 * Get all links for a page
 */
export function getLinksForPage(path: string): {
  inbound: AuthorityLink[];
  outbound: AuthorityLink[];
} {
  return {
    inbound: linkRegistry.filter(l => l.to === path),
    outbound: linkRegistry.filter(l => l.from === path),
  };
}

// ============ AUTHORITY CALCULATION ============

/**
 * Calculate authority scores using PageRank-inspired algorithm
 */
export function calculateAuthorityScores(iterations: number = 20): void {
  const dampingFactor = 0.85;
  const nodes = Array.from(authorityGraph.values());
  const nodeCount = nodes.length;

  if (nodeCount === 0) return;

  // Initialize scores
  const initialScore = 1 / nodeCount;
  for (const node of nodes) {
    node.authorityScore = initialScore;
  }

  // Iterate
  for (let i = 0; i < iterations; i++) {
    const newScores = new Map<string, number>();

    for (const node of nodes) {
      let score = (1 - dampingFactor) / nodeCount;

      // Add contribution from inbound links
      for (const inboundPath of node.inboundLinks) {
        const inboundNode = authorityGraph.get(inboundPath);
        if (inboundNode && inboundNode.outboundLinks.size > 0) {
          // Weight by link type if available
          const link = linkRegistry.find(
            l => l.from === inboundPath && l.to === node.path
          );
          const weight = link?.weight || 0.5;

          score +=
            dampingFactor *
            (inboundNode.authorityScore / inboundNode.outboundLinks.size) *
            weight;
        }
      }

      newScores.set(node.path, score);
    }

    // Update scores
    for (const [path, score] of newScores) {
      const node = authorityGraph.get(path);
      if (node) {
        node.authorityScore = score;
      }
    }
  }

  // Normalize scores to 0-1 range
  const maxScore = Math.max(...nodes.map(n => n.authorityScore));
  if (maxScore > 0) {
    for (const node of nodes) {
      node.authorityScore = node.authorityScore / maxScore;
    }
  }
}

/**
 * Get the authority score for a page
 */
export function getAuthorityScore(path: string): number {
  return authorityGraph.get(path)?.authorityScore || 0;
}

/**
 * Get the most authoritative page in a topic cluster
 */
export function getClusterAuthority(clusterId: string): ClusterAuthority | undefined {
  const nodes = getClusterNodes(clusterId);
  if (nodes.length === 0) return undefined;

  // Sort by authority score
  const sorted = [...nodes].sort((a, b) => b.authorityScore - a.authorityScore);

  // Find answer king (explicit or highest authority)
  const answerKing = sorted.find(n => n.isAnswerKing) || sorted[0];

  return {
    clusterId,
    answerKingPath: answerKing.path,
    topPages: sorted.slice(0, 5).map(n => ({
      path: n.path,
      score: n.authorityScore,
    })),
    totalPages: nodes.length,
    averageAuthority: nodes.reduce((sum, n) => sum + n.authorityScore, 0) / nodes.length,
  };
}

// ============ ANSWER KING MANAGEMENT ============

/**
 * Set a page as the answer king for its cluster
 */
export function setAnswerKing(path: string): boolean {
  const node = authorityGraph.get(path);
  if (!node || !node.topicCluster) return false;

  // Clear existing answer king in cluster
  const clusterPaths = clusterIndex.get(node.topicCluster);
  if (clusterPaths) {
    for (const clusterPath of clusterPaths) {
      const clusterNode = authorityGraph.get(clusterPath);
      if (clusterNode) {
        clusterNode.isAnswerKing = false;
      }
    }
  }

  // Set new answer king
  node.isAnswerKing = true;
  return true;
}

/**
 * Get the answer king for a topic cluster
 */
export function getAnswerKing(clusterId: string): AuthorityNode | undefined {
  const nodes = getClusterNodes(clusterId);
  return nodes.find(n => n.isAnswerKing);
}

/**
 * Auto-elect answer kings based on authority scores
 */
export function autoElectAnswerKings(): number {
  let elected = 0;

  for (const clusterId of clusterIndex.keys()) {
    const nodes = getClusterNodes(clusterId);

    // Skip if already has answer king
    if (nodes.some(n => n.isAnswerKing)) continue;

    // Find highest authority page
    const sorted = [...nodes].sort((a, b) => b.authorityScore - a.authorityScore);
    if (sorted.length > 0 && sorted[0].authorityScore > 0.5) {
      sorted[0].isAnswerKing = true;
      elected++;
    }
  }

  return elected;
}

// ============ ORPHAN DETECTION ============

/**
 * Find pages with no inbound links (orphan pages)
 */
export function findOrphanPages(): AuthorityNode[] {
  return Array.from(authorityGraph.values()).filter(
    node => node.inboundLinks.size === 0
  );
}

/**
 * Find pages with no outbound links (dead ends)
 */
export function findDeadEndPages(): AuthorityNode[] {
  return Array.from(authorityGraph.values()).filter(
    node => node.outboundLinks.size === 0
  );
}

// ============ STATISTICS ============

/**
 * Get graph statistics
 */
export function getGraphStats(): GraphStats {
  const nodes = Array.from(authorityGraph.values());
  const totalNodes = nodes.length;

  if (totalNodes === 0) {
    return {
      totalNodes: 0,
      totalLinks: 0,
      averageInbound: 0,
      averageOutbound: 0,
      orphanPages: 0,
      clusterCount: 0,
    };
  }

  const totalInbound = nodes.reduce((sum, n) => sum + n.inboundLinks.size, 0);
  const totalOutbound = nodes.reduce((sum, n) => sum + n.outboundLinks.size, 0);

  return {
    totalNodes,
    totalLinks: linkRegistry.length,
    averageInbound: totalInbound / totalNodes,
    averageOutbound: totalOutbound / totalNodes,
    orphanPages: findOrphanPages().length,
    clusterCount: clusterIndex.size,
  };
}

// ============ UTILITY ============

/**
 * Clear the authority graph (for testing)
 */
export function clearAuthorityGraph(): void {
  authorityGraph.clear();
  clusterIndex.clear();
  linkRegistry.length = 0;
}

/**
 * Export all nodes (for debugging/analysis)
 */
export function exportGraph(): AuthorityNode[] {
  return Array.from(authorityGraph.values());
}

// Types are exported inline above
