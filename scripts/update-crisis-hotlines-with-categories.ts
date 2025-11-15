import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data/resources/support-community/crisis_hotlines.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Category mappings for existing hotlines
const categoryMappings: Record<string, string[]> = {
  'the-trevor-project': ['lgbtq+', 'youth', 'suicide-prevention'],
  'veterans-crisis-line': ['veterans', 'military', 'suicide-prevention'],
  'national-domestic-violence-hotline': ['domestic-violence', 'safety'],
  'rainn-national-sexual-assault-hotline': ['sexual-assault', 'safety'],
  'stronghearts-native-helpline': ['domestic-violence', 'indigenous', 'safety'],
  'trans-lifeline': ['lgbtq+', 'transgender'],
  'blackline': ['bipoc', 'indigenous', 'lgbtq+'],
  'boys-town-national-hotline': ['youth', 'family'],
  'youthline': ['youth', 'peer-support'],
  'childhelp-hotline': ['child-abuse', 'safety', 'youth'],
  'love-is-respect': ['domestic-violence', 'youth', 'dating-violence', 'safety'],
  'deaflead-hotline': ['accessibility', 'deaf'],
  'samhsa-helpline': ['substance-use', 'mental-health', 'addiction'],
  'nami-helpline': ['mental-health', 'peer-support'],
  'anad-helpline': ['eating-disorders', 'mental-health'],
  'maternal-mental-health-hotline': ['postpartum', 'maternal', 'pregnancy'],
  'postpartum-support-international': ['postpartum', 'maternal', 'pregnancy'],
  'disaster-distress-helpline': ['disaster', 'trauma'],
  'lgbt-national-help-center': ['lgbtq+', 'peer-support'],
  'befrienders-worldwide': ['international'],
};

// Add categories to existing hotlines
data.hotlines = data.hotlines.map((hotline: any) => ({
  ...hotline,
  categories: categoryMappings[hotline.id] || [],
}));

