// src/lib/tools/clinician-tool-service.ts
// Service for loading and querying V4 clinician tools
//
// ARCHITECTURE: Fail-closed catalog using canonical Zod schema.
// Only schema-valid, publication-gate-passing tools appear in public APIs.
// Raw files that fail validation are logged and excluded silently.

import {
  ClinicianToolV4Z,
  isPublishReady,
  type ClinicianToolV4,
  type ClinicianProductCategory,
  CLINICIAN_PRODUCT_CATEGORY_LABELS,
  SCHEMA_TO_TAXONOMY_CATEGORY,
  TAXONOMY_TO_SCHEMA_CATEGORIES,
} from "../schemas/clinician-tool-v4";

// ============================================================================
// RE-EXPORT TYPES FROM CANONICAL SCHEMA
// ============================================================================

export type { ClinicianToolV4 } from "../schemas/clinician-tool-v4";
export { isPublishReady } from "../schemas/clinician-tool-v4";

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface ClinicianToolFilters {
  category?: string;
  subcategory?: string;
  priceRange?: "budget" | "mid-market" | "premium" | "enterprise";
  freeTier?: boolean;
  hasAI?: boolean;
  hasEHR?: boolean;
  hasTelehealth?: boolean;
  hipaaCompliant?: boolean;
  practiceSize?: string;
  clinicianRole?: string;
  capabilities?: string[];
  integrations?: string[];
}

export interface ClinicianToolSearchResult {
  tools: ClinicianToolV4[];
  total: number;
  filters: ClinicianToolFilters;
}

export interface CategoryCount {
  slug: string;
  display_name: string;
  count: number;
  url: string;
}

// ============================================================================
// PUBLICATION GATE
// ============================================================================

/**
 * LAUNCH ALLOWLIST - All schema-validated tools eligible for publication
 *
 * This list contains all 890 V4 tools. The actual publication gate is
 * isPublishReady() which checks: name, slug, primary_category, short_description,
 * hipaa_support !== "unknown", last_reviewed, and needs_review === false.
 *
 * As of 2026-09-01: 890 tools on allowlist, ~184 pass isPublishReady()
 */
