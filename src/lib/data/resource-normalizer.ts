// src/lib/data/resource-normalizer.ts
import { AnyResourceZ } from "@/lib/schemas/resource";
import { transformKnowledgeHubArticle, buildBodyFromLegacy } from "@/lib/utils/resource-shape";

function normalizeLegacyResource(content: any) {
  if (!content || typeof content !== "object") return content;

  const normalized = { ...content };
  const metadata = { ...(content.metadata || {}) };
  let category: string | undefined = metadata.category || content.category;

  if (category === "articles-blogs" || category === "articles-guides" || category === "articles") {
    category = "knowledge-hub";
  }

  if (category && metadata.category !== category) {
    metadata.category = category;
  }

  normalized.metadata = metadata;

  if (category === "knowledge-hub") {
    const upgraded = transformKnowledgeHubArticle(normalized);
    upgraded.body = upgraded.body || buildBodyFromLegacy(upgraded);
    return upgraded;
  }

  if (!normalized.sections && Array.isArray(normalized.content?.sections)) {
    normalized.sections = normalized.content.sections;
  }

  return normalized;
}

export function normalizeResource(content: unknown) {
  console.log("Normalizing content for:", (content as any)?.slug);
  try {
    const parsed = AnyResourceZ.parse(normalizeLegacyResource(content));
    console.log("Schema validation passed for:", parsed.slug);

    parsed.name = String(parsed.name ?? "");
    if (parsed.description != null) parsed.description = String(parsed.description);
    return parsed;
  } catch (error) {
    console.error("Schema validation failed for:", (content as any)?.slug, error);
    throw error;
  }
}
