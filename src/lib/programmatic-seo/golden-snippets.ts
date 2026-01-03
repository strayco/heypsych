/**
 * Golden Snippet Generator
 * 
 * Creates "Position 0" content that Google shows ABOVE organic results.
 * These are the featured snippets and "People Also Ask" answers.
 * 
 * The key: Answer the question IMMEDIATELY in the first 40-60 words,
 * in a format Google can easily extract.
 */

export interface GoldenSnippet {
  question: string;
  answer: string;
  format: 'paragraph' | 'list' | 'table' | 'steps';
  wordCount: number;
}

/**
 * Common question patterns that trigger featured snippets
 * Format: [pattern, answer template generator]
 * 
 * Note: Some patterns only need treatment, others need both treatment and condition.
 * We use optional condition parameter with default empty string.
 */
const SNIPPET_PATTERNS: Record<string, (treatment: string, condition?: string) => GoldenSnippet> = {
  
  // "How long does X take to work?"
  'onset': (treatment, condition = 'the condition') => ({
    question: `How long does ${treatment} take to work for ${condition}?`,
    answer: `${treatment} typically takes 2-4 weeks to start working for ${condition}, with full therapeutic effects usually reached by 6-8 weeks. Some people notice improvements in sleep, anxiety, or energy within the first 1-2 weeks, while mood benefits take longer to develop.`,
    format: 'paragraph',
    wordCount: 48,
  }),

  // "What is the dosage of X for Y?"
  'dosage': (treatment, condition = 'the condition') => ({
    question: `What is the typical ${treatment} dosage for ${condition}?`,
    answer: `The typical ${treatment} dosage for ${condition} starts low (often 5-10mg for SSRIs) and increases gradually based on response and tolerability. Most adults reach a maintenance dose within 4-8 weeks. Your doctor will customize dosing to your specific needs.`,
    format: 'paragraph',
    wordCount: 44,
  }),

  // "Does X cause weight gain?"
  'weight': (treatment) => ({
    question: `Does ${treatment} cause weight gain?`,
    answer: `${treatment} may cause weight changes, but effects vary by individual. Some people gain weight, others lose it, and many experience no significant change. Weight effects are influenced by appetite changes, the underlying condition being treated, and individual metabolism.`,
    format: 'paragraph',
    wordCount: 42,
  }),

  // "Can you drink alcohol on X?"
  'alcohol': (treatment) => ({
    question: `Can you drink alcohol while taking ${treatment}?`,
    answer: `Drinking alcohol while taking ${treatment} is generally not recommended. Alcohol can: (1) Worsen depression and anxiety symptoms, (2) Increase drowsiness and sedation, (3) Impair judgment more than either substance alone, (4) Reduce medication effectiveness. If you choose to drink, limit intake and discuss with your doctor.`,
    format: 'list',
    wordCount: 53,
  }),

  // "What are the side effects of X?"
  'side-effects': (treatment) => ({
    question: `What are the side effects of ${treatment}?`,
    answer: `Common ${treatment} side effects include: (1) Nausea (usually improves in 1-2 weeks), (2) Headache, (3) Sleep changes, (4) Fatigue, (5) Dry mouth, (6) Sexual side effects. Most side effects are mild and temporary. Serious effects like severe allergic reactions or serotonin syndrome are rare but require immediate medical attention.`,
    format: 'list',
    wordCount: 54,
  }),

  // "What is X used for?"
  'uses': (treatment) => ({
    question: `What is ${treatment} used for?`,
    answer: `${treatment} is used to treat: (1) Depression (major depressive disorder), (2) Anxiety disorders (generalized anxiety, social anxiety, panic disorder), (3) OCD in some cases, (4) PTSD (off-label). It works by affecting serotonin levels in the brain and typically takes several weeks to reach full effectiveness.`,
    format: 'list',
    wordCount: 51,
  }),

  // "Is X addictive?"
  'addiction': (treatment) => ({
    question: `Is ${treatment} addictive?`,
    answer: `${treatment} is not addictive in the traditional sense—it doesn't cause cravings or drug-seeking behavior. However, stopping suddenly can cause discontinuation symptoms (dizziness, nausea, irritability). This is why gradual tapering under medical supervision is recommended when stopping.`,
    format: 'paragraph',
    wordCount: 42,
  }),

  // "X vs Y: which is better?"
  'comparison': (treatment1: string, treatment2: string = 'the alternative') => ({
    question: `${treatment1} vs ${treatment2}: which is better?`,
    answer: `Neither ${treatment1} nor ${treatment2} is universally "better"—both are effective with similar overall efficacy. The best choice depends on: (1) Your side effect tolerance, (2) Other medications you take, (3) Previous treatment response, (4) Specific symptoms. Many people try one and switch if needed.`,
    format: 'list',
    wordCount: 49,
  }),

  // "How to stop X safely?"
  'withdrawal': (treatment) => ({
    question: `How do you stop taking ${treatment} safely?`,
    answer: `To stop ${treatment} safely: (1) Never stop suddenly—always taper, (2) Work with your doctor to create a gradual reduction schedule, (3) Typical tapers reduce dose by 10-25% every 2-4 weeks, (4) Pause if withdrawal symptoms are severe, (5) Some people need slower tapers over several months.`,
    format: 'steps',
    wordCount: 52,
  }),

  // "What causes X?"
  'causes': (_: string, condition: string = 'this condition') => ({
    question: `What causes ${condition}?`,
    answer: `${condition} is caused by a combination of: (1) Genetics—family history increases risk, (2) Brain chemistry—neurotransmitter imbalances, (3) Life events—trauma, stress, major changes, (4) Medical conditions—thyroid issues, chronic pain, (5) Personality factors—certain temperaments are more vulnerable.`,
    format: 'list',
    wordCount: 41,
  }),

  // "Symptoms of X in women/men/etc."
  'symptoms-demographic': (condition: string, demographic: string = 'patients') => ({
    question: `What are the symptoms of ${condition} in ${demographic}?`,
    answer: `${condition} symptoms in ${demographic} may include the core features (persistent worry, mood changes, difficulty concentrating) but can present differently. ${demographic} may be more likely to report physical symptoms, sleep disturbances, or irritability rather than emotional symptoms.`,
    format: 'paragraph',
    wordCount: 44,
  }),
};