const LAUNCH_ALLOWLIST = new Set([
  // === 3 ===
  "3m-m-modal-fluency-for-imaging",
  // === 7 ===
  "75health",
  // === A ===
  "aari",
  "aari-ai-native-os",
  "aari-rcm",
  "aatbs",
  "aba-building-blocks",
  "ableto",
  "abridge",
  "access-telecare",
  "accessmedicine",
  "accolade-mental-health",
  "accumed",
  "adonis",
  "adonis-claims",
  "adonis-prior-authorization",
  "adonis-revenue-intelligence",
  "advanced-data-systems",
  "advanced-telemed-services",
  "advancedmd",
  "advancedmd-ehr",
  "advancedmd-medical-billing",
  "advancedpm",
  "affect-therapeutics",
  "ags-health",
  "aims-center-collaborative-care-registry",
  "akasa",
  "akasa-generative-ai",
  "akili-endeavorotc",
  "akili-interactive",
  "alleva",
  "alleva-crm",
  "alleva-emr",
  "alleva-incheck",
  "alleva-rcm",
  "allscripts-healthquest",
  "allscripts-opal",
  "allscripts-paragon",
  "allscripts-professional-ehr",
  "allscripts-rcms",
  "allscripts-star",
  "allscripts-sunrise",
  "allscripts-touchworks-ehr",
  "alma",
  "alma-insurance-support",
  "alma-provider-platform",
  "altera-paragon",
  "altera-sunrise",
  "altera-touchworks",
  "amazon-one-medical",
  "amazon-transcribe-medical",
  "ambience-healthcare",
  "amboss",
  "amd-global-telemedicine",
  "amelia-virtual-care",
  "american-professional-agency",
  "american-telepsychiatrists",
  "american-well-telehealth-platform",
  "amion",
  "amwell",
  "amwell-behavioral-health",
  "amwell-converge",
  "andros",
  "apa-insurance-trust",
  "aperture-credentialing",
  "appliedvr-relievrx",
  "arise",
  "array-behavioral-care",
  "as-you-are",
  "aspirion",
  "assemblyai-medical-speech",
  "athenaclinicals",
  "athenacollector",
  "athenacommunicator",
  "athenacoordinator",
  "athenaone",
  "athenaone-ambient-notes",
  "athenatelehealth",
  "attunement",
  "attunement-patient-monitoring",
  "augmedix",
  "augmedix-go",
  "augmedix-live",
  "autonotes",
  "avaamo-ambient",
  "availity",
  "availity-essentials",
  "availity-revenue-cycle-management",
  "avel-ecare",
  "aware-recovery-care",
  "awell-copilot",
  "azure-ai-speech-for-health",
  // === B ===
  "bastiongpt",
  "beck-institute-training",
  "behaivior-recovery",
  "behave-health",
  "behave-rcm",
  "behavioral-health-billing-services",
  "bend-health",
  "berries",
  "bestnotes",
  "better-outcomes-now",
  "betterhelp",
  "bh-works",
  "bicycle-health",
  "bicycle-health-mat",
  "big-health",
  "bloomapi",
  "bluebrix",
  "blueprint",
  "bmj-best-practice",
  "boulder-care",
  "boulder-care-mat",
  "breezynotes",
  "brellium",
  "bright-heart-health",
  "brightline",
  "brightside-health",
  // === C ===
  "calm-health",
  "camber",
  "candid-billing",
  "candid-claims",
  "candid-eligibility",
  "candid-health",
  "candid-remits",
  "caqh-proview",
  "carbon-health-virtual-care",
  "careclix",
  "carecloud-rcm",
  "careconnect",
  "caregility",
  "carelon-behavioral-health",
  "carepaths-ehr",
  "carepaths-outcomes",
  "carepatron",
  "carepatron-ai-medical-scribe",
  "carepatron-billing",
  "carepatron-telehealth",
  "carepov",
  "cartwheel-care",
  "catalyst",
  "cdoc",
  "ce-broker",
  "ce4less",
  "cedar",
  "cedar-pay",
  "cerebral",
  "cerner-anasazi",
  "cerner-communityworks",
  "cerner-firstnet",
  "cerner-millennium",
  "cerner-powerchart",
  "certemy",
  "certifyos",
  "change-healthcare",
  "change-healthcare-rcm",
  "charlie-health",
  "charlie-health-iop",
  "charta-health",
  "chartnote",
  "checkpoint-ehr",
  "chess-health-connections",
  "chess-health-eintervention",
  "chg-healthcare",
  "chiron-health",
  "circle-medical",
  "claim-md",
  "cleanslate-centers",
  "click-therapeutics-clickotine",
  "click-therapeutics-ct-152",
  "click-therapeutics-ct-155",
  "click4time",
  "clinicalkey",
  "clinicea",
  "clinicmind",
  "clinicmind-ai-scribe",
  "clinicsource",
  "clinictracker",
  "cliniko",
  "cliniko-telehealth",
  "cmf-group",
  "codametrix",
  "cognoa-canvas-dx",
  "collaboratemd",
  "collectly",
  "community-carelink",
  "commure-rcm",
  "commure-scribe",
  "commure-strongline",
  "comphealth",
  "compsych-guidanceresources",
  "compulink",
  "concert-health",
  "concert-health-collaborative-care",
  "consentz",
  "coralehr",
  "core-solutions-cx360",
  "coronis-health",
  "counsol-com",
  "covermymeds",
  "cph-associates",
  "credentialmydoc",
  "credsimple",
  "criteriaiq",
  "cube-therapy-billing",
  "curalinc-healthcare",
  "curogram",
  "current-health",
  // === D ===
  "daybreak-health",
  "daylight",
  "daylight-sondermind",
  "daylightrx",
  "dazos",
  "dbmotion",
  "deepcura",
  "deepgram-medical-transcription",
  "deepscribe",
  "denmaar-guardian",
  "denmaar-rcm",
  "denscribe",
  "denti-ai-voice",
  "dial3d",
  "docmatter",
  "doctor-on-demand",
  "doctor-on-demand-behavioral-health",
  "doctoralia-for-specialists",
  "doctorite",
  "docvilla",
  "dosespot",
  "doxgpt",
  "doximity",
  "doximity-ask",
  "doximity-dialer",
  "doximity-dialer-video",
  "doximity-directory",
  "doximity-doxgpt",
  "doximity-fax",
  "doximity-scribe",
  "doximity-talent-finder",
  "doxy-me",
  "drchrono",
  "drchrono-medical-billing",
  "drcloudehr",
  "drfirst-iprescribe",
  "drfirst-rcopia",
  "dricloud",
  "dricloud-telemedicine",
  "dxplain",
  "dynamed",
  "dynamicare-health",
  "dynamicare-rewards",
  // === E ===
  "e-psychiatry",
  "earlipoint",
  "eccovia-clienttrack",
  "echo",
  "echo-credentialing",
  "echovantage",
  "eclinicaltouch",
  "eclinicalworks-ai-medical-scribe",
  "eclinicalworks-ehr",
  "eclinicalworks-rcm",
  "ehryourway",
  "eko-telehealth",
  "eleanor-health",
  "eleos-health",
  "ellie-mental-health",
  "embark-behavioral-health",
  "emma",
  "enablemypractice",
  "encounter-telehealth",
  "endeavorrx",
  "ensai",
  "ensora-catalyst",
  "ensora-fusion",
  "ensora-mental-health",
  "ensora-myclientsplus",
  "ensora-npaworks",
  "ensora-procentive",
  "ensora-sharenote",
  "ensora-webaba",
  "epic-ambient-ai-integrations",
  "epic-beacon",
  "epic-cadence",
  "epic-canto",
  "epic-care-everywhere",
  "epic-cosmos",
  "epic-haiku",
  "epic-healthy-planet",
  "epic-hyperspace",
  "epic-mychart",
  "epic-resolute",
  "epic-willow",
  "epocrates",
  "equip",
  "equip-health-eating-disorder-care",
  "equip-virtual-eating-disorder-treatment",
  "evercheck",
  "evernorth-behavioral-health",
  "evidencemd",
  "evisit",
  "ewellness-healthcare",
  "experian-health",
  "experian-patient-estimates",
  "exym",
  // === F ===
  "fathom-ai-medical-coding",
  "figure-1",
  "finthrive",
  "flex-his",
  "floreo",
  "floreo-clinician-portal",
  "followmyhealth",
  "foothold-awards",
  "foresight-mental-health",
  "freed",
  "freed-ai",
  "fusion-ehr",
  // === G ===
  "galileo",
  "gehrimed",
  "genesight",
  "genoa-telepsychiatry",
  "genomind",
  "geode-health",
  "gideon",
  "ginger",
  "ginger-coach",
  "glass-ai",
  "glass-health",
  "globalmed",
  "goodtherapy",
  "google-cloud-healthcare-speech-to-text",
  "google-meet",
  "gorendezvous",
  "grand-rounds",
  "greenspace-health",
  "groups-recover-together",
  "grow-therapy",
  "grow-therapy-billing",
  "grow-therapy-provider-platform",
  "gusto",
  // === H ===
  "h1",
  "halaxy",
  "halaxy-telehealth",
  "happify",
  "happify-health",
  "happify-twill",
  "harmony-medical",
  "hatch-compliance",
  "hayat-health",
  "hazel-health-mental-health",
  "headspace-for-organizations",
  "headspace-health",
  "headway",
  "headway-billing",
  "headway-provider-platform",
  "healee",
  "healow",
  "healow-meet",
  "health-ecareers",
  "healthie",
  "healthie-ai-scribe",
  "healthie-billing",
  "healthie-telehealth",
  "healthjoy-behavioral-health",
  "healthstream-credentialstream",
  "healthtap",
  "heard",
  "heidi-health",
  "hicuity-health",
  "hinext-treat",
  "holmusk-neuroblu-database",
  "hpso",
  "human-dx",
  // === I ===
  "icanotes",
  "icanotes-billing",
  "ideal-option",
  "idgenetix",
  "ieso-digital-cbt",
  "ieso-digital-health",
  "ima-imaserve",
  "imaginesoftware",
  "inbox-health",
  "included-health-behavioral-health",
  "included-health-virtual-care",
  "inclusive-therapists",
  "inferscience-hcc-assistant",
  "infinx",
  "inflow",
  "insight-telepsychiatry",
  "insta",
  "instride-health",
  "intakeq-practiceq",
  "intakeq-telehealth",
  "intrigma",
  "iris-telehealth",
  "isabel",
  "iscribehealth",
  "ivypay",
  // === J ===
  "jane-app",
  "jane-telehealth",
  "joon-health",
  "juno-emr",
  // === K ===
  "k-health",
  "kareo-billing",
  "kareo-clinical",
  "kareo-engage",
  "kip-health",
  "kipu-emr",
  "kipu-grc",
  "kipu-health",
  "kipu-intelligence",
  "kipu-marketplace",
  "kipu-outcomes",
  "kipu-rcm",
  "kipucrm",
  "klara",
  "klara-patient-communication",
  "klarify",
  "klarify-insurance-claims",
  "knowtex",
  "koa-health",
  "koa-health-foundations",
  "koa-health-mindset",
  "koa-health-perspectives",
  // === L ===
  "lexicomp",
  "lia",
  "lifestance-health",
  "lightfully",
  "lightning-bolt",
  "lightning-step",
  "lightning-step-crm",
  "lightning-step-ehr",
  "lightning-step-rcm",
  "little-otter",
  "locumtenens-com",
  "lucasai",
  "lucet",
  "lucet-navigate-connect",
  "luma-health",
  "luminello",
  "lunajoy-health",
  "lyra-health",
  "lyssn",
  // === M ===
  "m3-checklist",
  "magellan-behavioral-health",
  "manatee",
  "mantra-health",
  "md-staff",
  "mdcalc",
  "mdhub",
  "mdlive",
  "medallion",
  "medallion-credentialing",
  "medallion-licensing",
  "medallion-payer-enrollment",
  "medclarity",
  "meddbase",
  "medez",
  "medgen",
  "medical-billers-and-coders",
  "medici",
  "medirecords",
  "medirecords-telehealth",
  "meditech-expanse",
  "medscape",
  "medshr",
  "medtrainer-credentialing",
  "memd",
  "mend",
  "mentalhappy",
  "mentalyc",
  "mentaya",
  "meru-health",
  "methasoft",
  "methodone",
  "mh-scribe",
  "micromedex",
  "microsoft-dragon-copilot",
  "microsoft-teams-for-healthcare",
  "midexpro",
  "mightier",
  "mightier-clinician-dashboard",
  "millin-billing",
  "millinpro",
  "mindful-health-solutions",
  "mindmotion-go",
  "mindoula",
  "mindpath-health",
  "mindstrong",
  "mindstrong-health",
  "mindwise-health",
  "mirah",
  "mirth-connect",
  "missing-piece-billing-consulting",
  "mmodal-fluency-direct",
  "mocingbird",
  "modern-health",
  "modio-health-oneview",
  "modio-payer-enrollment",
  "monument",
  "motivo",
  "mutuo-autoscribe",
  "my-best-practice",
  "myclientsplus",
  "myhealthpointe",
  "myinsight",
  "myoutcomes",
  "myunity",
  // === N ===
  "nabla",
  "nabla-copilot",
  "navina",
  "navix-health",
  "navix-rcm",
  "nei-prescribe",
  "neolytix",
  "netce",
  "netsmart-careconnect",
  "netsmart-carefabric",
  "netsmart-carepov",
  "netsmart-gehrimed",
  "netsmart-myavatar",
  "netsmart-myevolv",
  "netsmart-myhealthpointe",
  "netsmart-myinsight",
  "netsmart-mypov",
  "netsmart-myunity",
  "netsmart-revconnect",
  "netsmart-telehealth",
  "neuroblu",
  "neuroflow",
  "neuroflow-behavioral-health-integration",
  "neuropharmagen",
  "newcrop",
  "nextgen-behavioral-health-suite",
  "nextgen-enterprise",
  "nextgen-enterprise-ehr",
  "nextgen-enterprise-pm",
  "nextgen-mobile",
  "nextgen-office",
  "nextgen-patient-experience-platform",
  "nexus-ehr",
  "nimbo",
  "nirvana-health",
  "nocd",
  "nomad-health",
  "notable-ai",
  "notable-assistant",
  "notable-flow-studio",
  "notable-patient-ai",
  "noteable",
  "notemd",
  "npaworks",
  "nuance-dax",
  "nuance-dax-copilot",
  "nuance-dragon-medical-one",
  "nuemd",
  "nuemd-billing",
  "nym-clinical-language-understanding",
  "nystrom-associates",
  // === O ===
  "oar-health",
  "octave",
  "office-ally",
  "office-ally-service-center",
  "ohmd",
  "omada-mental-health",
  "onestep-scribe",
  "openevidence",
  "openloop",
  "operant-billing-solutions",
  "ophelia",
  "ophelia-oud-care",
  "optum-behavioral-health",
  "opus",
  "opus-crm",
  "opus-ehr",
  "opus-rcm",
  "oq-analyst",
  "oracle-clinical-ai-agent",
  "oracle-health-careaware",
  "oracle-health-communityworks",
  "oracle-health-firstnet",
  "oracle-health-healtheintent",
  "oracle-health-healthelife",
  "oracle-health-pathnet",
  "oracle-health-pharmnet",
  "oracle-health-powerchart",
  "oracle-health-radnet",
  "oracle-health-revelate",
  "orchid",
  "orchid-billing",
  "orchid-measurement-based-care",
  "osmind",
  "osmind-billing",
  "osmind-telehealth",
  "otter-ai",
  "owl-insights",
  "owl-practice",
  "oxfordvr-gamechange",
  // === P ===
  "pabau",
  "patagonia-health",
  "pathway",
  "patientnotes",
  "patientpay",
  "patientpop",
  "paydc",
  "payerpath",
  "payground",
  "pear-therapeutics",
  "pelago",
  "perfectserve",
  "personify-health-mental-wellbeing",
  "perspectives-reclaim",
  "perspectives-reclaim-denial-prevention",
  "pertexaiq-radekal",
  "pesi",
  "petal-health",
  "phreesia",
  "pieces-copilot",
  "pieces-technologies",
  "pimsy",
  "pimsy-mental-health-ehr",
  "plume-ia",
  "plushcare",
  "plutus-health",
  "pmhscribe",
  "pomelo-health",
  "power-bi-healthcare",
  "power-diary",
  "practice-better",
  "practice-better-telehealth",
  "practice-fusion",
  "practice-mate",
  "practicelink",
  "practicematch",
  "practicesuite",
  "practicesuite-billing",
  "precision-practice-management",
  "precisioncare",
  "preferra-insurance",
  "prescriberpoint",
  "prevounce",
  "prisma",
  "prms",
  "procentive",
  "procredex",
  "profi",
  "prosper-health",
  "prosperityehr",
  "psi-lu",
  "psious",
  "psychiatry-cloud",
  "psychology-today",
  "psychopharmacology-institute",
  "psychotherapy-networker",
  "psychwire",
  "psykdesk",
  "psylaris",
  "pursuecare",
  // === Q ===
  "qgenda",
  "qgenda-credentialing",
  "qualifacts-carelogic",
  "qualifacts-carelogic-enterprise",
  "qualifacts-credible",
  "qualifacts-insync",
  "qualifacts-insync-ehr",
  "qualifacts-iq",
  "qualifacts-methodone",
  "quartet-health",
  "quartet-smartmatch",
  "quenza",
  "quicdoc-enterprise",
  "quicdoc-office-cloud",
  "quicdoc-pro",
  "quicdoc-therapy",
  "quickbooks",
  // === R ===
  "r1-rcm",
  "rectangle-health",
  "rectangle-health-practice-management-bridge",
  "refresh-mental-health",
  "regard",
  "regard-ai",
  "regroup-telehealth",
  "reimbursify",
  "relatient",
  "relias",
  "remedly",
  "reservo",
  "revconnect",
  "ritten",
  "ritten-billing",
  "robin-healthcare",
  "rula",
  "rula-billing",
  "rula-provider-platform",
  "rxnt",
  "rxnt-medical-billing",
  // === S ===
  "s10-ai",
  "sa-de-vianet",
  "samms",
  "saykara",
  "schedule360",
  "scribeai",
  "scribeamerica-speke",
  "scribeberry",
  "scribeemr",
  "scribelink",
  "selia",
  "sermo",
  "sesame",
  "sesamerx",
  "sessions-health",
  "sessions-health-ai-assist",
  "sessions-health-assessments",
  "sessions-health-billing",
  "sessions-health-telehealth",
  "sevocity",
  "sharenote",
  "shiftadmin",
  "shimmer",
  "sia",
  "sigmund-aura",
  "silvercloud",
  "silvercloud-health",
  "silvercloud-space-from-anxiety",
  "silvercloud-space-from-depression",
  "silvercloud-space-from-gad",
  "silvercloud-space-from-stress",
  "silversheet",
  "simcare",
  "simcare-ai-training",
  "simplepractice",
  "simplepractice-insurance-billing",
  "simplepractice-measures",
  "simplepractice-note-taker",
  "simplepractice-telehealth",
  "skipta",
  "sleep-reset",
  "sleepio",
  "sleepiorx",
  "snapmd",
  "soap-note-buddy",
  "soc-telemed",
  "solutionreach",
  "sondermind",
  "sondermind-billing",
  "sondermind-provider-network",
  "sopris-health",
  "sparkrx",
  "splose",
  "spr-y-spry",
  "spring-health",
  "spruce-health",
  "steadymd",
  "streamline-smartcare",
  "suki-ai",
  "suki-assistant",
  "sully-ai-scribe",
  "sunoh-ai",
  "sunwave",
  "sunwave-alumni-management",
  "sunwave-crm",
  "sunwave-emr",
  "sunwave-rcm",
  "supanote",
  "superpay",
  "surescripts",
  "swymed",
  "symplr-cvo",
  "symplr-provider",
  "symplr-workforce",
  // === T ===
  "tableau-healthcare",
  "tali-ai",
  "talkiatry",
  "talkiatry-mdhub",
  "talkspace",
  "talkspace-business",
  "talkspace-psychiatry",
  "tandem-behavioral-health",
  "tebra",
  "tebra-billing",
  "teladoc-betterhelp",
  "teladoc-health",
  "teladoc-solo",
  "telehealth-by-simplepractice",
  "telehealth-certification-institute",
  "telemynd",
  "teneleven-ecr",
  "terapify",
  "thera-link",
  "therabill",
  "theranest",
  "theranest-billing",
  "theraplatform",
  "theraplatform-telehealth",
  "therapy-brands",
  "therapy-revenue-solutions",
  "therapyappointment",
  "therapyden",
  "therapyfuel",
  "therapynotes",
  "therapynotes-billing",
  "therapynotes-outcome-measures",
  "therapynotes-telehealth",
  "therapyzen",
  "thriveworks",
  "thrizer",
  "tigerconnect",
  "timelycare",
  "tm3",
  "tonic-app",
  "tortus",
  "total-brain",
  "trac9-informatics",
  "trakcare",
  "trayt-health",
  "tridiuum",
  "tridiuum-one",
  "trimed-complete",
  "trizetto",
  "trizetto-provider-solutions",
  "twill",
  "twill-care",
  "two-chairs",
  "twofold-health",
  "tytocare",
  "tytocare-home-smart-clinic",
  // === U ===
  "ukg-pro-workforce-management",
  "updox",
  "upheal",
  "uptodate",
  "uwill",
  // === V ===
  "valant",
  "valant-billing",
  "valant-ehr-suite",
  "valant-measures",
  "valant-telehealth",
  "valera-health",
  "vcita",
  "vectera",
  "vera-health",
  "veradigm-ehr",
  "verifiable",
  "verifiable-credentialing",
  "verifiable-network-management",
  "verisys",
  "vetrec",
  "vida-health-mental-health",
  "vidyohealth",
  "visualdx",
  "vitalsign6",
  "vivian-health",
  "vsee",
  "vsee-clinic",
  "vsee-messenger",
  "vsee-telehealth-platform",
  // === W ===
  "wave-accounting",
  "wavo-health",
  "waystar",
  "waystar-claims-management",
  "waystar-denial-appeal-management",
  "waystar-eligibility",
  "waystar-prior-authorization",
  "weatherby-healthcare",
  "webaba",
  "webex-for-healthcare",
  "weconnect-recovery",
  "wecounsel",
  "welligent-ehr",
  "wellsky-scheduling",
  "wheel",
  "within-health",
  "woebot",
  "woebot-health",
  "workday-healthcare",
  "workit-health",
  "wysa-copilot",
  "wysa-for-employers",
  // === X ===
  "xifin",
  "xrhealth",
  // === Y ===
  "yana-former-internal-aari-name",
  "youper",
  // === Z ===
  "zanda",
  "zanda-ai-session-transcription",
  "zanda-telehealth",
  "zelis",
  "zencare",
  "zencharts",
  "zipnosis",
  "zoom-clinical-notes",
  "zoom-for-healthcare",
  "zur-institute",
]);

