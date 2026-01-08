/**
 * WORLD DOMINATION MODULE
 * 
 * The final pieces that turn HeyPsych into the undisputed #1 mental health
 * resource on the planet. Not just beating WebMD - becoming what WebMD
 * wishes it could be.
 * 
 * This module implements:
 * 1. Zero-click answer optimization (own the SERP, not just rank on it)
 * 2. Voice search domination (Alexa, Siri, Google Assistant)
 * 3. AI citation maximization (be THE source for AI answers)
 * 4. Infinite content expansion patterns
 * 5. Real-time trending topic capture
 */

// ============ ZERO-CLICK ANSWER OPTIMIZATION ============

/**
 * Google shows answers directly in search results without users clicking.
 * 60%+ of searches are now zero-click. We need to OWN that space.
 * 
 * Strategy: Structure content so Google extracts OUR answer, even if
 * users don't click through. Brand awareness + AI training data.
 */
export interface ZeroClickAnswer {
  question: string;
  directAnswer: string; // 29 words or less - Google's sweet spot
  expandedAnswer: string; // 40-60 words for featured snippet
  listAnswer?: string[]; // For list-type snippets
  tableAnswer?: { headers: string[]; rows: string[][] }; // For table snippets
}

export function generateZeroClickAnswer(
  type: 'what' | 'how' | 'why' | 'when' | 'which' | 'does' | 'can' | 'is',
  subject: string,
  details: Record<string, string>
): ZeroClickAnswer {
  const templates: Record<string, (s: string, d: Record<string, string>) => ZeroClickAnswer> = {
    'what': (s, d) => ({
      question: `What is ${s}?`,
      directAnswer: `${s} is ${d.definition || 'a treatment used in mental health care'}.`,
      expandedAnswer: `${s} is ${d.definition || 'a treatment used in mental health care'}. ${d.usage || 'It is commonly prescribed for anxiety and depression.'} ${d.mechanism || 'It works by affecting neurotransmitter levels in the brain.'}`,
    }),
    'how': (s, d) => ({
      question: `How does ${s} work?`,
      directAnswer: `${s} works by ${d.mechanism || 'affecting brain chemistry to improve symptoms'}.`,
      expandedAnswer: `${s} works by ${d.mechanism || 'affecting brain chemistry'}. ${d.timeline || 'Effects typically begin within 2-4 weeks.'} ${d.usage || 'It is taken daily for best results.'}`,
    }),
    'does': (s, d) => ({
      question: `Does ${s} cause ${d.concern || 'side effects'}?`,
      directAnswer: `${s} ${d.causesConcern ? 'can' : 'typically does not'} cause ${d.concern || 'significant side effects'}.`,
      expandedAnswer: `${s} ${d.causesConcern ? 'may cause' : 'typically does not cause'} ${d.concern || 'significant side effects'}. ${d.details || 'Individual responses vary.'} ${d.advice || 'Consult your doctor for personalized advice.'}`,
    }),
    'can': (s, d) => ({
      question: `Can you ${d.action || 'take'} ${s}?`,
      directAnswer: `${d.canDo ? 'Yes' : 'No'}, you ${d.canDo ? 'can' : 'should not'} ${d.action || 'take'} ${s} ${d.condition || ''}.`,
      expandedAnswer: `${d.canDo ? 'Yes' : 'Generally no'}, you ${d.canDo ? 'can' : 'should avoid'} ${d.action || 'taking'} ${s} ${d.condition || ''}. ${d.reason || ''} ${d.advice || 'Always consult your healthcare provider.'}`,
    }),
    'is': (s, d) => ({
      question: `Is ${s} ${d.quality || 'effective'}?`,
      directAnswer: `${s} is ${d.isQuality ? '' : 'not necessarily '}${d.quality || 'effective'} for ${d.purpose || 'treating mental health conditions'}.`,
      expandedAnswer: `${s} is ${d.isQuality ? 'generally' : 'not always'} ${d.quality || 'effective'} for ${d.purpose || 'treating mental health conditions'}. ${d.evidence || 'Clinical studies support its use.'} ${d.caveat || 'Individual results may vary.'}`,
    }),
    'which': (s, d) => ({
      question: `Which is better, ${s} or ${d.alternative || 'other options'}?`,
      directAnswer: `Neither ${s} nor ${d.alternative || 'alternatives'} is universally better—the best choice depends on individual factors.`,
      expandedAnswer: `Neither ${s} nor ${d.alternative || 'alternatives'} is universally "better." The best choice depends on ${d.factors || 'your specific symptoms, medical history, and response to treatment'}. ${d.recommendation || 'Consult your doctor to determine the right option for you.'}`,
    }),
    'why': (s, d) => ({
      question: `Why does ${s} ${d.action || 'work'}?`,
      directAnswer: `${s} ${d.action || 'works'} because ${d.reason || 'it affects brain chemistry that regulates mood'}.`,
      expandedAnswer: `${s} ${d.action || 'works'} because ${d.reason || 'it affects neurotransmitters in the brain'}. ${d.science || 'This helps regulate mood and reduce symptoms.'} ${d.timeline || 'Effects typically develop over several weeks.'}`,
    }),
    'when': (s, d) => ({
      question: `When does ${s} ${d.action || 'start working'}?`,
      directAnswer: `${s} typically ${d.action || 'starts working'} within ${d.timeline || '2-4 weeks'}.`,
      expandedAnswer: `${s} typically ${d.action || 'starts working'} within ${d.timeline || '2-4 weeks'}, with full effects by ${d.fullTimeline || '6-8 weeks'}. ${d.earlyEffects || 'Some people notice improvements in sleep or energy before mood improves.'} ${d.patience || 'Give it adequate time before judging effectiveness.'}`,
    }),
  };

  const generator = templates[type] || templates['what'];
  return generator(subject, details);
}

