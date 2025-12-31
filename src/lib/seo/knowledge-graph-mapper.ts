/**
 * Knowledge Graph Mapper
 *
 * Maps HeyPsych entities to external knowledge graphs (Wikidata, DBpedia, SNOMED CT)
 * to enable "Entity Grounding" for LLM/AI retrieval systems.
 *
 * This allows Google, OpenAI, and Anthropic to:
 * 1. Uniquely identify our entities in the global knowledge graph
 * 2. Verify medical accuracy against authoritative sources
 * 3. Link our definitions to established medical ontologies
 *
 * @see https://www.wikidata.org/
 * @see https://dbpedia.org/
 * @see https://www.snomed.org/
 */

import type { Entity } from '@/lib/types/database';

/**
 * Wikidata mappings for common mental health conditions
 * Format: { slug: Wikidata QID }
 *
 * To find Wikidata IDs:
 * 1. Search on https://www.wikidata.org/
 * 2. Copy the QID from the entity page (e.g., Q131755 for "Major Depressive Disorder")
 */
export const CONDITION_WIKIDATA_MAP: Record<string, string> = {
  // Mood Disorders
  'major-depressive-disorder': 'Q42844',
  'persistent-depressive-disorder': 'Q18554748',
  'bipolar-i-disorder': 'Q131447',
  'bipolar-ii-disorder': 'Q18643213',
  'bipolar-disorder-due-to-medical-condition': 'Q131447',
  'cyclothymic-disorder': 'Q650359',
  'disruptive-mood-dysregulation-disorder': 'Q5284064',
  'premenstrual-dysphoric-disorder': 'Q903448',
  'depressive-disorder-due-to-medical-condition': 'Q42844',
  'substance-medication-induced-depressive-disorder': 'Q42844',
  'substance-medication-induced-bipolar-disorder': 'Q131447',

  // Anxiety Disorders
  'generalized-anxiety-disorder': 'Q178194',
  'panic-disorder': 'Q202387',
  'agoraphobia': 'Q181600',
  'social-anxiety-disorder': 'Q204175',
  'specific-phobia': 'Q133811',
  'separation-anxiety-disorder': 'Q815382',
  'selective-mutism': 'Q1195269',
  'anxiety-disorder-due-to-medical-condition': 'Q48143',
  'substance-medication-induced-anxiety-disorder': 'Q48143',

  // Trauma & Stress-Related Disorders
  'posttraumatic-stress-disorder': 'Q202737',
  'acute-stress-disorder': 'Q375928',
  'adjustment-disorders': 'Q327231',
  'reactive-attachment-disorder': 'Q1137704',
  'disinhibited-social-engagement-disorder': 'Q5282398',

  // Obsessive-Compulsive & Related
  'obsessive-compulsive-disorder': 'Q128332',
  'body-dysmorphic-disorder': 'Q612693',
  'hoarding-disorder': 'Q5888076',
  'trichotillomania': 'Q389735',
  'excoriation-disorder': 'Q1135802',
  'ocd-due-to-medical-condition': 'Q128332',
  'substance-medication-induced-ocd': 'Q128332',

  // Neurodevelopmental Disorders
  'attention-deficit-hyperactivity-disorder': 'Q181923',
  'autism-spectrum-disorder': 'Q38404',
  'intellectual-disability': 'Q131749',
  'global-developmental-delay': 'Q5571763',
  'specific-learning-disorder': 'Q1414305',
  'language-disorder': 'Q929548',
  'speech-sound-disorder': 'Q752993',
  'childhood-onset-fluency-disorder': 'Q179824',
  'social-pragmatic-communication-disorder': 'Q18646324',
  'stereotypic-movement-disorder': 'Q429672',
  'tourettes-disorder': 'Q180517',
  'persistent-motor-vocal-tic-disorder': 'Q2067504',
  'provisional-tic-disorder': 'Q2067504',
  'developmental-coordination-disorder': 'Q1199308',

  // Psychotic Disorders
  'schizophrenia': 'Q58981',
  'schizoaffective-disorder': 'Q742942',
  'schizophreniform-disorder': 'Q1758251',
  'delusional-disorder': 'Q1189494',
  'brief-psychotic-disorder': 'Q3282637',
  'schizotypal-personality-disorder': 'Q485146',
  'catatonia-associated-with-mental-disorder': 'Q736427',
  'catatonic-disorder-due-to-medical-condition': 'Q736427',
  'psychotic-disorder-due-to-medical-condition': 'Q183257',
  'substance-medication-induced-psychotic-disorder': 'Q183257',

  // Eating Disorders
  'anorexia-nervosa': 'Q1079',
  'bulimia-nervosa': 'Q131681',
  'binge-eating-disorder': 'Q2270155',
  'avoidant-restrictive-food-intake-disorder': 'Q17092975',
  'pica': 'Q506',
  'rumination-disorder': 'Q506894',

  // Personality Disorders
  'borderline-personality-disorder': 'Q41630',
  'antisocial-personality-disorder': 'Q175363',
  'narcissistic-personality-disorder': 'Q912835',
  'avoidant-personality-disorder': 'Q910214',
  'dependent-personality-disorder': 'Q1189509',
  'obsessive-compulsive-personality-disorder': 'Q1189520',
  'paranoid-personality-disorder': 'Q918296',
  'schizoid-personality-disorder': 'Q912889',
  'histrionic-personality-disorder': 'Q849683',
  'personality-change-due-to-medical-condition': 'Q270673',

  // Sleep-Wake Disorders
  'insomnia-disorder': 'Q41828',
  'hypersomnolence-disorder': 'Q1318776',
  'narcolepsy': 'Q7955',
  'obstructive-sleep-apnea-hypopnea': 'Q187661',
  'central-sleep-apnea': 'Q2061131',
  'sleep-related-hypoventilation': 'Q12125952',
  'circadian-rhythm-sleep-wake-disorders': 'Q574715',
  'non-rem-sleep-arousal-disorders': 'Q1936815',
  'nightmare-disorder': 'Q745664',
  'rem-sleep-behavior-disorder': 'Q1346208',
  'restless-legs-syndrome': 'Q503924',
  'substance-medication-induced-sleep-disorder': 'Q41828',
  'sleep-terrors': 'Q785422',
  'sleepwalking': 'Q746083',

  // Substance-Related & Addictive Disorders
  'alcohol': 'Q177719',
  'caffeine': 'Q19844345',
  'cannabis': 'Q2092324',
  'hallucinogen-persisting-perception-disorder': 'Q908474',
  'inhalant': 'Q18556043',
  'opioid': 'Q3518602',
  'sedative-hypnotic-anxiolytic': 'Q18555976',
  'stimulant': 'Q18554320',
  'tobacco': 'Q18553315',
  'phencyclidine': 'Q407217',
  'gambling-disorder': 'Q12195',

  // Disruptive, Impulse-Control, and Conduct Disorders
  'oppositional-defiant-disorder': 'Q1138715',
  'intermittent-explosive-disorder': 'Q1424395',
  'conduct-disorder': 'Q913299',
  'pyromania': 'Q201387',
  'kleptomania': 'Q190798',

  // Somatic Symptom & Related Disorders
  'somatic-symptom-disorder': 'Q18554309',
  'illness-anxiety-disorder': 'Q2052234',
  'conversion-disorder': 'Q842634',
  'psychological-factors-affecting-medical-conditions': 'Q18659252',
  'factitious-disorder': 'Q1392746',

  // Dissociative Disorders
  'dissociative-identity-disorder': 'Q193447',
  'dissociative-amnesia': 'Q382415',
  'depersonalization-derealization-disorder': 'Q652657',

  // Elimination Disorders
  'enuresis': 'Q193407',
  'encopresis': 'Q1340018',

  // Paraphilic Disorders
  'voyeuristic-disorder': 'Q2690012',
  'exhibitionistic-disorder': 'Q742252',
  'frotteuristic-disorder': 'Q915476',
  'sexual-masochism-disorder': 'Q193034',
  'sexual-sadism-disorder': 'Q193034',
  'pedophilic-disorder': 'Q165468',
  'fetishistic-disorder': 'Q170222',
  'transvestic-disorder': 'Q592928',

  // Sexual Dysfunctions
  'delayed-ejaculation': 'Q5253456',
  'erectile-disorder': 'Q147778',
  'female-orgasmic-disorder': 'Q3086580',
  'female-sexual-interest-arousal-disorder': 'Q3086580',
  'genito-pelvic-pain-penetration-disorder': 'Q280503',
  'male-hypoactive-sexual-desire-disorder': 'Q6742641',
  'premature-ejaculation': 'Q379775',
  'substance-medication-induced-sexual-dysfunction': 'Q147778',

  // Gender Dysphoria
  'gender-dysphoria': 'Q39266',

  // Neurocognitive Disorders
  'delirium': 'Q131742',
  'neurocognitive-disorder': 'Q3649',
};

