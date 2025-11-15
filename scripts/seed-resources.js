import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Comprehensive resources data
const resourcesData = [
  // Assessment Tools
  {
    name: "PHQ-9 Depression Screening",
    slug: "phq-9-depression-screening",
    category: "Assessment Tools",
    type: "Depression Screening",
    description:
      "The Patient Health Questionnaire-9 (PHQ-9) is a validated 9-item depression screening tool used by healthcare providers worldwide.",
    data: {
      purpose: "Screen for depression severity and monitor treatment response",
      administration_time: "2-3 minutes",
      age_range: "12+ years",
      scoring: {
        minimal: "0-4",
        mild: "5-9",
        moderate: "10-14",
        moderately_severe: "15-19",
        severe: "20-27",
      },
      validity: "Extensively validated in primary care and specialty settings",
      clinical_use: "Initial screening, treatment monitoring, outcome measurement",
      languages_available: ["English", "Spanish", "Chinese", "Arabic", "French"],
      cost: "Free for clinical use",
      citation: "Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9.",
      questions: [
        "Little interest or pleasure in doing things",
        "Feeling down, depressed, or hopeless",
        "Trouble falling or staying asleep, or sleeping too much",
        "Feeling tired or having little energy",
        "Poor appetite or overeating",
        "Feeling bad about yourself or that you are a failure",
        "Trouble concentrating on things",
        "Moving or speaking slowly or being fidgety/restless",
        "Thoughts that you would be better off dead or hurting yourself",
      ],
    },
  },
  {
    name: "GAD-7 Anxiety Screening",
    slug: "gad-7-anxiety-screening",
    category: "Assessment Tools",
    type: "Anxiety Screening",
    description:
      "The Generalized Anxiety Disorder 7-item scale (GAD-7) is a validated tool for screening and measuring anxiety symptom severity.",
    data: {
      purpose: "Screen for generalized anxiety disorder and measure anxiety severity",
      administration_time: "2-3 minutes",
      age_range: "13+ years",
      scoring: {
        minimal: "0-4",
        mild: "5-9",
        moderate: "10-14",
        severe: "15-21",
      },
      validity: "Validated across diverse populations and clinical settings",
      clinical_use: "Screening, treatment monitoring, research",
      sensitivity: "89% for GAD",
      specificity: "82% for GAD",
      questions: [
        "Feeling nervous, anxious, or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it's hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid as if something awful might happen",
      ],
    },
  },
  {
    name: "ADHD Rating Scale-5",
    slug: "adhd-rating-scale-5",
    category: "Assessment Tools",
    type: "ADHD Screening",
    description:
      "Comprehensive ADHD assessment tool based on DSM-5 criteria for children and adolescents.",
    data: {
      purpose: "Assess ADHD symptoms and severity in children/adolescents",
      administration_time: "5-10 minutes",
      age_range: "5-17 years",
      versions: ["Parent form", "Teacher form", "Self-report (adolescents)"],
      domains: ["Inattention", "Hyperactivity-Impulsivity"],
      clinical_cutoffs: "Age and gender-specific percentile ranks",
      validity: "Normed on 2000+ children, excellent reliability",
    },
  },
  {
    name: "Beck Depression Inventory-II",
    slug: "beck-depression-inventory-ii",
    category: "Assessment Tools",
    type: "Depression Assessment",
    description:
      "21-item self-report measure of depression severity, widely used in clinical practice and research.",
    data: {
      purpose: "Measure depression severity and monitor treatment response",
      administration_time: "5-10 minutes",
      age_range: "13+ years",
      scoring: {
        minimal: "0-13",
        mild: "14-19",
        moderate: "20-28",
        severe: "29-63",
      },
      domains: ["Cognitive", "Affective", "Somatic", "Vegetative symptoms"],
      validity: "Gold standard depression measure, extensive validation",
    },
  },

  // Crisis Resources
  {
    name: "National Suicide Prevention Lifeline",
    slug: "national-suicide-prevention-lifeline",
    category: "Crisis Resources",
    type: "Crisis Hotline",
    description: "24/7 crisis support for people in suicidal crisis or emotional distress.",
    data: {
      phone: "988",
      availability: "24/7/365",
      services: ["Crisis counseling", "Risk assessment", "Local referrals", "Follow-up"],
      languages: ["English", "Spanish", "TTY available"],
      website: "suicidepreventionlifeline.org",
      text_option: "Text 'HELLO' to 741741",
      chat_option: "Online chat available",
      specialized_lines: {
        veterans: "1-800-273-8255 Press 1",
        lgbt: "1-866-488-7386",
        deaf_hard_hearing: "1-800-799-4889",
      },
    },
  },
  {
    name: "Crisis Text Line",
    slug: "crisis-text-line",
    category: "Crisis Resources",
    type: "Text Support",
    description: "Free, 24/7 crisis support via text message for people in crisis.",
    data: {
      text_number: "741741",
      keyword: "Text HOME to 741741",
      availability: "24/7/365",
      response_time: "Under 5 minutes average",
      volunteer_training: "30+ hours of training",
      privacy: "Anonymous and confidential",
    },
  },

  // Calculators & Tools
  {
    name: "Medication Cost Calculator",
    slug: "medication-cost-calculator",
    category: "Tools & Calculators",
    type: "Cost Calculator",
    description: "Compare psychiatric medication costs across pharmacies and insurance plans.",
    data: {
      features: [
        "Compare prices across major pharmacy chains",
        "Factor in insurance copays and deductibles",
        "Generic vs brand name cost analysis",
        "Discount program integration",
        "Annual cost projections",
      ],
      data_sources: ["GoodRx", "SingleCare", "Pharmacy chains", "Insurance formularies"],
      update_frequency: "Weekly price updates",
      medications_covered: "500+ psychiatric medications",
    },
  },
  {
    name: "Therapy Cost Estimator",
    slug: "therapy-cost-estimator",
    category: "Tools & Calculators",
    type: "Cost Calculator",
    description: "Estimate therapy costs based on location, insurance, and treatment type.",
    data: {
      factors: [
        "Geographic location",
        "Insurance coverage",
        "Provider credentials",
        "Session frequency",
      ],
      cost_ranges: {
        individual_therapy: "$100-300 per session",
        group_therapy: "$40-120 per session",
        intensive_outpatient: "$3000-10000 per program",
      },
      insurance_info: "Coverage varies widely by plan and provider network status",
    },
  },

  // Educational Materials
  {
    name: "Mental Health First Aid Guide",
    slug: "mental-health-first-aid-guide",
    category: "Educational Materials",
    type: "Training Resource",
    description: "Comprehensive guide to recognizing and responding to mental health crises.",
    data: {
      topics: [
        "Recognizing warning signs",
        "How to approach someone in crisis",
        "Active listening techniques",
        "When to seek professional help",
        "Cultural considerations",
        "Self-care for helpers",
      ],
      target_audience: "General public, educators, workplace leaders",
      format: "Interactive online modules with certification",
      duration: "8-hour course",
    },
  },
  {
    name: "Understanding Depression Guide",
    slug: "understanding-depression-guide",
    category: "Educational Materials",
    type: "Patient Education",
    description: "Comprehensive patient and family guide to understanding depression.",
    data: {
      sections: [
        "What is depression?",
        "Symptoms and warning signs",
        "Causes and risk factors",
        "Treatment options",
        "Supporting a loved one",
        "Recovery and maintenance",
      ],
      reading_level: "8th grade",
      languages: ["English", "Spanish", "Chinese"],
      format: "PDF download, web-based, print-friendly",
    },
  },

  // Treatment Finders
  {
    name: "Provider Directory",
    slug: "provider-directory",
    category: "Treatment Finders",
    type: "Provider Search",
    description:
      "Comprehensive directory of mental health providers with advanced search and filtering.",
    data: {
      provider_types: [
        "Psychiatrists",
        "Psychologists",
        "Licensed Clinical Social Workers",
        "Marriage & Family Therapists",
        "Psychiatric Nurse Practitioners",
        "Substance Abuse Counselors",
      ],
      search_filters: [
        "Location/Distance",
        "Insurance accepted",
        "Specialty areas",
        "Languages spoken",
        "Gender preference",
        "Telehealth availability",
      ],
      verification: "Provider licenses verified monthly",
      coverage: "Nationwide directory with 50,000+ providers",
    },
  },
  {
    name: "Treatment Program Locator",
    slug: "treatment-program-locator",
    category: "Treatment Finders",
    type: "Program Search",
    description: "Find specialized mental health and substance abuse treatment programs.",
    data: {
      program_types: [
        "Inpatient psychiatric facilities",
        "Intensive outpatient programs",
        "Partial hospitalization programs",
        "Residential treatment centers",
        "Substance abuse treatment",
        "Eating disorder programs",
      ],
      search_criteria: ["Location", "Age groups", "Insurance", "Specialty focus"],
      data_source: "SAMHSA Treatment Locator and verified facilities",
    },
  },

  // Support & Recovery
  {
    name: "Peer Support Network",
    slug: "peer-support-network",
    category: "Support & Recovery",
    type: "Community Support",
    description: "Connect with others who have similar mental health experiences.",
    data: {
      features: [
        "Moderated support groups",
        "One-on-one peer matching",
        "Recovery story sharing",
        "Resource recommendations",
        "Crisis support protocols",
      ],
      safety_measures: "Trained moderators, community guidelines, crisis protocols",
      accessibility: "Web-based platform with mobile app",
      privacy: "Anonymous participation options available",
    },
  },
  {
    name: "Recovery Toolkit",
    slug: "recovery-toolkit",
    category: "Support & Recovery",
    type: "Self-Help Resource",
    description: "Comprehensive toolkit for managing mental health and supporting recovery.",
    data: {
      tools: [
        "Mood tracking worksheets",
        "Coping skills inventory",
        "Crisis safety planning",
        "Medication management logs",
        "Therapy goal setting",
        "Relapse prevention planning",
      ],
      format: "Interactive PDFs, mobile-friendly web tools",
      evidence_base: "Based on CBT, DBT, and evidence-based practices",
    },
  },

  // Interactive Tools
  {
    name: "Mood Tracker",
    slug: "mood-tracker",
    category: "Tools & Calculators",
    type: "Self-Monitoring Tool",
    description: "Daily mood tracking tool to help identify patterns and triggers.",
    data: {
      features: [
        "Daily mood ratings (1-10 scale)",
        "Activity logging",
        "Sleep tracking",
        "Medication adherence",
        "Symptom monitoring",
        "Trigger identification",
      ],
      export_options: ["PDF reports", "Share with provider", "Data visualization"],
      privacy: "Data stored locally, export options available",
      evidence_base: "Supported by research on mood monitoring effectiveness",
    },
  },
  {
    name: "Wellness Assessment",
    slug: "wellness-assessment",
    category: "Assessment Tools",
    type: "Wellness Screening",
    description: "Comprehensive wellness assessment covering multiple domains of mental health.",
    data: {
      domains: [
        "Emotional wellbeing",
        "Social connections",
        "Physical health",
        "Work/life balance",
        "Stress management",
        "Sleep quality",
      ],
      scoring: "Percentile scores for each domain with personalized recommendations",
      duration: "10-15 minutes",
      use_cases: ["Self-assessment", "Provider intake", "Progress monitoring"],
    },
  },
];