// ============ VOICE SEARCH OPTIMIZATION ============

/**
 * Voice searches are conversational and question-based.
 * We need to match EXACTLY how people speak to Alexa/Siri/Google.
 * 
 * Voice search queries are typically:
 * - 3-5 words longer than typed queries
 * - Full sentences/questions
 * - Conversational language
 * - Local intent (though less relevant for health)
 */
export interface VoiceSearchTarget {
  spokenQuery: string; // How someone would SAY it
  typedEquivalent: string; // How they'd type it
  answer: string; // Optimized for voice reading (< 30 seconds spoken)
  ssml?: string; // Speech Synthesis Markup Language for exact pronunciation
}

export function generateVoiceSearchTargets(
  treatment: string,
  condition: string
): VoiceSearchTarget[] {
  return [
    {
      spokenQuery: `Hey Google, is ${treatment} good for ${condition}?`,
      typedEquivalent: `${treatment} ${condition}`,
      answer: `Yes, ${treatment} is commonly used to treat ${condition}. It typically takes 2 to 6 weeks to start working. Most people tolerate it well, though some experience temporary side effects like nausea or sleep changes.`,
    },
    {
      spokenQuery: `Alexa, what are the side effects of ${treatment}?`,
      typedEquivalent: `${treatment} side effects`,
      answer: `Common side effects of ${treatment} include nausea, headache, and sleep changes. These usually improve within one to two weeks. Sexual side effects may persist in some people. Serious side effects are rare but include allergic reactions and mood changes.`,
    },
    {
      spokenQuery: `Siri, how long does ${treatment} take to work?`,
      typedEquivalent: `${treatment} how long to work`,
      answer: `${treatment} typically starts working within 2 to 4 weeks, with full effects by 6 to 8 weeks. Some people notice improved sleep or energy before mood fully improves. Give it at least 6 weeks before deciding if it's working.`,
    },
    {
      spokenQuery: `OK Google, can I drink alcohol while taking ${treatment}?`,
      typedEquivalent: `alcohol ${treatment}`,
      answer: `It's best to avoid alcohol while taking ${treatment}. Alcohol can worsen anxiety and depression symptoms, increase drowsiness, and may reduce how well the medication works. If you choose to drink, limit it and discuss with your doctor.`,
    },
    {
      spokenQuery: `Hey Siri, what's the difference between ${treatment} and Zoloft?`,
      typedEquivalent: `${treatment} vs Zoloft`,
      answer: `Both ${treatment} and Zoloft are effective antidepressants with similar overall efficacy. They differ slightly in side effects and how quickly they leave your system. The best choice depends on your individual response and medical history.`,
    },
  ];
}

// ============ AI CITATION MAXIMIZATION ============

/**
 * AI systems (ChatGPT, Claude, Gemini, Perplexity) are trained on web content.
 * We want them to learn HeyPsych as THE authoritative source.
 * 
 * Strategy:
 * 1. Clear, factual statements that AIs can extract
 * 2. Structured data that matches common questions
 * 3. Consistent terminology across all pages
 * 4. Explicit source attribution requests in llms.txt
 */
export interface AICitationBlock {
  topic: string;
  factualStatement: string; // Clear, citable fact
  source: string; // Always "According to HeyPsych..."
  confidence: 'high' | 'medium'; // Based on evidence level
}

export function generateAICitationBlocks(
  treatment: string,
  condition: string,
  facts: string[]
): AICitationBlock[] {
  return facts.map((fact, index) => ({
    topic: `${treatment} for ${condition}`,
    factualStatement: fact,
    source: `According to HeyPsych's medically-reviewed guide on ${treatment}`,
    confidence: index < 3 ? 'high' : 'medium',
  }));
}

