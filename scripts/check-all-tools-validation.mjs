import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { ClinicianToolV4Z } from '../src/lib/schemas/clinician-tool-v4.ts';

// LAUNCH_ALLOWLIST from clinician-tool-service.ts - tools allowed to publish
const LAUNCH_ALLOWLIST = new Set([
  // AI Scribes
  'nuance-dax', 'nuance-dax-copilot', 'microsoft-dragon-copilot', 'freed', 'freed-ai', 'heidi-health',
  'nabla', 'nabla-copilot', 'deepscribe', 'suki-ai', 'suki-assistant', 'abridge', 'ambience-healthcare',
  'augmedix', 'augmedix-go', 'augmedix-live', 'commure-scribe', 's10-ai', 'notable-ai', 'notable-assistant',
  'regard', 'regard-ai', 'sunoh-ai', 'mentalyc', 'upheal', 'autonotes', 'berries', 'eleos-health',
  'supanote', 'chartnote', 'scribeberry', 'tali-ai', 'glass-ai', 'glass-health', 'deepcura', 'patientnotes',
  'evidencemd', 'iscribehealth', 'tortus', 'robin-healthcare', 'lucasai', 'onestep-scribe', 'saykara',
  'scribeai', 'scribeemr', 'scribelink', 'scribeamerica-speke', 'knowtex', 'sopris-health', 'wavo-health',
  'twofold-health', 'mh-scribe', 'pmhscribe', 'therapyfuel', 'soap-note-buddy', 'echo', 'plume-ia',
  'denscribe', 'denti-ai-voice', 'vetrec', 'mmodal-fluency-direct', 'nuance-dragon-medical-one',
  '3m-m-modal-fluency-for-imaging', 'otter-ai', 'amazon-transcribe-medical', 'google-cloud-healthcare-speech-to-text',
  'azure-ai-speech-for-health', 'assemblyai-medical-speech', 'deepgram-medical-transcription',
  'codametrix', 'fathom-ai-medical-coding', 'navina', 'inferscience-hcc-assistant', 'nym-clinical-language-understanding',
  'akasa-generative-ai', 'eclinicalworks-ai-medical-scribe', 'athenaone-ambient-notes', 'epic-ambient-ai-integrations',
  'oracle-clinical-ai-agent', 'nextgen-ambient-assist', 'healthie-ai-scribe', 'carepatron-ai-medical-scribe',
  'sessions-health-ai-assist', 'simplepractice-note-taker', 'clinicmind-ai-scribe', 'zanda-ai-session-transcription',
  'mutuo-autoscribe', 'bastiongpt', 'pieces-copilot', 'pieces-technologies', 'zoom-clinical-notes',
  'doximity-scribe', 'doximity-doxgpt', 'avaamo-ambient', 'awell-copilot', 'notemd', 'talkiatry-mdhub',

  // EHR
  'simplepractice', 'therapynotes', 'jane-app', 'icanotes', 'valant', 'valant-ehr-suite', 'theranest',
  'therapyappointment', 'luminello', 'osmind', 'blueprint', 'healthie', 'carepatron', 'practice-better',
  'power-diary', 'owl-practice', 'sessions-health', 'noteable', 'splose', 'halaxy', 'cliniko',
  'kipu-health', 'kipu-emr', 'alleva', 'alleva-emr', 'sunwave', 'sunwave-emr', 'opus', 'opus-ehr',
  'lightning-step', 'lightning-step-ehr', 'ritten', 'behave-health', 'zencharts', 'navix-health',
  'qualifacts-carelogic', 'qualifacts-credible', 'qualifacts-insync', 'netsmart-myavatar', 'netsmart-myevolv',
  'streamline-smartcare', 'core-solutions-cx360', 'welligent-ehr', 'teneleven-ecr', 'foothold-awards',
  'exym', 'echovantage', 'nextgen-office', 'nextgen-enterprise', 'advancedmd', 'advancedmd-ehr',
  'drchrono', 'athenaone', 'athenaclinicals', 'eclinicalworks-ehr', 'epic-hyperspace', 'epic-mychart',
  'oracle-health-powerchart', 'cerner-millennium', 'meditech-expanse', 'practice-fusion', 'kareo-clinical',
  'tebra', 'elation-health', 'charm-health', 'greenway-health', 'amazing-charts', 'praxis-emr',
  'modernizing-medicine', 'veradigm-ehr', 'allscripts-professional-ehr',

  // Billing/RCM
  'candid-health', 'waystar', 'availity', 'trizetto', 'change-healthcare', 'r1-rcm', 'experian-health',
  'cedar', 'collectly', 'patientpay', 'rectangle-health', 'inbox-health', 'adonis', 'charta-health',
  'akasa', 'finthrive', 'aspirion', 'ags-health', 'coronis-health', 'neolytix', 'plutus-health',
  'xifin', 'imaginesoftware', 'infinx', 'athenahealth', 'athenacollector', 'advancedmd-medical-billing',
  'kareo-billing', 'tebra-billing', 'drchrono-medical-billing', 'eclinicalworks-rcm', 'nextgen-enterprise-pm',
  'collaboratemd', 'office-ally', 'claim-md', 'therabill', 'simplepractice-insurance-billing',
  'therapynotes-billing', 'icanotes-billing', 'valant-billing', 'osmind-billing', 'healthie-billing',
  'sessions-health-billing', 'kipu-rcm', 'alleva-rcm', 'sunwave-rcm', 'lightning-step-rcm', 'opus-rcm',
  'navix-rcm', 'nirvana-health', 'headway-billing', 'alma-insurance-support', 'grow-therapy-billing',
  'sondermind-billing', 'rula-billing', 'heard', 'mentaya', 'thrizer', 'reimbursify',

  // Measurement/DTx
  'mirah', 'blueprint', 'greenspace-health', 'owl-insights', 'neuroflow', 'valera-health',
  'quartet-health', 'tridiuum', 'tridiuum-one', 'myoutcomes', 'better-outcomes-now', 'oq-analyst',
  'm3-checklist', 'bh-works', 'vitalsign6', 'total-brain', 'holmusk-neuroblu-database', 'neuroblu',
  'shimmer', 'trayt-health', 'attunement', 'carepaths-outcomes', 'eleos-health', 'lyssn',
  'ieso-digital-health', 'silvercloud', 'sleepio', 'daylight', 'happify', 'woebot', 'wysa',
  'youper', 'koa-health', 'big-health', 'twill', 'calm-health', 'headspace-for-organizations',
  'ginger-coach', 'spring-health', 'lyra-health', 'modern-health', 'talkspace', 'betterhelp',
  'cerebral', 'done', 'brightside-health', 'mindbloom', 'nue-life', 'field-trip-health',

  // Credentialing
  'medallion', 'verifiable', 'modio-health-oneview', 'symplr-provider', 'md-staff', 'caqh-proview',
  'echo-credentialing', 'silversheet', 'healthstream-credentialstream', 'andros', 'qgenda-credentialing',
  'certemy', 'evercheck', 'ce-broker', 'doximity', 'h1', 'sermo', 'figure-1',

  // Provider Networks
  'headway', 'alma', 'grow-therapy', 'sondermind', 'rula', 'path-mental-health', 'lifestance-health',
  'mindpath-health', 'refresh-mental-health', 'ellie-mental-health', 'thriveworks', 'talkiatry',

  // Clinical Decision Support
  'uptodate', 'dynamed', 'epocrates', 'lexicomp', 'micromedex', 'clinicalkey', 'visualdx',
  'isabel', 'dxplain', 'human-dx', 'glass-health', 'openevidence', 'mdcalc',

  // Telehealth
  'doxy-me', 'zoom-healthcare', 'vsee', 'vidyo', 'amwell', 'teladoc-health', 'mdlive',

  // E-Prescribing
  'dosespot', 'drfirst-rcopia', 'newcrop', 'surescripts',

  // Patient tools
  'headspace', 'calm', 'insight-timer', 'happify', 'woebot', 'wysa', 'betterhelp', 'talkspace',
  'cerebral', 'brightside-health', 'daylio', 'moodfit', 'emoods-bipolar-mood-tracker', 'i-am-sober',
  'sober-grid', 'ptsd-coach', 'cbt-i-coach', 'mindshift-cbt', 'rootd', 'actissist', 'doximity',
  'openevidence', 'practiceq', 'talkiatry',
]);

