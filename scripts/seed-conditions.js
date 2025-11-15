import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: ".env.local" });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// Helper function to get basic condition data
function createConditionData(name, category, prevalence = "Data not available", onset = "Varies") {
  return {
    name: name,
    slug: createSlug(name),
    title: name,
    description: `${name} is a mental health condition classified under ${category} in the DSM-5.`,
    content: {
      name: name,
      description: `${name} is a mental health condition classified under ${category} in the DSM-5.`,
      prevalence: prevalence,
      age_of_onset: onset,
      symptoms: {
        primary: ["Symptoms vary by individual", "Professional assessment required"],
      },
      diagnostic_criteria:
        "Diagnosis requires professional clinical assessment according to DSM-5 criteria.",
      prognosis: "Treatment outcomes vary; professional care recommended.",
      comorbidities: [],
      risk_factors: {
        biological: ["Genetic factors", "Brain chemistry"],
        psychological: ["Stress", "Trauma"],
        environmental: ["Life circumstances", "Social factors"],
      },
      category: category,
    },
    metadata: {
      category: category,
      prevalence: prevalence,
      age_of_onset: onset,
      entity_type: "condition",
    },
  };
}

// COMPLETE DSM-5 CONDITIONS (Just the key ones for testing)
const allDSMConditions = [
  // Intellectual Disabilities
  createConditionData(
    "Intellectual Disability (Intellectual Developmental Disorder)",
    "Autism & Development",
    "1-2% of population",
    "Before age 18"
  ),
  createConditionData(
    "Global Developmental Delay",
    "Autism & Development",
    "1-3% of children",
    "Early childhood"
  ),
  createConditionData(
    "Unspecified Intellectual Disability",
    "Autism & Development",
    "Varies",
    "Before age 18"
  ),

  // Communication Disorders
  createConditionData(
    "Language Disorder",
    "Autism & Development",
    "7-8% of children",
    "Early childhood"
  ),
  createConditionData(
    "Speech Sound Disorder",
    "Autism & Development",
    "8-15% of children",
    "Early childhood"
  ),
  createConditionData(
    "Childhood-Onset Fluency Disorder (Stuttering)",
    "Autism & Development",
    "1% of children",
    "Ages 2-7"
  ),

  // Autism Spectrum Disorder
  {
    name: "Autism Spectrum Disorder",
    slug: "autism-spectrum-disorder",
    title: "Autism Spectrum Disorder",
    description:
      "A neurodevelopmental disorder characterized by challenges with social communication and restricted, repetitive behaviors.",
    content: {
      name: "Autism Spectrum Disorder",
      description:
        "A neurodevelopmental disorder characterized by challenges with social communication and restricted, repetitive behaviors.",
      prevalence: "1 in 36 children",
      age_of_onset: "Early childhood (symptoms apparent by age 2)",
      symptoms: {
        social_communication: [
          "Difficulty with social interaction",
          "Limited eye contact",
          "Challenges with nonverbal communication",
        ],
        restricted_behaviors: [
          "Repetitive movements",
          "Intense interests",
          "Sensory sensitivities",
          "Need for routine",
        ],
      },
      diagnostic_criteria:
        "Persistent deficits in social communication and restricted, repetitive patterns of behavior",
      prognosis: "Varies widely; early intervention improves outcomes",
      comorbidities: ["ADHD", "Anxiety Disorders", "Intellectual Disability"],
      risk_factors: {
        biological: ["Genetics", "Advanced parental age", "Prenatal factors"],
        environmental: ["Prenatal infections", "Birth complications"],
      },
      category: "Autism & Development",
    },
    metadata: {
      category: "Autism & Development",
      prevalence: "1 in 36 children",
      age_of_onset: "Early childhood",
      entity_type: "condition",
    },
  },

  // ADHD
  {
    name: "Attention-Deficit/Hyperactivity Disorder",
    slug: "adhd",
    title: "Attention-Deficit/Hyperactivity Disorder (ADHD)",
    description:
      "A neurodevelopmental disorder characterized by persistent patterns of inattention, hyperactivity, and impulsivity.",
    content: {
      name: "Attention-Deficit/Hyperactivity Disorder",
      description:
        "A neurodevelopmental disorder characterized by persistent patterns of inattention, hyperactivity, and impulsivity.",
      prevalence: "5-7% of children, 2.5% of adults",
      age_of_onset: "Childhood (before age 12)",
      symptoms: {
        inattentive: [
          "Difficulty focusing",
          "Forgetfulness",
          "Easily distracted",
          "Poor organization",
        ],
        hyperactive: ["Restlessness", "Excessive talking", "Difficulty sitting still"],
        impulsive: ["Acting without thinking", "Interrupting others", "Difficulty waiting"],
      },
      diagnostic_criteria:
        "Persistent pattern of inattention and/or hyperactivity-impulsivity that interferes with functioning",
      prognosis: "Manageable with proper treatment and support",
      comorbidities: ["Learning Disorders", "Anxiety Disorders", "Depression"],
      risk_factors: {
        biological: ["Genetics", "Brain structure differences", "Premature birth"],
        environmental: ["Lead exposure", "Alcohol/tobacco use during pregnancy"],
      },
      category: "Attention & Learning",
    },
    metadata: {
      category: "Attention & Learning",
      prevalence: "5-7% of children, 2.5% of adults",
      age_of_onset: "Childhood",
      entity_type: "condition",
    },
  },

  // Major Depression
  {
    name: "Major Depressive Disorder",
    slug: "major-depressive-disorder",
    title: "Major Depressive Disorder",
    description:
      "A mood disorder characterized by persistent feelings of sadness, hopelessness, and loss of interest.",
    content: {
      name: "Major Depressive Disorder",
      description:
        "A mood disorder characterized by persistent feelings of sadness, hopelessness, and loss of interest.",
      prevalence: "8.5% of adults annually",
      age_of_onset: "Can occur at any age, peak onset in 20s",
      symptoms: {
        emotional: ["Persistent sadness", "Hopelessness", "Loss of interest", "Guilt"],
        cognitive: ["Difficulty concentrating", "Indecisiveness", "Negative thoughts"],
        physical: ["Fatigue", "Sleep changes", "Appetite changes", "Psychomotor changes"],
      },
      diagnostic_criteria:
        "Five or more symptoms present for at least 2 weeks, including depressed mood or loss of interest",
      prognosis: "Highly treatable with therapy, medication, or combination",
      comorbidities: ["Anxiety Disorders", "Substance Use Disorders", "Chronic Medical Conditions"],
      risk_factors: {
        biological: ["Family history", "Brain chemistry", "Hormonal changes"],
        psychological: ["Perfectionism", "Low self-esteem", "Pessimistic thinking"],
        environmental: ["Trauma", "Loss", "Stress", "Social isolation"],
      },
      category: "Mood & Depression",
    },
    metadata: {
      category: "Mood & Depression",
      prevalence: "8.5% of adults annually",
      age_of_onset: "Any age",
      entity_type: "condition",
    },
  },

  createConditionData(
    "Generalized Anxiety Disorder",
    "Anxiety & Fear",
    "2.9% of adults",
    "Any age, peak in middle age"
  ),
  createConditionData(
    "Panic Disorder",
    "Anxiety & Fear",
    "2.7% of adults",
    "Late teens to mid-30s"
  ),
  createConditionData(
    "Social Anxiety Disorder (Social Phobia)",
    "Anxiety & Fear",
    "7% of adults",
    "Early teens"
  ),

  // Add more key conditions here...
  createConditionData(
    "Bipolar I Disorder",
    "Mood & Depression",
    "1% of adults",
    "Late teens to early 20s"
  ),
  createConditionData(
    "Schizophrenia",
    "Psychotic Disorders",
    "1.1% of adults",
    "Late teens to early 30s"
  ),
  createConditionData(
    "Obsessive-Compulsive Disorder",
    "Obsessive & Compulsive",
    "1.2% of adults",
    "Childhood to early adulthood"
  ),
  createConditionData(
    "Posttraumatic Stress Disorder",
    "Trauma & Stress",
    "3.5% of adults annually",
    "Any age after trauma"
  ),
];