async function seedResources() {
  console.log("📚 Seeding Comprehensive Mental Health Resources...");
  console.log("==================================================");
  console.log(`📊 Total resources to seed: ${resourcesData.length}`);

  try {
    // Check for existing resources to avoid duplicates
    console.log("🔍 Checking for existing resources...");
    const { data: existing } = await supabase
      .from("entities")
      .select("slug")
      .eq("type", "resource");

    const existingSlugs = new Set(existing?.map((e) => e.slug) || []);
    const newResources = resourcesData.filter((r) => !existingSlugs.has(r.slug));

    if (newResources.length === 0) {
      console.log("⚠️  All resources already exist in database");
      return;
    }

    console.log(
      `📝 Inserting ${newResources.length} new resources (${resourcesData.length - newResources.length} duplicates skipped)`
    );

    // Transform resources for universal entity system
    const resourceEntities = newResources.map((resource) => ({
      type: "resource",
      slug: resource.slug,
      title: resource.name,
      description: resource.description,
      content: {
        name: resource.name,
        category: resource.category,
        type: resource.type,
        description: resource.description,
        ...resource.data,
      },
      metadata: {
        category: resource.category,
        type: resource.type,
        entity_type: "resource",
      },
      status: "active",
    }));

    let successCount = 0;
    let errorCount = 0;

    // Insert in batches of 10 for better performance
    const batchSize = 10;
    for (let i = 0; i < resourceEntities.length; i += batchSize) {
      const batch = resourceEntities.slice(i, i + batchSize);

      console.log(
        `📥 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(resourceEntities.length / batchSize)} (${batch.length} resources)...`
      );

      const { data, error } = await supabase.from("entities").insert(batch).select();

      if (error) {
        console.error(`❌ Error inserting batch:`, error);
        errorCount += batch.length;
      } else {
        successCount += data?.length || batch.length;
        console.log(`✅ Inserted ${data?.length || batch.length} resources`);
      }
    }

    console.log("\n🎉 Resources seeding completed!");
    console.log(`✅ Successfully added: ${successCount} resources`);
    console.log(`❌ Errors: ${errorCount} resources`);

    // Show breakdown by category
    const categoryBreakdown = resourcesData.reduce((acc, resource) => {
      acc[resource.category] = (acc[resource.category] || 0) + 1;
      return acc;
    }, {});

    console.log("\n📋 Resources by category:");
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      console.log(`   • ${category}: ${count} resources`);
    });

    // Show sample resources
    console.log("\n📖 Sample resources:");
    resourceEntities.slice(0, 5).forEach((resource) => {
      console.log(`   • ${resource.title} (${resource.metadata.category})`);
    });

    console.log("\n🎯 Next steps:");
    console.log("1. Run: node scripts/seed-providers.js");
    console.log("2. Visit: http://localhost:3000/resources");
  } catch (error) {
    console.error("💥 Seeding failed:", error.message);
    process.exit(1);
  }
}

// Run the seeding
seedResources();