/**
 * Check if a tool should be publicly visible
 *
 * A tool is publishable if ALL of:
 * - status is "active" (not draft, archived, or pending-review)
 * - lifecycle.status is "active" or "beta" (not deprecated, discontinued, acquired, merged)
 * - isPublishReady() returns true (has description, HIPAA known, reviewed, etc.)
 * - slug is on the LAUNCH_ALLOWLIST (temporary safety boundary)
 *
 * This is a STRICT gate. Fail-closed: any missing requirement excludes the tool.
 */
export function isToolPublishable(tool: ClinicianToolV4): boolean {
  // Status must be "active"
  if (tool.status !== "active") {
    return false;
  }

  // Lifecycle must be active or beta (not discontinued, acquired, etc.)
  const lifecycleStatus = tool.lifecycle?.status;
  if (lifecycleStatus && !["active", "beta"].includes(lifecycleStatus)) {
    return false;
  }

  // STRICT GATE: Must pass data quality requirements
  if (!isPublishReady(tool)) {
    return false;
  }

  // LAUNCH SAFETY: Must be on allowlist (temporary)
  if (!LAUNCH_ALLOWLIST.has(tool.slug)) {
    return false;
  }

  return true;
}

/**
 * Filter tools to only those that are publishable
 */
export function filterPublishableTools(
  tools: ClinicianToolV4[]
): ClinicianToolV4[] {
  return tools.filter(isToolPublishable);
}