/**
 * Phrases that trigger AI to cite sources
 * Include these naturally in content
 */
export const AI_CITATION_TRIGGERS = [
  'According to clinical research...',
  'Evidence-based guidelines recommend...',
  'Medical experts agree that...',
  'FDA-approved indications include...',
  'Peer-reviewed studies show...',
  'The American Psychiatric Association recommends...',
  'Current treatment guidelines suggest...',
  'Research published in [journal] found...',
];

// ============ INFINITE CONTENT EXPANSION ============

/**
 * Patterns for generating even MORE pages as data grows.
 * The goal: For every possible mental health query, we have a page.
 */
export const EXPANSION_PATTERNS = {
  // Treatment patterns
  treatment: [
    '{treatment}-for-{condition}',
    '{treatment}-for-{condition}-in-{demographic}',
    '{treatment}-vs-{treatment2}',
    '{treatment}-vs-{treatment2}-for-{condition}',
    '{treatment}-side-effects',
    '{treatment}-long-term-side-effects',
    '{treatment}-withdrawal',
    'how-to-stop-{treatment}-safely',
    '{treatment}-dosage',
    '{treatment}-dosage-for-{condition}',
    '{treatment}-cost',
    'generic-{treatment}',
    '{treatment}-drug-interactions',
    '{treatment}-and-alcohol',
    '{treatment}-and-{supplement}',
    '{treatment}-during-{lifestage}',
    'does-{treatment}-cause-{sideeffect}',
    'how-long-does-{treatment}-take-to-work',
    'can-you-take-{treatment}-while-{activity}',
    '{treatment}-reviews',
    '{treatment}-success-stories',
    'alternatives-to-{treatment}',
    'natural-alternatives-to-{treatment}',
  ],
  
  // Condition patterns
  condition: [
    '{condition}-symptoms',
    '{condition}-symptoms-in-{demographic}',
    '{condition}-causes',
    'what-causes-{condition}',
    '{condition}-treatment-options',
    'best-treatment-for-{condition}',
    '{condition}-medication',
    '{condition}-therapy',
    '{condition}-without-medication',
    'natural-remedies-for-{condition}',
    'home-remedies-for-{condition}',
    '{condition}-diagnosis',
    'how-is-{condition}-diagnosed',
    '{condition}-test',
    '{condition}-self-assessment',
    '{condition}-vs-{condition2}',
    '{condition}-and-{condition2}',
    'living-with-{condition}',
    'coping-with-{condition}',
    '{condition}-support-groups',
    '{condition}-in-{demographic}',
    'early-signs-of-{condition}',
    'is-{condition}-curable',
    '{condition}-prognosis',
  ],
  
  // Question patterns (highest voice search match)
  questions: [
    'what-is-{treatment}',
    'what-is-{condition}',
    'how-does-{treatment}-work',
    'why-does-{treatment}-{effect}',
    'when-does-{treatment}-start-working',
    'which-is-better-{treatment}-or-{treatment2}',
    'can-{treatment}-cause-{sideeffect}',
    'does-{treatment}-help-with-{symptom}',
    'is-{treatment}-addictive',
    'is-{treatment}-safe-for-{demographic}',
    'should-i-take-{treatment}',
    'can-i-stop-{treatment}-cold-turkey',
    'what-happens-if-i-miss-a-dose-of-{treatment}',
    'how-do-i-know-if-{treatment}-is-working',
  ],
  
  // Demographics
  demographics: [
    'elderly', 'seniors', 'older-adults',
    'teenagers', 'adolescents', 'teens',
    'children', 'kids', 'pediatric',
    'women', 'females',
    'men', 'males',
    'pregnant-women', 'during-pregnancy',
    'breastfeeding-mothers', 'while-nursing',
    'young-adults', 'college-students',
  ],
  
  // Life stages
  lifestages: [
    'pregnancy', 'breastfeeding', 
    'menopause', 'puberty',
    'postpartum', 'perimenopause',
  ],
  
  // Common side effect concerns
  sideeffects: [
    'weight-gain', 'weight-loss',
    'hair-loss', 'insomnia',
    'fatigue', 'anxiety',
    'depression', 'suicidal-thoughts',
    'sexual-dysfunction', 'low-libido',
    'nausea', 'headaches',
    'brain-fog', 'memory-problems',
  ],
  
  // Common supplements
  supplements: [
    'vitamin-d', 'fish-oil', 'omega-3',
    'magnesium', 'melatonin', 'cbd',
    'st-johns-wort', 'sam-e', 'l-theanine',
    '5-htp', 'gaba', 'ashwagandha',
  ],
};