/**
 * Wikidata mappings for psychiatric treatments
 */
export const TREATMENT_WIKIDATA_MAP: Record<string, string> = {
  // Evidence-Based Psychotherapy
  'cognitive-behavioral-therapy': 'Q380550',
  'dialectical-behavior-therapy': 'Q1205945',
  'acceptance-commitment-therapy': 'Q394652',
  'eye-movement-desensitization-and-reprocessing': 'Q384827',
  'mindfulness-based-cognitive-therapy': 'Q3314642',
  'interpersonal-therapy': 'Q1665986',
  'interpersonal-psychotherapy': 'Q1665986',
  'psychodynamic-therapy': 'Q1152135',
  'psychoanalytic-therapy': 'Q41630',
  'family-therapy': 'Q950931',
  'group-therapy': 'Q1547235',
  'motivational-interviewing': 'Q1629003',
  'exposure-therapy': 'Q864693',
  'prolonged-exposure-therapy': 'Q864693',
  'cognitive-processing-therapy': 'Q5140219',
  'schema-therapy': 'Q1195291',
  'mentalization-based-treatment': 'Q6817561',
  'transference-focused-psychotherapy': 'Q7833804',
  'supportive-psychotherapy': 'Q7644088',
  'behavior-therapy': 'Q275553',
  'behavioral-activation': 'Q4880711',
  'attachment-based-family-therapy': 'Q4817980',
  'narrative-therapy': 'Q1966044',
  'solution-focused-brief-therapy': 'Q845478',
  'art-therapy': 'Q752657',
  'music-therapy': 'Q638944',
  'dance-movement-therapy': 'Q1163773',
  'drama-therapy': 'Q1254054',
  'play-therapy': 'Q2098987',
  'sandplay-therapy': 'Q1339929',
  'clinical-hypnosis': 'Q162555',
  'biofeedback': 'Q586228',
  'neurofeedback': 'Q1376042',
  'animal-assisted-therapy': 'Q498499',
  'equine-therapy': 'Q3057055',

  // SSRIs (Selective Serotonin Reuptake Inhibitors)
  'selective-serotonin-reuptake-inhibitors': 'Q422248',
  'fluoxetine-Prozac-v2': 'Q422235',
  'sertraline-Zoloft-v2': 'Q422740',
  'escitalopram-Lexapro-v2': 'Q415455',
  'paroxetine-Paxil-v2': 'Q422652',
  'citalopram-Celexa-v2': 'Q417222',
  'fluvoxamine-Luvox-v2': 'Q422273',

  // SNRIs (Serotonin-Norepinephrine Reuptake Inhibitors)
  'serotonin-norepinephrine-reuptake-inhibitors': 'Q422313',
  'venlafaxine-Effexor-v2': 'Q422792',
  'duloxetine-Cymbalta-v2': 'Q422224',
  'desvenlafaxine-Pristiq-v2': 'Q5264817',
  'levomilnacipran-Fetzima-v2': 'Q15411034',
  'milnacipran-Savella-v2': 'Q422527',

  // Atypical Antidepressants
  'bupropion-Wellbutrin-v2': 'Q422221',
  'mirtazapine-Remeron-v2': 'Q422543',
  'trazodone-Desyrel-v2': 'Q422789',
  'nefazodone-Serzone-v2': 'Q422567',
  'vilazodone-Viibryd-v2': 'Q7929868',
  'vortioxetine-Trintellix-v2': 'Q7941287',
  'agomelatine-Valdoxan-v2': 'Q415810',
  'esketamine-Spravato-v2': 'Q27106044',

  // Tricyclic Antidepressants (TCAs)
  'amitriptyline-Elavil-v2': 'Q417449',
  'nortriptyline-Pamelor-v2': 'Q422605',
  'imipramine-Tofranil-v2': 'Q422313',
  'desipramine-Norpramin-v2': 'Q417978',
  'clomipramine-Anafranil-v2': 'Q417199',
  'doxepin-Sinequan-v2': 'Q422223',
  'trimipramine-Surmontil-v2': 'Q422786',
  'amoxapine-Asendin-v2': 'Q418272',

  // MAOIs (Monoamine Oxidase Inhibitors)
  'phenelzine-Nardil-v2': 'Q422680',
  'tranylcypromine-Parnate-v2': 'Q422780',
  'isocarboxazid-Marplan-v2': 'Q422326',
  'selegiline-Emsam-v2': 'Q419788',

  // Atypical Antipsychotics (Second-Generation)
  'aripiprazole-Abilify-v2': 'Q415631',
  'olanzapine-Zyprexa-v2': 'Q422626',
  'quetiapine-Seroquel-v2': 'Q422709',
  'risperidone-Risperdal-v2': 'Q422728',
  'ziprasidone-Geodon-v2': 'Q422811',
  'paliperidone-Invega-v2': 'Q422645',
  'asenapine-Saphris-v2': 'Q420776',
  'lurasidone-Latuda-v2': 'Q415658',
  'iloperidone-Fanapt-v2': 'Q422292',
  'brexpiprazole-Rexulti-v2': 'Q21083263',
  'cariprazine-Vraylar-v2': 'Q15412242',
  'clozapine-Clozaril-v2': 'Q417381',
  'lumateperone-Caplyta-v2': 'Q64356388',

  // Typical Antipsychotics (First-Generation)
  'haloperidol-Haldol-v2': 'Q422283',
  'chlorpromazine-Thorazine-v2': 'Q417169',
  'fluphenazine-Prolixin-v2': 'Q422260',
  'perphenazine-Trilafon-v2': 'Q422677',
  'thioridazine-Mellaril-v2': 'Q422766',
  'thiothixene-Navane-v2': 'Q422768',
  'trifluoperazine-Stelazine-v2': 'Q422784',
  'loxapine-Loxitane-v2': 'Q422461',

  // Mood Stabilizers
  'lithium-Eskalith-v2': 'Q568',
  'lithium-carbonate-v2': 'Q422439',
  'valproic-acid-Depakote-v2': 'Q422791',
  'divalproex-sodium-v2': 'Q422791',
  'lamotrigine-Lamictal-v2': 'Q422418',
  'carbamazepine-Tegretol-v2': 'Q417571',
  'oxcarbazepine-Trileptal-v2': 'Q422638',

  // Benzodiazepines
  'alprazolam-Xanax-v2': 'Q415218',
  'clonazepam-Klonopin-v2': 'Q417201',
  'lorazepam-Ativan-v2': 'Q422418',
  'diazepam-Valium-v2': 'Q422224',
  'chlordiazepoxide-Librium-v2': 'Q417129',
  'oxazepam-Serax-v2': 'Q422639',
  'temazepam-Restoril-v2': 'Q422759',
  'triazolam-Halcion-v2': 'Q422783',
  'bromazepam-Lexotan-v2': 'Q419116',

  // Non-Benzodiazepine Anxiolytics
  'buspirone-Buspar-v2': 'Q422221',
  'hydroxyzine-Vistaril-v2': 'Q422286',
  'pregabalin-Lyrica-v2': 'Q422700',
  'gabapentin-Neurontin-v2': 'Q422276',

  // ADHD Medications - Stimulants
  'methylphenidate-Ritalin-v2': 'Q422508',
  'dexmethylphenidate-Focalin-v2': 'Q5268048',
  'amphetamine-Adderall-v2': 'Q191924',
  'dextroamphetamine-Dexedrine-v2': 'Q420198',
  'lisdexamfetamine-Vyvanse-v2': 'Q422446',
  'methamphetamine-Desoxyn-v2': 'Q191924',

  // ADHD Medications - Non-Stimulants
  'atomoxetine-Strattera-v2': 'Q420828',
  'guanfacine-Intuniv-v2': 'Q422280',
  'clonidine-Kapvay-v2': 'Q417192',
  'viloxazine-Qelbree-v2': 'Q7931006',

  // Sleep Medications
  'zolpidem-Ambien-v2': 'Q422808',
  'eszopiclone-Lunesta-v2': 'Q422240',
  'zaleplon-Sonata-v2': 'Q422806',
  'ramelteon-Rozerem-v2': 'Q422711',
  'suvorexant-Belsomra-v2': 'Q15411128',
  'lemborexant-Dayvigo-v2': 'Q64362579',
  'doxepin-Silenor-v2': 'Q422223',

  // Opioid Use Disorder Medications
  'buprenorphine-Subutex-v2': 'Q420844',
  'buprenorphine-naloxone-Suboxone-v2': 'Q420844',
  'methadone-v2': 'Q422502',
  'naltrexone-Vivitrol-v2': 'Q422566',

  // Alcohol Use Disorder Medications
  'acamprosate-Campral-v2': 'Q415178',
  'disulfiram-Antabuse-v2': 'Q418076',
  'naltrexone-v2': 'Q422566',

  // Smoking Cessation
  'varenicline-Chantix-v2': 'Q422793',
  'bupropion-Zyban-v2': 'Q422221',
  'nicotine-replacement-therapy': 'Q2092195',

  // Interventional/Brain Stimulation Treatments
  'electroconvulsive-therapy': 'Q390550',
  'transcranial-magnetic-stimulation': 'Q638954',
  'deep-brain-stimulation': 'Q1182247',
  'vagus-nerve-stimulation': 'Q2508947',
  'magnetic-seizure-therapy': 'Q6730617',
  'ketamine-infusion-therapy': 'Q422305',

  // Common Supplements
  'omega-3-fatty-acids': 'Q407699',
  'vitamin-d': 'Q175853',
  'b-complex': 'Q194353',
  'vitamin-b12': 'Q18163',
  'folate': 'Q407332',
  'magnesium': 'Q660',
  's-adenosyl-methionine': 'Q422735',
  '5-htp': 'Q413382',
  'l-theanine': 'Q420576',
  'ashwagandha': 'Q158856',
  'rhodiola-rosea': 'Q157332',
  'st-johns-wort': 'Q155978',
  'valerian-root': 'Q156018',
  'melatonin': 'Q191290',
  'n-acetylcysteine': 'Q422557',
  'inositol': 'Q407956',
  'probiotics': 'Q170430',

  // Alternative/Complementary
  'meditation': 'Q1332181',
  'mindfulness': 'Q1457865',
  'yoga': 'Q9379',
  'acupuncture': 'Q5009',
  'massage-therapy': 'Q194604',
  'exercise': 'Q10990',
  'aerobic-exercise': 'Q1640385',
  'resistance-training': 'Q1094830',
  'tai-chi': 'Q11679',
  'qigong': 'Q171726',
  'light-therapy': 'Q1334698',
  'bright-light-therapy': 'Q1334698',
  'aromatherapy': 'Q170568',
  'pet-therapy': 'Q498499',
  'equine-assisted-therapy': 'Q3057055',

  // Additional Vitamins & Minerals
  'vitamin-b6-pyridoxine': 'Q190141',
  'vitamin-c': 'Q199678',
  'vitamin-e': 'Q188245',
  'vitamin-k': 'Q178290',
  'calcium': 'Q660',
  'zinc': 'Q758',
  'iron': 'Q677',
  'magnesium-glycinate': 'Q660',
  'selenium': 'Q876',
  'chromium': 'Q725',
  'phosphorus': 'Q674',
  'potassium': 'Q703',

  // Amino Acids & Metabolites
  'l-tryptophan': 'Q181234',
  'l-tyrosine': 'Q190090',
  'glycine': 'Q620730',
  'taurine': 'Q194155',
  'phenylalanine': 'Q181003',
  'glutamine': 'Q181619',
  'creatine': 'Q194091',

  // Herbal Supplements
  'kava': 'Q156168',
  'passionflower': 'Q158968',
  'lemon-balm': 'Q156092',
  'chamomile': 'Q156004',
  'lavender': 'Q156344',
  'hops': 'Q156310',
  'skullcap': 'Q159120',
  'california-poppy': 'Q159003',
  'ginkgo-biloba': 'Q152108',
  'bacopa-monnieri': 'Q764507',
  'lions-mane-mushroom': 'Q1568706',
  'reishi-mushroom': 'Q740968',
  'cordyceps': 'Q845564',
  'chaga-mushroom': 'Q850374',
  'turkey-tail-mushroom': 'Q219149',
  'siberian-ginseng': 'Q157355',
  'american-ginseng': 'Q157350',
  'korean-red-ginseng': 'Q157347',
  'holy-basil': 'Q157280',
  'turmeric': 'Q42562',
  'curcumin': 'Q422212',
  'green-tea-extract': 'Q49314',
  'black-seed-oil': 'Q156320',

  // Essential Fatty Acids
  'fish-oil': 'Q381121',
  'flax-seed-oil': 'Q157218',
  'borage-oil': 'Q156101',
  'evening-primrose-oil': 'Q156243',
  'krill-oil': 'Q6437827',

  // Probiotics & Gut Health
  'lactobacillus-rhamnosus': 'Q310698',
  'bifidobacterium-longum': 'Q310698',
  'bifidobacterium-breve': 'Q310698',
  'saccharomyces-boulardii': 'Q310698',
  'multi-strain-probiotics': 'Q170430',

  // Other Supplements
  'coenzyme-q10': 'Q193000',
  'alpha-lipoic-acid': 'Q242251',
  'citicoline': 'Q418942',
  'acetyl-l-carnitine': 'Q409788',
  'phosphatidylserine': 'Q422675',
  'phosphatidylcholine': 'Q422677',
  'alpha-gpc': 'Q2840688',
  'dmae': 'Q27133652',
  'quercetin': 'Q414416',
  'resveratrol': 'Q410193',
  'betaine-hcl': 'Q422147',

  // Meditation & Mindfulness Techniques
  'body-scan-meditation': 'Q1332181',
  'loving-kindness-meditation': 'Q6691617',
  'walking-meditation': 'Q7961591',
  'transcendental-meditation': 'Q221793',
  'vipassana-meditation': 'Q1151217',
  'zen-meditation': 'Q132265',
  'guided-imagery': 'Q2047733',
  'visualization': 'Q219141',

  // Breathwork Techniques
  'diaphragmatic-breathing': 'Q192797',
  'box-breathing': 'Q192797',
  '4-7-8-breathing': 'Q192797',
  'alternate-nostril-breathing': 'Q192797',
  'breath-of-fire': 'Q192797',
  'holotropic-breathwork': 'Q1625579',
  'rebirthing-breathwork': 'Q7301536',
  'wim-hof-method': 'Q16980397',

  // Massage & Bodywork
  'swedish-massage': 'Q2286420',
  'deep-tissue-massage': 'Q194604',
  'trigger-point-therapy': 'Q7841466',
  'myofascial-release': 'Q11446584',
  'craniosacral-therapy': 'Q952738',
  'shiatsu': 'Q465279',
  'thai-massage': 'Q917323',
  'reflexology': 'Q1166277',
  'rolfing': 'Q622097',

  // Energy & Alternative Therapies
  'reiki': 'Q189569',
  'therapeutic-touch': 'Q2089699',
  'healing-touch': 'Q5688867',
  'polarity-therapy': 'Q3909134',
  'crystal-healing': 'Q1142261',
  'sound-therapy': 'Q7565095',
  'singing-bowl-therapy': 'Q1190026',
  'color-therapy': 'Q1112821',

  // Parent Training & Family Programs
  'behavioral-parent-training': 'Q4880796',
  'parent-child-interaction-therapy': 'Q7135848',
  'triple-p-parenting': 'Q7842886',
  'incredible-years': 'Q6013796',
  'chicago-parent-program': 'Q5095161',
  '1-2-3-magic': 'Q4596863',
  'positive-parenting-program': 'Q7233628',

  // Specialized Psychotherapy Techniques
  'internal-family-systems': 'Q6053821',
  'somatic-experiencing': 'Q7559447',
  'sensorimotor-psychotherapy': 'Q7450441',
  'emotionally-focused-therapy': 'Q5373861',
  'gottman-method': 'Q5587149',
  'imago-relationship-therapy': 'Q5994734',
  'accelerated-resolution-therapy': 'Q2822953',
  'brainspotting': 'Q16840419',
  'havening-techniques': 'Q17013751',
  'emotional-freedom-technique': 'Q1337274',
  'thought-field-therapy': 'Q2433095',

  // Relaxation & Stress Management
  'progressive-muscle-relaxation': 'Q1142997',
  'autogenic-training': 'Q587417',
  'applied-relaxation': 'Q4781434',
  'systematic-desensitization': 'Q1430363',

  // Other Complementary Approaches
  'horticultural-therapy': 'Q1628997',
  'adventure-therapy': 'Q2825551',
  'wilderness-therapy': 'Q8000253',
  'equine-assisted-psychotherapy': 'Q3057055',
  'recreational-therapy': 'Q900467',
  'expressive-writing': 'Q1382620',
  'bibliotherapy': 'Q878351',
  'journaling': 'Q815269',
  'gratitude-practice': 'Q2571747',
};