// ============================================================================
// FILE SYSTEM LOADER
// ============================================================================

// Cache for schema-valid tools (may include drafts)
let allValidToolsCache: ClinicianToolV4[] | null = null;
let validToolsBySlugCache: Map<string, ClinicianToolV4> | null = null;

// Cache for publishable-only tools
let publishableToolsCache: ClinicianToolV4[] | null = null;
let publishableBySlugCache: Map<string, ClinicianToolV4> | null = null;

// Validation stats for debugging
let lastValidationStats: {
  total: number;
  schemaValid: number;
  schemaInvalid: number;
  publishable: number;
  errors: string[];
} | null = null;

/**
 * Webpack-safe server module loader
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadServerModule(moduleName: string): any {
  if (typeof window !== "undefined") return null;
  try {
    // eslint-disable-next-line no-eval
    return eval("require")(moduleName);
  } catch {
    return null;
  }
}

/**
 * Recursively find all JSON files in a directory
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findJsonFiles(dir: string, fs: any, path: any): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip non-product directories
        if (
          ["taxonomies", "raw", "generated", "comparisons"].includes(entry.name)
        ) {
          continue;
        }
        files.push(...findJsonFiles(fullPath, fs, path));
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }

  return files;
}

/**
 * Load all V4 clinician tools from /data/tools-v4/products/
 *
 * ARCHITECTURE: Fail-closed loading.
 * - Each file is validated against ClinicianToolV4Z.safeParse()
 * - Files that fail validation are logged and excluded
 * - Only schema-valid tools enter the catalog
 *
 * @param includeUnpublished - If true, returns schema-valid tools regardless of publication status.
 *                             Default false for safety.
 */
