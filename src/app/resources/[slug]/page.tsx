// SERVER COMPONENT - Resource Page with Static Generation + SEO
// Enables instant page loads for all resources with complete schema.org metadata
//
// Features:
// - Static generation controlled by static-generation-policy
// - ISR with 24-hour revalidation for on-demand pages
// - Complete SEO metadata via MetadataFactory
// - Full schema.org stack via SchemaFactory (5 schemas per page)
// - Server-side data fetching (no client waterfalls)
//
// BUILD STRATEGY:
// - Production builds use on-demand ISR to avoid Supabase dependency
// - Sitemap completeness is independent of build-time generation
// - SEO indexability is determined by the central index-decision-service
// @see src/lib/build/static-generation-policy.ts

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MetadataFactory } from "@/lib/seo/metadata-factory";
import { SchemaFactory, safeJsonLd } from "@/lib/seo/schema-factory";
import { pruneDeadLinks } from "@/lib/linking/live-paths";
import { ResourceDetailClient } from "@/components/resources/ResourceDetailClient";
import { ArticleExperience, type ArticleReviewer } from "@/components/articles/ArticleExperience";
import { SupportExperience } from "@/components/resources/experience/SupportExperience";
import { AssessmentShell } from "@/components/resources/experience/AssessmentShell";
import { fromKnowledgeHub } from "@/domains/articles/experience/model";
import { linkTargets } from "@/domains/articles/experience/targets";
import { buildSupport } from "@/domains/resources/experience/support";
import { buildAssessmentShell } from "@/domains/resources/experience/assessment";
import { EditorialService } from "@/lib/data/editorial-service";
import { isResourceToolStub } from "@/lib/entities/entity-slugs.generated";
import { getStaticParamsForRoute } from "@/lib/build/static-generation-policy";
import { getAllResourceSlugs } from "@/lib/resources/resource-loader";
import {
  getEntityBySlug,
  isEntityFound,
  isEntityUnavailable,
} from "@/lib/data/entity-cache";

// Generate static params based on the centralized static generation policy
// In production builds with SSG_MODE=none (default), returns empty array
// This removes Supabase from the build critical path while preserving full SEO
// All pages are still rendered on-demand via ISR with complete HTML/metadata
export async function generateStaticParams() {
  return getStaticParamsForRoute("resources", getAllResourceSlugs);
}

// Generate complete SEO metadata using MetadataFactory
// Includes: title, description, keywords, canonical, OpenGraph, Twitter Card
// Automatically handles different resource categories
// Uses request-scoped cache to share entity data with page component
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getEntityBySlug(slug);

  // Handle database unavailability - return safe defaults without caching as 404
  if (isEntityUnavailable(result)) {
    console.error("[ResourcePage] Database unavailable for metadata:", slug);
    return {
      title: "Resource",
      description: "Mental health resources and tools.",
    };
  }

  // Entity not found - return appropriate defaults
  if (!isEntityFound(result)) {
    return {
      title: "Resource",
      description: "Mental health resources and tools.",
    };
  }

  const entity = result.entity;

  // Use MetadataFactory to generate complete SEO metadata
  // Routes to appropriate generator based on resource category
  return await MetadataFactory.generate(entity);
}

// Server Component - Fetches data on server (or from request-scoped cache)
// Generates complete schema.org stack for SEO + inline links
// Entity is deduplicated with generateMetadata via React cache()
export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getEntityBySlug(slug);

  // Handle database unavailability - throw to trigger error boundary
  // This prevents caching a temporary failure as a permanent 404
  if (isEntityUnavailable(result)) {
    console.error("[ResourcePage] Database unavailable:", slug);
    throw new Error("Database temporarily unavailable");
  }

  // Entity not found - proper 404
  if (!isEntityFound(result)) {
    notFound();
  }

  const entity = result.entity;

  // Content enhancement disabled for performance
  // Links are pre-generated in JSON files and synced to database
  // const enhancedEntity = await enhanceEntityContent(entity);
  const enhancedEntity = entity;

  // Generate complete schema.org stack (5 schemas):
  // 1. Primary schema (varies by category: MedicalRiskEstimator, SoftwareApplication, Article)
  // 2. MedicalWebPage (universal)
  // 3. BreadcrumbList (navigation)
  // 4. Person schemas (author + medical reviewer, if present)
  // 5. FAQPage (auto-generated or explicit)
  const schemas = SchemaFactory.generateAll(entity);

  return (
    <>
      {/* Inject schema.org JSON-LD into page head */}
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
        />
      ))}

      {renderByKind(enhancedEntity) ?? <ResourceDetailClient entity={pruneDeadLinks(enhancedEntity)} />}
    </>
  );
}

/**
 * Articles, support organisations and assessments get their own page
 * (art bible §13). Anything else, or a record the models can't read, keeps
 * the original ResourceDetailClient layout.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderByKind(entity: any): React.ReactNode | null {
  try {
    const category = entity?.metadata?.category || entity?.category || entity?.data?.category;

    if (category === "knowledge-hub") {
      const article = fromKnowledgeHub(entity, linkTargets);
      if (!article.title || article.blocks.length === 0) return null;
      const r = article.reviewerIds.length ? EditorialService.getFirstReviewer(article.reviewerIds) : null;
      const reviewer: ArticleReviewer | null = r ? { name: r.name, credentials: r.credentials || null } : null;
      return <ArticleExperience article={article} back={{ href: "/resources", label: "Support and resources" }} kicker="Guide" reviewer={reviewer} />;
    }

    // A few organisations (Crisis Text Line, NAMI) are stored in the app
    // directory shape with no category; they rendered an empty page before.
    const uncategorisedOrg =
      !category && entity?.slug && !isResourceToolStub(entity.slug) && Boolean(entity?.data?.app_metadata?.website || entity?.app_metadata?.website);

    // Directory entries carry a human-readable grouping as their category
    // ("National Crisis", "By Identity / Culture"); they are support orgs too.
    const directoryOrg = typeof category === "string" && /[A-Z /]/.test(category);

    if (category === "support-community" || uncategorisedOrg || directoryOrg) {
      const support = buildSupport(entity);
      if (!support || (support.channels.length === 0 && support.sections.length === 0)) return null;
      return <SupportExperience support={support} />;
    }

    if (category === "assessments-screeners") {
      const shell = buildAssessmentShell(entity);
      if (!shell) return null;
      return <AssessmentShell shell={shell} entity={entity} />;
    }
  } catch (error) {
    console.error("[ResourcePage] Falling back to the original layout:", entity?.slug, error);
  }
  return null;
}

// Revalidate every 24 hours (ISR)
// Pages are static but refresh daily for updated content
export const revalidate = 86400;

// Generate static pages at build time
// Allow dynamic slugs not in generateStaticParams
export const dynamicParams = true;
