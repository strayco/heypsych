// Script to populate support-community resources
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resources = {
  // Crisis Resources
  "crisis/veterans-crisis-line": {
    kind: "resource",
    slug: "veterans-crisis-line",
    name: "Veterans Crisis Line",
    category: "support-community",
    description:
      "24/7 confidential crisis support for Veterans, service members, National Guard, Reserve, and their families and friends.",
    metadata: {
      category: "support-community",
      subcategory: "crisis",
      availability: "24/7",
      cost: "free",
      conditions: ["crisis", "ptsd", "depression", "suicide"],
      population: ["Veterans", "Military", "Service Members"],
    },
    organization: "U.S. Department of Veterans Affairs",
    phone: "988 (Press 1)",
    text: "Text 838255",
    website: "https://www.veteranscrisisline.net",
    coverage: "United States",
  },

  "crisis/trans-lifeline": {
    kind: "resource",
    slug: "trans-lifeline",
    name: "Trans Lifeline",
    category: "support-community",
    description:
      "Peer support hotline run by and for trans people. Provides emotional and financial support to trans people in crisis.",
    metadata: {
      category: "support-community",
      subcategory: "crisis",
      cost: "free",
      conditions: ["crisis", "transgender", "lgbtq"],
      population: ["Transgender", "Non-binary", "LGBTQ+"],
    },
    organization: "Trans Lifeline",
    phone: "US: 1-877-565-8860, Canada: 1-877-330-6366",
    website: "https://translifeline.org",
    coverage: "United States, Canada",
  },

  // Recovery Programs
  "recovery/alcoholics-anonymous": {
    kind: "resource",
    slug: "alcoholics-anonymous",
    name: "Alcoholics Anonymous (AA)",
    category: "support-community",
    description:
      "International fellowship of people who have had a drinking problem. 12-step program with meetings worldwide.",
    metadata: {
      category: "support-community",
      subcategory: "recovery",
      cost: "free",
      format: "in-person and online",
      conditions: ["alcohol use disorder", "addiction", "substance use"],
    },
    organization: "Alcoholics Anonymous",
    website: "https://www.aa.org",
    phone: "Check local listings",
    coverage: "Worldwide",
  },

  "recovery/narcotics-anonymous": {
    kind: "resource",
    slug: "narcotics-anonymous",
    name: "Narcotics Anonymous (NA)",
    category: "support-community",
    description:
      "Community-based program for people recovering from drug addiction. 12-step fellowship with meetings worldwide.",
    metadata: {
      category: "support-community",
      subcategory: "recovery",
      cost: "free",
      format: "in-person and online",
      conditions: ["substance use disorder", "addiction", "drug use"],
    },
    organization: "Narcotics Anonymous",
    website: "https://www.na.org",
    coverage: "Worldwide",
  },

  "recovery/smart-recovery": {
    kind: "resource",
    slug: "smart-recovery",
    name: "SMART Recovery",
    full_name: "Self-Management and Recovery Training",
    category: "support-community",
    description:
      "Science-based alternative to 12-step programs. Provides support for people with addictions using cognitive behavioral approaches.",
    metadata: {
      category: "support-community",
      subcategory: "recovery",
      cost: "free",
      format: "in-person and online",
      conditions: ["addiction", "substance use", "behavioral addiction"],
    },
    organization: "SMART Recovery",
    website: "https://www.smartrecovery.org",
    coverage: "Worldwide",
  },

  "recovery/al-anon": {
    kind: "resource",
    slug: "al-anon",
    name: "Al-Anon",
    category: "support-community",
    description:
      "Support groups for families and friends of people with alcohol problems. 12-step program for loved ones affected by someone else's drinking.",
    metadata: {
      category: "support-community",
      subcategory: "recovery",
      cost: "free",
      format: "in-person and online",
      conditions: ["family support", "codependency"],
      population: ["Family Members", "Friends"],
    },
    organization: "Al-Anon Family Groups",
    website: "https://al-anon.org",
    coverage: "Worldwide",
  },

  // Communities - Anxiety & OCD
  "communities/anxiety-ocd/adaa": {
    kind: "resource",
    slug: "adaa",
    name: "ADAA",
    full_name: "Anxiety and Depression Association of America",
    category: "support-community",
    description:
      "Educational resources, online peer support community, and therapist directory for anxiety and depression.",
    metadata: {
      category: "support-community",
      subcategory: "communities",
      cost: "free",
      format: "online",
      conditions: ["anxiety", "depression", "ocd", "ptsd", "panic disorder"],
    },
    organization: "Anxiety and Depression Association of America",
    website: "https://adaa.org",
    coverage: "United States",
  },

  "communities/anxiety-ocd/international-ocd-foundation": {
    kind: "resource",
    slug: "international-ocd-foundation",
    name: "International OCD Foundation",
    category: "support-community",
    description:
      "Resources, education, and support for people with OCD and related disorders. Hosts annual conference and connects people to treatment.",
    metadata: {
      category: "support-community",
      subcategory: "communities",
      cost: "free",
      format: "online and in-person",
      conditions: ["ocd", "body-focused repetitive behaviors", "hoarding"],
    },
    organization: "International OCD Foundation",
    website: "https://iocdf.org",
    coverage: "International",
  },

  // Communities - ADHD & Autism
  "communities/adhd-autism/chadd": {
    kind: "resource",
    slug: "chadd",
    name: "CHADD",
    full_name: "Children and Adults with Attention-Deficit/Hyperactivity Disorder",
    category: "support-community",
    description:
      "Education, advocacy, and support for individuals with ADHD and their families. Local chapters and online community.",
    metadata: {
      category: "support-community",
      subcategory: "communities",
      cost: "free and membership options",
      format: "online and in-person",
      conditions: ["adhd", "add"],
    },
    organization: "CHADD",
    website: "https://chadd.org",
    coverage: "United States",
  },

  "communities/adhd-autism/autism-society": {
    kind: "resource",
    slug: "autism-society",
    name: "Autism Society",
    category: "support-community",
    description:
      "Local support groups, educational resources, and advocacy for individuals on the autism spectrum and their families.",
    metadata: {
      category: "support-community",
      subcategory: "communities",
      cost: "free",
      format: "online and in-person",
      conditions: ["autism", "asd", "aspergers"],
    },
    organization: "Autism Society",
    website: "https://www.autism-society.org",
    coverage: "United States",
  },

  "communities/adhd-autism/asan": {
    kind: "resource",
    slug: "asan",
    name: "ASAN",
    full_name: "Autistic Self Advocacy Network",
    category: "support-community",
    description:
      "Autism advocacy organization run by and for autistic people. Focuses on systemic advocacy and community building.",
    metadata: {
      category: "support-community",
      subcategory: "communities",
      cost: "free",
      format: "online",
      conditions: ["autism", "neurodiversity"],
      population: ["Autistic Adults", "Self-advocates"],
    },
    organization: "Autistic Self Advocacy Network",
    website: "https://autisticadvocacy.org",
    coverage: "United States",
  },

  // Communities - Eating Disorders
  "communities/eating-disorders/neda": {
    kind: "resource",
    slug: "neda",
    name: "NEDA",
    full_name: "National Eating Disorders Association",
    category: "support-community",
    description:
      "Screening tools, treatment resources, support groups, and helpline for eating disorders.",
    metadata: {
      category: "support-community",
      subcategory: "communities",
      cost: "free",
      format: "online",
      conditions: ["anorexia", "bulimia", "binge eating disorder", "eating disorders"],
    },
    organization: "National Eating Disorders Association",
    website: "https://www.nationaleatingdisorders.org",
    phone: "1-800-931-2237",
    text: "Text NEDA to 741741",
    coverage: "United States",
  },

  // Identity - Faith
  "identity/faith/faithnet-nami": {
    kind: "resource",
    slug: "faithnet-nami",
    name: "FaithNet NAMI",
    category: "support-community",
    description:
      "NAMI's faith-based resource connecting faith communities with mental health support and education.",
    metadata: {
      category: "support-community",
      subcategory: "identity",
      cost: "free",
      conditions: ["mental health", "faith-based"],
      population: ["Faith Communities", "Religious"],
    },
    organization: "NAMI (National Alliance on Mental Illness)",
    website: "https://www.nami.org/Get-Involved/FaithNet",
    coverage: "United States",
  },

  // Identity - Family
  "identity/family/postpartum-support": {
    kind: "resource",
    slug: "postpartum-support",
    name: "Postpartum Support International",
    category: "support-community",
    description:
      "Support, education, and resources for families experiencing perinatal mood and anxiety disorders.",
    metadata: {
      category: "support-community",
      subcategory: "identity",
      cost: "free",
      format: "online and phone",
      conditions: ["postpartum depression", "anxiety", "perinatal mental health"],
      population: ["New Parents", "Pregnant", "Postpartum"],
    },
    organization: "Postpartum Support International",
    website: "https://www.postpartum.net",
    phone: "1-800-944-4773",
    text: "Text 503-894-9453",
    coverage: "International",
  },
};

// Create all the JSON files
const baseDir = path.join(__dirname, "..", "data", "resources", "support-community");

Object.entries(resources).forEach(([filePath, content]) => {
  const fullPath = path.join(baseDir, `${filePath}.json`);
  const dir = path.dirname(fullPath);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the JSON file
  fs.writeFileSync(fullPath, JSON.stringify(content, null, 2));
  console.log(`✅ Created: ${filePath}.json`);
});

console.log(`\n🎉 Successfully populated ${Object.keys(resources).length} support resources!`);
