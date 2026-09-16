import { Metadata } from "next";
import Link from "next/link";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { ArrowRight, TrendingUp, Brain, Pill, Users, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Learn | Mental Health Education & Research | HeyPsych",
  description:
    "Evidence-based mental health education. Latest research on treatments, therapy approaches, medications, and emerging science like GLP-1 for addiction and AI in therapy.",
  keywords: [
    "mental health education",
    "therapy research",
    "medication guides",
    "GLP-1 addiction",
    "AI therapy",
    "mental health articles",
    "depression treatment research",
    "anxiety therapy guide",
  ],
  openGraph: {
    title: "Learn | Mental Health Education",
    description: "Evidence-based mental health education and latest research.",
    type: "website",
  },
};

interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  readingTime: number;
  publishedAt: string;
  featured?: boolean;
}

function getArticles(): Article[] {
  const articlesPath = join(process.cwd(), "data/learn");

  try {
    const files = readdirSync(articlesPath).filter((f) => f.endsWith(".json"));

    return files
      .map((file) => {
        const content = JSON.parse(
          readFileSync(join(articlesPath, file), "utf-8")
        );
        return {
          slug: content.slug,
          title: content.title,
          description: content.description,
          category: content.category,
          tags: content.tags || [],
          readingTime: content.readingTime || 5,
          publishedAt: content.publishedAt,
          featured: content.featured,
        };
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  } catch {
    return [];
  }
}

const categoryConfig: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  "emerging-science": { icon: Sparkles, color: "text-purple-600 bg-purple-50", label: "Emerging Science" },
  "treatment-guides": { icon: Pill, color: "text-blue-600 bg-blue-50", label: "Treatment Guides" },
  "therapy-explained": { icon: Brain, color: "text-green-600 bg-green-50", label: "Therapy Explained" },
  "research-digest": { icon: TrendingUp, color: "text-orange-600 bg-orange-50", label: "Research Digest" },
  "condition-guides": { icon: Users, color: "text-rose-600 bg-rose-50", label: "Conditions" },
  "self-help": { icon: Brain, color: "text-teal-600 bg-teal-50", label: "Self-Help" },
};

export default function LearnHub() {
  const articles = getArticles();
  const featured = articles.filter((a) => a.featured).slice(0, 3);
  const recent = articles.filter((a) => !a.featured).slice(0, 12);

  const categories = Object.entries(categoryConfig);

  return (
    <main className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-label-primary sm:text-4xl">
            Learn
          </h1>
          <p className="mt-4 text-lg text-label-secondary">
            Evidence-based mental health education. From emerging research to practical therapy guides.
          </p>
        </div>
      </section>

      {/* Category Pills */}
      <section className="border-b border-separator px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(([key, config]) => {
              const Icon = config.icon;
              const count = articles.filter((a) => a.category === key).length;
              return (
                <Link
                  key={key}
                  href={`/learn?category=${key}`}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-105 ${config.color}`}
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                  <span className="text-xs opacity-60">({count})</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featured.length > 0 && (
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-label-tertiary">
              Featured
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((article) => {
                const cat = categoryConfig[article.category];
                return (
                  <Link
                    key={article.slug}
                    href={`/learn/${article.slug}`}
                    className="group rounded-xl border border-separator bg-surface p-6 transition-all hover:border-accent hover:shadow-lg"
                  >
                    {cat && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cat.color}`}>
                        <cat.icon className="h-3 w-3" />
                        {cat.label}
                      </span>
                    )}
                    <h3 className="mt-3 text-lg font-semibold text-label-primary group-hover:text-accent">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-sm text-label-secondary line-clamp-2">
                      {article.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-label-tertiary">
                      <span>{article.readingTime} min read</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* All Articles */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-label-tertiary">
            Latest Articles
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((article) => {
              const cat = categoryConfig[article.category];
              return (
                <Link
                  key={article.slug}
                  href={`/learn/${article.slug}`}
                  className="group flex flex-col rounded-lg border border-separator bg-surface p-5 transition-all hover:border-accent"
                >
                  <div className="flex items-center gap-2">
                    {cat && (
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${cat.color}`}>
                        {cat.label}
                      </span>
                    )}
                    <span className="text-xs text-label-quaternary">
                      {article.readingTime} min
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold text-label-primary group-hover:text-accent">
                    {article.title}
                  </h3>
                  <p className="mt-1 text-sm text-label-secondary line-clamp-2">
                    {article.description}
                  </p>
                </Link>
              );
            })}
          </div>

          {articles.length > 15 && (
            <div className="mt-8 text-center">
              <Link
                href="/learn/archive"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                View all {articles.length} articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