/**
 * Wikidata mappings for mental health resources (organizations, apps, tools)
 */
export const RESOURCE_WIKIDATA_MAP: Record<string, string> = {
  // Crisis Hotlines & Support Organizations
  '988-lifeline': 'Q7261303',
  'crisis-text-line': 'Q15634780',
  'the-trevor-project': 'Q3526844',
  'trans-lifeline': 'Q18154389',
  'nami': 'Q6959757',
  'samhsa-helpline': 'Q7410515',
  'rainn-national-sexual-assault-hotline': 'Q7284393',
  'samaritans-uk': 'Q3470084',
  'veterans-crisis-line': 'Q7923517',
  'postpartum-support-international': 'Q7233484',
  'suicide-prevention-lifeline': 'Q7634581',

  // Mental Health Organizations
  'international-ocd-foundation': 'Q6052736',
  'iocdf': 'Q6052736',
  'neda': 'Q6950947',
  'adaa': 'Q4680747',
  'dbsa': 'Q5192857',
  'chadd': 'Q5067097',
  'autism-society': 'Q2871899',
  'schizophrenia-psychosis-alliance': 'Q7431715',
  'jed-foundation': 'Q6172456',
  'active-minds': 'Q4677120',

  // Support Groups
  'aa': 'Q407815',
  'narcotics-anonymous': 'Q1546904',
  'al-anon': 'Q286858',
  'smart-recovery': 'Q7543661',

  // Mental Health Apps
  'headspace': 'Q17072111',
  'calm': 'Q27985426',
  'talkspace': 'Q17148829',
  'betterhelp': 'Q28134788',
  'insight-timer': 'Q28494502',
  'woebot': 'Q30675653',

  // Clinical Assessment Tools
  'phq-9': 'Q3388385',
  'gad-7': 'Q5516387',
  'asrs-v1-1': 'Q4654318',
  'PTSD-coach': 'Q7246894',
};

