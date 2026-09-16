import { Metadata } from "next";
import Link from "next/link";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { ArrowLeft, TrendingUp, Brain, Pill, Users, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "All Articles | Learn | HeyPsych",
  description:
    "Browse all mental health education articles. Evidence-based guides on treatments, therapy approaches, medications, and emerging research.",
  openGraph: {
    title: "All Articles | Learn | HeyPsych",
    description: "Browse all mental health education articles.",
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

export default function LearnArchive() {
  const articles = getArticles();

  return (
    <main className="min-h-screen bg-canvas">
      {/* Header */}
      <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/learn"
            className="mb-4 inline-flex items-center gap-2 text-sm text-label-secondary hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learn
          </Link>
          <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
            All Articles
          </h1>
          <p className="mt-2 text-label-secondary">
            {articles.length} articles on mental health education and research
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
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
        </div>
      </section>
    </main>
  );
}