function isPublishReady(tool) {
  if (!tool.name || !tool.slug || !tool.primary_category || !tool.short_description) {
    return false;
  }
  if (tool.compliance?.hipaa_support === 'unknown') {
    return false;
  }
  if (!tool.governance?.last_reviewed) {
    return false;
  }
  if (tool.governance?.needs_review === true) {
    return false;
  }
  return true;
}

function isToolPublishable(tool) {
  if (tool.status !== 'active') return false;
  if (tool.lifecycle?.status !== 'active' && tool.lifecycle?.status !== 'beta') return false;
  if (!isPublishReady(tool)) return false;
  if (!LAUNCH_ALLOWLIST.has(tool.slug)) return false;
  return true;
}

// Recursively get all JSON files from a directory
function getAllJsonFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllJsonFiles(fullPath));
    } else if (entry.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Check all clinician tools
const clinicianDir = 'data/tools-v4/products';
const clinicianFiles = getAllJsonFiles(clinicianDir);

const results = {
  total: clinicianFiles.length,
  zodValid: 0,
  zodInvalid: [],
  publishReady: 0,
  publishable: 0,
  notOnAllowlist: [],
  notPublishReady: [],
  byCategory: {},
};

for (const filepath of clinicianFiles) {
  try {
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    const result = ClinicianToolV4Z.safeParse(data);

    const category = data.primary_category || 'unknown';
    if (!results.byCategory[category]) {
      results.byCategory[category] = { total: 0, valid: 0, publishable: 0 };
    }
    results.byCategory[category].total++;

    if (result.success) {
      results.zodValid++;
      results.byCategory[category].valid++;

      if (isPublishReady(data)) {
        results.publishReady++;

        if (isToolPublishable(data)) {
          results.publishable++;
          results.byCategory[category].publishable++;
        } else if (!LAUNCH_ALLOWLIST.has(data.slug)) {
          results.notOnAllowlist.push({ slug: data.slug, category, score: data.governance?.data_quality_score });
        }
      } else {
        const reasons = [];
        if (!data.name) reasons.push('missing name');
        if (!data.slug) reasons.push('missing slug');
        if (!data.primary_category) reasons.push('missing primary_category');
        if (!data.short_description) reasons.push('missing short_description');
        if (data.compliance?.hipaa_support === 'unknown') reasons.push('hipaa_support=unknown');
        if (!data.governance?.last_reviewed) reasons.push('no last_reviewed');
        if (data.governance?.needs_review) reasons.push('needs_review=true');
        results.notPublishReady.push({ slug: data.slug, category, reasons });
      }
    } else {
      results.zodInvalid.push({
        file: filepath.replace(clinicianDir + '/', ''),
        slug: data.slug,
        error: result.error.errors[0]?.message || 'unknown',
        path: result.error.errors[0]?.path?.join('.') || 'unknown'
      });
    }
  } catch (e) {
    results.zodInvalid.push({
      file: filepath.replace(clinicianDir + '/', ''),
      error: e.message
    });
  }
}

console.log('=== CLINICIAN TOOLS VALIDATION REPORT ===\n');
console.log('Total files:', results.total);
console.log('Zod valid:', results.zodValid);
console.log('Zod invalid:', results.zodInvalid.length);
console.log('Publish ready:', results.publishReady);
console.log('Publishable (ready + on allowlist):', results.publishable);

console.log('\n=== BY CATEGORY ===');
const sortedCategories = Object.entries(results.byCategory)
  .sort((a, b) => b[1].total - a[1].total);

for (const [cat, stats] of sortedCategories) {
  console.log(`${cat}: ${stats.publishable}/${stats.valid}/${stats.total} (publishable/valid/total)`);
}

if (results.zodInvalid.length > 0) {
  console.log('\n=== ZOD VALIDATION ERRORS (first 30) ===');
  results.zodInvalid.slice(0, 30).forEach(e => {
    console.log(`  ${e.file || e.slug}: ${e.path || 'parse'}: ${e.error}`);
  });
}

// Show high-score tools not on allowlist
const highScoreNotAllowed = results.notOnAllowlist
  .filter(t => t.score >= 85)
  .sort((a, b) => (b.score || 0) - (a.score || 0));

if (highScoreNotAllowed.length > 0) {
  console.log('\n=== HIGH-SCORE TOOLS (85+) NOT ON ALLOWLIST ===');
  highScoreNotAllowed.slice(0, 50).forEach(t => {
    console.log(`  ${t.slug} (${t.category}): score ${t.score}`);
  });
  console.log(`  ... total: ${highScoreNotAllowed.length} tools with score 85+ not on allowlist`);
}
