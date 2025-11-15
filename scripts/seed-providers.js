import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ES Module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const cities = [
  { name: "San Francisco", state: "CA", zip: "94102", lat: 37.7749, lng: -122.4194 },
  { name: "Los Angeles", state: "CA", zip: "90210", lat: 34.0522, lng: -118.2437 },
  { name: "San Diego", state: "CA", zip: "92101", lat: 32.7157, lng: -117.1611 },
  { name: "Sacramento", state: "CA", zip: "95814", lat: 38.5816, lng: -121.4944 },
  { name: "San Jose", state: "CA", zip: "95110", lat: 37.3382, lng: -121.8863 },
];

const specialtyGroups = [
  ["general_psychiatry"],
  ["child_adolescent"],
  ["geriatric"],
  ["addiction"],
  ["general_psychiatry"],
];

const medicalSchools = [
  "UCSF School of Medicine",
  "Stanford School of Medicine",
  "UCLA David Geffen School of Medicine",
  "USC Keck School of Medicine",
  "UC San Diego School of Medicine",
];

const residencyPrograms = [
  "UCSF Psychiatry Residency Program",
  "Stanford Psychiatry Residency Program",
  "UCLA Psychiatry Residency Program",
  "Massachusetts General Hospital Psychiatry Residency",
  "Johns Hopkins Psychiatry Residency",
];

const practiceNames = [
  "Bay Area Psychiatry",
  "Central Valley Mental Health",
  "Pacific Coast Psychiatric Associates",
  "Golden State Psychiatrists",
  "Comprehensive Mental Health Center",
];

const firstNames = {
  male: [
    "Michael",
    "David",
    "James",
    "Robert",
    "John",
    "William",
    "Richard",
    "Charles",
    "Joseph",
    "Thomas",
  ],
  female: [
    "Sarah",
    "Jennifer",
    "Lisa",
    "Maria",
    "Jessica",
    "Emily",
    "Ashley",
    "Amanda",
    "Michelle",
    "Stephanie",
  ],
};

const lastNames = [
  "Johnson",
  "Rodriguez",
  "Chen",
  "Kumar",
  "Williams",
  "Smith",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Garcia",
];

const insuranceOptions = [
  ["Blue Cross Blue Shield", "Aetna", "Kaiser Permanente", "UnitedHealth"],
  ["Cigna", "Anthem", "Kaiser Permanente", "Blue Cross Blue Shield"],
  ["Medicare", "Medicaid", "Blue Cross Blue Shield", "Aetna"],
  ["UnitedHealth", "Humana", "Kaiser Permanente", "Cigna"],
  ["Out-of-network", "Blue Cross Blue Shield", "Aetna"],
];

const treatmentApproaches = [
  ["medication_management", "psychopharmacology", "psychotherapy"],
  ["medication_management", "psychopharmacology", "cbt", "psychotherapy"],
  ["medication_management", "psychopharmacology", "psychodynamic"],
  ["medication_management", "consultation", "psychotherapy"],
  ["psychopharmacology", "cbt", "psychotherapy"],
];

function generateSlug(name, index) {
  // Create unique slug without timestamp for cleaner URLs
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() + `-${index}`
  );
}

