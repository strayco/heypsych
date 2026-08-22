/**
 * Tests for Central Indexation Firewall
 * @see src/lib/seo/index-decision-service.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyRouteFamily,
  makeEntityIndexDecision,
  makePathIndexDecision,
  makeGuideIndexDecision,
  getRobotsMetaTag,
  getCanonicalUrl,
  calculateDecisionStats,
  filterEntitiesForSitemap,
  IndexDecisionService,
  registerAnswerKing,
  type IndexDecision,
  type RouteFamily,
} from '@/lib/seo/index-decision-service';
import type { Entity } from '@/lib/types/database';
import { registerSource, clearRegistry } from '@/lib/trust/clinical-source-registry';
import { clearLedger } from '@/lib/trust/medical-claim-ledger';

// ============ TEST SETUP ============

// Clear registries before each test to avoid cross-test pollution
beforeEach(() => {
  clearRegistry();
  clearLedger();

  // Register test sources that match the DOIs in mock entities
  // This ensures claims are validated as "supported" rather than "unsupported"
  registerSource({
    doi: '10.1000/example.2024.001',
    title: 'Test Clinical Study 1',
    year: 2024,
    sourceType: 'peer_reviewed',
    evidenceLevel: 'A',
    topics: ['test', 'medications'],
  });

  registerSource({
    doi: '10.1000/example.2024.002',
    title: 'Test Clinical Study 2',
    year: 2024,
    sourceType: 'peer_reviewed',
    evidenceLevel: 'A',
    topics: ['test', 'medications'],
  });
});

// ============ TEST FIXTURES ============

function createMockEntity(overrides: Partial<Entity> = {}): Entity {
  // Generate enough content to exceed minWordCount (600 for treatments)
  const longContent = `
    This comprehensive treatment overview provides detailed information about the medication's mechanism of action,
    clinical applications, dosing guidelines, and safety considerations. The treatment works by modulating
    neurotransmitter systems in the brain, specifically targeting serotonin reuptake to improve mood regulation
    and reduce anxiety symptoms. Clinical studies have demonstrated significant efficacy in treating major
    depressive disorder and generalized anxiety disorder, with response rates typically ranging from 60 to 70
    percent in controlled trials. The medication is generally well-tolerated, though patients should be aware
    of potential side effects and drug interactions. Healthcare providers should carefully evaluate each patient's
    medical history before prescribing this treatment. Regular monitoring and follow-up appointments are recommended
    to assess treatment response and adjust dosing as needed. Patients should not discontinue the medication
    abruptly without consulting their healthcare provider, as gradual tapering may be necessary to minimize
    discontinuation symptoms. This treatment represents an important option in the psychiatric toolkit for
    managing mood and anxiety disorders.
  `.trim();

  return {
    id: 'test-id-123',
    schema_id: 'treatment',
    name: 'Test Treatment',
    slug: 'test-treatment',
    description: longContent,
    data: {
      summary: 'A comprehensive overview of this psychiatric medication including mechanism, efficacy, and safety.',
      sections: [
        {
          type: 'overview',
          heading: 'Overview',
          content: longContent
        },
        {
          type: 'side_effects',
          heading: 'Side Effects',
          content: `Common side effects include nausea, headache, dizziness, and sleep disturbances. Most side effects
            are mild to moderate and tend to diminish over the first few weeks of treatment. Patients should report
            any persistent or severe side effects to their healthcare provider. Serious but rare side effects may
            include serotonin syndrome, increased bleeding risk, and changes in heart rhythm. Close monitoring is
            recommended during the initial treatment period. Other commonly reported adverse effects include dry mouth,
            constipation, excessive sweating, and sexual dysfunction. Weight changes may occur in some patients, though
            this medication is generally considered weight-neutral compared to other antidepressants. Patients with a
            history of gastrointestinal issues should be monitored closely during the initial phase of treatment.`
        },
        {
          type: 'dosage',
          heading: 'Dosage',
          content: `The recommended starting dose is typically 10mg once daily, which may be increased based on
            clinical response and tolerability. Maximum recommended dose is 20mg per day. Dose adjustments may be
            necessary for elderly patients or those with hepatic impairment. The medication should be taken at the
            same time each day with or without food. For patients with renal impairment, no dosage adjustment is
            typically necessary. However, the starting dose should be conservative in patients over 65 years of age.
            Treatment duration typically extends for at least 6-12 months after symptom remission to prevent relapse.`
        },
        {
          type: 'interactions',
          heading: 'Drug Interactions',
          content: `This medication may interact with MAOIs, other serotonergic drugs, NSAIDs, and anticoagulants.
            Patients should inform their healthcare provider of all medications they are currently taking. Concurrent
            use with triptans may increase the risk of serotonin syndrome. Caution is advised when combining with
            medications that affect hepatic enzyme metabolism. Alcohol consumption should be minimized during treatment.
            St. John's Wort and other herbal supplements may also interact with this medication and should be avoided.`
        },
      ],
      clinical_metadata: {
        mechanism_of_action: 'Selective serotonin reuptake inhibitor (SSRI) that increases serotonin availability in the synaptic cleft',
        primary_indications: ['depression', 'anxiety', 'panic disorder'],
        contraindications: ['MAOI use within 14 days', 'hypersensitivity to the drug'],
      },
    },
    metadata: {
      references: [
        { title: 'Reference 1', doi: '10.1000/example.2024.001' },
        { title: 'Reference 2', doi: '10.1000/example.2024.002' },
      ],
    },
    status: 'active',
    visibility: 'public',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    type: 'treatment',
    ...overrides,
  };
}

// ============ ROUTE CLASSIFICATION TESTS ============

describe('Route Classification', () => {
  it('should classify conditions routes', () => {
    expect(classifyRouteFamily('/conditions/anxiety')).toBe('conditions');
    expect(classifyRouteFamily('/conditions/major-depressive-disorder')).toBe('conditions');
  });

  it('should classify conditions hub as hubs', () => {
    expect(classifyRouteFamily('/conditions')).toBe('hubs');
  });

  it('should classify treatments routes', () => {
    expect(classifyRouteFamily('/treatments/lexapro')).toBe('treatments');
    expect(classifyRouteFamily('/treatments/cognitive-behavioral-therapy')).toBe('treatments');
  });

  it('should classify treatment hubs as hubs', () => {
    expect(classifyRouteFamily('/treatments')).toBe('hubs');
    expect(classifyRouteFamily('/treatments/medications')).toBe('hubs');
    expect(classifyRouteFamily('/treatments/therapy')).toBe('hubs');
  });

  it('should classify resources routes', () => {
    expect(classifyRouteFamily('/resources/some-article')).toBe('resources');
  });

  it('should classify resource hubs as hubs', () => {
    expect(classifyRouteFamily('/resources')).toBe('hubs');
    expect(classifyRouteFamily('/resources/assessments-screeners')).toBe('hubs');
  });

  it('should classify guide routes', () => {
    expect(classifyRouteFamily('/guide/lexapro-for-anxiety')).toBe('guide');
    expect(classifyRouteFamily('/guide/lexapro-vs-zoloft')).toBe('guide');
  });

  it('should classify API routes', () => {
    expect(classifyRouteFamily('/api/search')).toBe('api');
    expect(classifyRouteFamily('/api/conditions/anxiety')).toBe('api');
  });

  it('should classify static routes', () => {
    expect(classifyRouteFamily('/')).toBe('static');
    expect(classifyRouteFamily('/about')).toBe('static');
    expect(classifyRouteFamily('/privacy')).toBe('static');
  });

  it('should classify search route', () => {
    expect(classifyRouteFamily('/search')).toBe('search');
  });

  it('should classify unknown routes', () => {
    expect(classifyRouteFamily('/unknown/path')).toBe('unknown');
  });
});

// ============ ENTITY INDEX DECISION TESTS ============

describe('Entity Index Decisions', () => {
  it('should make indexable decision for quality active entity', () => {
    const entity = createMockEntity();
    const decision = makeEntityIndexDecision(entity, '/treatments/test-treatment');

    expect(decision.indexable).toBe(true);
    expect(decision.sitemapEligible).toBe(true);
    expect(decision.public).toBe(true);
    expect(decision.cohort).toMatch(/indexable_pilot|validated|answer_king/);
  });

  it('should make noindex decision for draft entity', () => {
    const entity = createMockEntity({ status: 'draft' });
    const decision = makeEntityIndexDecision(entity, '/treatments/test-treatment');

    expect(decision.indexable).toBe(false);
    expect(decision.cohort).toBe('retired');
    expect(decision.reasons).toContain("Entity status is 'draft', not 'active'");
  });

  it('should make noindex decision for non-public entity', () => {
    const entity = createMockEntity({ visibility: 'admin' });
    const decision = makeEntityIndexDecision(entity, '/treatments/test-treatment');

    expect(decision.indexable).toBe(false);
    expect(decision.public).toBe(false);
    expect(decision.reasons).toContain("Entity visibility is 'admin', not 'public'");
  });

  it('should make noindex decision when explicit noindex flag is set', () => {
    const entity = createMockEntity({
      seo: { noindex: true },
    });
    const decision = makeEntityIndexDecision(entity, '/treatments/test-treatment');

    expect(decision.indexable).toBe(false);
    expect(decision.cohort).toBe('public_noindex');
    expect(decision.reasons).toContain('Explicit noindex flag set in entity.seo');
  });

  it('should include evidence in decision', () => {
    const entity = createMockEntity();
    const decision = makeEntityIndexDecision(entity, '/treatments/test-treatment');

    expect(decision.evidence).toBeDefined();
    expect(decision.evidence.quality).toBeDefined();
    expect(decision.evidence.freshness).toBeDefined();
    expect(decision.evidence.ymyl).toBeDefined();
    expect(decision.evidence.ymyl.isMedicalContent).toBe(true);
  });
});

// ============ PATH INDEX DECISION TESTS ============

describe('Path Index Decisions', () => {
  it('should make indexable decision for static pages', () => {
    const decision = makePathIndexDecision('/');

    expect(decision.indexable).toBe(true);
    expect(decision.cohort).toBe('validated');
    expect(decision.routeFamily).toBe('static');
  });

  it('should make indexable decision for hub pages', () => {
    const decision = makePathIndexDecision('/conditions');

    expect(decision.indexable).toBe(true);
    expect(decision.cohort).toBe('validated');
    expect(decision.routeFamily).toBe('hubs');
  });

  it('should make noindex decision for API routes', () => {
    const decision = makePathIndexDecision('/api/search');

    expect(decision.indexable).toBe(false);
    expect(decision.crawlable).toBe(false);
    expect(decision.routeFamily).toBe('api');
  });

  it('should make noindex decision for unknown routes', () => {
    const decision = makePathIndexDecision('/unknown/weird/path');

    expect(decision.indexable).toBe(false);
    expect(decision.routeFamily).toBe('unknown');
  });
});

// ============ GUIDE INDEX DECISION TESTS ============

describe('Guide Page Index Decisions', () => {
  it('should make indexable decision for quality guide page', () => {
    const decision = makeGuideIndexDecision('lexapro-for-anxiety', {
      pageType: 'treatment-for-condition',
      wordCount: 800,
      uniquenessScore: 0.85,
      safetyScore: 0.9,
    });

    expect(decision.indexable).toBe(true);
    expect(decision.routeFamily).toBe('guide');
  });

  it('should make noindex decision for thin guide page', () => {
    const decision = makeGuideIndexDecision('some-thin-page', {
      pageType: 'treatment-for-condition',
      wordCount: 200,
      uniquenessScore: 0.85,
      safetyScore: 0.9,
    });

    expect(decision.indexable).toBe(false);
    expect(decision.reasons.some(r => r.includes('Word count'))).toBe(true);
  });

  it('should make noindex decision for low uniqueness guide page', () => {
    const decision = makeGuideIndexDecision('duplicate-page', {
      pageType: 'treatment-for-condition',
      wordCount: 800,
      uniquenessScore: 0.4,
      safetyScore: 0.9,
    });

    expect(decision.indexable).toBe(false);
    expect(decision.reasons.some(r => r.includes('Uniqueness'))).toBe(true);
  });

  it('should make noindex decision for low safety guide page', () => {
    const decision = makeGuideIndexDecision('unsafe-page', {
      pageType: 'treatment-for-condition',
      wordCount: 800,
      uniquenessScore: 0.85,
      safetyScore: 0.5,
    });

    expect(decision.indexable).toBe(false);
    expect(decision.reasons.some(r => r.includes('Safety'))).toBe(true);
  });
});

// ============ ROBOTS META TAG TESTS ============

describe('Robots Meta Tag Generation', () => {
  it('should return index,follow for indexable decisions', () => {
    const decision: IndexDecision = {
      routeFamily: 'treatments',
      canonicalPath: '/treatments/test',
      public: true,
      crawlable: true,
      indexable: true,
      sitemapEligible: true,
      internallyPromotable: true,
      alternateFormatEligible: true,
      cohort: 'validated',
      reasons: [],
      evidence: { quality: {}, demand: {}, authority: {}, freshness: {}, ymyl: {} },
    };

    expect(getRobotsMetaTag(decision)).toBe('index,follow');
  });

  it('should return noindex,follow for noindex decisions', () => {
    const decision: IndexDecision = {
      routeFamily: 'treatments',
      canonicalPath: '/treatments/test',
      public: true,
      crawlable: true,
      indexable: false,
      sitemapEligible: false,
      internallyPromotable: true,
      alternateFormatEligible: false,
      cohort: 'public_noindex',
      reasons: [],
      evidence: { quality: {}, demand: {}, authority: {}, freshness: {}, ymyl: {} },
    };

    expect(getRobotsMetaTag(decision)).toBe('noindex,follow');
  });

  it('should return noindex,nofollow for uncrawlable decisions', () => {
    const decision: IndexDecision = {
      routeFamily: 'api',
      canonicalPath: '/api/test',
      public: true,
      crawlable: false,
      indexable: false,
      sitemapEligible: false,
      internallyPromotable: false,
      alternateFormatEligible: false,
      cohort: 'public_noindex',
      reasons: [],
      evidence: { quality: {}, demand: {}, authority: {}, freshness: {}, ymyl: {} },
    };

    expect(getRobotsMetaTag(decision)).toBe('noindex,nofollow');
  });
});

// ============ CANONICAL URL TESTS ============

describe('Canonical URL Generation', () => {
  it('should return self-canonical for regular pages', () => {
    const decision: IndexDecision = {
      routeFamily: 'treatments',
      canonicalPath: '/treatments/lexapro',
      public: true,
      crawlable: true,
      indexable: true,
      sitemapEligible: true,
      internallyPromotable: true,
      alternateFormatEligible: true,
      cohort: 'validated',
      reasons: [],
      evidence: { quality: {}, demand: {}, authority: {}, freshness: {}, ymyl: {} },
    };

    expect(getCanonicalUrl(decision, 'https://heypsych.com')).toBe('https://heypsych.com/treatments/lexapro');
  });

  it('should return answer king canonical when deferring', () => {
    const decision: IndexDecision = {
      routeFamily: 'guide',
      canonicalPath: '/guide/lexapro-for-anxiety-in-elderly',
      public: true,
      crawlable: true,
      indexable: false,
      sitemapEligible: false,
      internallyPromotable: true,
      alternateFormatEligible: false,
      cohort: 'public_noindex',
      reasons: ['Defers to answer king'],
      evidence: {
        quality: {},
        demand: {},
        authority: { defersToCanonicale: '/guide/lexapro-for-anxiety' },
        freshness: {},
        ymyl: {},
      },
    };

    expect(getCanonicalUrl(decision, 'https://heypsych.com')).toBe('https://heypsych.com/guide/lexapro-for-anxiety');
  });
});

// ============ STATISTICS TESTS ============

describe('Decision Statistics', () => {
  it('should calculate correct statistics', () => {
    const decisions: IndexDecision[] = [
      {
        routeFamily: 'treatments',
        canonicalPath: '/treatments/a',
        public: true,
        crawlable: true,
        indexable: true,
        sitemapEligible: true,
        internallyPromotable: true,
        alternateFormatEligible: true,
        cohort: 'validated',
        reasons: ['All gates passed'],
        evidence: { quality: {}, demand: {}, authority: {}, freshness: {}, ymyl: {} },
      },
      {
        routeFamily: 'treatments',
        canonicalPath: '/treatments/b',
        public: true,
        crawlable: true,
        indexable: false,
        sitemapEligible: false,
        internallyPromotable: true,
        alternateFormatEligible: false,
        cohort: 'public_noindex',
        reasons: ['Word count too low'],
        evidence: { quality: {}, demand: {}, authority: {}, freshness: {}, ymyl: {} },
      },
      {
        routeFamily: 'conditions',
        canonicalPath: '/conditions/c',
        public: true,
        crawlable: true,
        indexable: true,
        sitemapEligible: true,
        internallyPromotable: true,
        alternateFormatEligible: true,
        cohort: 'answer_king',
        reasons: ['Answer king'],
        evidence: { quality: {}, demand: {}, authority: {}, freshness: {}, ymyl: {} },
      },
    ];

    const stats = calculateDecisionStats(decisions);

    expect(stats.total).toBe(3);
    expect(stats.indexable).toBe(2);
    expect(stats.noindex).toBe(1);
    expect(stats.sitemapEligible).toBe(2);
    expect(stats.byCohort.validated).toBe(1);
    expect(stats.byCohort.public_noindex).toBe(1);
    expect(stats.byCohort.answer_king).toBe(1);
    expect(stats.byRouteFamily.treatments).toBe(2);
    expect(stats.byRouteFamily.conditions).toBe(1);
  });
});

// ============ SERVICE CACHING TESTS ============

describe('IndexDecisionService Caching', () => {
  let service: IndexDecisionService;

  beforeEach(() => {
    service = new IndexDecisionService();
  });

  it('should cache entity decisions', () => {
    const entity = createMockEntity();

    const decision1 = service.getEntityDecision(entity);
    const decision2 = service.getEntityDecision(entity);

    // Should return same decision object
    expect(decision1).toBe(decision2);
  });

  it('should cache path decisions', () => {
    const decision1 = service.getPathDecision('/conditions');
    const decision2 = service.getPathDecision('/conditions');

    expect(decision1).toBe(decision2);
  });

  it('should clear cache', () => {
    const entity = createMockEntity();
    service.getEntityDecision(entity);

    expect(service.getCacheStats().size).toBeGreaterThan(0);

    service.clearCache();

    expect(service.getCacheStats().size).toBe(0);
  });
});

// ============ SITEMAP FILTERING TESTS ============

describe('Sitemap Filtering', () => {
  it('should filter out non-eligible entities', () => {
    const entities: Entity[] = [
      createMockEntity({ slug: 'good-entity' }),
      createMockEntity({ slug: 'draft-entity', status: 'draft' }),
      createMockEntity({ slug: 'admin-entity', visibility: 'admin' }),
    ];

    const filtered = filterEntitiesForSitemap(entities, 'treatments');

    expect(filtered.length).toBe(1);
    expect(filtered[0].entity.slug).toBe('good-entity');
  });
});
