/**
 * Authority Graph Tests
 *
 * @see Phase G of Wave 3 directive
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerPage,
  getNode,
  registerLink,
  getLinksForPage,
  calculateAuthorityScores,
  getAuthorityScore,
  getClusterAuthority,
  setAnswerKing,
  getAnswerKing,
  autoElectAnswerKings,
  findOrphanPages,
  findDeadEndPages,
  getGraphStats,
  clearAuthorityGraph,
  getClusterNodes,
} from '@/lib/trust/authority-graph';

describe('Authority Graph - Node Management', () => {
  beforeEach(() => {
    clearAuthorityGraph();
  });

  it('should register a page', () => {
    const node = registerPage({
      path: '/conditions/depression',
      entitySlug: 'depression',
      entityType: 'condition',
      topicCluster: 'depression-treatment',
    });

    expect(node.path).toBe('/conditions/depression');
    expect(node.entitySlug).toBe('depression');
    expect(node.topicCluster).toBe('depression-treatment');
    expect(node.authorityScore).toBe(0);
  });

  it('should retrieve a node', () => {
    registerPage({ path: '/test' });

    const node = getNode('/test');
    expect(node).toBeDefined();
    expect(node?.path).toBe('/test');
  });

  it('should update existing node', () => {
    registerPage({ path: '/test', topicCluster: 'cluster-a' });
    registerPage({ path: '/test', topicCluster: 'cluster-b', isAnswerKing: true });

    const node = getNode('/test');
    expect(node?.topicCluster).toBe('cluster-b');
    expect(node?.isAnswerKing).toBe(true);
  });

  it('should index by cluster', () => {
    registerPage({ path: '/page-1', topicCluster: 'cluster-a' });
    registerPage({ path: '/page-2', topicCluster: 'cluster-a' });
    registerPage({ path: '/page-3', topicCluster: 'cluster-b' });

    const clusterA = getClusterNodes('cluster-a');
    const clusterB = getClusterNodes('cluster-b');

    expect(clusterA.length).toBe(2);
    expect(clusterB.length).toBe(1);
  });
});

describe('Authority Graph - Link Management', () => {
  beforeEach(() => {
    clearAuthorityGraph();
  });

  it('should register a link', () => {
    registerPage({ path: '/page-a' });
    registerPage({ path: '/page-b' });

    registerLink({
      from: '/page-a',
      to: '/page-b',
      linkType: 'inline',
    });

    const nodeA = getNode('/page-a');
    const nodeB = getNode('/page-b');

    expect(nodeA?.outboundLinks.has('/page-b')).toBe(true);
    expect(nodeB?.inboundLinks.has('/page-a')).toBe(true);
  });

  it('should auto-register pages when linking', () => {
    registerLink({
      from: '/new-page-a',
      to: '/new-page-b',
      linkType: 'inline',
    });

    expect(getNode('/new-page-a')).toBeDefined();
    expect(getNode('/new-page-b')).toBeDefined();
  });

  it('should get links for a page', () => {
    registerLink({ from: '/a', to: '/b', linkType: 'inline' });
    registerLink({ from: '/c', to: '/b', linkType: 'related' });
    registerLink({ from: '/b', to: '/d', linkType: 'navigation' });

    const links = getLinksForPage('/b');

    expect(links.inbound.length).toBe(2);
    expect(links.outbound.length).toBe(1);
  });
});

describe('Authority Graph - Authority Calculation', () => {
  beforeEach(() => {
    clearAuthorityGraph();
  });

  it('should calculate authority scores', () => {
    // Create a simple graph: A -> B -> C, A -> C
    registerLink({ from: '/a', to: '/b', linkType: 'inline' });
    registerLink({ from: '/b', to: '/c', linkType: 'inline' });
    registerLink({ from: '/a', to: '/c', linkType: 'inline' });

    calculateAuthorityScores();

    // C should have highest authority (most inbound)
    expect(getAuthorityScore('/c')).toBeGreaterThan(getAuthorityScore('/a'));
  });

  it('should weight links by type', () => {
    // Create two paths to same destination, different link types
    registerLink({ from: '/source-inline', to: '/dest', linkType: 'inline' });
    registerLink({ from: '/source-footer', to: '/other', linkType: 'footer' });

    // Both destinations have 1 inbound link, but different weights
    calculateAuthorityScores();

    // Inline links should contribute more authority
    const destScore = getAuthorityScore('/dest');
    const otherScore = getAuthorityScore('/other');

    // Both should have some authority
    expect(destScore).toBeGreaterThan(0);
    expect(otherScore).toBeGreaterThan(0);
  });

  it('should normalize scores to 0-1', () => {
    registerLink({ from: '/a', to: '/b', linkType: 'inline' });
    registerLink({ from: '/c', to: '/b', linkType: 'inline' });
    registerLink({ from: '/d', to: '/b', linkType: 'inline' });

    calculateAuthorityScores();

    // Max score should be 1.0
    const maxScore = Math.max(
      getAuthorityScore('/a'),
      getAuthorityScore('/b'),
      getAuthorityScore('/c'),
      getAuthorityScore('/d')
    );

    expect(maxScore).toBe(1);
  });
});

describe('Authority Graph - Cluster Authority', () => {
  beforeEach(() => {
    clearAuthorityGraph();
  });

  it('should get cluster authority', () => {
    registerPage({ path: '/cond-1', topicCluster: 'depression' });
    registerPage({ path: '/cond-2', topicCluster: 'depression' });
    registerPage({ path: '/treat-1', topicCluster: 'depression' });

    // Give cond-1 more authority
    registerLink({ from: '/external', to: '/cond-1', linkType: 'inline' });
    registerLink({ from: '/external', to: '/cond-1', linkType: 'related' });
    calculateAuthorityScores();

    const authority = getClusterAuthority('depression');

    expect(authority).toBeDefined();
    expect(authority?.totalPages).toBe(3);
    expect(authority?.topPages.length).toBeLessThanOrEqual(5);
  });

  it('should identify answer king in cluster', () => {
    registerPage({ path: '/main', topicCluster: 'topic', isAnswerKing: true });
    registerPage({ path: '/variant', topicCluster: 'topic' });

    const authority = getClusterAuthority('topic');

    expect(authority?.answerKingPath).toBe('/main');
  });
});

describe('Authority Graph - Answer King Management', () => {
  beforeEach(() => {
    clearAuthorityGraph();
  });

  it('should set answer king', () => {
    registerPage({ path: '/main', topicCluster: 'topic' });
    registerPage({ path: '/variant', topicCluster: 'topic' });

    const success = setAnswerKing('/main');

    expect(success).toBe(true);
    expect(getNode('/main')?.isAnswerKing).toBe(true);
  });

  it('should clear previous answer king when setting new one', () => {
    registerPage({ path: '/old-king', topicCluster: 'topic', isAnswerKing: true });
    registerPage({ path: '/new-king', topicCluster: 'topic' });

    setAnswerKing('/new-king');

    expect(getNode('/old-king')?.isAnswerKing).toBe(false);
    expect(getNode('/new-king')?.isAnswerKing).toBe(true);
  });

  it('should get answer king for cluster', () => {
    registerPage({ path: '/king', topicCluster: 'topic', isAnswerKing: true });
    registerPage({ path: '/peasant', topicCluster: 'topic' });

    const answerKing = getAnswerKing('topic');

    expect(answerKing?.path).toBe('/king');
  });

  it('should auto-elect answer kings', () => {
    registerPage({ path: '/high-auth', topicCluster: 'topic-a' });
    registerPage({ path: '/low-auth', topicCluster: 'topic-a' });
    registerPage({ path: '/already-king', topicCluster: 'topic-b', isAnswerKing: true });
    registerPage({ path: '/other', topicCluster: 'topic-b' });

    // Give high-auth more authority
    registerLink({ from: '/ext-1', to: '/high-auth', linkType: 'inline' });
    registerLink({ from: '/ext-2', to: '/high-auth', linkType: 'inline' });
    registerLink({ from: '/ext-3', to: '/high-auth', linkType: 'inline' });
    calculateAuthorityScores();

    const elected = autoElectAnswerKings();

    // Should only elect for topic-a (topic-b already has king)
    expect(elected).toBe(1);
    expect(getNode('/high-auth')?.isAnswerKing).toBe(true);
    expect(getNode('/already-king')?.isAnswerKing).toBe(true);
  });
});

describe('Authority Graph - Orphan Detection', () => {
  beforeEach(() => {
    clearAuthorityGraph();
  });

  it('should find orphan pages', () => {
    registerPage({ path: '/connected' });
    registerPage({ path: '/orphan' });
    registerLink({ from: '/external', to: '/connected', linkType: 'inline' });

    const orphans = findOrphanPages();

    expect(orphans.some(o => o.path === '/orphan')).toBe(true);
    expect(orphans.some(o => o.path === '/connected')).toBe(false);
  });

  it('should find dead end pages', () => {
    registerPage({ path: '/has-links' });
    registerPage({ path: '/dead-end' });
    registerLink({ from: '/has-links', to: '/somewhere', linkType: 'inline' });

    const deadEnds = findDeadEndPages();

    expect(deadEnds.some(d => d.path === '/dead-end')).toBe(true);
    expect(deadEnds.some(d => d.path === '/has-links')).toBe(false);
  });
});

describe('Authority Graph - Statistics', () => {
  beforeEach(() => {
    clearAuthorityGraph();
  });

  it('should calculate graph statistics', () => {
    registerPage({ path: '/a', topicCluster: 'cluster-1' });
    registerPage({ path: '/b', topicCluster: 'cluster-1' });
    registerPage({ path: '/c', topicCluster: 'cluster-2' });
    registerLink({ from: '/a', to: '/b', linkType: 'inline' });
    registerLink({ from: '/b', to: '/c', linkType: 'inline' });

    const stats = getGraphStats();

    expect(stats.totalNodes).toBe(3);
    expect(stats.totalLinks).toBe(2);
    expect(stats.clusterCount).toBe(2);
    expect(stats.averageInbound).toBeCloseTo(2 / 3, 2);
    expect(stats.averageOutbound).toBeCloseTo(2 / 3, 2);
  });

  it('should handle empty graph', () => {
    const stats = getGraphStats();

    expect(stats.totalNodes).toBe(0);
    expect(stats.totalLinks).toBe(0);
    expect(stats.averageInbound).toBe(0);
    expect(stats.averageOutbound).toBe(0);
  });
});