async function loadV4ToolsFromFiles(
  includeUnpublished = false
): Promise<ClinicianToolV4[]> {
  // Return cached publishable tools if available
  if (!includeUnpublished && publishableToolsCache) {
    return publishableToolsCache;
  }

  // Return cached all-valid tools if available
  if (includeUnpublished && allValidToolsCache) {
    return allValidToolsCache;
  }

  // Need to load from files
  if (!allValidToolsCache) {
    const fs = loadServerModule("fs");
    const path = loadServerModule("path");

    if (!fs || !path) {
      console.warn("File system not available - returning empty tools list");
      return [];
    }

    try {
      const toolsDir = path.join(process.cwd(), "data/tools-v4/products");

      if (!fs.existsSync(toolsDir)) {
        console.warn("V4 tools directory does not exist:", toolsDir);
        return [];
      }

      const files = findJsonFiles(toolsDir, fs, path);
      const validTools: ClinicianToolV4[] = [];
      const bySlug = new Map<string, ClinicianToolV4>();
      const errors: string[] = [];

      for (const filePath of files) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const data = JSON.parse(content);

          // Only process V4 clinician tools
          if (data.schema_version !== "4.0" || data.kind !== "clinician-tool") {
            continue;
          }

          // FAIL-CLOSED: Validate against canonical schema
          const result = ClinicianToolV4Z.safeParse(data);

          if (!result.success) {
            // Log schema failures but don't include in catalog
            const relativePath = path.relative(process.cwd(), filePath);
            const errorSummary = result.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ");
            errors.push(`${relativePath}: ${errorSummary}`);
            continue;
          }

          const tool = result.data;
          validTools.push(tool);

          // Track by slug (last one wins if duplicates)
          bySlug.set(tool.slug, tool);
        } catch (err) {
          const relativePath = path.relative(process.cwd(), filePath);
          errors.push(`${relativePath}: JSON parse error`);
        }
      }

      // Sort by featured, then by name
      validTools.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      });

      allValidToolsCache = validTools;
      validToolsBySlugCache = bySlug;

      // Compute publishable subset
      const publishable = filterPublishableTools(validTools);
      publishableToolsCache = publishable;
      publishableBySlugCache = new Map(
        publishable.map((t) => [t.slug, t])
      );

      // Store stats for debugging
      lastValidationStats = {
        total: files.length,
        schemaValid: validTools.length,
        schemaInvalid: files.length - validTools.length,
        publishable: publishable.length,
        errors: errors.slice(0, 20),
      };

      // Log summary in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[ClinicianToolService] Loaded ${validTools.length}/${files.length} schema-valid tools, ${publishable.length} publishable`
        );
      }
    } catch (error) {
      console.error("Error loading V4 tools from files:", error);
      return [];
    }
  }

  // Return appropriate cache
  if (includeUnpublished) {
    return allValidToolsCache || [];
  }
  return publishableToolsCache || [];
}

