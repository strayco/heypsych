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

async function updateProviderData() {
  console.log("🔄 HeyPsych Provider Update Tool");
  console.log("===============================");

  try {
    // Update last_verified dates for all providers
    const { data: providers, error: fetchError } = await supabase
      .from("entities")
      .select("id, content")
      .eq("type", "provider")
      .eq("status", "active");

    if (fetchError) {
      throw new Error(`Failed to fetch providers: ${fetchError.message}`);
    }

    console.log(`📊 Found ${providers?.length || 0} active providers to update`);

    if (!providers || providers.length === 0) {
      console.log("✅ No providers found to update");
      return;
    }

    // Update last_verified date
    const today = new Date().toISOString().split("T")[0];
    let updated = 0;

    // Update in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < providers.length; i += batchSize) {
      const batch = providers.slice(i, i + batchSize);

      const updates = batch.map((provider) => ({
        id: provider.id,
        content: {
          ...provider.content,
          last_verified: today,
          last_updated: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }));

      const { error: updateError } = await supabase
        .from("entities")
        .upsert(updates, { onConflict: "id" });

      if (updateError) {
        console.error(`❌ Failed to update batch ${i}-${i + batch.length}:`, updateError.message);
      } else {
        updated += batch.length;
        console.log(`✅ Updated ${updated}/${providers.length} providers`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updated} providers!`);
    console.log(`📅 Last verified date set to: ${today}`);
  } catch (error) {
    console.error("💥 Update failed:", error.message);
    process.exit(1);
  }
}

async function cleanupInactiveProviders() {
  console.log("\n🧹 Cleaning up inactive providers...");

  try {
    // Find providers not verified in the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString().split("T")[0];

    // Query providers with old last_verified dates
    const { data: staleProviders, error } = await supabase
      .from("entities")
      .select("id, title, content")
      .eq("type", "provider")
      .eq("status", "active")
      .filter("content->>last_verified", "lt", cutoffDate);

    if (error) {
      throw new Error(`Failed to find stale providers: ${error.message}`);
    }

    if (!staleProviders || staleProviders.length === 0) {
      console.log("✅ No stale providers found");
      return;
    }

    console.log(`⚠️  Found ${staleProviders.length} providers not verified since ${cutoffDate}`);

    // Show some examples
    console.log("📋 Sample stale providers:");
    staleProviders.slice(0, 3).forEach((provider) => {
      const lastVerified = provider.content?.last_verified || "never";
      console.log(`   • ${provider.title} (last verified: ${lastVerified})`);
    });

    // Mark as archived instead of deleting
    const { error: archiveError } = await supabase
      .from("entities")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .in(
        "id",
        staleProviders.map((p) => p.id)
      );

    if (archiveError) {
      throw new Error(`Failed to archive stale providers: ${archiveError.message}`);
    }

    console.log(`🗄️  Archived ${staleProviders.length} stale providers`);
  } catch (error) {
    console.error("💥 Cleanup failed:", error.message);
  }
}

async function generateProviderStats() {
  console.log("\n📊 Generating provider statistics...");

  try {
    const { data: providers, error } = await supabase
      .from("entities")
      .select("content, metadata")
      .eq("type", "provider")
      .eq("status", "active");

    if (error) {
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }

    if (!providers || providers.length === 0) {
      console.log("📊 No provider data found");
      return;
    }

    // Calculate statistics
    const totalProviders = providers.length;
    const accepting = providers.filter((p) => p.content?.accepting_new_patients).length;
    const telehealth = providers.filter((p) => p.content?.telehealth_available).length;
    const claimed = providers.filter((p) => p.content?.profile_claimed).length;

    // Specialty breakdown
    const specialtyCount = {};
    providers.forEach((provider) => {
      const specialties = provider.content?.specialties || provider.metadata?.specialties || [];
      specialties.forEach((specialty) => {
        const cleanSpecialty = specialty
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        specialtyCount[cleanSpecialty] = (specialtyCount[cleanSpecialty] || 0) + 1;
      });
    });

    // City breakdown
    const cityCount = {};
    providers.forEach((provider) => {
      const city = provider.content?.address?.city || provider.metadata?.location?.split(",")[0];
      if (city) {
        cityCount[city.trim()] = (cityCount[city.trim()] || 0) + 1;
      }
    });

    // Years of experience breakdown
    const experienceBreakdown = {
      "New (0-5 years)": 0,
      "Experienced (6-15 years)": 0,
      "Senior (16-25 years)": 0,
      "Veteran (25+ years)": 0,
    };

    providers.forEach((provider) => {
      const years = provider.content?.years_experience;
      if (years) {
        if (years <= 5) experienceBreakdown["New (0-5 years)"]++;
        else if (years <= 15) experienceBreakdown["Experienced (6-15 years)"]++;
        else if (years <= 25) experienceBreakdown["Senior (16-25 years)"]++;
        else experienceBreakdown["Veteran (25+ years)"]++;
      }
    });

    // Insurance breakdown
    const insuranceCount = {};
    providers.forEach((provider) => {
      const insurances = provider.content?.insurance_accepted || [];
      insurances.forEach((insurance) => {
        insuranceCount[insurance] = (insuranceCount[insurance] || 0) + 1;
      });
    });

    console.log("\n📈 Provider Directory Statistics:");
    console.log(`   👨‍⚕️ Total Active Providers: ${totalProviders}`);
    console.log(
      `   ✅ Accepting New Patients: ${accepting} (${Math.round((accepting / totalProviders) * 100)}%)`
    );
    console.log(
      `   💻 Telehealth Available: ${telehealth} (${Math.round((telehealth / totalProviders) * 100)}%)`
    );
    console.log(
      `   🔐 Profiles Claimed: ${claimed} (${Math.round((claimed / totalProviders) * 100)}%)`
    );

    if (Object.keys(specialtyCount).length > 0) {
      console.log("\n🏥 Top Specialties:");
      Object.entries(specialtyCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([specialty, count]) => {
          console.log(`   ${specialty}: ${count} providers`);
        });
    }

    if (Object.keys(cityCount).length > 0) {
      console.log("\n🏙️  Geographic Distribution:");
      Object.entries(cityCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([city, count]) => {
          console.log(`   ${city}: ${count} providers`);
        });
    }

    console.log("\n👨‍⚕️ Experience Levels:");
    Object.entries(experienceBreakdown).forEach(([level, count]) => {
      const percentage = Math.round((count / totalProviders) * 100);
      console.log(`   ${level}: ${count} providers (${percentage}%)`);
    });

    if (Object.keys(insuranceCount).length > 0) {
      console.log("\n💳 Top Insurance Plans Accepted:");
      Object.entries(insuranceCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([insurance, count]) => {
          const percentage = Math.round((count / totalProviders) * 100);
          console.log(`   ${insurance}: ${count} providers (${percentage}%)`);
        });
    }

    // Data quality metrics
    const hasEmail = providers.filter((p) => p.content?.email).length;
    const hasPhone = providers.filter((p) => p.content?.phone).length;
    const hasWebsite = providers.filter((p) => p.content?.website).length;
    const hasBio = providers.filter((p) => p.content?.bio && p.content.bio.length > 50).length;

    console.log("\n📊 Data Quality Metrics:");
    console.log(
      `   📧 Email Available: ${hasEmail} (${Math.round((hasEmail / totalProviders) * 100)}%)`
    );
    console.log(
      `   📞 Phone Available: ${hasPhone} (${Math.round((hasPhone / totalProviders) * 100)}%)`
    );
    console.log(
      `   🌐 Website Available: ${hasWebsite} (${Math.round((hasWebsite / totalProviders) * 100)}%)`
    );
    console.log(`   📝 Complete Bio: ${hasBio} (${Math.round((hasBio / totalProviders) * 100)}%)`);
  } catch (error) {
    console.error("💥 Stats generation failed:", error.message);
  }
}

async function validateProviderData() {
  console.log("\n🔍 Validating provider data quality...");

  try {
    const { data: providers, error } = await supabase
      .from("entities")
      .select("id, title, content")
      .eq("type", "provider")
      .eq("status", "active");

    if (error) {
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }

    if (!providers || providers.length === 0) {
      console.log("📊 No providers found to validate");
      return;
    }

    const issues = [];

    providers.forEach((provider) => {
      const content = provider.content || {};
      const providerIssues = [];

      // Required field validation
      if (!content.full_name && !provider.title) {
        providerIssues.push("Missing name");
      }
      if (!content.specialties || content.specialties.length === 0) {
        providerIssues.push("Missing specialties");
      }
      if (!content.address || !content.address.city) {
        providerIssues.push("Missing address");
      }

      // Data quality validation
      if (!content.phone && !content.email) {
        providerIssues.push("No contact information");
      }
      if (!content.bio || content.bio.length < 50) {
        providerIssues.push("Incomplete bio");
      }
      if (!content.years_experience) {
        providerIssues.push("Missing experience info");
      }

      if (providerIssues.length > 0) {
        issues.push({
          id: provider.id,
          title: provider.title || content.full_name || "Unknown Provider",
          issues: providerIssues,
        });
      }
    });

    console.log(`\n📋 Data Validation Results:`);
    console.log(`   ✅ Valid Providers: ${providers.length - issues.length}`);
    console.log(`   ⚠️  Providers with Issues: ${issues.length}`);

    if (issues.length > 0) {
      console.log("\n🚨 Top Data Quality Issues:");
      const issueCount = {};
      issues.forEach((provider) => {
        provider.issues.forEach((issue) => {
          issueCount[issue] = (issueCount[issue] || 0) + 1;
        });
      });

      Object.entries(issueCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([issue, count]) => {
          console.log(`   ${issue}: ${count} providers`);
        });

      // Show sample problematic providers
      console.log("\n📋 Sample providers needing attention:");
      issues.slice(0, 3).forEach((provider) => {
        console.log(`   • ${provider.title}: ${provider.issues.join(", ")}`);
      });
    }
  } catch (error) {
    console.error("💥 Validation failed:", error.message);
  }
}

async function optimizeSearchData() {
  console.log("\n🔍 Optimizing provider search data...");

  try {
    const { data: providers, error } = await supabase
      .from("entities")
      .select("id, title, content, metadata")
      .eq("type", "provider")
      .eq("status", "active");

    if (error) {
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }

    if (!providers || providers.length === 0) {
      console.log("📊 No providers found to optimize");
      return;
    }

    console.log(`🔧 Optimizing search data for ${providers.length} providers...`);

    let optimized = 0;
    const batchSize = 25;

    for (let i = 0; i < providers.length; i += batchSize) {
      const batch = providers.slice(i, i + batchSize);

      const updates = batch.map((provider) => {
        const content = provider.content || {};
        const metadata = provider.metadata || {};

        // Create optimized search metadata
        const searchMetadata = {
          ...metadata,
          searchable_name: provider.title?.toLowerCase(),
          searchable_specialties: (content.specialties || []).map((s) => s.toLowerCase()),
          searchable_location: content.address?.city?.toLowerCase(),
          searchable_insurance: (content.insurance_accepted || []).map((i) => i.toLowerCase()),
          full_text_search: [
            provider.title,
            content.full_name,
            content.bio,
            ...(content.specialties || []),
            content.address?.city,
            content.address?.state,
            ...(content.insurance_accepted || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        };

        return {
          id: provider.id,
          metadata: searchMetadata,
          updated_at: new Date().toISOString(),
        };
      });

      const { error: updateError } = await supabase
        .from("entities")
        .upsert(updates, { onConflict: "id" });

      if (updateError) {
        console.error(`❌ Failed to optimize batch ${i}-${i + batch.length}:`, updateError.message);
      } else {
        optimized += batch.length;
        console.log(`✅ Optimized ${optimized}/${providers.length} providers`);
      }
    }

    console.log(`🎉 Successfully optimized search data for ${optimized} providers!`);
  } catch (error) {
    console.error("💥 Optimization failed:", error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || "update";

  console.log("🏥 HeyPsych Provider Management Tool");
  console.log("====================================");

  switch (action) {
    case "update":
      await updateProviderData();
      break;
    case "cleanup":
      await cleanupInactiveProviders();
      break;
    case "stats":
      await generateProviderStats();
      break;
    case "validate":
      await validateProviderData();
      break;
    case "optimize":
      await optimizeSearchData();
      break;
    case "all":
      await updateProviderData();
      await cleanupInactiveProviders();
      await validateProviderData();
      await optimizeSearchData();
      await generateProviderStats();
      break;
    default:
      console.log("\n📖 Usage: node scripts/update-providers.js [command]");
      console.log("\nAvailable commands:");
      console.log("  update   - Update last_verified dates for all providers");
      console.log("  cleanup  - Archive providers not verified in 90+ days");
      console.log("  stats    - Generate comprehensive provider statistics");
      console.log("  validate - Check data quality and identify issues");
      console.log("  optimize - Optimize search metadata for better performance");
      console.log("  all      - Run all maintenance tasks");
      console.log("\nExamples:");
      console.log("  node scripts/update-providers.js stats");
      console.log("  node scripts/update-providers.js all");
  }
}

// Run the script
main();