/**
 * DBpedia resource mappings (fallback when Wikidata not available)
 * DBpedia URLs are more stable but less structured than Wikidata
 */
function getDBpediaURI(slug: string, type: 'condition' | 'treatment'): string | null {
  // Convert slug to DBpedia resource format
  // e.g., "major-depressive-disorder" → "Major_depressive_disorder"
  const resourceName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('_');

  return `http://dbpedia.org/resource/${resourceName}`;
}

/**
 * Generate sameAs array for MedicalCondition schemas
 *
 * @param entity - The condition entity
 * @returns Array of authoritative URIs or null if no mappings found
 */
export function getConditionSameAsLinks(entity: Entity): string[] | null {
  const links: string[] = [];

  // 1. Wikidata (highest priority - most structured)
  // Check metadata first, then hardcoded map
  const wikidataId = entity.metadata?.wikidata_qid || CONDITION_WIKIDATA_MAP[entity.slug];
  if (wikidataId && /^Q\d+$/.test(wikidataId)) {
    links.push(`https://www.wikidata.org/wiki/${wikidataId}`);
  }

  // 2. DBpedia (fallback - good for natural language processing)
  const dbpediaUri = getDBpediaURI(entity.slug, 'condition');
  if (dbpediaUri && !wikidataId) {
    // Only add DBpedia if we don't have Wikidata (to avoid duplication)
    links.push(dbpediaUri);
  }

  // 3. SNOMED CT (if available in entity metadata)
  // SNOMED CT is the gold standard for medical terminology
  const snomedCode = entity.metadata?.snomed_ct_code;
  if (snomedCode) {
    links.push(`http://snomed.info/id/${snomedCode}`);
  }

  // 4. ICD-10 (if available)
  const icd10Code = entity.metadata?.icd10_code;
  if (icd10Code && typeof icd10Code === 'string') {
    // Link to WHO ICD browser
    links.push(`https://icd.who.int/browse10/2019/en#/${icd10Code.replace('.', '')}`);
  }

  return links.length > 0 ? links : null;
}

