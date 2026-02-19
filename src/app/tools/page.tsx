// src/app/tools/page.tsx
// Directory Landing Page - /tools/

import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Smartphone, Brain, Heart, Moon, Zap, Shield, Users, Pill, Stethoscope } from "lucide-react";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";

export const metadata: Metadata = {
  title: "Mental Health Tools & Apps Directory | HeyPsych",
  description: "Browse evidence-based mental health apps and digital tools. Compare therapy platforms, mood trackers, meditation apps, and more. Find the right tool for anxiety, depression, ADHD, sleep, and other conditions.",
  keywords: [
    "mental health apps",
    "therapy apps",
    "best mental health apps",
    "depression apps",
    "anxiety apps",
    "online therapy",
    "mental health tools",
  ],
  alternates: {
    canonical: "https://heypsych.com/tools/",
  },
};

// Hub icons mapping
const hubIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  sleep: Moon,
  "anxiety-stress": Heart,
  "mood-depression": Brain,
  "focus-adhd": Zap,
  "trauma-ptsd": Shield,
  "substance-use": Pill,
  "serious-mental-illness": Brain,
  "find-support": Users,
};

// Hub colors
const hubColors: Record<string, string> = {
  sleep: "from-indigo-500 to-purple-600",
  "anxiety-stress": "from-rose-500 to-pink-600",
  "mood-depression": "from-amber-500 to-orange-600",
  "focus-adhd": "from-violet-500 to-purple-600",
  "trauma-ptsd": "from-emerald-500 to-teal-600",
  "substance-use": "from-teal-500 to-cyan-600",
  "serious-mental-illness": "from-purple-500 to-indigo-600",
  "find-support": "from-blue-500 to-indigo-600",
};

export default async function ToolsDirectoryPage() {
  const hubs = TaxonomyService.getAllHubs();
  const allTools = await ToolService.getAll();
  const featuredTools = await ToolService.getFeatured(6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Hero */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Mental Health Tools
            </span>
          </h1>
          <p className="mt-4 text-xl text-neutral-600 max-w-2xl mx-auto">
            Evidence-based apps and platforms reviewed by our medical board. 
            Find the right tool for your mental health journey.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {allTools.length} tools reviewed across {hubs.length} categories
          </p>
        </div>
      </section>

      {/* Hub Grid */}
      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Browse by Category
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hubs.map((hub) => {
              const Icon = hubIcons[hub.slug] || Smartphone;
              const gradient = hubColors[hub.slug] || "from-gray-500 to-gray-600";
              
              return (
                <Link
                  key={hub.slug}
                  href={hub.url}
                  className="group relative overflow-hidden rounded-xl bg-white border border-neutral-200 p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${gradient} text-white mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <h3 className="font-semibold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                    {hub.display_name}
                  </h3>
                  
                  <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                    {hub.intro.slice(0, 100)}...
                  </p>
                  
                  <div className="mt-3 flex items-center gap-1 text-indigo-600 text-sm font-medium">
                    Browse tools
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* For Clinicians CTA */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-lg text-white flex-shrink-0">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-neutral-900 text-lg">
                  For Clinicians
                </h3>
                <p className="mt-1 text-neutral-600">
                  AI scribes, clinical decision support, EHRs, and billing tools designed for mental health practices.
                </p>
                <Link
                  href="/tools/for-clinicians/"
                  className="inline-flex items-center gap-1 mt-3 text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  Browse clinician tools
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      {featuredTools.length > 0 && (
        <section className="px-4 pb-12 sm:px-6 lg:px-8 bg-white border-y border-neutral-200">
          <div className="mx-auto max-w-6xl py-10">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              Featured Tools
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}/`}
                  className="group flex items-start gap-4 p-4 rounded-lg border border-neutral-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 p-2 bg-indigo-50 rounded-lg">
                    <Smartphone className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-indigo-600 transition-colors truncate">
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                      {tool.short_description}
                    </p>
                    {tool.app_rating && (
                      <p className="mt-1 text-sm text-amber-600 font-medium">
                        ★ {tool.app_rating}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How to Use */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
            How to Find the Right Tool
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold text-neutral-900">Browse Categories</h3>
              <p className="mt-1 text-sm text-neutral-600">
                Start with a category that matches your needs, like sleep, anxiety, or mood tracking.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold text-neutral-900">Compare Tools</h3>
              <p className="mt-1 text-sm text-neutral-600">
                Use filters to narrow by price, platform, and privacy. Read our expert reviews.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold mb-3">
                3
              </div>
              <h3 className="font-semibold text-neutral-900">Make Your Choice</h3>
              <p className="mt-1 text-sm text-neutral-600">
                Check the &quot;Best For&quot; and &quot;Not For&quot; sections to find your perfect match.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signal */}
      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
            <Shield className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              All tools reviewed by the{" "}
              <Link href="/about/medical-review-board" className="underline hover:no-underline">
                HeyPsych Medical Board
              </Link>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export const revalidate = 86400; // 24 hours
