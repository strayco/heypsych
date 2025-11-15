// src/lib/schemas/article.ts
import { z } from "zod";

// Knowledge Hub pillars
export const ArticlePillarZ = z.enum([
  "self-help-and-wellness",
  "research-and-science",
  "how-to-guides",
  "latest",
  "community-and-stories",
]);

// Content format types
export const ArticleFormatZ = z.enum([
  "article",
  "video",
  "podcast",
  "infographic",
]);

// Body content block types
const H2BlockZ = z.object({
  type: z.literal("h2"),
  text: z.string(),
});

const ParagraphBlockZ = z.object({
  type: z.literal("p"),
  text: z.string(),
});

const ListBlockZ = z.object({
  type: z.literal("list"),
  items: z.array(z.string()),
});

const RelatedBlockZ = z.object({
  type: z.literal("related"),
  slugs: z.array(z.string()),
});

const ContentBlockZ = z.union([
  H2BlockZ,
  ParagraphBlockZ,
  ListBlockZ,
  RelatedBlockZ,
]);

// Main article schema
export const ArticleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be kebab-case"),
  pillar: ArticlePillarZ,
  subcategory: z.string().optional(),
  summary: z.string().min(1),
  coverImage: z.string().optional(),
  authors: z.array(z.string()).min(1, "At least one author required"),
  publishedAt: z.string().refine(
    (v) => !Number.isNaN(Date.parse(v)),
    "Invalid ISO date string"
  ),
  updatedAt: z.string().optional(),
  readingMinutes: z.number().optional(),
  tags: z.array(z.string()).optional(),
  audience: z.array(z.string()).optional(),
  format: ArticleFormatZ.optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
    })
    .optional(),
  body: z.array(ContentBlockZ),
  schemaOrg: z.record(z.string(), z.any()).optional(),
});

export type Article = z.infer<typeof ArticleSchema>;
export type ArticlePillar = z.infer<typeof ArticlePillarZ>;
export type ArticleFormat = z.infer<typeof ArticleFormatZ>;
export type ContentBlock = z.infer<typeof ContentBlockZ>;