// ============================================================================
// CLINICIAN TOOL SERVICE
// ============================================================================

export class ClinicianToolService {
  /**
   * Load all V4 clinician tools (publishable only by default)
   *
   * @param options.includeUnpublished - Include drafts and non-active tools (admin only)
   */
  static async loadClinicianTools(options?: {
    includeUnpublished?: boolean;
  }): Promise<ClinicianToolV4[]> {
    return loadV4ToolsFromFiles(options?.includeUnpublished ?? false);
  }

  /**
   * Load ALL schema-valid tools including drafts (for admin/validation use only)
   */
  static async loadAllToolsIncludingDrafts(): Promise<ClinicianToolV4[]> {
    return loadV4ToolsFromFiles(true);
  }

  /**
   * Get a single tool by slug
   *
   * SECURITY: Only returns publishable tools by default.
   * Use options.includeUnpublished for admin access.
   */
  static async getBySlug(
    slug: string,
    options?: { includeUnpublished?: boolean }
  ): Promise<ClinicianToolV4 | null> {
    // Ensure cache is populated
    await loadV4ToolsFromFiles(options?.includeUnpublished ?? false);

    if (options?.includeUnpublished) {
      return validToolsBySlugCache?.get(slug) ?? null;
    }

    // PUBLICATION GATE: Only return from publishable cache
    return publishableBySlugCache?.get(slug) ?? null;
  }

  /**
   * Get tools by category.
   * Accepts both schema category slugs and V4 taxonomy slugs.
   */
  static async getByCategory(
    categorySlug: string
  ): Promise<ClinicianToolV4[]> {
    const allTools = await this.loadClinicianTools();

    // Get schema categories that map to this taxonomy slug
    const schemaCategories = TAXONOMY_TO_SCHEMA_CATEGORIES[categorySlug];

    if (schemaCategories && schemaCategories.length > 0) {
      // This is a taxonomy slug - filter by mapped schema categories
      return allTools.filter((tool) =>
        schemaCategories.includes(tool.primary_category)
      );
    }

    // Fallback: treat as schema category slug (direct match)
    return allTools.filter((tool) => tool.primary_category === categorySlug);
  }

