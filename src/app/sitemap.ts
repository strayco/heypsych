import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.heypsych.com").trim().replace(/\/+$/, '');
  const currentDate = new Date();

  // Static pages with priority and changeFrequency
  const staticPages: MetadataRoute.Sitemap = [
    // High priority pages
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/conditions`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/treatments`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/psychiatrists`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/psych-trail`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },

    // Condition category pages
    {
      url: `${baseUrl}/conditions/anxiety-fear`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/mood-depression`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/attention-learning`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/trauma-stress`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/psychotic-disorders`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/personality-disorders`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/eating-body-image`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/substance-use-disorders`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/obsessive-compulsive`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/autism-development`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/behavioral-disorders`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/dementia-memory`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/sleep-disorders`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/sexual-health`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/dissociative-disorders`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conditions/somatic-health-anxiety`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // Treatment category pages
    {
      url: `${baseUrl}/treatments/medications`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/treatments/therapy`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/treatments/interventional`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/treatments/supplements`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/treatments/alternative`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/treatments/investigational`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },

    // Resource pages
    {
      url: `${baseUrl}/resources/assessments-screeners`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/resources/articles-guides`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/resources/digital-tools`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/resources/support-community`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/knowledge-hub`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },

    // Search and other pages
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Fetch dynamic routes from database
  try {
    const { supabase } = await import("@/lib/config/database");

    // Fetch all published conditions
    const { data: conditions } = await supabase
      .from("entities")
      .select("slug, updated_at")
      .eq("type", "condition")
      .eq("status", "active")
      .order("slug");

    // Fetch all published treatments
    const { data: treatments } = await supabase
      .from("entities")
      .select("slug, updated_at")
      .in("type", ["medication", "therapy", "treatment", "interventional", "investigational", "alternative", "supplement"])
      .eq("status", "active")
      .order("slug");

    // Fetch digital tools specifically (PHASE 1.1: Digital Tools Sitemap)
    const { data: digitalTools } = await supabase
      .from("entities")
      .select("slug, updated_at")
      .eq("type", "resource")
      .eq("status", "active")
      .eq("metadata->>category", "digital-tools")
      .order("slug");

    // Fetch other resources (assessments, articles, etc.)
    const { data: otherResources } = await supabase
      .from("entities")
      .select("slug, updated_at")
      .eq("type", "resource")
      .eq("status", "active")
      .neq("metadata->>category", "digital-tools")
      .order("slug");

    // Add dynamic condition pages
    if (conditions) {
      conditions.forEach((condition) => {
        staticPages.push({
          url: `${baseUrl}/conditions/${condition.slug}`,
          lastModified: new Date(condition.updated_at),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      });
    }

    // Add dynamic treatment pages
    if (treatments) {
      treatments.forEach((treatment) => {
        staticPages.push({
          url: `${baseUrl}/treatments/${treatment.slug}`,
          lastModified: new Date(treatment.updated_at),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      });
    }

    // Add digital tool pages (PHASE 1.1: Higher priority for tools)
    if (digitalTools) {
      digitalTools.forEach((tool) => {
        staticPages.push({
          url: `${baseUrl}/resources/${tool.slug}`,
          lastModified: new Date(tool.updated_at),
          changeFrequency: "monthly",
          priority: 0.7, // Increased from 0.6 to 0.7 for digital tools
        });
      });
    }

    // Add other resource pages
    if (otherResources) {
      otherResources.forEach((resource) => {
        staticPages.push({
          url: `${baseUrl}/resources/${resource.slug}`,
          lastModified: new Date(resource.updated_at),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      });
    }

    console.log(`📊 Sitemap generated: ${conditions?.length || 0} conditions, ${treatments?.length || 0} treatments, ${digitalTools?.length || 0} digital tools, ${otherResources?.length || 0} other resources`);
  } catch (error) {
    console.error("Error fetching dynamic routes for sitemap:", error);
    // Continue with static pages only
  }

  // Add PsychTrails scenario pages
  try {
    const { scenarios } = await import("@/lib/psychTrail");
    const scenarioList = Object.values(scenarios);

    scenarioList.forEach((scenario) => {
      staticPages.push({
        url: `${baseUrl}/psych-trail/${scenario.id}`,
        lastModified: new Date(scenario.updatedAt),
        changeFrequency: "monthly",
        priority: 0.75,
      });
    });

    console.log(`📊 Added ${scenarioList.length} PsychTrails scenarios to sitemap`);
  } catch (error) {
    console.error("Error adding PsychTrails scenarios to sitemap:", error);
  }

  return staticPages;
}
