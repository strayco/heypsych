// Comparison Hub Page
// Lists all available treatment comparisons

import { Metadata } from "next";
import Link from "next/link";
import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Treatment Comparisons | Compare Medications & Therapies | HeyPsych",
  description:
    "Compare mental health medications and therapies side by side. See differences in effectiveness, side effects, and which treatment might be right for you.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/compare`,
  },
  openGraph: {
    title: "Treatment Comparisons | HeyPsych",
    description:
      "Compare mental health medications and therapies side by side.",
  },
};

interface ComparisonSummary {
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  drug_class?: string;
}

function getAllComparisons(): ComparisonSummary[] {
  const comparePath = join(process.cwd(), "data/treatments/compare");

  if (!existsSync(comparePath)) {
    return [];
  }

  try {
    const files = readdirSync(comparePath);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const filePath = join(comparePath, f);
        const content = JSON.parse(readFileSync(filePath, "utf-8"));
        return {
          slug: content.slug,
          name: content.name,
          title: content.title,
          description: content.description,
          category: content.metadata?.category || "general",
          drug_class: content.metadata?.drug_class,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to read comparisons", error);
    return [];
  }
}

export default function ComparisonsPage() {
  const comparisons = getAllComparisons();

  // Group by category
  const grouped = comparisons.reduce(
    (acc, comp) => {
      const cat = comp.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(comp);
      return acc;
    },
    {} as Record<string, ComparisonSummary[]>
  );

  const categoryLabels: Record<string, string> = {
    medications: "Medication Comparisons",
    therapy: "Therapy Comparisons",
    categories: "Treatment Category Comparisons",
    general: "Other Comparisons",
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-neutral-500 mb-6">
          <Link href="/" className="hover:text-neutral-700">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/treatments" className="hover:text-neutral-700">
            Treatments
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">Compare</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Treatment Comparisons
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
            Compare mental health medications and therapies side by side. See
            differences in effectiveness, side effects, drug interactions, and
            find out which treatment might be right for you.
          </p>
        </header>

        {/* Comparisons by Category */}
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="mb-10">
            <h2 className="text-xl font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-200">
              {categoryLabels[category] || category}
            </h2>
            <div className="grid gap-4">
              {items.map((comp) => (
                <Link
                  key={comp.slug}
                  href={`/treatments/compare/${comp.slug}`}
                  className="block p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        {comp.name}
                      </h3>
                      <p className="text-sm text-neutral-600 line-clamp-2">
                        {comp.description}
                      </p>
                    </div>
                    {comp.drug_class && (
                      <span className="shrink-0 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {comp.drug_class}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {comparisons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500">
              No comparisons available yet. Check back soon!
            </p>
          </div>
        )}

      </div>
    </main>
  );
}

// Revalidate every 24 hours
export const revalidate = 86400;

