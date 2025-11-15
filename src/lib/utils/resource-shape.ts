import path from "path";

export function parseReadingMinutes(value?: string | number | null): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") return value;
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

function splitIntoParagraphs(text?: string) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ type: "p", text: p }));
}

export function buildBodyFromLegacy(resource: any): any[] | undefined {
  if (Array.isArray(resource?.body) && resource.body.length > 0) {
    return resource.body;
  }

  const blocks: any[] = [];
  const legacyContent = resource?.content;

  if (legacyContent?.introduction) {
    blocks.push({ type: "p", text: legacyContent.introduction });
  }

  const addSections = (sections?: any[]) => {
    if (!Array.isArray(sections)) return;
    sections.forEach((section) => {
      if (!section) return;
      if (section.heading) {
        blocks.push({ type: "h2", text: section.heading });
      } else if (section.title) {
        blocks.push({ type: "h2", text: section.title });
      }
      if (section.content) {
        blocks.push(...splitIntoParagraphs(section.content));
      } else if (section.text) {
        blocks.push({ type: "p", text: section.text });
      }
    });
  };

  addSections(legacyContent?.sections);
  addSections(resource?.sections);

  if (legacyContent?.conclusion) {
    blocks.push({ type: "p", text: legacyContent.conclusion });
  }

  return blocks.length > 0 ? blocks : undefined;
}

function stripAsterisksDeep(value: any): any {
  if (typeof value === "string") {
    return value.replace(/\*/g, "");
  }
  if (Array.isArray(value)) {
    return value.map(stripAsterisksDeep);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripAsterisksDeep(v)]));
  }
  return value;
}

function inferPillar(articleType?: string | null, fallbackSlug?: string): string {
  if (!articleType && fallbackSlug?.includes("community")) {
    return "community-and-stories";
  }

  switch (articleType) {
    case "research":
    case "latest":
      return "research-and-science";
    case "lived-experience":
      return "community-and-stories";
    case "how-to":
      return "how-to-guides";
    default:
      return "how-to-guides";
  }
}

function inferSubcategory(articleType?: string | null): string | undefined {
  switch (articleType) {
    case "research":
      return "psychology";
    case "latest":
      return "mental-health-trends";
    case "lived-experience":
      return "personal-stories";
    case "how-to":
      return "health-systems";
    default:
      return undefined;
  }
}

export function ensureArray(value: any): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  return [value];
}

export function transformKnowledgeHubArticle(raw: any) {
  if (!raw || typeof raw !== "object") return raw;

  const normalized = { ...raw };
  const metadata = { ...(raw.metadata || {}) };
  metadata.category = "knowledge-hub";
  normalized.kind = "resource";
  const allowedFormats = new Set(["article", "video", "podcast", "infographic"]);

  normalized.slug =
    normalized.slug ||
    normalized?.seo?.canonical?.split("/").filter(Boolean).pop() ||
    path.basename(normalized.filePath || "", ".json");

  normalized.name = normalized.name || normalized.title || normalized.slug;
  normalized.description =
    normalized.description || normalized.summary || metadata.description || normalized.excerpt || "";
  normalized.summary = normalized.summary || normalized.description;

  normalized.metadata = metadata;
  normalized.pillar = normalized.pillar || metadata.pillar || inferPillar(metadata.article_type, normalized.slug);
  normalized.subcategory = normalized.subcategory || metadata.subcategory || inferSubcategory(metadata.article_type);

  const tags =
    normalized.tags ||
    metadata.topics ||
    normalized.topics ||
    normalized.content?.topics ||
    normalized.content?.tags ||
    [];

  normalized.tags = tags;
  if (!metadata.topics && Array.isArray(tags)) {
    metadata.topics = tags;
  }

  if (!normalized.authors || normalized.authors.length === 0) {
    normalized.authors = ensureArray(normalized.author) || ensureArray(raw.authors);
  }

  if (!normalized.author && Array.isArray(normalized.authors) && normalized.authors.length > 0) {
    normalized.author = normalized.authors[0];
  }

  normalized.readingMinutes =
    normalized.readingMinutes ??
    parseReadingMinutes(normalized.reading_time) ??
    parseReadingMinutes(metadata.read_time);

  normalized.reading_time =
    normalized.reading_time ||
    metadata.read_time ||
    (normalized.readingMinutes ? `${normalized.readingMinutes} min read` : undefined);

  normalized.publishedAt = normalized.publishedAt || metadata.published_date || metadata.publishedAt;
  normalized.updatedAt = normalized.updatedAt || metadata.updatedAt;

  normalized.format = normalized.format || metadata.format;
  if (!allowedFormats.has(normalized.format)) {
    normalized.format = "article";
  }

  const body = buildBodyFromLegacy(normalized);
  if (body) {
    normalized.body = body;
  }

  const sanitized = stripAsterisksDeep(normalized);
  sanitized.authors = ["anonymous"];
  sanitized.author = "anonymous";
  if (sanitized.metadata) {
    sanitized.metadata.author = "anonymous";
  }

  return sanitized;
}