/**
 * Generate sameAs array for Drug/MedicalTherapy schemas
 *
 * @param entity - The treatment entity
 * @returns Array of authoritative URIs or null if no mappings found
 */
export function getTreatmentSameAsLinks(entity: Entity): string[] | null {
  const links: string[] = [];

  // 1. Wikidata - Check metadata first, then hardcoded map
  const wikidataId = entity.metadata?.wikidata_qid || TREATMENT_WIKIDATA_MAP[entity.slug];
  if (wikidataId && /^Q\d+$/.test(wikidataId)) {
    links.push(`https://www.wikidata.org/wiki/${wikidataId}`);
  }

  // 2. DBpedia (fallback)
  const dbpediaUri = getDBpediaURI(entity.slug, 'treatment');
  if (dbpediaUri && !wikidataId) {
    links.push(dbpediaUri);
  }

  // 3. RxNorm (for medications)
  // RxNorm is the NIH standard for clinical drugs
  const rxnormCode = entity.metadata?.rxnorm_code;
  if (rxnormCode) {
    links.push(`https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${rxnormCode}`);
  }

  // 4. DrugBank (for medications)
  const drugbankId = entity.metadata?.drugbank_id;
  if (drugbankId) {
    links.push(`https://go.drugbank.com/drugs/${drugbankId}`);
  }

  // 5. PubChem (for chemical compounds)
  const pubchemId = entity.metadata?.pubchem_cid;
  if (pubchemId) {
    links.push(`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemId}`);
  }

  return links.length > 0 ? links : null;
}

