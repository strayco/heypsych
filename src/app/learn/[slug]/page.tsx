import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { ArrowLeft, Clock, Calendar, ArrowRight } from "lucide-react";

interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  readingTime: number;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  content: ContentBlock[];
  crosslinks: {
    conditions: string[];
    treatments: string[];
    resources: string[];
    articles: string[];
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

interface ContentBlock {
  type: "h2" | "h3" | "p" | "list" | "blockquote" | "callout" | "study";
  text?: string;
  items?: string[];
  citation?: string;
  url?: string; // DOI or PubMed link for study citations
  variant?: "info" | "warning" | "tip";
}

function getArticle(slug: string): Article | null {
  const filePath = join(process.cwd(), "data/learn", `${slug}.json`);

  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function getAllSlugs(): string[] {
  const articlesPath = join(process.cwd(), "data/learn");

  try {
    return readdirSync(articlesPath)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    return { title: "Article Not Found" };
  }

  return {
    title: article.seo?.title || `${article.title} | HeyPsych Learn`,
    description: article.seo?.description || article.description,
    keywords: article.seo?.keywords || article.tags,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: article.author ? [article.author] : undefined,
    },
    alternates: {
      canonical: `https://heypsych.com/learn/${slug}`,
    },
  };
}

function renderContent(block: ContentBlock, index: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2 key={index} className="mt-10 mb-4 text-2xl font-bold text-label-primary">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 key={index} className="mt-8 mb-3 text-xl font-semibold text-label-primary">
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p key={index} className="mb-4 text-label-secondary leading-relaxed">
          {block.text}
        </p>
      );
    case "list":
      return (
        <ul key={index} className="mb-4 ml-6 list-disc space-y-2 text-label-secondary">
          {block.items?.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "blockquote":
      return (
        <blockquote
          key={index}
          className="my-6 border-l-4 border-accent bg-fill-quaternary pl-4 py-3 italic text-label-secondary"
        >
          {block.text}
          {block.citation && (
            <cite className="mt-2 block text-sm not-italic text-label-tertiary">
              — {block.citation}
            </cite>
          )}
        </blockquote>
      );
    case "callout":
      const variantStyles = {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        warning: "bg-amber-50 border-amber-200 text-amber-800",
        tip: "bg-green-50 border-green-200 text-green-800",
      };
      return (
        <div
          key={index}
          className={`my-6 rounded-lg border p-4 ${variantStyles[block.variant || "info"]}`}
        >
          {block.text}
        </div>
      );
    case "study":
      return (
        <div
          key={index}
          className="my-6 rounded-lg border border-purple-200 bg-purple-50 p-4"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-2">
            Research Finding
          </div>
          <p className="text-purple-900">{block.text}</p>
          {block.citation && (
            <cite className="mt-2 block text-sm text-purple-700">
              Source:{" "}
              {block.url ? (
                <a
                  href={block.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-purple-900"
                >
                  {block.citation}
                </a>
              ) : (
                block.citation
              )}
            </cite>
          )}
        </div>
      );
    default:
      return null;
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    notFound();
  }

  const hasConditions = article.crosslinks?.conditions?.length > 0;
  const hasTreatments = article.crosslinks?.treatments?.length > 0;
  const hasResources = article.crosslinks?.resources?.length > 0;
  const hasRelatedArticles = article.crosslinks?.articles?.length > 0;

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": "Organization",
      name: article.author || "HeyPsych Editorial Team",
    },
    publisher: {
      "@type": "Organization",
      name: "HeyPsych",
      url: "https://heypsych.com",
    },
    mainEntityOfPage: `https://heypsych.com/learn/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="min-h-screen bg-canvas">
        {/* Header */}
        <header className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 text-sm text-label-tertiary hover:text-accent mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Learn
            </Link>

            <h1 className="text-3xl font-bold text-label-primary sm:text-4xl">
              {article.title}
            </h1>

            <p className="mt-4 text-lg text-label-secondary">
              {article.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-label-tertiary">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {article.readingTime} min read
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-fill-secondary px-3 py-1 text-xs text-label-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {article.content.map((block, i) => renderContent(block, i))}
          </div>
        </article>

        {/* Crosslinks */}
        {(hasConditions || hasTreatments || hasResources || hasRelatedArticles) && (
          <section className="border-t border-separator bg-surface-grouped px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-lg font-semibold text-label-primary">
                Related Resources
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                {hasConditions && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-label-tertiary">
                      Related Conditions
                    </h3>
                    <ul className="space-y-2">
                      {article.crosslinks.conditions.map((slug) => (
                        <li key={slug}>
                          <Link
                            href={`/conditions/${slug}`}
                            className="inline-flex items-center gap-2 text-accent hover:underline"
                          >
                            {slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hasTreatments && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-label-tertiary">
                      Related Treatments
                    </h3>
                    <ul className="space-y-2">
                      {article.crosslinks.treatments.map((slug) => (
                        <li key={slug}>
                          <Link
                            href={`/treatments/${slug}`}
                            className="inline-flex items-center gap-2 text-accent hover:underline"
                          >
                            {slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hasResources && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-label-tertiary">
                      Assessments & Tools
                    </h3>
                    <ul className="space-y-2">
                      {article.crosslinks.resources.map((slug) => (
                        <li key={slug}>
                          <Link
                            href={`/resources/${slug}`}
                            className="inline-flex items-center gap-2 text-accent hover:underline"
                          >
                            {slug.toUpperCase()}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hasRelatedArticles && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-label-tertiary">
                      Continue Reading
                    </h3>
                    <ul className="space-y-2">
                      {article.crosslinks.articles.map((slug) => (
                        <li key={slug}>
                          <Link
                            href={`/learn/${slug}`}
                            className="inline-flex items-center gap-2 text-accent hover:underline"
                          >
                            {slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Medical Disclaimer */}
        <section className="border-t border-separator px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs text-label-quaternary">
              <strong>Medical Disclaimer:</strong> This article is for educational purposes only
              and is not a substitute for professional medical advice, diagnosis, or treatment.
              Always seek the advice of your physician or qualified mental health provider with
              any questions you may have regarding a medical condition.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
