/**
 * People Also Ask (PAA) Question Templates
 * 
 * These are the exact question patterns Google shows in "People Also Ask" boxes.
 * Adding these as FAQs to condition/treatment pages dramatically increases
 * chances of appearing in PAA and AI Overviews.
 * 
 * Data sourced from actual Google PAA mining for mental health queries.
 */

export interface PAA_Question {
  pattern: string;
  answer_template: string;
}

/**
 * Condition-specific PAA patterns
 * {condition} will be replaced with the condition name
 */
export const CONDITION_PAA_PATTERNS: PAA_Question[] = [
  {
    pattern: "What are the 5 signs of {condition}?",
    answer_template: "The five key signs of {condition} include: {symptom_1}, {symptom_2}, {symptom_3}, {symptom_4}, and {symptom_5}. These symptoms typically persist for at least two weeks and cause significant distress or impairment in daily functioning."
  },
  {
    pattern: "What causes {condition}?",
    answer_template: "{condition} is caused by a combination of genetic, biological, environmental, and psychological factors. There is no single cause - rather, it develops from the interaction of inherited vulnerability, brain chemistry changes, stressful life events, and learned patterns of thinking."
  },
  {
    pattern: "Can {condition} be cured?",
    answer_template: "While there is no permanent 'cure' for {condition}, it is highly treatable. Many people achieve full remission with appropriate treatment including therapy, medication, or both. With proper management, most individuals with {condition} can lead fulfilling, productive lives."
  },
  {
    pattern: "How is {condition} diagnosed?",
    answer_template: "{condition} is diagnosed by a mental health professional through clinical interview, symptom assessment, and ruling out other conditions. There's no blood test or brain scan that can diagnose it - diagnosis is based on DSM-5 criteria, which require specific symptoms lasting for a defined period."
  },
  {
    pattern: "What is the best treatment for {condition}?",
    answer_template: "The most effective treatment for {condition} typically combines psychotherapy (such as CBT) with medication when needed. Treatment is personalized - what works best depends on symptom severity, individual preferences, and response to initial treatment. Early intervention improves outcomes significantly."
  },
  {
    pattern: "Is {condition} a disability?",
    answer_template: "{condition} can qualify as a disability under the ADA if it substantially limits major life activities. Many people with {condition} are eligible for workplace accommodations or disability benefits. The key factor is how significantly the condition impairs functioning, not the diagnosis itself."
  },
  {
    pattern: "How long does {condition} last?",
    answer_template: "The duration of {condition} varies widely. Some people experience a single episode lasting months, while others have recurrent or chronic symptoms. With treatment, most acute episodes improve within 4-8 weeks. Long-term management often prevents relapse."
  },
  {
    pattern: "What happens if {condition} is left untreated?",
    answer_template: "Untreated {condition} typically worsens over time and can lead to: relationship problems, job loss, substance abuse, physical health complications, and increased risk of self-harm. Early treatment significantly improves long-term outcomes and quality of life."
  },
];

/**
 * Medication-specific PAA patterns
 * {medication} will be replaced with the medication name
 * {generic} will be replaced with the generic name
 */
export const MEDICATION_PAA_PATTERNS: PAA_Question[] = [
  {
    pattern: "What is {medication} used for?",
    answer_template: "{medication} ({generic}) is primarily prescribed for {primary_indications}. It may also be used off-label for {off_label_uses}. It belongs to the {drug_class} class of medications."
  },
  {
    pattern: "What are the side effects of {medication}?",
    answer_template: "Common side effects of {medication} include {common_side_effects}. Most side effects are mild and improve within the first few weeks. Serious but rare side effects include {serious_side_effects}. Contact your doctor if side effects persist or worsen."
  },
  {
    pattern: "How long does it take for {medication} to work?",
    answer_template: "{medication} typically takes {onset_time} to show initial effects, with full benefits often seen after {full_effect_time}. Don't stop taking it early if you don't feel immediate improvement - antidepressants need consistent use to work properly."
  },
  {
    pattern: "Is {medication} addictive?",
    answer_template: "{medication} is {addiction_profile}. While it's not addictive in the traditional sense, stopping suddenly can cause discontinuation symptoms. Always taper off under medical supervision rather than stopping abruptly."
  },
  {
    pattern: "Can you drink alcohol with {medication}?",
    answer_template: "Drinking alcohol while taking {medication} is generally not recommended. Alcohol can worsen side effects like drowsiness and dizziness, reduce the medication's effectiveness, and increase depression symptoms. If you choose to drink, discuss safe limits with your doctor."
  },
  {
    pattern: "What happens if you miss a dose of {medication}?",
    answer_template: "If you miss a dose of {medication}, take it as soon as you remember - unless it's close to your next scheduled dose. Never double up doses. Missing occasional doses is usually not serious, but consistent dosing provides best results."
  },
  {
    pattern: "Can you stop taking {medication} suddenly?",
    answer_template: "No, you should not stop taking {medication} suddenly. Abrupt discontinuation can cause withdrawal-like symptoms including dizziness, nausea, anxiety, and 'brain zaps.' Work with your doctor to gradually taper the dose over several weeks."
  },
];

