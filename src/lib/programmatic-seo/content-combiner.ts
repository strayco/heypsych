/**
 * Content Combiner for Programmatic SEO
 * 
 * Intelligently merges condition and treatment data to create
 * unique, valuable content for each programmatic page.
 */

import type { ProgrammaticPageConfig, DemographicModifier, ContentModifier } from './page-generator';

export interface CombinedContent {
  title: string;
  metaDescription: string;
  h1: string;
  introduction: string;
  sections: ContentSection[];
  faqs: FAQ[];
  relatedLinks: RelatedLink[];
  lastUpdated: string;
}

export interface ContentSection {
  id: string;
  heading: string;
  content: string;
  items?: string[];
  type: 'text' | 'list' | 'table' | 'warning' | 'tip';
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface RelatedLink {
  title: string;
  url: string;
  description?: string;
}

export interface TreatmentData {
  name: string;
  slug: string;
  type: string;
  summary: string;
  description: string;
  patient_summary?: string;
  clinical_metadata?: {
    primary_indications?: string[];
    linked_conditions?: Array<{
      slug: string;
      relationship: string;
      context: string;
    }>;
    contraindications?: string[];
    efficacy_response?: {
      metric: string;
      percentage_value: string;
      patient_text: string;
      comparison_data?: string;
      citation_tag?: string;
    };
    pharmacokinetics?: {
      onset?: string;
      half_life?: string;
      metabolism?: string;
      absorption?: string;
      bioavailability?: string;
      peak_plasma?: string;
      duration_IR?: string;
      excretion?: string;
      protein_binding?: string;
      food_effect?: string;
    };
  };
  sections?: Array<{
    type: string;
    heading?: string;
    text?: string;
    items?: string[];
  }>;
  metadata?: {
    drug_classes?: string[];
    brand_names?: string[];
    age_groups?: string[];
    generic_available?: boolean;
    fda_approval_year?: number;
    prescription_status?: string;
    controlled_substance?: string;
  };
}

export interface ConditionData {
  name: string;
  slug: string;
  content: {
    description: string;
    prevalence?: string;
    age_of_onset?: string;
    prognosis?: string;
    diagnostic_criteria?: string;
    neurobiology?: {
      brain_networks?: string[];
      connectivity_findings?: string[];
      cellular_molecular?: string[];
      genetics?: string;
    };
    evaluation?: {
      history_observation?: string[];
      gold_standard_measures?: string[];
      screeners_rating_scales?: string[];
      cognitive_language_adaptive?: string[];
      sensory_motor_other?: string[];
      differential_diagnosis?: string[];
      team_and_process?: string;
    };
    symptoms?: {
      core?: string[];
      associated?: string[];
      strengths_common?: string[];
    };
    severity_levels?: {
      mild?: string;
      moderate?: string;
      severe?: string;
    };
    risk_factors?: {
      biological?: string[];
      psychological?: string[];
      environmental?: string[];
    };
    impact_on_life?: {
      communication_learning?: string;
      social_relationships?: string;
      daily_living?: string;
      work?: string;
      self_esteem?: string;
    };
    comorbidities?: string[];
    treatment_approaches?: {
      psychotherapy?: string[];
      medications?: string[];
      lifestyle_interventions?: string[];
      education_and_family?: string[];
    };
    treatment_goals?: string[];
    missed_diagnosis_factors?: string[];
    overdiagnosis_factors?: string[];
    specifiers?: Record<string, string[]>;
    developmental_stages?: {
      childhood?: string[];
      adolescence?: string[];
      adulthood?: string[];
    };
    real_life_examples?: string[];
    warning_signs?: string[];
    when_to_seek_help?: string;
    self_help_strategies?: string[];
  };
}

/**
 * Generate combined content for a treatment-for-condition page
 */
export function generateTreatmentForConditionContent(
  treatment: TreatmentData,
  condition: ConditionData,
  config: ProgrammaticPageConfig
): CombinedContent {
  const treatmentName = treatment.name;
  const conditionName = condition.name;
  const brandName = getBrandName(treatment);
  
  // Find specific context for this condition from treatment data
  const linkedCondition = treatment.clinical_metadata?.linked_conditions?.find(
    lc => lc.slug === config.conditionSlug
  );
  const specificContext = linkedCondition?.context || '';
  const relationship = linkedCondition?.relationship || 'treatment';

  const title = `${brandName} for ${conditionName}: Uses, Dosage & What to Expect`;
  const metaDescription = `Learn how ${brandName} (${getGenericName(treatment)}) treats ${conditionName}. Evidence-based guide covering dosage, effectiveness, side effects, and what to expect during treatment.`;

  const introduction = generateIntroduction(treatment, condition, relationship, specificContext);
  const sections = generateSections(treatment, condition, config);
  const faqs = generateFAQs(treatment, condition, config);
  const relatedLinks = generateRelatedLinks(treatment, condition);

  return {
    title,
    metaDescription,
    h1: `${brandName} for ${conditionName}`,
    introduction,
    sections,
    faqs,
    relatedLinks,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate content for demographic-specific pages
 */
export function generateDemographicContent(
  treatment: TreatmentData,
  condition: ConditionData,
  demographic: DemographicModifier,
  config: ProgrammaticPageConfig
): CombinedContent {
  const brandName = getBrandName(treatment);
  const conditionName = condition.name;
  const demographicLabel = getDemographicLabel(demographic);

  const title = `${brandName} for ${conditionName} in ${demographicLabel}: Safety & Dosing Guide`;
  const metaDescription = `Is ${brandName} safe for ${demographicLabel.toLowerCase()} with ${conditionName}? Learn about age-specific dosing, precautions, and what to expect.`;

  const introduction = generateDemographicIntro(treatment, condition, demographic);
  const sections = generateDemographicSections(treatment, condition, demographic, config);
  const faqs = generateDemographicFAQs(treatment, condition, demographic);
  const relatedLinks = generateRelatedLinks(treatment, condition);

  return {
    title,
    metaDescription,
    h1: `${brandName} for ${conditionName} in ${demographicLabel}`,
    introduction,
    sections,
    faqs,
    relatedLinks,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate content for condition symptoms by demographic
 */
export function generateConditionSymptomsContent(
  condition: ConditionData,
  demographic: DemographicModifier,
  config: ProgrammaticPageConfig
): CombinedContent {
  const conditionName = condition.name;
  const demographicLabel = getDemographicLabel(demographic);

  const title = `${conditionName} Symptoms in ${demographicLabel}: Signs to Watch For`;
  const metaDescription = `How does ${conditionName} present in ${demographicLabel.toLowerCase()}? Learn the unique symptoms, warning signs, and when to seek professional help.`;

  const introduction = generateSymptomsIntro(condition, demographic);
  const sections = generateSymptomsSections(condition, demographic);
  const faqs = generateSymptomsFAQs(condition, demographic);

  return {
    title,
    metaDescription,
    h1: `${conditionName} Symptoms in ${demographicLabel}`,
    introduction,
    sections,
    faqs,
    relatedLinks: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate treatment comparison content
 */
export function generateComparisonContent(
  treatment1: TreatmentData,
  treatment2: TreatmentData,
  condition: ConditionData,
  config: ProgrammaticPageConfig
): CombinedContent {
  const brand1 = getBrandName(treatment1);
  const brand2 = getBrandName(treatment2);
  const conditionName = condition.name;

  const title = `${brand1} vs ${brand2} for ${conditionName}: Which Is Better?`;
  const metaDescription = `Compare ${brand1} and ${brand2} for treating ${conditionName}. Side-by-side analysis of effectiveness, side effects, dosing, and which might work better for you.`;

  return {
    title,
    metaDescription,
    h1: `${brand1} vs ${brand2} for ${conditionName}`,
    introduction: generateComparisonIntro(treatment1, treatment2, condition),
    sections: generateComparisonSections(treatment1, treatment2, condition),
    faqs: generateComparisonFAQs(treatment1, treatment2, condition),
    relatedLinks: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate side effects content
 */
export function generateSideEffectsContent(
  treatment: TreatmentData,
  config: ProgrammaticPageConfig
): CombinedContent {
  const brandName = getBrandName(treatment);

  const title = `${brandName} Side Effects: Common, Serious & What to Expect`;
  const metaDescription = `Complete guide to ${brandName} side effects. Learn what's common vs serious, how long they last, and tips for managing them.`;

  return {
    title,
    metaDescription,
    h1: `${brandName} Side Effects`,
    introduction: generateSideEffectsIntro(treatment),
    sections: generateSideEffectsSections(treatment),
    faqs: generateSideEffectsFAQs(treatment),
    relatedLinks: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate natural alternatives content
 */
export function generateNaturalAlternativesContent(
  condition: ConditionData,
  config: ProgrammaticPageConfig
): CombinedContent {
  const conditionName = condition.name;
  const isWithoutMeds = config.modifier === 'without-medication';

  const title = isWithoutMeds
    ? `How to Treat ${conditionName} Without Medication: Natural Approaches`
    : `Natural Remedies for ${conditionName}: Evidence-Based Options`;

  const metaDescription = isWithoutMeds
    ? `Explore non-medication approaches for managing ${conditionName}. Evidence-based natural treatments, lifestyle changes, and therapy options.`
    : `Natural remedies and supplements for ${conditionName}. What works, what doesn't, and how to safely combine with other treatments.`;

  return {
    title,
    metaDescription,
    h1: isWithoutMeds ? `Treating ${conditionName} Without Medication` : `Natural Remedies for ${conditionName}`,
    introduction: generateNaturalIntro(condition, isWithoutMeds),
    sections: generateNaturalSections(condition),
    faqs: generateNaturalFAQs(condition),
    relatedLinks: [],
    lastUpdated: new Date().toISOString(),
  };
}

// ============ Helper Functions ============

function getBrandName(treatment: TreatmentData): string {
  if (treatment.metadata?.brand_names?.[0]) {
    return treatment.metadata.brand_names[0];
  }
  // Extract from name like "Escitalopram (Lexapro)"
  const match = treatment.name.match(/\(([^)]+)\)/);
  return match ? match[1] : treatment.name;
}

function getGenericName(treatment: TreatmentData): string {
  // Extract from name like "Escitalopram (Lexapro)"
  const match = treatment.name.match(/^([^(]+)/);
  return match ? match[1].trim() : treatment.name;
}

function getDemographicLabel(demographic: DemographicModifier): string {
  const labels: Record<DemographicModifier, string> = {
    'elderly': 'Older Adults',
    'seniors': 'Seniors',
    'teenagers': 'Teenagers',
    'adolescents': 'Adolescents',
    'children': 'Children',
    'women': 'Women',
    'men': 'Men',
    'pregnancy': 'Pregnancy',
    'breastfeeding': 'Breastfeeding',
    'young-adults': 'Young Adults',
  };
  return labels[demographic] || demographic;
}

function generateIntroduction(
  treatment: TreatmentData,
  condition: ConditionData,
  relationship: string,
  specificContext: string
): string {
  const brandName = getBrandName(treatment);
  const isOffLabel = relationship === 'off_label';
  
  let intro = treatment.patient_summary || treatment.summary;
  
  if (specificContext) {
    intro += ` ${specificContext}`;
  }

  if (isOffLabel) {
    intro += ` While ${brandName} is not FDA-approved specifically for ${condition.name}, it is commonly prescribed off-label based on clinical evidence.`;
  }

  return intro;
}

function generateSections(
  treatment: TreatmentData,
  condition: ConditionData,
  config: ProgrammaticPageConfig
): ContentSection[] {
  const sections: ContentSection[] = [];
  const brandName = getBrandName(treatment);

  // How it works section
  sections.push({
    id: 'how-it-works',
    heading: `How ${brandName} Works for ${condition.name}`,
    content: treatment.description,
    type: 'text',
  });

  // Dosage information
  if (treatment.clinical_metadata?.pharmacokinetics) {
    const pk = treatment.clinical_metadata.pharmacokinetics;
    sections.push({
      id: 'dosage-timing',
      heading: 'Dosage and Timing',
      content: `${brandName} typically takes ${pk.onset} to show effects. ${pk.half_life ? `With a half-life of ${pk.half_life}, once-daily dosing is usually sufficient.` : ''}`,
      type: 'text',
    });
  }

  // Effectiveness
  if (treatment.clinical_metadata?.efficacy_response) {
    const efficacy = treatment.clinical_metadata.efficacy_response;
    sections.push({
      id: 'effectiveness',
      heading: 'How Effective Is It?',
      content: efficacy.patient_text,
      type: 'text',
    });
  }

  // What to expect
  sections.push({
    id: 'what-to-expect',
    heading: 'What to Expect',
    content: `When starting ${brandName} for ${condition.name}, here's the typical timeline:`,
    items: [
      'Week 1-2: You may experience initial side effects like nausea or sleep changes. These usually improve.',
      'Week 2-4: Some people notice early improvements in sleep, energy, or anxiety.',
      'Week 4-8: Full therapeutic effects typically emerge. Give it adequate time.',
      'Ongoing: Regular follow-up helps optimize dosing and monitor progress.',
    ],
    type: 'list',
  });

  // Symptoms it helps
  if (condition.content.symptoms?.core) {
    sections.push({
      id: 'symptoms-treated',
      heading: `${condition.name} Symptoms ${brandName} Can Help With`,
      content: `${brandName} may help reduce these common symptoms:`,
      items: condition.content.symptoms.core.slice(0, 6),
      type: 'list',
    });
  }

  // Warnings/precautions
  if (treatment.clinical_metadata?.contraindications) {
    sections.push({
      id: 'precautions',
      heading: 'Important Precautions',
      content: 'Before starting treatment, discuss with your doctor if any of these apply:',
      items: treatment.clinical_metadata.contraindications.slice(0, 5),
      type: 'warning',
    });
  }

  // Lifestyle support
  if (condition.content.treatment_approaches?.lifestyle_interventions) {
    sections.push({
      id: 'lifestyle-support',
      heading: 'Lifestyle Changes That Help',
      content: `While taking ${brandName}, these lifestyle changes can boost your results:`,
      items: condition.content.treatment_approaches.lifestyle_interventions,
      type: 'tip',
    });
  }

  return sections;
}

function generateFAQs(
  treatment: TreatmentData,
  condition: ConditionData,
  config: ProgrammaticPageConfig
): FAQ[] {
  const brandName = getBrandName(treatment);
  const conditionName = condition.name;

  return [
    {
      question: `How long does ${brandName} take to work for ${conditionName}?`,
      answer: `Most people start noticing improvements in 2-4 weeks, with full effects typically emerging by 6-8 weeks. ${treatment.clinical_metadata?.pharmacokinetics?.onset || 'Give it adequate time before judging effectiveness.'}`,
    },
    {
      question: `What is the typical ${brandName} dosage for ${conditionName}?`,
      answer: `Dosing varies by individual factors. Your doctor will typically start low and adjust based on response and tolerability. Follow your prescribed dose and don't adjust without medical guidance.`,
    },
    {
      question: `Can I drink alcohol while taking ${brandName}?`,
      answer: `It's generally recommended to avoid or limit alcohol while taking ${brandName}. Alcohol can worsen ${conditionName} symptoms and may interact with the medication, potentially increasing side effects.`,
    },
    {
      question: `What are the most common side effects of ${brandName}?`,
      answer: `Common side effects in the first few weeks may include nausea, headache, sleep changes, and fatigue. These often improve as your body adjusts. Sexual side effects may persist for some people.`,
    },
    {
      question: `Is ${brandName} addictive?`,
      answer: `${brandName} is not considered addictive in the traditional sense. However, stopping suddenly can cause discontinuation symptoms. Always taper off gradually under medical supervision.`,
    },
    {
      question: `Can ${brandName} be combined with therapy for ${conditionName}?`,
      answer: `Yes, combining medication with therapy (like CBT) is often more effective than either alone. ${condition.content.treatment_approaches?.psychotherapy?.[0] || 'Talk to your provider about the best combination approach.'}`,
    },
  ];
}

function generateRelatedLinks(
  treatment: TreatmentData,
  condition: ConditionData
): RelatedLink[] {
  return [
    {
      title: `Learn more about ${condition.name}`,
      url: `/conditions/${condition.slug}`,
      description: 'Comprehensive guide to symptoms, causes, and treatments',
    },
    {
      title: `Full ${treatment.name} guide`,
      url: `/treatments/${treatment.slug}`,
      description: 'Complete medication information and dosing',
    },
  ];
}

// Demographic-specific generators
function generateDemographicIntro(
  treatment: TreatmentData,
  condition: ConditionData,
  demographic: DemographicModifier
): string {
  const brandName = getBrandName(treatment);
  const label = getDemographicLabel(demographic);

  const demographicConsiderations: Record<DemographicModifier, string> = {
    'elderly': `${brandName} can be used in older adults, but typically requires lower starting doses and careful monitoring due to changes in metabolism and increased sensitivity to side effects.`,
    'seniors': `${brandName} can be used in seniors, but requires age-appropriate dosing adjustments and monitoring for interactions with other medications.`,
    'teenagers': `${brandName} may be prescribed to teenagers with ${condition.name}, with careful monitoring for mood changes and suicidal ideation, especially in the first few months.`,
    'adolescents': `${brandName} is sometimes used in adolescents, requiring close monitoring by caregivers and healthcare providers.`,
    'children': `The use of ${brandName} in children requires specialized pediatric evaluation and careful consideration of risks and benefits.`,
    'women': `${brandName} considerations for women include potential effects on menstrual cycles, fertility considerations, and contraception planning.`,
    'men': `Men taking ${brandName} should be aware of potential sexual side effects and discuss any concerns with their healthcare provider.`,
    'pregnancy': `${brandName} during pregnancy requires careful risk-benefit analysis. Some medications may carry risks, but untreated ${condition.name} also poses risks.`,
    'breastfeeding': `If you're breastfeeding and need ${brandName}, work closely with your doctor to weigh the benefits of treatment against potential infant exposure.`,
    'young-adults': `Young adults (18-25) taking ${brandName} should be monitored for mood changes, particularly in early treatment.`,
  };

  return demographicConsiderations[demographic] || '';
}

function generateDemographicSections(
  treatment: TreatmentData,
  condition: ConditionData,
  demographic: DemographicModifier,
  config: ProgrammaticPageConfig
): ContentSection[] {
  const brandName = getBrandName(treatment);
  const label = getDemographicLabel(demographic);
  
  const sections: ContentSection[] = [
    {
      id: 'special-considerations',
      heading: `Special Considerations for ${label}`,
      content: `When using ${brandName} in ${label.toLowerCase()}, healthcare providers consider several factors:`,
      items: generateDemographicConsiderations(demographic, brandName),
      type: 'list',
    },
    {
      id: 'dosing-adjustments',
      heading: 'Dosing Adjustments',
      content: getDemographicDosingInfo(demographic, brandName),
      type: 'text',
    },
    {
      id: 'monitoring',
      heading: 'Monitoring Recommendations',
      content: `Regular monitoring is important for ${label.toLowerCase()} taking ${brandName}:`,
      items: getMonitoringRecommendations(demographic),
      type: 'list',
    },
  ];

  return sections;
}

function generateDemographicConsiderations(demographic: DemographicModifier, brandName: string): string[] {
  const considerations: Record<DemographicModifier, string[]> = {
    'elderly': [
      'Slower metabolism may require lower doses',
      'Increased risk of drug interactions with other medications',
      'Higher sensitivity to side effects like dizziness',
      'Monitoring for cognitive effects',
      'Regular electrolyte and kidney function checks',
    ],
    'seniors': [
      'Age-related changes in drug processing',
      'Polypharmacy considerations',
      'Fall risk assessment',
      'Cognitive monitoring',
    ],
    'teenagers': [
      'FDA black box warning for suicidal thoughts',
      'Close monitoring in first 1-2 months',
      'Involvement of parents/guardians in care',
      'School and social functioning assessment',
    ],
    'adolescents': [
      'Developmental considerations',
      'Mood and behavior monitoring',
      'Family involvement in treatment',
      'Academic impact assessment',
    ],
    'children': [
      'Age-appropriate formulations',
      'Weight-based dosing',
      'Growth monitoring',
      'Behavioral assessments',
    ],
    'women': [
      'Hormonal cycle interactions',
      'Contraception considerations',
      'Pre-pregnancy planning if applicable',
      'Bone health monitoring with long-term use',
    ],
    'men': [
      'Sexual function monitoring',
      'Cardiovascular risk assessment',
      'Lifestyle factor optimization',
    ],
    'pregnancy': [
      'Risk-benefit analysis for both mother and fetus',
      'Potential effects during each trimester',
      'Alternative options consideration',
      'Delivery and postpartum planning',
    ],
    'breastfeeding': [
      'Drug transfer to breast milk',
      'Infant exposure assessment',
      'Timing of doses relative to feeding',
      'Monitoring infant for effects',
    ],
    'young-adults': [
      'Emerging adult considerations',
      'Lifestyle factors (college, work stress)',
      'Mood monitoring per FDA guidance',
      'Long-term planning',
    ],
  };
  return considerations[demographic] || [];
}

function getDemographicDosingInfo(demographic: DemographicModifier, brandName: string): string {
  const dosingInfo: Record<DemographicModifier, string> = {
    'elderly': `For older adults, ${brandName} is typically started at half the usual adult dose and increased gradually. Maximum doses may also be lower than in younger adults.`,
    'seniors': `Seniors often benefit from a "start low, go slow" approach with ${brandName}. Your doctor will carefully titrate to find the minimum effective dose.`,
    'teenagers': `Teenage dosing of ${brandName} often starts lower than adult doses and is adjusted based on response and tolerability. Close follow-up is essential.`,
    'adolescents': `Adolescent dosing requires careful individualization. Growth and development stage influence appropriate dosing.`,
    'children': `Pediatric dosing is based on weight and age, typically starting very low and increasing gradually under close medical supervision.`,
    'women': `Standard adult dosing applies for most women. Adjustments may be needed based on other factors like weight, other medications, or hormonal treatments.`,
    'men': `Standard adult dosing typically applies. Individual factors like other medications and health conditions influence optimal dosing.`,
    'pregnancy': `If ${brandName} is deemed necessary during pregnancy, the lowest effective dose is used. Dose adjustments may be needed as pregnancy progresses.`,
    'breastfeeding': `The lowest effective dose is recommended while breastfeeding. Some providers suggest timing doses after feeding to minimize infant exposure.`,
    'young-adults': `Young adults typically receive standard adult dosing with close monitoring, especially in the first 2-3 months of treatment.`,
  };
  return dosingInfo[demographic] || '';
}

function getMonitoringRecommendations(demographic: DemographicModifier): string[] {
  const monitoring: Record<DemographicModifier, string[]> = {
    'elderly': [
      'Regular blood pressure checks',
      'Kidney and liver function tests',
      'Falls risk assessment',
      'Cognitive function monitoring',
      'Drug interaction review at each visit',
    ],
    'seniors': [
      'Medication review at each visit',
      'Side effect assessment',
      'Functional status evaluation',
      'Safety assessments',
    ],
    'teenagers': [
      'Weekly check-ins for first month',
      'Mood and behavior tracking',
      'Suicidality screening',
      'Academic and social functioning',
      'Family feedback',
    ],
    'adolescents': [
      'Regular mental health assessments',
      'Growth monitoring',
      'Developmental milestone tracking',
      'School performance review',
    ],
    'children': [
      'Frequent follow-up visits',
      'Growth charts (height and weight)',
      'Behavioral observations',
      'Parent/caregiver reports',
    ],
    'women': [
      'Menstrual cycle tracking',
      'Bone density if long-term use',
      'Regular check-ups',
      'Contraception review',
    ],
    'men': [
      'Sexual function assessment',
      'Cardiovascular monitoring',
      'Regular follow-up visits',
    ],
    'pregnancy': [
      'Regular OB/GYN visits',
      'Fetal ultrasounds',
      'Mental health monitoring',
      'Birth planning discussions',
    ],
    'breastfeeding': [
      'Infant weight and development',
      'Maternal mental health',
      'Milk supply monitoring',
      'Infant behavior observation',
    ],
    'young-adults': [
      'Mood monitoring',
      'Life transition support',
      'Regular follow-up',
      'Safety planning',
    ],
  };
  return monitoring[demographic] || [];
}

function generateDemographicFAQs(
  treatment: TreatmentData,
  condition: ConditionData,
  demographic: DemographicModifier
): FAQ[] {
  const brandName = getBrandName(treatment);
  const label = getDemographicLabel(demographic);
  const conditionName = condition.name;

  return [
    {
      question: `Is ${brandName} safe for ${label.toLowerCase()}?`,
      answer: `${brandName} can be used in ${label.toLowerCase()} when the benefits outweigh the risks. Special considerations apply, including potential dose adjustments and closer monitoring.`,
    },
    {
      question: `What dose of ${brandName} is used for ${label.toLowerCase()} with ${conditionName}?`,
      answer: `Dosing for ${label.toLowerCase()} is individualized. Typically, lower starting doses and more gradual increases are recommended. Your healthcare provider will determine the appropriate dose.`,
    },
    {
      question: `Are there alternatives to ${brandName} for ${label.toLowerCase()}?`,
      answer: `Several alternatives may be available depending on individual circumstances. Discuss all options with your healthcare provider to find the best fit.`,
    },
  ];
}

// Symptoms content generators
function generateSymptomsIntro(condition: ConditionData, demographic: DemographicModifier): string {
  const label = getDemographicLabel(demographic);
  return `${condition.name} can present differently in ${label.toLowerCase()} compared to other age groups. Understanding these unique manifestations helps with early recognition and appropriate treatment.`;
}

function generateSymptomsSections(condition: ConditionData, demographic: DemographicModifier): ContentSection[] {
  const label = getDemographicLabel(demographic);
  const sections: ContentSection[] = [];

  // Core symptoms with demographic context
  if (condition.content.symptoms?.core) {
    sections.push({
      id: 'core-symptoms',
      heading: `Common ${condition.name} Symptoms in ${label}`,
      content: `These symptoms may appear in ${label.toLowerCase()} with ${condition.name}:`,
      items: condition.content.symptoms.core,
      type: 'list',
    });
  }

  // Developmental stage info if available
  const stageKey = getDemographicStageKey(demographic);
  if (stageKey && condition.content.developmental_stages?.[stageKey]) {
    sections.push({
      id: 'developmental-presentation',
      heading: `How ${condition.name} Presents in ${label}`,
      content: `Unique patterns seen in ${label.toLowerCase()}:`,
      items: condition.content.developmental_stages[stageKey],
      type: 'list',
    });
  }

  // Warning signs
  if (condition.content.warning_signs) {
    sections.push({
      id: 'warning-signs',
      heading: 'Warning Signs to Watch For',
      content: `Be alert to these warning signs in ${label.toLowerCase()}:`,
      items: condition.content.warning_signs,
      type: 'warning',
    });
  }

  // When to seek help
  sections.push({
    id: 'when-to-seek-help',
    heading: 'When to Seek Professional Help',
    content: condition.content.when_to_seek_help || 'If symptoms significantly impact daily functioning, relationships, or quality of life, consult a mental health professional.',
    type: 'text',
  });

  return sections;
}

function getDemographicStageKey(demographic: DemographicModifier): 'childhood' | 'adolescence' | 'adulthood' | null {
  const mapping: Partial<Record<DemographicModifier, 'childhood' | 'adolescence' | 'adulthood'>> = {
    'children': 'childhood',
    'teenagers': 'adolescence',
    'adolescents': 'adolescence',
    'elderly': 'adulthood',
    'seniors': 'adulthood',
  };
  return mapping[demographic] || null;
}

function generateSymptomsFAQs(condition: ConditionData, demographic: DemographicModifier): FAQ[] {
  const label = getDemographicLabel(demographic);
  const conditionName = condition.name;

  return [
    {
      question: `How is ${conditionName} different in ${label.toLowerCase()}?`,
      answer: `${conditionName} can present with age-specific symptoms and patterns. In ${label.toLowerCase()}, certain symptoms may be more prominent or manifest differently than in other age groups.`,
    },
    {
      question: `At what age does ${conditionName} typically appear?`,
      answer: condition.content.age_of_onset || `${conditionName} can develop at various ages, though some age groups may be more commonly affected. Early intervention improves outcomes.`,
    },
    {
      question: `How common is ${conditionName} in ${label.toLowerCase()}?`,
      answer: condition.content.prevalence || `Prevalence varies by age group. Consult population studies or your healthcare provider for specific statistics.`,
    },
  ];
}

// Comparison content generators
function generateComparisonIntro(
  treatment1: TreatmentData,
  treatment2: TreatmentData,
  condition: ConditionData
): string {
  const brand1 = getBrandName(treatment1);
  const brand2 = getBrandName(treatment2);
  return `Both ${brand1} and ${brand2} are used to treat ${condition.name}, but they have important differences. This comparison helps you understand which might be a better fit for your situation.`;
}

function generateComparisonSections(
  treatment1: TreatmentData,
  treatment2: TreatmentData,
  condition: ConditionData
): ContentSection[] {
  const brand1 = getBrandName(treatment1);
  const brand2 = getBrandName(treatment2);

  return [
    {
      id: 'overview',
      heading: 'Overview Comparison',
      content: `${brand1}: ${treatment1.summary}\n\n${brand2}: ${treatment2.summary}`,
      type: 'text',
    },
    {
      id: 'key-differences',
      heading: 'Key Differences',
      content: 'The main differences between these medications include:',
      items: [
        `Drug class: ${treatment1.metadata?.drug_classes?.[0] || 'N/A'} vs ${treatment2.metadata?.drug_classes?.[0] || 'N/A'}`,
        `Typical onset: ${treatment1.clinical_metadata?.pharmacokinetics?.onset || 'varies'} vs ${treatment2.clinical_metadata?.pharmacokinetics?.onset || 'varies'}`,
        `Half-life: ${treatment1.clinical_metadata?.pharmacokinetics?.half_life || 'varies'} vs ${treatment2.clinical_metadata?.pharmacokinetics?.half_life || 'varies'}`,
      ],
      type: 'list',
    },
    {
      id: 'who-might-prefer',
      heading: `Who Might Prefer ${brand1} or ${brand2}`,
      content: 'The best choice depends on individual factors including other medications, side effect concerns, and personal response.',
      type: 'text',
    },
  ];
}

function generateComparisonFAQs(
  treatment1: TreatmentData,
  treatment2: TreatmentData,
  condition: ConditionData
): FAQ[] {
  const brand1 = getBrandName(treatment1);
  const brand2 = getBrandName(treatment2);

  return [
    {
      question: `Which is more effective, ${brand1} or ${brand2}?`,
      answer: `Both medications have similar effectiveness for most people. Individual response varies, and what works best depends on your specific situation and biology.`,
    },
    {
      question: `Can I switch from ${brand1} to ${brand2}?`,
      answer: `Yes, switching is possible under medical supervision. Your doctor will guide a safe transition, which may involve tapering one medication while starting the other.`,
    },
    {
      question: `Which has fewer side effects, ${brand1} or ${brand2}?`,
      answer: `Side effect profiles differ between individuals. Some people tolerate one better than the other. Your doctor can help you weigh the specific side effects of each.`,
    },
  ];
}

// Side effects content generators
function generateSideEffectsIntro(treatment: TreatmentData): string {
  const brandName = getBrandName(treatment);
  return `Like all medications, ${brandName} can cause side effects. Most are mild and improve over time, but some require medical attention. Here's what to expect and when to be concerned.`;
}

function generateSideEffectsSections(treatment: TreatmentData): ContentSection[] {
  const brandName = getBrandName(treatment);

  return [
    {
      id: 'common-side-effects',
      heading: 'Common Side Effects',
      content: `These side effects are common when starting ${brandName} and often improve within 1-2 weeks:`,
      items: [
        'Nausea or upset stomach',
        'Headache',
        'Sleep changes (drowsiness or insomnia)',
        'Fatigue',
        'Dry mouth',
        'Changes in appetite',
      ],
      type: 'list',
    },
    {
      id: 'serious-side-effects',
      heading: 'Serious Side Effects (Seek Medical Help)',
      content: 'Contact your doctor immediately if you experience:',
      items: [
        'Severe allergic reaction (rash, swelling, difficulty breathing)',
        'Unusual bleeding or bruising',
        'Severe mood changes or worsening depression',
        'Thoughts of self-harm',
        'Seizures',
        'Serotonin syndrome symptoms (agitation, rapid heartbeat, high temperature)',
      ],
      type: 'warning',
    },
    {
      id: 'managing-side-effects',
      heading: 'Tips for Managing Side Effects',
      content: 'These strategies can help reduce side effects:',
      items: [
        'Take with food if nausea occurs',
        'Take at bedtime if drowsiness is an issue (or morning if it causes insomnia)',
        'Stay hydrated',
        'Give it time—many side effects improve after the first few weeks',
        'Talk to your doctor about dose adjustments if side effects are bothersome',
      ],
      type: 'tip',
    },
  ];
}

function generateSideEffectsFAQs(treatment: TreatmentData): FAQ[] {
  const brandName = getBrandName(treatment);

  return [
    {
      question: `How long do ${brandName} side effects last?`,
      answer: `Most common side effects improve within 1-2 weeks as your body adjusts. Some, like sexual side effects, may persist. Talk to your doctor if side effects are troublesome after the adjustment period.`,
    },
    {
      question: `What happens if I stop ${brandName} suddenly?`,
      answer: `Stopping suddenly can cause discontinuation symptoms like dizziness, nausea, irritability, and "brain zaps." Always taper off gradually under medical supervision.`,
    },
    {
      question: `Does ${brandName} cause weight gain?`,
      answer: `Weight changes are possible but vary by individual. Some people gain weight, others lose it, and many experience no significant change. Lifestyle factors also play a role.`,
    },
  ];
}

// Natural alternatives content generators
function generateNaturalIntro(condition: ConditionData, isWithoutMeds: boolean): string {
  const conditionName = condition.name;
  return isWithoutMeds
    ? `Many people prefer to explore non-medication options for ${conditionName}, either as primary treatment or alongside other approaches. Evidence supports several natural methods that can make a real difference.`
    : `Natural remedies and lifestyle changes can complement or sometimes serve as alternatives to medication for ${conditionName}. Here's what the evidence says about natural approaches.`;
}

function generateNaturalSections(condition: ConditionData): ContentSection[] {
  const sections: ContentSection[] = [];

  // Therapy options
  if (condition.content.treatment_approaches?.psychotherapy) {
    sections.push({
      id: 'therapy-options',
      heading: 'Evidence-Based Therapy Options',
      content: 'These therapeutic approaches are well-supported by research:',
      items: condition.content.treatment_approaches.psychotherapy,
      type: 'list',
    });
  }

  // Lifestyle interventions
  if (condition.content.treatment_approaches?.lifestyle_interventions) {
    sections.push({
      id: 'lifestyle-changes',
      heading: 'Lifestyle Changes That Help',
      content: 'Making these changes can significantly impact symptoms:',
      items: condition.content.treatment_approaches.lifestyle_interventions,
      type: 'list',
    });
  }

  // Self-help strategies
  if (condition.content.self_help_strategies) {
    sections.push({
      id: 'self-help',
      heading: 'Self-Help Strategies',
      content: 'Try incorporating these practices into your daily routine:',
      items: condition.content.self_help_strategies,
      type: 'tip',
    });
  }

  // When medication might be needed
  sections.push({
    id: 'when-medication-needed',
    heading: 'When Medication Might Be Needed',
    content: `Natural approaches work well for many people, but medication may be necessary if symptoms are severe, significantly impair daily functioning, or don't respond to other treatments. There's no shame in needing medication—it's about finding what works for you.`,
    type: 'text',
  });

  return sections;
}

function generateNaturalFAQs(condition: ConditionData): FAQ[] {
  const conditionName = condition.name;

  return [
    {
      question: `Can ${conditionName} be treated without medication?`,
      answer: `Yes, many people manage ${conditionName} effectively with therapy, lifestyle changes, and self-help strategies. The best approach depends on symptom severity and individual response.`,
    },
    {
      question: `What supplements help with ${conditionName}?`,
      answer: `Some supplements may help, but evidence varies. Always consult your healthcare provider before starting supplements, as they can interact with medications and have their own side effects.`,
    },
    {
      question: `How long does natural treatment take to work?`,
      answer: `Natural approaches often require consistent practice over weeks to months. Therapy typically shows benefits within 8-12 sessions, while lifestyle changes may take several weeks to show full effects.`,
    },
  ];
}