// International hotlines to add
const internationalHotlines = [
  {
    id: 'samaritans-uk',
    kind: 'resource',
    type: 'hotline',
    name: 'Samaritans (UK & Ireland)',
    summary: '24/7 emotional support line for anyone in distress or experiencing suicidal thoughts.',
    categories: ['international', 'suicide-prevention'],
    labels: {
      free: true,
      availability: '24/7',
      focus: ['UK', 'Ireland'],
      audience: ['All'],
      verified: true,
    },
    org: {
      name: 'Samaritans',
      url: 'https://www.samaritans.org',
    },
    coverage: [
      {
        region: 'INTL',
        scope: 'regional',
      },
    ],
    contacts: [
      {
        region: 'UK',
        channels: {
          call: [
            {
              label: 'Call',
              value: '116 123',
            },
          ],
          text: [],
          chat: [],
          tty: [],
          other: [],
        },
      },
    ],
    actions: {
      site_url: 'https://www.samaritans.org',
      chat_url: null,
      text: null,
      tty: null,
      whatsapp: null,
    },
    i18n: {
      languages: ['English'],
      accessibility: [],
    },
    taxonomy: {
      topics: ['crisis', 'suicide-prevention', 'emotional-support'],
      conditions: ['crisis', 'depression', 'suicide'],
      identities: [],
    },
    search: {
      keywords: ['uk', 'ireland', 'british', 'samaritans', 'international'],
      aka: [],
    },
    linkage: {
      see_also: ['befrienders-worldwide'],
      supersedes: [],
      superseded_by: [],
    },
    compliance: {
      last_verified: null,
      source_of_truth: 'public-website',
      notes: null,
    },
    seo: {
      indexable: true,
      canonical: '/crisis/samaritans-uk',
      schema_org: 'Organization',
    },
    display: {
      pin: false,
      weight: 0,
    },
  },
  {
    id: 'talk-suicide-canada',
    kind: 'resource',
    type: 'hotline',
    name: 'Talk Suicide Canada',
    summary: 'National 988 crisis service for Canada providing suicide prevention and crisis support.',
    categories: ['international', 'suicide-prevention'],
    labels: {
      free: true,
      availability: '24/7',
      focus: ['Canada'],
      audience: ['All'],
      verified: true,
    },
    org: {
      name: 'Talk Suicide Canada',
      url: 'https://talksuicide.ca',
    },
    coverage: [
      {
        region: 'INTL',
        scope: 'national',
      },
    ],
    contacts: [
      {
        region: 'CA',
        channels: {
          call: [
            {
              label: 'Call or Text',
              value: '988',
            },
          ],
          text: [
            {
              label: 'Text',
              value: '988',
            },
          ],
          chat: [],
          tty: [],
          other: [],
        },
      },
    ],
    actions: {
      site_url: 'https://talksuicide.ca',
      chat_url: null,
      text: '988',
      tty: null,
      whatsapp: null,
    },
    i18n: {
      languages: ['English', 'French'],
      accessibility: [],
    },
    taxonomy: {
      topics: ['crisis', 'suicide-prevention'],
      conditions: ['crisis', 'depression', 'suicide'],
      identities: [],
    },
    search: {
      keywords: ['canada', 'canadian', '988', 'international'],
      aka: [],
    },
    linkage: {
      see_also: ['befrienders-worldwide'],
      supersedes: [],
      superseded_by: [],
    },
    compliance: {
      last_verified: null,
      source_of_truth: 'public-website',
      notes: null,
    },
    seo: {
      indexable: true,
      canonical: '/crisis/talk-suicide-canada',
      schema_org: 'Organization',
    },
    display: {
      pin: false,
      weight: 0,
    },
  },
  {
    id: 'lifeline-australia',
    kind: 'resource',
    type: 'hotline',
    name: 'Lifeline Australia',
    summary: 'National crisis support and suicide prevention line for anyone in Australia.',
    categories: ['international', 'suicide-prevention'],
    labels: {
      free: true,
      availability: '24/7',
      focus: ['Australia'],
      audience: ['All'],
      verified: true,
    },
    org: {
      name: 'Lifeline Australia',
      url: 'https://www.lifeline.org.au',
    },
    coverage: [
      {
        region: 'INTL',
        scope: 'national',
      },
    ],
    contacts: [
      {
        region: 'AU',
        channels: {
          call: [
            {
              label: 'Call',
              value: '13 11 14',
            },
          ],
          text: [],
          chat: [],
          tty: [],
          other: [],
        },
      },
    ],
    actions: {
      site_url: 'https://www.lifeline.org.au',
      chat_url: null,
      text: null,
      tty: null,
      whatsapp: null,
    },
    i18n: {
      languages: ['English'],
      accessibility: [],
    },
    taxonomy: {
      topics: ['crisis', 'suicide-prevention'],
      conditions: ['crisis', 'depression', 'suicide'],
      identities: [],
    },
    search: {
      keywords: ['australia', 'australian', 'lifeline', 'international'],
      aka: [],
    },
    linkage: {
      see_also: ['befrienders-worldwide'],
      supersedes: [],
      superseded_by: [],
    },
    compliance: {
      last_verified: null,
      source_of_truth: 'public-website',
      notes: null,
    },
    seo: {
      indexable: true,
      canonical: '/crisis/lifeline-australia',
      schema_org: 'Organization',
    },
    display: {
      pin: false,
      weight: 0,
    },
  },
  {
    id: 'mind-hk',
    kind: 'resource',
    type: 'hotline',
    name: 'Mind HK',
    summary: 'Mental health text line providing support via WhatsApp and text in Hong Kong.',
    categories: ['international', 'mental-health'],
    labels: {
      free: true,
      availability: '24/7',
      focus: ['Hong Kong'],
      audience: ['All'],
      verified: true,
    },
    org: {
      name: 'Mind Hong Kong',
      url: 'https://www.mind.org.hk',
    },
    coverage: [
      {
        region: 'INTL',
        scope: 'regional',
      },
    ],
    contacts: [
      {
        region: 'HK',
        channels: {
          call: [],
          text: [
            {
              label: 'WhatsApp/Text',
              value: '9385 9677',
            },
          ],
          chat: [],
          tty: [],
          other: [],
        },
      },
    ],
    actions: {
      site_url: 'https://www.mind.org.hk',
      chat_url: null,
      text: '9385 9677',
      tty: null,
      whatsapp: '9385 9677',
    },
    i18n: {
      languages: ['English', 'Cantonese'],
      accessibility: [],
    },
    taxonomy: {
      topics: ['crisis', 'mental-health'],
      conditions: ['crisis', 'depression', 'anxiety'],
      identities: [],
    },
    search: {
      keywords: ['hong kong', 'hk', 'international', 'whatsapp'],
      aka: [],
    },
    linkage: {
      see_also: ['befrienders-worldwide'],
      supersedes: [],
      superseded_by: [],
    },
    compliance: {
      last_verified: null,
      source_of_truth: 'public-website',
      notes: null,
    },
    seo: {
      indexable: true,
      canonical: '/crisis/mind-hk',
      schema_org: 'Organization',
    },
    display: {
      pin: false,
      weight: 0,
    },
  },
  {
    id: 'aasra-india',
    kind: 'resource',
    type: 'hotline',
    name: 'AASRA (India)',
    summary: 'Suicide prevention and mental health helpline serving all of India.',
    categories: ['international', 'suicide-prevention', 'mental-health'],
    labels: {
      free: true,
      availability: '24/7',
      focus: ['India'],
      audience: ['All'],
      verified: true,
    },
    org: {
      name: 'AASRA',
      url: 'http://www.aasra.info',
    },
    coverage: [
      {
        region: 'INTL',
        scope: 'national',
      },
    ],
    contacts: [
      {
        region: 'IN',
        channels: {
          call: [
            {
              label: 'Call',
              value: '91-9820466726',
            },
          ],
          text: [],
          chat: [],
          tty: [],
          other: [],
        },
      },
    ],
    actions: {
      site_url: 'http://www.aasra.info',
      chat_url: null,
      text: null,
      tty: null,
      whatsapp: null,
    },
    i18n: {
      languages: ['Hindi', 'English'],
      accessibility: [],
    },
    taxonomy: {
      topics: ['crisis', 'suicide-prevention', 'mental-health'],
      conditions: ['crisis', 'depression', 'suicide'],
      identities: [],
    },
    search: {
      keywords: ['india', 'indian', 'aasra', 'international'],
      aka: [],
    },
    linkage: {
      see_also: ['befrienders-worldwide'],
      supersedes: [],
      superseded_by: [],
    },
    compliance: {
      last_verified: null,
      source_of_truth: 'public-website',
      notes: null,
    },
    seo: {
      indexable: true,
      canonical: '/crisis/aasra-india',
      schema_org: 'Organization',
    },
    display: {
      pin: false,
      weight: 0,
    },
  },
  {
    id: 'sos-voz-amiga-portugal',
    kind: 'resource',
    type: 'hotline',
    name: 'SOS Voz Amiga (Portugal)',
    summary: 'Emotional support helpline for anyone in Portugal experiencing distress.',
    categories: ['international', 'emotional-support'],
    labels: {
      free: true,
      availability: 'Hours vary',
      focus: ['Portugal'],
      audience: ['All'],
      verified: true,
    },
    org: {
      name: 'SOS Voz Amiga',
      url: 'https://www.sosvozamiga.org',
    },
    coverage: [
      {
        region: 'INTL',
        scope: 'national',
      },
    ],
    contacts: [
      {
        region: 'PT',
        channels: {
          call: [
            {
              label: 'Call',
              value: '213 544 545',
            },
          ],
          text: [],
          chat: [],
          tty: [],
          other: [],
        },
      },
    ],
    actions: {
      site_url: 'https://www.sosvozamiga.org',
      chat_url: null,
      text: null,
      tty: null,
      whatsapp: null,
    },
    i18n: {
      languages: ['Portuguese'],
      accessibility: [],
    },
    taxonomy: {
      topics: ['crisis', 'emotional-support'],
      conditions: ['crisis', 'depression', 'anxiety'],
      identities: [],
    },
    search: {
      keywords: ['portugal', 'portuguese', 'international'],
      aka: [],
    },
    linkage: {
      see_also: ['befrienders-worldwide'],
      supersedes: [],
      superseded_by: [],
    },
    compliance: {
      last_verified: null,
      source_of_truth: 'public-website',
      notes: null,
    },
    seo: {
      indexable: true,
      canonical: '/crisis/sos-voz-amiga-portugal',
      schema_org: 'Organization',
    },
    display: {
      pin: false,
      weight: 0,
    },
  },
  {
    id: 'samaritans-singapore',
    kind: 'resource',
    type: 'hotline',
    name: 'Samaritans Singapore',
    summary: '24/7 emotional support line for anyone in Singapore.',
    categories: ['international', 'emotional-support', 'suicide-prevention'],
    labels: {
      free: true,
      availability: '24/7',
      focus: ['Singapore'],
      audience: ['All'],
      verified: true,
    },
    org: {
      name: 'Samaritans of Singapore',
      url: 'https://www.sos.org.sg',
    },
    coverage: [
      {
        region: 'INTL',
        scope: 'national',
      },
    ],
    contacts: [
      {
        region: 'SG',
        channels: {
          call: [
            {
              label: 'Call',
              value: '1-767',
            },
          ],
          text: [],
          chat: [],
          tty: [],
          other: [],
        },
      },
    ],
    actions: {
      site_url: 'https://www.sos.org.sg',
      chat_url: null,
      text: null,
      tty: null,
      whatsapp: null,
    },
    i18n: {
      languages: ['English'],
      accessibility: [],
    },
    taxonomy: {
      topics: ['crisis', 'emotional-support', 'suicide-prevention'],
      conditions: ['crisis', 'depression', 'suicide'],
      identities: [],
    },
    search: {
      keywords: ['singapore', 'international'],
      aka: [],
    },
    linkage: {
      see_also: ['befrienders-worldwide'],
      supersedes: [],
      superseded_by: [],
    },
    compliance: {
      last_verified: null,
      source_of_truth: 'public-website',
      notes: null,
    },
    seo: {
      indexable: true,
      canonical: '/crisis/samaritans-singapore',
      schema_org: 'Organization',
    },
    display: {
      pin: false,
      weight: 0,
    },
  },
  {
    id: 'linea-135-argentina',
    kind: 'resource',
    type: 'hotline',
    name: 'Línea 135 (Argentina)',
    summary: 'National suicide prevention service for Argentina providing 24/7 crisis support.',
    categories: ['international', 'suicide-prevention'],
    labels: {
      free: true,
      availability: '24/7',
      focus: ['Argentina'],
      audience: ['All'],
      verified: true,
    },
    org: {
      name: 'Centro de Asistencia al Suicida',
      url: null,
    },
    coverage: [
      {
        region: 'INTL',
        scope: 'national',
      },
    ],
    contacts: [
      {
        region: 'AR',
        channels: {
          call: [
            {
              label: 'Call',
              value: '135',
            },
          ],
          text: [],
          chat: [],
          tty: [],
          other: [],
        },
      },
    ],
    actions: {
      site_url: null,
      chat_url: null,
      text: null,
      tty: null,
      whatsapp: null,
    },
    i18n: {
      languages: ['Spanish'],
      accessibility: [],
    },
    taxonomy: {
      topics: ['crisis', 'suicide-prevention'],
      conditions: ['crisis', 'depression', 'suicide'],
      identities: [],
    },
    search: {
      keywords: ['argentina', 'argentinian', 'spanish', 'international'],
      aka: [],
    },
    linkage: {
      see_also: ['befrienders-worldwide'],
      supersedes: [],
      superseded_by: [],
    },
    compliance: {
      last_verified: null,
      source_of_truth: 'public-website',
      notes: null,
    },
    seo: {
      indexable: true,
      canonical: '/crisis/linea-135-argentina',
      schema_org: 'Organization',
    },
    display: {
      pin: false,
      weight: 0,
    },
  },
];

// Add international hotlines
data.hotlines.push(...internationalHotlines);

// Update version
data.lastUpdated = '2025-01-10';
data.version = '2.0';

// Write back to file
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

console.log('✅ Updated crisis_hotlines.json with categories and international hotlines');
console.log(`📊 Total hotlines: ${data.hotlines.length}`);
console.log(`🌍 International hotlines: ${data.hotlines.filter((h: any) => h.categories.includes('international')).length}`);