/**
 * Therapy-specific PAA patterns
 */
export const THERAPY_PAA_PATTERNS: PAA_Question[] = [
  {
    pattern: "What is {therapy} therapy?",
    answer_template: "{therapy} is a structured, evidence-based form of psychotherapy that {mechanism}. It typically involves {session_structure} and focuses on {focus_areas}. Research shows it's effective for treating {effective_for}."
  },
  {
    pattern: "How long does {therapy} take to work?",
    answer_template: "Most people notice improvements from {therapy} within {initial_improvement}. A typical course of treatment lasts {typical_duration}. Some people benefit from shorter-term treatment while others prefer ongoing therapy for maintenance."
  },
  {
    pattern: "Is {therapy} covered by insurance?",
    answer_template: "{therapy} is typically covered by health insurance when provided by a licensed mental health professional. Coverage varies by plan - check with your insurer about mental health benefits, copays, and any session limits."
  },
  {
    pattern: "Can I do {therapy} online?",
    answer_template: "Yes, {therapy} can be effectively delivered online through video sessions. Research shows online therapy is as effective as in-person for most conditions. Many therapists offer teletherapy, and some platforms specialize in {therapy} specifically."
  },
];

/**
 * Generate condition-specific FAQs from PAA patterns
 */
export function generateConditionFAQs(
  conditionName: string,
  symptoms: string[],
): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];
  
  // Take top 5 symptoms for the "5 signs" question
  const topSymptoms = symptoms.slice(0, 5);
  
  for (const pattern of CONDITION_PAA_PATTERNS.slice(0, 5)) {
    let question = pattern.pattern.replace(/{condition}/g, conditionName);
    let answer = pattern.answer_template.replace(/{condition}/g, conditionName);
    
    // Replace symptom placeholders if present
    topSymptoms.forEach((symptom, i) => {
      answer = answer.replace(`{symptom_${i + 1}}`, symptom.toLowerCase());
    });
    
    // Clean up any remaining placeholders
    answer = answer.replace(/{symptom_\d+}/g, "changes in daily functioning");
    
    faqs.push({ q: question, a: answer });
  }
  
  return faqs;
}

/**
 * High-value PAA questions for mental health (generic)
 * These can be added to hub pages or articles
 */
export const GENERIC_MENTAL_HEALTH_PAA = [
  {
    q: "What are the 5 most common mental disorders?",
    a: "The five most common mental disorders are: 1) Anxiety disorders (including GAD, panic disorder, social anxiety), 2) Major depressive disorder, 3) PTSD and trauma-related disorders, 4) ADHD, and 5) Substance use disorders. Together, these affect hundreds of millions of people worldwide."
  },
  {
    q: "How do I know if I need therapy?",
    a: "Consider therapy if you're experiencing: persistent sadness or anxiety lasting more than two weeks, difficulty functioning at work or in relationships, sleep problems, substance use to cope, thoughts of self-harm, or simply feeling 'stuck.' You don't need a crisis to benefit from therapy - it helps with personal growth too."
  },
  {
    q: "What's the difference between a psychiatrist and psychologist?",
    a: "Psychiatrists are medical doctors (MD/DO) who can prescribe medication and often focus on the biological aspects of mental health. Psychologists have doctoral degrees (PhD/PsyD) and specialize in psychotherapy and psychological testing. Many people see both - a psychiatrist for medication management and a psychologist for therapy."
  },
  {
    q: "Are mental health medications safe?",
    a: "Mental health medications are generally safe when prescribed and monitored by a qualified professional. Like all medications, they have potential side effects that vary by drug class and individual. The benefits typically outweigh risks for people with moderate to severe symptoms. Never start or stop psychiatric medications without medical guidance."
  },
  {
    q: "Can mental illness be prevented?",
    a: "While mental illness can't always be prevented, risk can be reduced through: maintaining social connections, regular exercise, adequate sleep, stress management, limiting alcohol/drugs, and early intervention when symptoms appear. For those with genetic risk, preventive therapy can reduce likelihood of developing certain conditions."
  },
];


