/**
 * Approved Symptom Registry
 *
 * Curated registry of canonical symptom entities.
 * Each entity has been editorially reviewed and mapped to condition content.
 *
 * This is the source of truth for indexable symptom pages.
 * Only entities marked as indexable:true and reviewed:true will have
 * statically generated pages and appear in the sitemap.
 */

import type {
  SymptomEntity,
  SymptomCategory,
  SymptomCategoryMeta,
} from "./types";

/**
 * Category metadata for UI and navigation
 */
export const SYMPTOM_CATEGORIES: SymptomCategoryMeta[] = [
  {
    id: "mood-motivation",
    name: "Mood & Motivation",
    description: "Changes in how you feel emotionally or your drive to do things",
    icon: "heart",
  },
  {
    id: "worry-fear",
    name: "Worry & Fear",
    description: "Persistent concerns, anxiety, or fears that feel hard to control",
    icon: "shield-alert",
  },
  {
    id: "sleep",
    name: "Sleep",
    description: "Difficulty falling asleep, staying asleep, or sleeping too much",
    icon: "moon",
  },
  {
    id: "attention-memory",
    name: "Attention & Memory",
    description: "Trouble focusing, concentrating, or remembering things",
    icon: "brain",
  },
  {
    id: "thoughts-perceptions",
    name: "Thoughts & Perceptions",
    description: "Unusual thoughts, beliefs, or ways of perceiving the world",
    icon: "eye",
  },
  {
    id: "trauma-stress",
    name: "Trauma & Stress",
    description: "Responses to difficult or overwhelming experiences",
    icon: "shield",
  },
  {
    id: "eating-body-image",
    name: "Eating & Body Image",
    description: "Concerns about eating, weight, or how your body looks",
    icon: "utensils",
  },
  {
    id: "energy-physical",
    name: "Energy & Physical",
    description: "Changes in energy levels or physical sensations",
    icon: "battery",
  },
  {
    id: "behavior-impulses",
    name: "Behavior & Impulses",
    description: "Difficulty controlling actions or urges",
    icon: "zap",
  },
  {
    id: "relationships-social",
    name: "Relationships & Social",
    description: "Difficulties with social connections or interactions",
    icon: "users",
  },
];

/**
 * Get category metadata by ID
 */