  /**
   * Get tools by category (including secondary categories).
   * Accepts both schema category slugs and V4 taxonomy slugs.
   */
  static async getByCategoryInclusive(
    categorySlug: string
  ): Promise<ClinicianToolV4[]> {
    const allTools = await this.loadClinicianTools();

    // Get schema categories that map to this taxonomy slug
    const schemaCategories = TAXONOMY_TO_SCHEMA_CATEGORIES[categorySlug];

    if (schemaCategories && schemaCategories.length > 0) {
      // This is a taxonomy slug
      return allTools.filter(
        (tool) =>
          schemaCategories.includes(tool.primary_category) ||
          tool.secondary_categories.some((cat) => schemaCategories.includes(cat))
      );
    }

    // Fallback: treat as schema category slug
    return allTools.filter(
      (tool) =>
        tool.primary_category === categorySlug ||
        tool.secondary_categories.includes(categorySlug as ClinicianProductCategory)
    );
  }

  /**
   * Get tool counts per category (publishable only).
   * Returns counts by SCHEMA category slugs (as stored in tool data).
   */
  static async getToolCounts(): Promise<Record<string, number>> {
    const allTools = await this.loadClinicianTools();
    const counts: Record<string, number> = {};

    for (const tool of allTools) {
      counts[tool.primary_category] = (counts[tool.primary_category] || 0) + 1;
    }

    return counts;
  }

  /**
   * Get tool counts by V4 TAXONOMY category slugs (SEO-friendly URLs).
   * Maps schema categories to taxonomy categories for consistent URL structure.
   */
  static async getToolCountsByTaxonomy(): Promise<Record<string, number>> {
    const allTools = await this.loadClinicianTools();
    const counts: Record<string, number> = {};

    for (const tool of allTools) {
      // Map schema category to taxonomy category
      const taxonomySlug = SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category];
      if (taxonomySlug) {
        counts[taxonomySlug] = (counts[taxonomySlug] || 0) + 1;
      }
    }