async function seedAllConditions() {
  console.log("🧠 Seeding Mental Health Conditions...");
  console.log("=====================================");
  console.log(`📊 Total conditions to seed: ${allDSMConditions.length}`);

  try {
    // Check for existing conditions to avoid duplicates
    console.log("🔍 Checking for existing conditions...");
    const { data: existing } = await supabase
      .from("entities")
      .select("slug")
      .eq("type", "condition");

    const existingSlugs = new Set(existing?.map((e) => e.slug) || []);
    const newConditions = allDSMConditions.filter((c) => !existingSlugs.has(c.slug));

    if (newConditions.length === 0) {
      console.log("⚠️  All conditions already exist in database");
      return;
    }

    console.log(
      `📝 Inserting ${newConditions.length} new conditions (${allDSMConditions.length - newConditions.length} duplicates skipped)`
    );

    // Transform conditions for universal entity system
    const conditionEntities = newConditions.map((condition) => ({
      type: "condition",
      slug: condition.slug,
      title: condition.title || condition.name,
      description: condition.description,
      content: condition.content,
      metadata: condition.metadata,
      status: "active",
    }));

    let successCount = 0;
    let errorCount = 0;

    // Insert in batches of 10 for better error handling
    const batchSize = 10;
    for (let i = 0; i < conditionEntities.length; i += batchSize) {
      const batch = conditionEntities.slice(i, i + batchSize);

      console.log(
        `📥 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(conditionEntities.length / batchSize)} (${batch.length} conditions)...`
      );

      const { data, error } = await supabase.from("entities").insert(batch).select();

      if (error) {
        console.error(`❌ Error inserting batch:`, error);
        errorCount += batch.length;
      } else {
        successCount += data?.length || batch.length;
        console.log(`✅ Inserted ${data?.length || batch.length} conditions`);
      }
    }

    console.log(`\n🎉 Conditions seeding completed!`);
    console.log(`✅ Successfully added: ${successCount} conditions`);
    console.log(`❌ Errors: ${errorCount} conditions`);

    // Summary by category
    const categoryCount = {};
    allDSMConditions.forEach((condition) => {
      const category = condition.content?.category || condition.metadata?.category;
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });

    console.log("\n📋 Conditions by category:");
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`   • ${category}: ${count} conditions`);
    });

    console.log("\n🎯 Next steps:");
    console.log("1. Run: node scripts/seed-treatments.js");
    console.log("2. Visit: http://localhost:3000/conditions");
  } catch (error) {
    console.error("❌ Fatal error during seeding:", error);
    console.log("💡 Make sure you ran: node scripts/setup/create-schemas.js");
    process.exit(1);
  }
}

// Run the seeding
seedAllConditions();