/**
 * Generate sameAs array for mental health resources (organizations, apps, tools)
 *
 * @param entity - The resource entity
 * @returns Array of authoritative URIs or null if no mappings found
 */
export function getResourceSameAsLinks(entity: Entity): string[] | null {
  const links: string[] = [];

  // 1. Wikidata - Check metadata first, then hardcoded map
  const wikidataId = entity.metadata?.wikidata_qid || RESOURCE_WIKIDATA_MAP[entity.slug];
  if (wikidataId && /^Q\d+$/.test(wikidataId)) {
    links.push(`https://www.wikidata.org/wiki/${wikidataId}`);
  }

  // 2. DBpedia (fallback)
  const dbpediaUri = getDBpediaURI(entity.slug, 'treatment'); // Using treatment type as fallback
  if (dbpediaUri && !wikidataId) {
    links.push(dbpediaUri);
  }

  return links.length > 0 ? links : null;
}

/**
 * Get ORCID URL for medical professionals
 *
 * ORCID is the gold standard for researcher identification
 * Used for E-E-A-T verification in Google Search
 *
 * @param orcidId - ORCID identifier (format: 0000-0001-2345-6789)
 * @returns Full ORCID URL
 */
export function getORCIDUrl(orcidId: string): string {
  return `https://orcid.org/${orcidId}`;
}

/**
 * Validate Wikidata QID format
 * @param qid - Wikidata identifier (e.g., Q131755)
 * @returns True if valid format
 */
export function isValidWikidataQID(qid: string): boolean {
  return /^Q\d+$/.test(qid);
}

/**
 * Validate ORCID format
 * @param orcid - ORCID identifier
 * @returns True if valid format
 */
export function isValidORCID(orcid: string): boolean {
  return /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/.test(orcid);
}

/**
 * Get statistics on knowledge graph coverage
 * Useful for monitoring/reporting
 */
export function getKnowledgeGraphCoverage(): {
  conditions: number;
  treatments: number;
  resources: number;
  total: number;
} {
  return {
    conditions: Object.keys(CONDITION_WIKIDATA_MAP).length,
    treatments: Object.keys(TREATMENT_WIKIDATA_MAP).length,
    resources: Object.keys(RESOURCE_WIKIDATA_MAP).length,
    total: Object.keys(CONDITION_WIKIDATA_MAP).length + Object.keys(TREATMENT_WIKIDATA_MAP).length + Object.keys(RESOURCE_WIKIDATA_MAP).length,
  };
}