    return counts;
  }

  // Taxonomy slug to display name mapping
  private static readonly TAXONOMY_DISPLAY_NAMES: Record<string, string> = {
    "marketing-patient-acquisition": "Marketing & Patient Acquisition",
    "ehr-practice-management": "EHR & Practice Management",
    "ai-scribe-documentation": "AI Scribes & Documentation",
    "billing-rcm": "Billing & RCM",
    "telehealth-communication": "Telehealth & Communication",
    "provider-networks": "Provider Networks",
    "measurement-outcomes": "Measurement & Outcomes",
    "prescribing-erx": "Prescribing & e-Rx",
    "credentialing-workforce": "Credentialing & Workforce",
    "patient-engagement": "Patient Engagement",
    "clinical-decision-support": "Clinical Decision Support",
    "scheduling-intake": "Scheduling & Intake",
    "compliance-security": "Compliance & Security",
    "analytics-reporting": "Analytics & Reporting",
    "care-coordination": "Care Coordination",
    "digital-therapeutics": "Digital Therapeutics",
    "malpractice-insurance": "Malpractice Insurance",
  };

  /**
   * Get tool counts with category metadata using V4 taxonomy slugs.
   * This is the primary method for the landing page.
   */
  static async getCategoryCounts(): Promise<CategoryCount[]> {
    const counts = await this.getToolCountsByTaxonomy();

    return Object.entries(counts)
      .map(([slug, count]) => ({
        slug,
        display_name: this.TAXONOMY_DISPLAY_NAMES[slug] || slug,
        count,
        url: `/tools/for-clinicians/${slug}/`,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Search clinician tools with filters
   */
  static async searchClinicianTools(
    query?: string,
    filters?: ClinicianToolFilters
  ): Promise<ClinicianToolSearchResult> {
    let tools = await this.loadClinicianTools();

    // Apply text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      tools = tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(lowerQuery) ||
          (tool.short_description?.toLowerCase().includes(lowerQuery) ?? false) ||
          (tool.one_liner?.toLowerCase().includes(lowerQuery) ?? false) ||
          tool.capabilities.some((c) => c.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.category) {
        tools = tools.filter(
          (t) =>
            t.primary_category === filters.category ||
            t.secondary_categories.includes(
              filters.category as ClinicianProductCategory
            )
        );
      }

      if (filters.priceRange) {
        tools = tools.filter(
          (t) => t.pricing?.price_range === filters.priceRange
        );
      }

      if (filters.freeTier !== undefined) {
        tools = tools.filter((t) => t.pricing?.free_tier === filters.freeTier);
      }

      if (filters.hasAI !== undefined) {
        tools = tools.filter((t) => t.feature_flags.has_ai === filters.hasAI);
      }

      if (filters.hasEHR !== undefined) {
        tools = tools.filter((t) => t.feature_flags.has_ehr === filters.hasEHR);
      }

      if (filters.hasTelehealth !== undefined) {
        tools = tools.filter(
          (t) => t.feature_flags.has_telehealth === filters.hasTelehealth
        );
      }

      if (filters.hipaaCompliant !== undefined) {
        // CORRECT: Check for "yes" not truthy
        tools = tools.filter(
          (t) =>
            (t.compliance.hipaa_support === "yes") === filters.hipaaCompliant
        );
      }

      if (filters.practiceSize) {
        tools = tools.filter(
          (t) =>
            t.audiences?.organization_sizes?.includes(
              filters.practiceSize as ClinicianToolV4["audiences"]["organization_sizes"][number]
            ) ?? false
        );
      }

      if (filters.clinicianRole) {
        tools = tools.filter(
          (t) =>
            t.audiences?.clinician_roles?.includes(
              filters.clinicianRole as ClinicianToolV4["audiences"]["clinician_roles"][number]
            ) ?? false
        );
      }

      if (filters.capabilities?.length) {
        tools = tools.filter((t) =>
          filters.capabilities!.some((cap) =>
            t.capabilities.includes(
              cap as ClinicianToolV4["capabilities"][number]
            )
          )
        );
      }

      if (filters.integrations?.length) {
        tools = tools.filter((t) =>
          filters.integrations!.some((int) =>
            t.integrations.some((i) => i.slug === int)
          )
        );
      }
    }

    return {
      tools,
      total: tools.length,
      filters: filters || {},
    };
  }

  /**
   * Get comparison candidates for a category (publishable only)
   *
   * P0-12 FIX: Removed featured bias from ranking
   * Ranking is now based on:
   * 1. Data quality score (governance.data_quality_score)
   * 2. Compliance verification (HIPAA and BAA confirmed)
   * 3. Content completeness (has description, pricing info)
   * 4. Alphabetical as tiebreaker
   */
  static async getComparisonCandidates(
    category: string,
    limit = 10
  ): Promise<ClinicianToolV4[]> {
    const tools = await this.getByCategory(category);

    return tools
      .sort((a, b) => {
        // P0-12: Score based on objective data quality, NOT featured status
        const aScore = this.calculateComparisonScore(a);
        const bScore = this.calculateComparisonScore(b);
        if (aScore !== bScore) return bScore - aScore;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);
  }

  /**
   * Calculate comparison score for a tool
   *
   * P0-12: Objective scoring based on data completeness and verification
   * Score breakdown:
   * - Base data quality score (0-100 from governance)
   * - +10 if HIPAA confirmed "yes"
   * - +10 if BAA confirmed "yes"
   * - +5 if has pricing information
   * - +5 if has description > 100 chars
   * - +5 if has website URL
   */
  private static calculateComparisonScore(tool: ClinicianToolV4): number {
    let score = tool.governance?.data_quality_score || 0;

    // Compliance bonuses (separate HIPAA and BAA per P0-12)
    if (tool.compliance?.hipaa_support === "yes") score += 10;
    if (tool.compliance?.baa_available === "yes") score += 10;

    // Content completeness bonuses
    if (tool.pricing?.starting_price_display || tool.pricing?.model) score += 5;
    if (tool.short_description && tool.short_description.length > 100) score += 5;
    if (tool.website_url) score += 5;

    return score;
  }

  /**
   * Get featured tools for a category
   */
  static async getFeaturedByCategory(
    category: string,
    limit = 6
  ): Promise<ClinicianToolV4[]> {
    const tools = await this.getByCategory(category);
    return tools.filter((t) => t.featured).slice(0, limit);
  }

  /**
   * Get all featured clinician tools
   */
  static async getFeatured(limit = 6): Promise<ClinicianToolV4[]> {
    const tools = await this.loadClinicianTools();
    return tools.filter((t) => t.featured).slice(0, limit);
  }

  /**
   * Get related tools for a tool (publishable only)
   *
   * SECURITY: Only returns publishable tools even if source tool
   * has related_tools pointing to drafts.
   */
  static async getRelated(
    toolSlug: string,
    limit = 4
  ): Promise<ClinicianToolV4[]> {
    const tool = await this.getBySlug(toolSlug);
    if (!tool) return [];

    const related: ClinicianToolV4[] = [];

    // First, try explicit related tools (only publishable ones)
    if (tool.related_tools) {
      for (const relSlug of tool.related_tools.slice(0, limit * 2)) {
        // SECURITY: getBySlug only returns publishable by default
        const relTool = await this.getBySlug(relSlug);
        if (relTool) {
          related.push(relTool);
          if (related.length >= limit) break;
        }
      }
    }

    if (related.length >= limit) {
      return related.slice(0, limit);
    }

    // Fill with tools from same category
    const categoryTools = await this.getByCategory(tool.primary_category);
    for (const catTool of categoryTools) {
      if (
        catTool.slug !== toolSlug &&
        !related.some((r) => r.slug === catTool.slug)
      ) {
        related.push(catTool);
        if (related.length >= limit) break;
      }
    }

    return related.slice(0, limit);
  }

  /**
   * Get all tool slugs (for static generation) - publishable only
   */
  static async getAllSlugs(): Promise<string[]> {
    const tools = await this.loadClinicianTools();
    return tools.map((t) => t.slug);
  }

  /**
   * Get all unique categories from publishable tools
   */
  static async getAllCategories(): Promise<ClinicianProductCategory[]> {
    const tools = await this.loadClinicianTools();
    const categories = new Set<ClinicianProductCategory>();

    for (const tool of tools) {
      categories.add(tool.primary_category);
    }

    return Array.from(categories).sort();
  }

  /**
   * Get validation stats (for admin/debugging)
   */
  static getValidationStats(): typeof lastValidationStats {
    return lastValidationStats;
  }

  /**
   * Clear cache (useful for development)
   */
  static clearCache(): void {
    allValidToolsCache = null;
    validToolsBySlugCache = null;
    publishableToolsCache = null;
    publishableBySlugCache = null;
    lastValidationStats = null;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const loadClinicianTools =
  ClinicianToolService.loadClinicianTools.bind(ClinicianToolService);

export const loadAllToolsIncludingDrafts =
  ClinicianToolService.loadAllToolsIncludingDrafts.bind(ClinicianToolService);

export const getClinicianToolBySlug =
  ClinicianToolService.getBySlug.bind(ClinicianToolService);

export const getClinicianToolsByCategory =
  ClinicianToolService.getByCategory.bind(ClinicianToolService);

export const getClinicianToolCounts =
  ClinicianToolService.getToolCounts.bind(ClinicianToolService);

export const searchClinicianTools =
  ClinicianToolService.searchClinicianTools.bind(ClinicianToolService);

export const getComparisonCandidates =
  ClinicianToolService.getComparisonCandidates.bind(ClinicianToolService);