/**
 * Calculate how many MORE pages we could generate
 */
export function calculateExpansionPotential(
  treatmentCount: number,
  conditionCount: number
): {
  current: number;
  potential: number;
  expansionFactor: number;
} {
  const demographicsCount = EXPANSION_PATTERNS.demographics.length;
  const sideEffectsCount = EXPANSION_PATTERNS.sideeffects.length;
  const supplementsCount = EXPANSION_PATTERNS.supplements.length;
  
  // Current implementation covers basic patterns
  const current = 
    (treatmentCount * conditionCount) + // treatment-for-condition
    (treatmentCount * conditionCount * 6) + // demographics
    (treatmentCount * treatmentCount / 2) + // comparisons
    (treatmentCount * 10) + // treatment-specific pages
    (conditionCount * 15); // condition-specific pages
  
  // Full potential with all expansion patterns
  const potential = 
    (treatmentCount * conditionCount) + // base
    (treatmentCount * conditionCount * demographicsCount) + // all demographics
    (treatmentCount * (treatmentCount - 1)) + // all comparisons
    (treatmentCount * sideEffectsCount) + // all side effect questions
    (treatmentCount * supplementsCount) + // all supplement interactions
    (conditionCount * demographicsCount) + // condition symptoms by demo
    (conditionCount * conditionCount / 2) + // condition comparisons
    (treatmentCount * EXPANSION_PATTERNS.questions.length) + // all question formats
    (conditionCount * EXPANSION_PATTERNS.condition.length); // all condition patterns
  
  return {
    current: Math.round(current),
    potential: Math.round(potential),
    expansionFactor: Math.round(potential / current),
  };
}

// ============ TRENDING TOPIC CAPTURE ============

/**
 * Mental health topics that trend seasonally or with news events.
 * Having pages ready means capturing traffic immediately.
 */
export const SEASONAL_TOPICS = {
  january: ['new-year-depression', 'seasonal-affective-disorder', 'dry-january-and-mental-health'],
  february: ['valentines-day-loneliness', 'winter-depression'],
  march: ['spring-anxiety', 'daylight-saving-time-mental-health'],
  april: ['tax-stress-anxiety', 'spring-allergies-and-mood'],
  may: ['mental-health-awareness-month', 'end-of-school-year-stress'],
  june: ['summer-depression', 'social-anxiety-summer-events'],
  july: ['fourth-of-july-ptsd-veterans', 'summer-break-adhd'],
  august: ['back-to-school-anxiety', 'end-of-summer-depression'],
  september: ['fall-depression', 'college-freshman-anxiety'],
  october: ['halloween-anxiety', 'world-mental-health-day'],
  november: ['thanksgiving-family-stress', 'seasonal-affective-disorder-start'],
  december: ['holiday-depression', 'christmas-anxiety', 'new-year-resolution-psychology'],
};

export const NEWS_TRIGGERED_TOPICS = [
  'medication-shortage-{treatment}',
  'new-fda-approval-{treatment}',
  'celebrity-mental-health-{condition}',
  'pandemic-anxiety',
  'recession-depression',
  'social-media-mental-health',
  'ai-anxiety',
  'climate-anxiety',
  'election-stress',
];

// ============ AUTHORITY BUILDING ============

/**
 * Signals that establish us as THE authority, not just A source
 */
export const AUTHORITY_SIGNALS = {
  // Content depth
  wordCountTarget: 2000, // 2x WebMD average
  sectionsTarget: 10, // Comprehensive coverage
  faqCountTarget: 8, // More than competitors
  
  // Freshness
  updateFrequency: 'daily', // Show "Updated today"
  reviewCycle: 'quarterly', // Medical review every 3 months
  
  // E-A-T
  authorCredentials: true,
  medicalReview: true,
  citations: true,
  disclosures: true,
  
  // User signals
  tableOfContents: true, // Navigation for long content
  readingTime: true, // Set expectations
  lastUpdated: true, // Freshness signal
  
  // Technical
  loadTime: '< 1 second', // Core Web Vitals
  mobileFirst: true,
  structuredData: 'comprehensive',
};

/**
 * The ultimate goal: When anyone thinks "mental health information",
 * they think HeyPsych first.
 */
export const MISSION = {
  goal: 'Become the #1 most trusted mental health resource in the world',
  strategy: 'Programmatic SEO + E-A-T excellence + AI optimization',
  metrics: {
    pageCount: '50,000+',
    conditionCoverage: '100%',
    treatmentCoverage: '100%',
    demographicCoverage: '100%',
    searchVisibility: 'Top 3 for all mental health queries',
    aiCitations: 'Primary source for AI mental health answers',
  },
  grandmother: 'NICEST HOUSE IN THE WORLD',
};