export function getCategoryMeta(id: SymptomCategory): SymptomCategoryMeta | undefined {
  return SYMPTOM_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * The approved symptom registry
 * Each entity represents a canonical symptom that can have an indexable page
 */
export const SYMPTOM_REGISTRY: SymptomEntity[] = [
  // ============================================================================
  // MOOD & MOTIVATION
  // ============================================================================
  {
    slug: "low-mood",
    name: "Low Mood",
    shortDefinition:
      "Persistent feelings of sadness, emptiness, or hopelessness that last most of the day and feel different from normal sadness.",
    aliases: [
      "feeling sad",
      "persistent sadness",
      "feeling down",
      "feeling blue",
      "depressed mood",
      "feeling empty",
    ],
    searchPhrases: [
      "why do I feel sad all the time",
      "can't shake this sadness",
      "feeling hopeless",
      "everything feels gray",
    ],
    category: "mood-motivation",
    examples: [
      {
        text: "Some people describe waking up with a heavy feeling that colors everything, making even favorite activities feel flat or meaningless.",
              },
      {
        text: "For example, getting through the workday might feel like moving through fog, with a persistent weight that doesn't lift even during breaks or good news.",
              },
      {
        text: "This might look like going through daily routines but feeling disconnected from any sense of enjoyment or satisfaction, even from things that used to bring pleasure.",
              },
    ],
    relatedSymptoms: ["loss-of-interest", "fatigue", "emotional-numbness"],
    conditionRelationships: [
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Depressed mood most of the day, nearly every day"],
        context: "Low mood is a core feature that persists for at least two weeks and represents a change from previous functioning.",
      },
      {
        conditionSlug: "persistent-depressive-disorder",
        conditionName: "Persistent Depressive Disorder",
        symptomText: ["Depressed mood for most of the day, more days than not"],
        context: "With this pattern, low mood persists for years rather than weeks, often becoming so familiar it feels like 'just how I am.'",
      },
      {
        conditionSlug: "bipolar-disorder",
        conditionName: "Bipolar Disorder",
        symptomText: ["Depressive episodes with low mood"],
        context: "Low mood can occur during depressive episodes, which alternate with periods of elevated mood or energy.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Thyroid conditions (hypothyroidism) can cause persistent low mood",
      "Sleep disorders may contribute to mood changes",
      "Certain medications list mood changes as a side effect",
      "Grief and major life transitions often involve temporary low mood",
      "Chronic pain or illness can affect mood",
      "Nutritional deficiencies (vitamin D, B12) may play a role",
    ],
    whenToSeekHelp: [
      "When low mood persists for more than two weeks",
      "When it significantly interferes with daily responsibilities",
      "When experiencing thoughts of self-harm or suicide",
      "When physical symptoms like sleep or appetite changes accompany mood changes",
    ],
    assessmentLinks: [
      {
        label: "PHQ-9 Depression Screener",
        href: "/resources/assessments-screeners/phq-9",
        relevance: "Screens for depressive symptoms including low mood",
      },
    ],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "loss-of-interest",
    name: "Loss of Interest",
    shortDefinition:
      "Diminished interest or pleasure in activities that you used to enjoy, sometimes called anhedonia.",
    aliases: [
      "anhedonia",
      "nothing feels enjoyable",
      "lost interest in hobbies",
      "don't enjoy things anymore",
      "things feel pointless",
    ],
    searchPhrases: [
      "why don't I enjoy anything anymore",
      "lost passion for hobbies",
      "nothing makes me happy",
      "activities feel meaningless",
    ],
    category: "mood-motivation",
    examples: [
      {
        text: "This might look like putting off activities that once brought joy, not because of lack of time, but because they just don't seem appealing anymore.",
              },
      {
        text: "Some people describe scrolling through their contacts wanting to reach out to friends, but feeling no real desire to actually connect.",
                context: "relationships",
      },
      {
        text: "For example, a musician might stop practicing not because they're too busy, but because picking up the instrument feels like it requires more energy than it's worth.",
              },
    ],
    relatedSymptoms: ["low-mood", "fatigue", "social-withdrawal"],
    conditionRelationships: [
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Markedly diminished interest or pleasure in all, or almost all, activities"],
        context: "Loss of interest is one of two core symptoms required for diagnosis, alongside low mood.",
      },
      {
        conditionSlug: "persistent-depressive-disorder",
        conditionName: "Persistent Depressive Disorder",
        symptomText: ["Poor appetite or overeating", "Low energy or fatigue"],
        context: "Often accompanies the chronic low mood of this condition.",
      },
      {
        conditionSlug: "schizophrenia",
        conditionName: "Schizophrenia",
        symptomText: ["Avolition", "Diminished emotional expression"],
        context: "Can occur as part of negative symptoms, representing reduced motivation and pleasure.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Burnout from work or caregiving can temporarily reduce interest in activities",
      "Major life changes may shift what feels engaging",
      "Certain medications can blunt emotions and reduce pleasure",
      "Chronic illness or pain can make activities feel less appealing",
    ],
    whenToSeekHelp: [
      "When loss of interest persists for more than two weeks",
      "When it affects your relationships or work",
      "When accompanied by other mood changes",
      "When you can't identify an external cause",
    ],
    assessmentLinks: [
      {
        label: "PHQ-9 Depression Screener",
        href: "/resources/assessments-screeners/phq-9",
        relevance: "Includes questions about interest and pleasure",
      },
    ],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "irritability",
    name: "Irritability",
    shortDefinition:
      "Feeling easily annoyed, frustrated, or angered by things that wouldn't normally bother you, or reacting more intensely than the situation calls for.",
    aliases: [
      "feeling irritable",
      "short temper",
      "easily frustrated",
      "snapping at people",
      "feeling on edge",
      "low frustration tolerance",
    ],
    searchPhrases: [
      "why am I so irritable",
      "snapping at everyone",
      "little things make me angry",
      "can't control my temper",
    ],
    category: "mood-motivation",
    examples: [
      {
        text: "Some people describe feeling like they're always one small inconvenience away from losing their patience, even when they know the situation doesn't warrant such a strong reaction.",
              },
      {
        text: "This might look like snapping at family members over minor issues, then feeling guilty afterwards but unable to prevent it from happening again.",
                context: "relationships",
      },
      {
        text: "For example, traffic delays or slow internet that would normally be mildly annoying might trigger intense frustration that feels disproportionate.",
                context: "everyday",
      },
    ],
    relatedSymptoms: ["mood-swings", "feeling-overwhelmed", "restlessness"],
    conditionRelationships: [
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Irritable mood"],
        context: "Irritability can be a prominent feature of depression, especially in children and adolescents, sometimes even more noticeable than sadness.",
      },
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Irritability"],
        context: "Constant worry can leave little mental reserve, making minor frustrations feel overwhelming.",
      },
      {
        conditionSlug: "bipolar-disorder",
        conditionName: "Bipolar Disorder",
        symptomText: ["Irritable mood during manic or hypomanic episodes"],
        context: "Can occur during elevated mood states, sometimes instead of or alongside euphoria.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Sleep deprivation commonly causes irritability",
      "Hunger and blood sugar fluctuations can affect mood",
      "Hormonal changes (menstrual cycle, menopause, thyroid) can increase irritability",
      "Chronic pain or discomfort can lower tolerance",
      "Caffeine withdrawal or excessive caffeine intake",
      "Chronic stress and burnout",
    ],
    whenToSeekHelp: [
      "When irritability is affecting your relationships",
      "When you notice it's out of proportion to situations",
      "When it's accompanied by other mood or sleep changes",
      "When you're concerned about acting on angry impulses",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "mood-swings",
    name: "Mood Swings",
    shortDefinition:
      "Rapid or unpredictable shifts in emotional state, moving between different moods more quickly or intensely than feels typical for you.",
    aliases: [
      "emotional ups and downs",
      "emotional instability",
      "rapid mood changes",
      "emotional rollercoaster",
      "mood fluctuations",
    ],
    searchPhrases: [
      "why do my moods change so fast",
      "emotional rollercoaster",
      "moods all over the place",
      "can't stabilize my emotions",
    ],
    category: "mood-motivation",
    examples: [
      {
        text: "Some people describe feeling fine one moment and then deeply upset the next, sometimes without any clear trigger.",
              },
      {
        text: "This might look like going from energized and optimistic in the morning to feeling hopeless by evening, with the shifts feeling confusing and hard to predict.",
              },
      {
        text: "For example, a minor disappointment might trigger intense sadness that feels overwhelming but then lifts within hours.",
              },
    ],
    relatedSymptoms: ["irritability", "emotional-numbness", "feeling-overwhelmed"],
    conditionRelationships: [
      {
        conditionSlug: "bipolar-disorder",
        conditionName: "Bipolar Disorder",
        symptomText: ["Distinct periods of abnormally elevated, expansive, or irritable mood"],
        context: "Involves distinct episodes lasting days to weeks, not moment-to-moment shifts within a single day.",
      },
      {
        conditionSlug: "borderline-personality-disorder",
        conditionName: "Borderline Personality Disorder",
        symptomText: ["Affective instability due to marked reactivity of mood"],
        context: "Mood shifts tend to be rapid (hours), intense, and often triggered by interpersonal events.",
      },
      {
        conditionSlug: "premenstrual-dysphoric-disorder",
        conditionName: "Premenstrual Dysphoric Disorder",
        symptomText: ["Marked affective lability"],
        context: "Mood swings occur in a predictable pattern related to the menstrual cycle.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Hormonal fluctuations (menstrual cycle, perimenopause, thyroid)",
      "Sleep deprivation can destabilize mood",
      "Blood sugar swings may contribute",
      "Some medications can affect mood stability",
      "High stress periods can increase emotional reactivity",
      "Substance use and withdrawal",
    ],
    whenToSeekHelp: [
      "When mood swings significantly impact relationships or work",
      "When you notice patterns that concern you",
      "When the shifts feel uncontrollable",
      "When accompanied by impulsive behaviors you regret",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "emotional-numbness",
    name: "Emotional Numbness",
    shortDefinition:
      "Feeling disconnected from your emotions, as if you can't access feelings like joy, sadness, or love that you know should be there.",
    aliases: [
      "feeling numb",
      "emotional blunting",
      "can't feel anything",
      "disconnected from emotions",
      "flat affect",
    ],
    searchPhrases: [
      "why can't I feel emotions",
      "emotionally numb",
      "feel nothing inside",
      "disconnected from feelings",
    ],
    category: "mood-motivation",
    examples: [
      {
        text: "Some people describe going through the motions of daily life but feeling like they're watching themselves from a distance, unable to connect with what they're doing.",
              },
      {
        text: "This might look like receiving good news and knowing you should feel happy, but experiencing only a blank emptiness.",
              },
      {
        text: "For example, being at a family celebration and noticing that you feel nothing, even though you can see everyone else is engaged and joyful.",
                context: "relationships",
      },
    ],
    relatedSymptoms: ["loss-of-interest", "low-mood"],
    conditionRelationships: [
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Diminished interest or pleasure", "Psychomotor retardation"],
        context: "Emotional numbness can be part of severe depression, where the capacity to feel seems dulled.",
      },
      {
        conditionSlug: "post-traumatic-stress-disorder",
        conditionName: "Post-Traumatic Stress Disorder",
        symptomText: ["Emotional numbing", "Detachment from others"],
        context: "Can develop as a protective response to overwhelming experiences.",
      },
      {
        conditionSlug: "depersonalization-derealization-disorder",
        conditionName: "Depersonalization-Derealization Disorder",
        symptomText: ["Experiences of unreality or detachment"],
        context: "Feeling disconnected from one's emotions is a core feature.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Some medications (including antidepressants) can cause emotional blunting",
      "Severe stress or shock can temporarily cause numbing",
      "Sleep deprivation can dull emotional responses",
      "Grief can involve periods of numbness",
      "Burnout may lead to emotional exhaustion",
    ],
    whenToSeekHelp: [
      "When numbness persists beyond a few weeks",
      "When it follows a traumatic event",
      "When it's affecting your relationships",
      "When you started a new medication and noticed this change",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },

  // ============================================================================
  // WORRY & FEAR
  // ============================================================================
  {
    slug: "persistent-worry",
    name: "Persistent Worry",
    shortDefinition:
      "Ongoing, hard-to-control worry about multiple areas of life that feels excessive compared to the actual likelihood or impact of the feared events.",
    aliases: [
      "constant worry",
      "chronic anxiety",
      "excessive worrying",
      "can't stop worrying",
      "always anxious",
      "worry all the time",
    ],
    searchPhrases: [
      "why do I worry so much",
      "can't stop thinking about what could go wrong",
      "always worried about something",
      "anxious about everything",
    ],
    category: "worry-fear",
    examples: [
      {
        text: "Some people describe their mind jumping from one worry to another throughout the day, never quite settling, even when things are going well.",
              },
      {
        text: "This might look like spending hours imagining worst-case scenarios about work, health, family, and finances, cycling through concerns without resolution.",
                context: "everyday",
      },
      {
        text: "For example, a small deadline at work might trigger spiraling thoughts about job security, financial ruin, and disappointing loved ones.",
                context: "work-school",
      },
    ],
    relatedSymptoms: ["difficulty-concentrating", "restlessness", "trouble-sleeping"],
    conditionRelationships: [
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Excessive anxiety and worry occurring more days than not"],
        context: "Persistent worry about multiple domains is the core feature, lasting at least six months.",
      },
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Anxiety and worry"],
        context: "Worry often accompanies depression, sometimes focusing on past regrets or current inadequacies.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Caffeine and stimulants can increase anxiety and worry",
      "Thyroid disorders can cause anxiety symptoms",
      "Major life changes naturally increase worry temporarily",
      "Some medications have anxiety as a side effect",
      "Sleep deprivation amplifies anxious thinking",
    ],
    whenToSeekHelp: [
      "When worry occupies most of your day",
      "When it's hard to control despite trying",
      "When physical symptoms accompany the worry (tension, restlessness, sleep problems)",
      "When it's been going on for months",
    ],
    assessmentLinks: [
      {
        label: "GAD-7 Anxiety Screener",
        href: "/resources/assessments-screeners/gad-7",
        relevance: "Screens for generalized anxiety symptoms including worry",
      },
    ],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "racing-thoughts",
    name: "Racing Thoughts",
    shortDefinition:
      "Thoughts that move rapidly from one to another, sometimes feeling uncontrollable or overwhelming, making it hard to focus on any single thing.",
    aliases: [
      "mind racing",
      "thoughts won't slow down",
      "mental chatter",
      "can't quiet my mind",
      "thoughts going too fast",
    ],
    searchPhrases: [
      "why won't my mind slow down",
      "thoughts racing at night",
      "can't turn off my brain",
      "mind won't stop",
    ],
    category: "attention-memory",
    examples: [
      {
        text: "Some people describe their thoughts as a radio that can't be tuned to one station, constantly jumping between frequencies.",
              },
      {
        text: "This might look like lying in bed with thoughts bouncing rapidly from one topic to another, making sleep feel impossible.",
                context: "everyday",
      },
      {
        text: "For example, trying to work on a task but your mind keeps generating new ideas, reminders, and tangents faster than you can process them.",
                context: "work-school",
      },
    ],
    relatedSymptoms: ["difficulty-concentrating", "trouble-sleeping", "restlessness"],
    conditionRelationships: [
      {
        conditionSlug: "bipolar-disorder",
        conditionName: "Bipolar Disorder",
        symptomText: ["Flight of ideas or subjective experience that thoughts are racing"],
        context: "Racing thoughts during manic or hypomanic episodes often feel pleasurable and creative, though overwhelming.",
      },
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Difficulty controlling worry", "Restlessness"],
        context: "Anxious racing thoughts tend to circle around worries and concerns rather than creative ideas.",
      },
      {
        conditionSlug: "attention-deficit-hyperactivity-disorder",
        conditionName: "ADHD",
        symptomText: ["Difficulty sustaining attention", "Often 'on the go'"],
        context: "Can involve a constant flow of thoughts and difficulty filtering, though typically consistent rather than episodic.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Caffeine and stimulants can speed up thinking",
      "Sleep deprivation can cause racing thoughts at night",
      "High stress naturally increases mental activity",
      "Some medications can cause this as a side effect",
      "Thyroid conditions may contribute",
    ],
    whenToSeekHelp: [
      "When racing thoughts prevent sleep consistently",
      "When they're accompanied by changes in energy or behavior",
      "When they feel very different from your normal mental state",
      "When they interfere with daily functioning",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "panic-episodes",
    name: "Panic-Like Episodes",
    shortDefinition:
      "Sudden surges of intense fear or discomfort that peak within minutes and include physical symptoms like racing heart, shortness of breath, or feeling like something terrible is happening.",
    aliases: [
      "panic attacks",
      "anxiety attacks",
      "sudden overwhelming fear",
      "intense anxiety episodes",
      "feeling like I'm dying",
    ],
    searchPhrases: [
      "am I having a panic attack",
      "sudden overwhelming fear",
      "heart racing for no reason",
      "feel like I'm going to die",
    ],
    category: "worry-fear",
    examples: [
      {
        text: "Some people describe a sudden wave of terror that comes out of nowhere, with their heart pounding, chest tight, and a conviction that something is very wrong.",
              },
      {
        text: "This might look like sitting in a meeting when suddenly breathing becomes difficult, hands go numb, and an overwhelming urge to escape takes over.",
                context: "work-school",
      },
      {
        text: "For example, waking up in the middle of the night with your heart racing, sweating, and a sense of impending doom that takes time to subside.",
              },
    ],
    relatedSymptoms: ["persistent-worry", "avoidance", "feeling-on-edge"],
    conditionRelationships: [
      {
        conditionSlug: "panic-disorder",
        conditionName: "Panic Disorder",
        symptomText: ["Recurrent unexpected panic attacks", "Persistent concern about additional attacks"],
        context: "Involves repeated panic attacks and worry about having more, leading to behavioral changes.",
      },
      {
        conditionSlug: "social-anxiety-disorder",
        conditionName: "Social Anxiety Disorder",
        symptomText: ["Physical symptoms in social situations"],
        context: "Panic-like symptoms may occur specifically in social or performance situations.",
      },
      {
        conditionSlug: "post-traumatic-stress-disorder",
        conditionName: "Post-Traumatic Stress Disorder",
        symptomText: ["Intense physiological reactions to trauma reminders"],
        context: "Can be triggered by reminders of traumatic experiences.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Cardiac conditions can cause similar symptoms and should be evaluated",
      "Thyroid problems may cause palpitations and anxiety",
      "Caffeine, alcohol, and some substances can trigger panic-like symptoms",
      "Some medications have panic-like side effects",
      "Asthma and respiratory conditions can cause similar sensations",
      "Blood sugar drops may cause similar symptoms",
    ],
    whenToSeekHelp: [
      "First time experiencing these symptoms (to rule out medical causes)",
      "When episodes are recurring",
      "When you're changing your behavior to avoid potential triggers",
      "When symptoms significantly impact daily life",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "feeling-on-edge",
    name: "Feeling On Edge",
    shortDefinition:
      "A persistent state of alertness or tension, as if something bad might happen at any moment, making it hard to relax.",
    aliases: [
      "always on alert",
      "can't relax",
      "feeling tense",
      "hypervigilance",
      "keyed up",
      "nervous energy",
    ],
    searchPhrases: [
      "why can't I relax",
      "always waiting for something bad",
      "constantly tense",
      "can't let my guard down",
    ],
    category: "worry-fear",
    examples: [
      {
        text: "Some people describe a constant background hum of alertness, as if their body is always prepared for danger even when they know they're safe.",
              },
      {
        text: "This might look like being unable to sit through a movie without checking your phone, your surroundings, or feeling restless.",
                context: "everyday",
      },
      {
        text: "For example, at a family dinner, scanning the room, noticing every noise, and struggling to fully engage in conversation because part of your attention is elsewhere.",
                context: "relationships",
      },
    ],
    relatedSymptoms: ["persistent-worry", "restlessness", "trouble-sleeping"],
    conditionRelationships: [
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Feeling keyed up or on edge", "Restlessness"],
        context: "This keyed-up feeling accompanies the persistent worry and is one of the diagnostic criteria.",
      },
      {
        conditionSlug: "post-traumatic-stress-disorder",
        conditionName: "Post-Traumatic Stress Disorder",
        symptomText: ["Hypervigilance", "Exaggerated startle response"],
        context: "Hyperarousal symptoms develop after trauma, keeping the nervous system in a protective alert state.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Caffeine and stimulants increase alertness",
      "Sleep deprivation can cause a wired-but-tired state",
      "Some medications have stimulating effects",
      "Chronic stress keeps the nervous system activated",
      "Thyroid conditions can cause nervousness",
    ],
    whenToSeekHelp: [
      "When you can't remember the last time you felt truly relaxed",
      "When it's affecting sleep or daily functioning",
      "When accompanied by other anxiety symptoms",
      "When it follows a traumatic or highly stressful event",
    ],
    assessmentLinks: [
      {
        label: "GAD-7 Anxiety Screener",
        href: "/resources/assessments-screeners/gad-7",
        relevance: "Includes questions about feeling on edge and restlessness",
      },
    ],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "avoidance",
    name: "Avoidance",
    shortDefinition:
      "Staying away from situations, places, activities, or thoughts that trigger anxiety or distress, even when avoidance creates problems in your life.",
    aliases: [
      "avoiding situations",
      "staying away from triggers",
      "can't face certain things",
      "escape behaviors",
      "withdrawing from activities",
    ],
    searchPhrases: [
      "why do I avoid everything",
      "can't face certain situations",
      "avoiding things making life smaller",
      "too anxious to do things",
    ],
    category: "worry-fear",
    examples: [
      {
        text: "Some people describe their world gradually shrinking as more places and activities get added to the 'too uncomfortable' list.",
              },
      {
        text: "This might look like declining social invitations repeatedly because the anticipatory anxiety feels overwhelming, even though you miss connecting with friends.",
                context: "relationships",
      },
      {
        text: "For example, taking longer routes to avoid highways, then avoiding driving altogether, then becoming uncomfortable leaving the house.",
                context: "everyday",
      },
    ],
    relatedSymptoms: ["persistent-worry", "social-withdrawal", "panic-episodes"],
    conditionRelationships: [
      {
        conditionSlug: "social-anxiety-disorder",
        conditionName: "Social Anxiety Disorder",
        symptomText: ["Avoidance of public speaking, meeting new people, eating in public"],
        context: "Avoiding social situations is a core feature, driven by fear of judgment or embarrassment.",
      },
      {
        conditionSlug: "post-traumatic-stress-disorder",
        conditionName: "Post-Traumatic Stress Disorder",
        symptomText: ["Avoidance of trauma reminders", "Avoidance of thoughts or feelings about the trauma"],
        context: "Avoiding reminders of traumatic experiences is a hallmark symptom.",
      },
      {
        conditionSlug: "agoraphobia",
        conditionName: "Agoraphobia",
        symptomText: ["Avoidance of situations where escape might be difficult"],
        context: "Fear and avoidance of situations like crowds, public transportation, or being alone outside the home.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Some avoidance is healthy and protective",
      "Temporary avoidance during recovery from illness or stress can be appropriate",
      "Cultural factors may influence what feels comfortable",
    ],
    whenToSeekHelp: [
      "When avoidance is limiting your work, relationships, or daily activities",
      "When the list of things you avoid keeps growing",
      "When you recognize avoidance isn't solving the problem",
      "When you want to do things but anxiety prevents you",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "intrusive-thoughts",
    name: "Intrusive Thoughts",
    shortDefinition:
      "Unwanted, distressing thoughts, images, or urges that pop into your mind uninvited and feel contrary to who you are or what you want.",
    aliases: [
      "unwanted thoughts",
      "disturbing thoughts",
      "thoughts I can't control",
      "scary thoughts",
      "bad thoughts",
    ],
    searchPhrases: [
      "why do I have disturbing thoughts",
      "thoughts I don't want to have",
      "can't stop terrible thoughts",
      "scary thoughts out of nowhere",
    ],
    category: "thoughts-perceptions",
    examples: [
      {
        text: "Some people describe sudden, vivid images of harm coming to loved ones, even though they would never want anything bad to happen.",
              },
      {
        text: "This might look like a thought popping in while driving about swerving into traffic, even though there's no desire to do so and the thought feels horrifying.",
                context: "everyday",
      },
      {
        text: "For example, holding a baby and suddenly having an image of dropping them, then spending hours worrying about what this thought means about you.",
              },
    ],
    relatedSymptoms: ["persistent-worry", "difficulty-concentrating"],
    conditionRelationships: [
      {
        conditionSlug: "obsessive-compulsive-disorder",
        conditionName: "Obsessive-Compulsive Disorder",
        symptomText: ["Obsessions: recurrent, persistent thoughts, urges, or images that are intrusive and unwanted"],
        context: "Intrusive thoughts become obsessions when they cause significant distress and lead to compulsive behaviors or mental rituals.",
      },
      {
        conditionSlug: "post-traumatic-stress-disorder",
        conditionName: "Post-Traumatic Stress Disorder",
        symptomText: ["Intrusive memories", "Distressing dreams"],
        context: "Intrusive thoughts and memories of traumatic events are core symptoms.",
      },
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Excessive worry"],
        context: "Anxious thoughts can feel intrusive, though they typically center on realistic worries rather than taboo or horrifying content.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Most people experience intrusive thoughts occasionally without them being problematic",
      "Stress and sleep deprivation can increase intrusive thoughts",
      "New life roles (new parent, new responsibilities) can trigger intrusive thoughts",
      "Caffeine and stimulants may increase mental chatter",
    ],
    whenToSeekHelp: [
      "When intrusive thoughts cause significant distress",
      "When you spend a lot of time trying to neutralize or suppress them",
      "When they're affecting your daily functioning",
      "When you're avoiding activities because of the thoughts",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },

  // ============================================================================
  // ATTENTION & MEMORY
  // ============================================================================
  {
    slug: "difficulty-concentrating",
    name: "Difficulty Concentrating",
    shortDefinition:
      "Trouble focusing attention on tasks, maintaining concentration, or following through on activities, making it hard to complete work or engage fully.",
    aliases: [
      "can't focus",
      "trouble paying attention",
      "mind wandering",
      "brain fog",
      "concentration problems",
      "easily distracted",
    ],
    searchPhrases: [
      "why can't I focus",
      "keep zoning out",
      "mind keeps wandering",
      "can't concentrate at work",
    ],
    category: "attention-memory",
    examples: [
      {
        text: "Some people describe reading the same paragraph multiple times because their mind keeps drifting to other things.",
                context: "work-school",
      },
      {
        text: "This might look like starting multiple tasks but not finishing any of them, with attention jumping to whatever seems most interesting in the moment.",
                context: "work-school",
      },
      {
        text: "For example, during a meeting, realizing you've missed the last few minutes because your mind was elsewhere, even though you wanted to pay attention.",
                context: "work-school",
      },
    ],
    relatedSymptoms: ["racing-thoughts", "memory-difficulties", "fatigue"],
    conditionRelationships: [
      {
        conditionSlug: "attention-deficit-hyperactivity-disorder",
        conditionName: "ADHD",
        symptomText: ["Difficulty sustaining attention in tasks", "Often fails to give close attention to details"],
        context: "Concentration difficulties are present from childhood and occur across multiple settings, not just during stress or mood episodes.",
      },
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Diminished ability to think or concentrate"],
        context: "Concentration often worsens during depressive episodes and improves as mood lifts.",
      },
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Difficulty concentrating or mind going blank"],
        context: "Worry repeatedly pulls attention away from current tasks.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Sleep deprivation significantly impacts concentration",
      "Nutritional deficiencies (iron, B12) can affect focus",
      "Thyroid conditions may impair concentration",
      "Some medications have cognitive side effects",
      "Chronic pain can make focusing difficult",
      "Perimenopause and hormonal changes can affect cognition",
      "Long COVID and post-viral syndromes",
    ],
    whenToSeekHelp: [
      "When concentration problems are affecting work or school performance",
      "When they represent a change from your baseline",
      "When accompanied by other concerning symptoms",
      "When you've tried basic strategies (sleep, reducing distractions) without improvement",
    ],
    assessmentLinks: [
      {
        label: "Adult ADHD Self-Report Scale",
        href: "/resources/assessments-screeners/asrs",
        relevance: "Screens for attention-related symptoms",
      },
    ],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "memory-difficulties",
    name: "Memory Difficulties",
    shortDefinition:
      "Problems with remembering information, conversations, or recent events that feels different from normal forgetting.",
    aliases: [
      "forgetfulness",
      "memory problems",
      "can't remember things",
      "losing track of things",
      "memory lapses",
    ],
    searchPhrases: [
      "why am I so forgetful",
      "can't remember what I did",
      "memory getting worse",
      "forgetting conversations",
    ],
    category: "attention-memory",
    examples: [
      {
        text: "Some people describe walking into a room and having no idea why they went there, multiple times a day.",
                context: "everyday",
      },
      {
        text: "This might look like having a conversation and genuinely not recalling it the next day, even when others mention specific details.",
                context: "relationships",
      },
      {
        text: "For example, missing appointments despite putting them in your calendar, because you forgot to check the calendar.",
                context: "everyday",
      },
    ],
    relatedSymptoms: ["difficulty-concentrating", "fatigue", "feeling-overwhelmed"],
    conditionRelationships: [
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Diminished ability to think or concentrate"],
        context: "Depression can impair working memory and recall, often improving as the depression lifts.",
      },
      {
        conditionSlug: "attention-deficit-hyperactivity-disorder",
        conditionName: "ADHD",
        symptomText: ["Often forgetful in daily activities"],
        context: "Working memory difficulties are common, affecting recall of instructions, appointments, and daily tasks.",
      },
      {
        conditionSlug: "post-traumatic-stress-disorder",
        conditionName: "Post-Traumatic Stress Disorder",
        symptomText: ["Inability to remember important aspects of the trauma"],
        context: "Memory difficulties may be specific to traumatic events or more general during high-stress periods.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Sleep deprivation significantly impacts memory consolidation",
      "Nutritional deficiencies (B12, thiamine) can cause memory problems",
      "Thyroid conditions affect cognition",
      "Some medications impair memory",
      "Chronic stress affects memory function",
      "Normal aging involves some memory changes",
      "Substance use can affect memory",
    ],
    whenToSeekHelp: [
      "When memory difficulties represent a change from your baseline",
      "When they're affecting your ability to function at work or home",
      "When accompanied by other cognitive changes",
      "When the changes are progressive or sudden",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "restlessness",
    name: "Restlessness",
    shortDefinition:
      "An uncomfortable internal sense of needing to move or do something, making it hard to sit still, relax, or wait patiently.",
    aliases: [
      "can't sit still",
      "fidgety",
      "inner restlessness",
      "agitation",
      "constantly moving",
      "need to keep moving",
    ],
    searchPhrases: [
      "why can't I sit still",
      "always need to be doing something",
      "uncomfortable when not moving",
      "internal agitation",
    ],
    category: "energy-physical",
    examples: [
      {
        text: "Some people describe an uncomfortable internal buzzing that only quiets when they're physically moving or keeping busy.",
              },
      {
        text: "This might look like constantly shifting positions, tapping feet, or getting up frequently during activities that require sitting.",
                context: "work-school",
      },
      {
        text: "For example, feeling physically uncomfortable during a movie because sitting still for that long creates an almost unbearable urge to get up.",
                context: "everyday",
      },
    ],
    relatedSymptoms: ["racing-thoughts", "feeling-on-edge", "difficulty-concentrating"],
    conditionRelationships: [
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Restlessness or feeling keyed up or on edge"],
        context: "Anxiety-driven restlessness often accompanies worry and tension.",
      },
      {
        conditionSlug: "attention-deficit-hyperactivity-disorder",
        conditionName: "ADHD",
        symptomText: ["Often fidgets or squirms", "Often leaves seat when remaining seated is expected"],
        context: "Hyperactive symptoms can persist into adulthood as inner restlessness even if external movement decreases.",
      },
      {
        conditionSlug: "bipolar-disorder",
        conditionName: "Bipolar Disorder",
        symptomText: ["Increase in goal-directed activity or psychomotor agitation"],
        context: "Restlessness during elevated mood states may feel energizing rather than uncomfortable.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Caffeine and stimulants cause restlessness",
      "Some medications cause akathisia (medication-induced restlessness)",
      "Restless legs syndrome causes an urge to move the legs",
      "Blood sugar fluctuations can contribute",
      "Withdrawal from various substances",
    ],
    whenToSeekHelp: [
      "When restlessness significantly interferes with daily activities",
      "When it started after beginning a new medication",
      "When accompanied by other mood or anxiety symptoms",
      "When it's been present since childhood",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },

  // ============================================================================
  // ENERGY & PHYSICAL
  // ============================================================================
  {
    slug: "fatigue",
    name: "Fatigue",
    shortDefinition:
      "Persistent tiredness, exhaustion, or lack of energy that isn't proportionate to activity level and doesn't fully resolve with rest.",
    aliases: [
      "always tired",
      "exhaustion",
      "no energy",
      "feeling drained",
      "low energy",
      "chronic tiredness",
    ],
    searchPhrases: [
      "why am I always tired",
      "exhausted no matter how much I sleep",
      "no energy to do anything",
      "constantly drained",
    ],
    category: "energy-physical",
    examples: [
      {
        text: "Some people describe waking up after a full night's sleep feeling as tired as when they went to bed.",
              },
      {
        text: "This might look like needing to rest after simple activities that wouldn't have been tiring before.",
                context: "everyday",
      },
      {
        text: "For example, the thought of showering or cooking dinner feeling overwhelming because of how much energy it would require.",
                context: "everyday",
      },
    ],
    relatedSymptoms: ["low-mood", "difficulty-concentrating", "loss-of-interest"],
    conditionRelationships: [
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Fatigue or loss of energy nearly every day"],
        context: "Fatigue is one of the most common symptoms, often present even when mood symptoms are subtle.",
      },
      {
        conditionSlug: "persistent-depressive-disorder",
        conditionName: "Persistent Depressive Disorder",
        symptomText: ["Low energy or fatigue"],
        context: "Chronic low energy accompanies the persistent low mood.",
      },
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Being easily fatigued"],
        context: "Constant worry is mentally exhausting and depletes energy.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Sleep disorders (apnea, insomnia) are common causes",
      "Thyroid conditions (hypothyroidism) cause fatigue",
      "Anemia and nutritional deficiencies",
      "Chronic infections or post-viral syndromes",
      "Medications with sedating effects",
      "Chronic conditions (diabetes, heart disease)",
      "Sleep deprivation from any cause",
    ],
    whenToSeekHelp: [
      "When fatigue persists for weeks despite adequate sleep",
      "When it significantly impacts daily functioning",
      "When accompanied by other symptoms",
      "When it represents a notable change from your baseline",
    ],
    assessmentLinks: [
      {
        label: "PHQ-9 Depression Screener",
        href: "/resources/assessments-screeners/phq-9",
        relevance: "Includes questions about energy and fatigue",
      },
    ],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "feeling-overwhelmed",
    name: "Feeling Overwhelmed",
    shortDefinition:
      "A sense that demands exceed your capacity to cope, where even manageable tasks feel like too much.",
    aliases: [
      "too much to handle",
      "can't cope",
      "drowning in responsibilities",
      "everything is too much",
      "stressed beyond capacity",
    ],
    searchPhrases: [
      "why do I feel so overwhelmed",
      "can't handle anything",
      "everything feels like too much",
      "drowning in tasks",
    ],
    category: "energy-physical",
    examples: [
      {
        text: "Some people describe looking at a to-do list and feeling paralyzed, unable to start because everything feels equally urgent and impossible.",
                context: "work-school",
      },
      {
        text: "This might look like a minor request from someone feeling like the last straw, triggering tears or frustration.",
                context: "relationships",
      },
      {
        text: "For example, knowing you need to respond to emails, do laundry, and grocery shop, but being unable to choose where to start so doing none of it.",
                context: "everyday",
      },
    ],
    relatedSymptoms: ["fatigue", "difficulty-concentrating", "irritability"],
    conditionRelationships: [
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Difficulty controlling worry", "Difficulty concentrating"],
        context: "Chronic worry about multiple areas creates a persistent sense of being overwhelmed.",
      },
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Fatigue or loss of energy", "Diminished ability to think or concentrate"],
        context: "Reduced energy and cognitive capacity make normal demands feel unmanageable.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Genuine overcommitment or unreasonable demands",
      "Major life transitions (new job, new baby, caregiving)",
      "Sleep deprivation reduces coping capacity",
      "Hormonal changes can affect stress tolerance",
      "Physical illness reduces available resources",
    ],
    whenToSeekHelp: [
      "When feeling overwhelmed is constant rather than situational",
      "When you've made reasonable adjustments but still can't cope",
      "When accompanied by other mood or anxiety symptoms",
      "When it's affecting your health or relationships",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },

  // ============================================================================
  // SLEEP
  // ============================================================================
  {
    slug: "trouble-sleeping",
    name: "Trouble Falling Asleep",
    shortDefinition:
      "Difficulty initiating sleep, lying awake for extended periods before being able to fall asleep.",
    aliases: [
      "insomnia",
      "can't fall asleep",
      "mind racing at bedtime",
      "lying awake",
      "sleep onset problems",
    ],
    searchPhrases: [
      "why can't I fall asleep",
      "mind won't turn off at night",
      "lying awake for hours",
      "trouble getting to sleep",
    ],
    category: "sleep",
    examples: [
      {
        text: "Some people describe going to bed tired but then lying there with their mind suddenly active, reviewing the day or anticipating tomorrow.",
              },
      {
        text: "This might look like watching the clock advance hour by hour, becoming more anxious about not sleeping as time passes.",
                context: "everyday",
      },
      {
        text: "For example, feeling exhausted all day but the moment your head hits the pillow, you're suddenly wide awake.",
              },
    ],
    relatedSymptoms: ["racing-thoughts", "persistent-worry", "fatigue"],
    conditionRelationships: [
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Sleep disturbance"],
        context: "Worry often intensifies at bedtime when there are fewer distractions.",
      },
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Insomnia"],
        context: "Sleep-onset insomnia is common in depression, though some people experience hypersomnia instead.",
      },
      {
        conditionSlug: "post-traumatic-stress-disorder",
        conditionName: "Post-Traumatic Stress Disorder",
        symptomText: ["Sleep disturbance"],
        context: "Hyperarousal can make it difficult to relax enough to fall asleep.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Caffeine, especially later in the day",
      "Screen time before bed (blue light exposure)",
      "Irregular sleep schedule",
      "Environmental factors (noise, light, temperature)",
      "Physical discomfort or pain",
      "Certain medications",
      "Primary sleep disorders",
    ],
    whenToSeekHelp: [
      "When sleep problems persist for more than a few weeks",
      "When daytime functioning is significantly affected",
      "When you've tried basic sleep hygiene without success",
      "When accompanied by other concerning symptoms",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "sleeping-too-much",
    name: "Sleeping Too Much",
    shortDefinition:
      "Sleeping significantly more than usual, having difficulty getting out of bed, or feeling the need for excessive sleep.",
    aliases: [
      "hypersomnia",
      "oversleeping",
      "can't get out of bed",
      "sleeping all the time",
      "excessive sleep",
    ],
    searchPhrases: [
      "why do I sleep so much",
      "can't get out of bed",
      "sleeping 12 hours still tired",
      "always want to sleep",
    ],
    category: "sleep",
    examples: [
      {
        text: "Some people describe sleeping 10-12 hours and still not feeling rested, with no desire to get out of bed.",
              },
      {
        text: "This might look like missing morning commitments repeatedly because getting up feels impossible, not just unpleasant.",
                context: "work-school",
      },
      {
        text: "For example, spending entire weekends in bed, not because you're relaxing, but because you can't summon the energy to do otherwise.",
                context: "everyday",
      },
    ],
    relatedSymptoms: ["fatigue", "low-mood", "loss-of-interest"],
    conditionRelationships: [
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Hypersomnia"],
        context: "Some people with depression sleep excessively, using sleep as an escape or simply lacking energy to stay awake.",
      },
      {
        conditionSlug: "bipolar-disorder",
        conditionName: "Bipolar Disorder",
        symptomText: ["Hypersomnia during depressive episodes"],
        context: "Excessive sleep typically occurs during depressive episodes, contrasting with decreased need for sleep during elevated mood states.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Sleep apnea causes non-restorative sleep despite long sleep duration",
      "Thyroid conditions (hypothyroidism)",
      "Medications with sedating effects",
      "Recovery from illness or surgery",
      "Narcolepsy and other sleep disorders",
      "Seasonal changes (seasonal affective patterns)",
    ],
    whenToSeekHelp: [
      "When excessive sleep is affecting work, school, or relationships",
      "When you don't feel rested despite long sleep",
      "When accompanied by other mood changes",
      "When it represents a significant change from your normal pattern",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
  {
    slug: "appetite-changes",
    name: "Appetite Changes",
    shortDefinition:
      "Significant changes in appetite, either eating much more or much less than usual, often without a clear reason.",
    aliases: [
      "eating too much",
      "not eating",
      "lost appetite",
      "increased appetite",
      "food doesn't appeal",
      "emotional eating",
    ],
    searchPhrases: [
      "why is my appetite different",
      "not hungry anymore",
      "eating way more than usual",
      "food has no appeal",
    ],
    category: "eating-body-image",
    examples: [
      {
        text: "Some people describe food losing all appeal, having to force themselves to eat because they know they should.",
              },
      {
        text: "This might look like eating for comfort even when not hungry, using food to manage emotions.",
                context: "everyday",
      },
      {
        text: "For example, realizing an entire day passed without eating and feeling no hunger, or conversely, eating continuously without feeling satisfied.",
                context: "everyday",
      },
    ],
    relatedSymptoms: ["low-mood", "persistent-worry", "feeling-overwhelmed"],
    conditionRelationships: [
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Significant weight loss or gain", "Decrease or increase in appetite"],
        context: "Appetite changes (either direction) are common in depression and often accompany other symptoms.",
      },
      {
        conditionSlug: "generalized-anxiety-disorder",
        conditionName: "Generalized Anxiety Disorder",
        symptomText: ["Physical symptoms of anxiety"],
        context: "Anxiety can suppress appetite or lead to stress eating.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Medications commonly affect appetite",
      "Gastrointestinal conditions",
      "Hormonal changes",
      "Illness and recovery",
      "Changes in activity level",
      "Stress response",
    ],
    whenToSeekHelp: [
      "When appetite changes lead to significant weight changes",
      "When accompanied by other mood or anxiety symptoms",
      "When eating patterns feel out of control",
      "When nutrition is being significantly affected",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },

  // ============================================================================
  // RELATIONSHIPS & SOCIAL
  // ============================================================================
  {
    slug: "social-withdrawal",
    name: "Social Withdrawal",
    shortDefinition:
      "Pulling away from social connections, avoiding interactions with friends and family, or losing interest in being around others.",
    aliases: [
      "isolating myself",
      "avoiding people",
      "don't want to socialize",
      "withdrawing from friends",
      "self-isolation",
    ],
    searchPhrases: [
      "why don't I want to see anyone",
      "avoiding friends and family",
      "isolating myself from everyone",
      "no energy for people",
    ],
    category: "relationships-social",
    examples: [
      {
        text: "Some people describe letting texts and calls go unanswered, not out of anger, but because reaching out feels like too much effort.",
                context: "relationships",
      },
      {
        text: "This might look like declining all social invitations and then feeling lonely, but still not wanting to connect.",
                context: "relationships",
      },
      {
        text: "For example, making excuses to leave family gatherings early or avoiding them altogether, even though you used to enjoy them.",
                context: "relationships",
      },
    ],
    relatedSymptoms: ["loss-of-interest", "fatigue", "avoidance"],
    conditionRelationships: [
      {
        conditionSlug: "major-depressive-disorder",
        conditionName: "Major Depressive Disorder",
        symptomText: ["Social withdrawal", "Loss of interest"],
        context: "Withdrawing from social connections is common as depression reduces both energy and interest in activities.",
      },
      {
        conditionSlug: "social-anxiety-disorder",
        conditionName: "Social Anxiety Disorder",
        symptomText: ["Avoidance of social situations"],
        context: "Withdrawal is driven by fear of judgment rather than lack of interest.",
      },
      {
        conditionSlug: "post-traumatic-stress-disorder",
        conditionName: "Post-Traumatic Stress Disorder",
        symptomText: ["Feelings of detachment from others"],
        context: "Can develop after trauma as part of emotional numbing.",
      },
    ],
    nonPsychiatricConsiderations: [
      "Introversion (preference for less social time) is not the same as withdrawal",
      "Major life changes may temporarily shift social capacity",
      "Chronic illness can limit social energy",
      "Caregiving demands may reduce social availability",
    ],
    whenToSeekHelp: [
      "When isolation is affecting your well-being",
      "When you want to connect but can't bring yourself to",
      "When accompanied by other mood symptoms",
      "When withdrawal is leading to problems at work or in relationships",
    ],
    assessmentLinks: [],
    indexable: true,
    reviewed: true,
    lastReviewed: "2025-01-15",
  },
];

/**
 * Get all indexable symptoms (those that should have pages)
 */
export function getIndexableSymptoms(): SymptomEntity[] {
  return SYMPTOM_REGISTRY.filter(
    (symptom) => symptom.indexable && symptom.reviewed
  );
}

/**
 * Get a symptom by slug
 */
export function getSymptomBySlug(slug: string): SymptomEntity | undefined {
  return SYMPTOM_REGISTRY.find((symptom) => symptom.slug === slug);
}

/**
 * Get symptoms by category
 */
export function getSymptomsByCategory(category: SymptomCategory): SymptomEntity[] {
  return SYMPTOM_REGISTRY.filter((symptom) => symptom.category === category);
}

/**
 * Get all symptom slugs for static generation
 */
export function getAllSymptomSlugs(): string[] {
  return getIndexableSymptoms().map((symptom) => symptom.slug);
}

/**
 * Check if a slug matches any symptom (canonical or alias)
 */
export function findSymptomBySlugOrAlias(input: string): SymptomEntity | undefined {
  const normalized = input.toLowerCase().trim();

  // First check canonical slugs
  const bySlug = SYMPTOM_REGISTRY.find(
    (symptom) => symptom.slug.toLowerCase() === normalized
  );
  if (bySlug) return bySlug;

  // Then check aliases
  return SYMPTOM_REGISTRY.find((symptom) =>
    symptom.aliases.some(
      (alias) => alias.toLowerCase().replace(/\s+/g, "-") === normalized
    )
  );
}