/**
 * Generate a golden snippet for a specific page type
 */
export function generateGoldenSnippet(
  pageType: string,
  treatment?: string,
  treatment2?: string,
  condition?: string,
  demographic?: string
): GoldenSnippet | null {
  const t = treatment || 'this medication';
  const c = condition || 'this condition';
  
  switch (pageType) {
    case 'treatment-for-condition':
      return SNIPPET_PATTERNS['onset'](t, c);
    case 'treatment-dosage':
      return SNIPPET_PATTERNS['dosage'](t, c);
    case 'treatment-side-effects':
      return SNIPPET_PATTERNS['side-effects'](t);
    case 'treatment-withdrawal':
      return SNIPPET_PATTERNS['withdrawal'](t);
    case 'treatment-interactions':
      return SNIPPET_PATTERNS['alcohol'](t);
    case 'treatment-vs-treatment':
      return SNIPPET_PATTERNS['comparison'](t, treatment2 || 'the alternative');
    case 'condition-causes':
      return SNIPPET_PATTERNS['causes']('', c);
    case 'condition-symptoms-demographic':
      return SNIPPET_PATTERNS['symptoms-demographic'](c, demographic || 'patients');
    default:
      return null;
  }
}

/**
 * Format answer for Google's featured snippet extraction
 * Key: First sentence should be extractable standalone
 */
export function formatForSnippet(answer: string, format: 'paragraph' | 'list' | 'steps'): string {
  if (format === 'paragraph') {
    return answer;
  }
  
  if (format === 'list' || format === 'steps') {
    // Convert numbered items like "(1)" to proper list items
    return answer
      .replace(/\((\d+)\)/g, '\n$1.')
      .trim();
  }
  
  return answer;
}

/**
 * Generate "People Also Ask" questions for a topic
 * These should be used in FAQ sections with proper FAQPage schema
 */
export function generatePAAQuestions(
  treatment?: string,
  condition?: string
): Array<{ question: string; priority: 'high' | 'medium' }> {
  const t = treatment || 'this medication';
  const c = condition || 'this condition';
  
  const questions = [];
  
  if (treatment) {
    questions.push(
      { question: `How long does ${t} take to work?`, priority: 'high' as const },
      { question: `What are the side effects of ${t}?`, priority: 'high' as const },
      { question: `Can you drink alcohol on ${t}?`, priority: 'high' as const },
      { question: `Does ${t} cause weight gain?`, priority: 'high' as const },
      { question: `Is ${t} addictive?`, priority: 'medium' as const },
      { question: `What happens if you stop ${t} suddenly?`, priority: 'medium' as const },
      { question: `Can you take ${t} at night?`, priority: 'medium' as const },
    );
  }
  
  if (condition) {
    questions.push(
      { question: `What is the best treatment for ${c}?`, priority: 'high' as const },
      { question: `Can ${c} be cured?`, priority: 'high' as const },
      { question: `What causes ${c}?`, priority: 'medium' as const },
      { question: `How is ${c} diagnosed?`, priority: 'medium' as const },
    );
  }
  
  if (treatment && condition) {
    questions.push(
      { question: `Is ${t} effective for ${c}?`, priority: 'high' as const },
      { question: `What is the dosage of ${t} for ${c}?`, priority: 'high' as const },
    );
  }
  
  return questions;
}