function generateProvider(index) {
  const isChild = index % 5 === 0; // 20% child psychiatrists
  const isGeriatric = index % 7 === 0; // ~14% geriatric
  const isAddiction = index % 8 === 0; // ~12% addiction

  const gender = Math.random() > 0.6 ? "female" : "male"; // Slight female majority
  const firstName = firstNames[gender][index % firstNames[gender].length];
  const lastName = lastNames[index % lastNames.length];
  const city = cities[index % cities.length];

  let specialties = specialtyGroups[index % specialtyGroups.length];
  if (isChild) specialties = ["child_adolescent", "adhd", "anxiety"];
  if (isGeriatric) specialties = ["geriatric", "depression", "anxiety"];
  if (isAddiction) specialties = ["addiction", "trauma"];

  const yearsExp = Math.min(5 + (index % 25), 35); // 5-35 years experience
  const medSchool = medicalSchools[index % medicalSchools.length];
  const residency = residencyPrograms[index % residencyPrograms.length];

  // Generate realistic fees based on location and experience
  const baseFee =
    city.name === "San Francisco"
      ? 500
      : city.name === "Los Angeles"
        ? 450
        : city.name === "San Jose"
          ? 475
          : 400;

  const experienceMultiplier = 1 + yearsExp / 100; // Slight increase with experience
  const initialFee = Math.round((baseFee + (index % 100)) * experienceMultiplier);
  const followUpFee = Math.round(initialFee * 0.65);
  const medMgmtFee = Math.round(initialFee * 0.45);

  const fullName = `Dr. ${firstName} ${lastName}`;

  return {
    type: "provider",
    slug: generateSlug(`dr-${firstName}-${lastName}`, index),
    title: `${fullName}, MD`,
    description: `${isChild ? "Child & Adolescent " : isGeriatric ? "Geriatric " : isAddiction ? "Addiction " : ""}Psychiatrist in ${city.name}, CA`,
    content: {
      full_name: fullName,
      credentials: isChild
        ? "MD, Board Certified Child & Adolescent Psychiatrist"
        : isGeriatric
          ? "MD, Board Certified Geriatric Psychiatrist"
          : "MD, Board Certified Psychiatrist",
      medical_school: medSchool,
      residency: residency,
      specialties: specialties,
      subspecialties: isChild
        ? ["Board Certified in Psychiatry", "Board Certified in Child & Adolescent Psychiatry"]
        : isGeriatric
          ? ["Board Certified in Psychiatry", "Board Certified in Geriatric Psychiatry"]
          : ["Board Certified in Psychiatry"],
      practice_name: `${practiceNames[index % practiceNames.length]} - ${city.name}`,
      address: {
        street: `${100 + index} Medical Plaza Dr, Suite ${200 + (index % 800)}`,
        city: city.name,
        state: city.state,
        zip: city.zip,
        coordinates: { lat: city.lat, lng: city.lng },
      },
      phone: `(${Math.floor(Math.random() * 900) + 100}) 555-${String(index).padStart(4, "0")}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${practiceNames[index % practiceNames.length].toLowerCase().replace(/\s+/g, "").replace(/&/g, "and")}.com`,
      website: `https://${practiceNames[index % practiceNames.length].toLowerCase().replace(/\s+/g, "").replace(/&/g, "and")}.com/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      accepting_new_patients: index % 3 !== 0, // 67% accepting
      insurance_accepted: insuranceOptions[index % insuranceOptions.length],
      treatment_approaches: treatmentApproaches[index % treatmentApproaches.length],
      years_experience: yearsExp,
      languages:
        index % 4 === 0
          ? ["English", "Spanish"]
          : index % 7 === 0
            ? ["English", "Mandarin"]
            : ["English"],
      session_fee: {
        initial_consultation: initialFee,
        follow_up: followUpFee,
        medication_management: medMgmtFee,
      },
      telehealth_available: index % 2 === 0, // 50% offer telehealth
      bio: `Dr. ${firstName} ${lastName} is a ${isChild ? "double " : ""}board-certified psychiatrist with ${yearsExp} years of experience${isChild ? " specializing in child and adolescent mental health" : isGeriatric ? " specializing in geriatric psychiatry" : isAddiction ? " specializing in addiction psychiatry" : ""}. ${gender === "female" ? "She" : "He"} provides comprehensive psychiatric care in ${city.name}, focusing on ${specialties.slice(0, 2).join(" and ").replace("_", " ")}.`,
      hospital_affiliations:
        city.name === "San Francisco"
          ? ["UCSF Medical Center", "Kaiser Permanente SF"]
          : city.name === "Los Angeles"
            ? ["UCLA Medical Center", "Cedars-Sinai"]
            : city.name === "San Diego"
              ? ["UCSD Medical Center", "Sharp Memorial"]
              : ["Kaiser Permanente", `${city.name} General Hospital`],
      rating: Math.round((4.0 + Math.random() * 1.0) * 10) / 10, // 4.0-5.0 rating
      total_reviews: Math.floor(20 + Math.random() * 180), // 20-200 reviews
      data_source: "seed",
      profile_claimed: false,
    },
    metadata: {
      specialties: specialties,
      location: `${city.name}, ${city.state}`,
      accepting_patients: index % 3 !== 0,
      telehealth: index % 2 === 0,
      years_experience: yearsExp,
      entity_type: "provider",
    },
    status: "active",
  };
}

async function clearExistingProviders() {
  console.log("🧹 Clearing existing providers...");

  const { error } = await supabase.from("entities").delete().eq("type", "provider");

  if (error) {
    console.error("❌ Error clearing existing providers:", error);
    throw error;
  }

  console.log("✅ Existing providers cleared");
}

async function seedProviders(count = 50) {
  try {
    console.log("🏥 HeyPsych Provider Seeding Tool");
    console.log("=================================");
    console.log(`📊 Generating ${count} providers...`);

    // Check for existing providers
    const { data: existing } = await supabase
      .from("entities")
      .select("slug")
      .eq("type", "provider");

    const existingSlugs = new Set(existing?.map((e) => e.slug) || []);

    // Generate providers
    const providers = [];
    for (let i = 0; i < count; i++) {
      const provider = generateProvider(i);

      // Ensure unique slug
      let uniqueSlug = provider.slug;
      let counter = 1;
      while (existingSlugs.has(uniqueSlug)) {
        uniqueSlug = `${provider.slug}-${counter}`;
        counter++;
      }
      provider.slug = uniqueSlug;
      existingSlugs.add(uniqueSlug);

      providers.push(provider);
    }

    console.log("📊 Provider Statistics:");
    console.log(`   🏙️  Cities: ${Math.min(count, cities.length)} California cities`);
    console.log(
      `   👶 Child Psychiatrists: ${providers.filter((p) => p.content.specialties.includes("child_adolescent")).length}`
    );
    console.log(
      `   👴 Geriatric Psychiatrists: ${providers.filter((p) => p.content.specialties.includes("geriatric")).length}`
    );
    console.log(
      `   🍺 Addiction Psychiatrists: ${providers.filter((p) => p.content.specialties.includes("addiction")).length}`
    );
    console.log(
      `   ✅ Accepting Patients: ${providers.filter((p) => p.content.accepting_new_patients).length}`
    );
    console.log(
      `   💻 Telehealth Available: ${providers.filter((p) => p.content.telehealth_available).length}`
    );

    // Insert providers in batches
    console.log(`\n📥 Inserting providers into database...`);

    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < providers.length; i += batchSize) {
      const batch = providers.slice(i, i + batchSize);

      const { data, error } = await supabase.from("entities").insert(batch).select();

      if (error) {
        console.error(`❌ Error inserting batch ${i}-${i + batch.length}:`, error);
        throw error;
      }

      inserted += data?.length || batch.length;
      console.log(`✅ Inserted ${inserted}/${providers.length} providers`);
    }

    console.log(`\n🎉 Successfully seeded ${inserted} providers!`);
    console.log("\n🎯 Seeding Summary:");
    console.log(`   👨‍⚕️ Total Providers: ${inserted}`);
    console.log(`   📍 Geographic Coverage: California cities`);
    console.log(`   🏥 Specialties: Multiple psychiatry subspecialties`);
    console.log(`   💰 Fee Range: $400-600 initial consultations`);
    console.log("\n✨ Your provider directory is ready!");
    console.log("   Visit: http://localhost:3000/providers");

    // Show sample providers
    console.log("\n📋 Sample providers:");
    providers.slice(0, 5).forEach((provider) => {
      console.log(
        `   • ${provider.title} - ${provider.content.address.city}, ${provider.content.specialties.join(", ")}`
      );
    });
  } catch (error) {
    console.error("💥 Seeding failed:", error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const count = parseInt(args[0]) || 50;

// Run the seeding
seedProviders(count);
