/**
 * Article experience model
 *
 * One reading model for both kinds of article on HeyPsych:
 *  - /learn articles (data/learn/*.json, typed content blocks), and
 *  - Knowledge Hub resources (/resources/<slug>, database entities whose
 *    sections are { heading, content } or { title, type, text } with
 *    "\n\n" paragraphs and "•" bullet lines).
 *
 * Pure. Everything comes from the record; related links are kept only when
 * the page they point to exists, so an article never sends a reader to a 404.
 */

export type ArticleBlock =
  | { kind: "h2"; id: string; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "quote"; text: string; cite: string | null }
  | { kind: "callout"; text: string; tone: "info" | "warning" | "tip" }
  | { kind: "study"; text: string; cite: string | null; url: string | null };

export interface ArticleLink {
  href: string;
  label: string;
}

export interface ArticleView {
  title: string;
  standfirst: string | null;
  minutes: number;
  published: string | null;
  updated: string | null;
  author: string | null;
  /** Medical reviewer ids (resolved to names by the page) and the review date. */
  reviewerIds: string[];
  reviewed: string | null;
  topics: string[];
  takeaways: string[];
  blocks: ArticleBlock[];
  /** h2 headings, for the in-article contents. */
  contents: { id: string; text: string }[];
  /** The first quote in the article, shown as a pull quote. */
  pullQuote: { text: string; cite: string | null } | null;
  related: { conditions: ArticleLink[]; treatments: ArticleLink[]; resources: ArticleLink[]; articles: ArticleLink[] };
  references: { title: string; source: string | null; url: string | null }[];
}

/** Bylines that say nothing about who wrote it. */
function realAuthor(v: string | null | undefined): string | null {
  if (!v || !v.trim()) return null;
  return /^(anonymous|unknown|n\/a|none)$/i.test(v.trim()) ? null : v.trim();
}

/** What exists, so links are checked rather than trusted. */
export interface LinkTargets {
  condition: (slug: string) => string | null; // name, or null if no page
  treatment: (slug: string) => string | null;
  resource: (slug: string) => string | null;
  article: (slug: string) => string | null;
}

// ---------------------------------------------------------------------------

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Strip the inline {link:type:slug:text} markup to its text. */
export function plain(text: string): string {
  return text.replace(/\{link:[^:}]+:[^:}]+:([^}]+)\}/g, "$1").trim();
}

function words(blocks: ArticleBlock[]): number {
  let n = 0;
  for (const b of blocks) {
    const t = "items" in b ? b.items.join(" ") : b.text;
    n += t.split(/\s+/).filter(Boolean).length;
  }
  return n;
}

function finish(
  base: Omit<ArticleView, "contents" | "pullQuote" | "minutes"> & { minutes?: number }
): ArticleView {
  // Unique heading ids, in order.
  const seen = new Map<string, number>();
  const blocks = base.blocks.map((b) => {
    if (b.kind !== "h2") return b;
    const root = slugify(b.text) || "section";
    const n = seen.get(root) ?? 0;
    seen.set(root, n + 1);
    return { ...b, id: n === 0 ? root : `${root}-${n + 1}` };
  });
  const quote = blocks.find((b): b is Extract<ArticleBlock, { kind: "quote" }> => b.kind === "quote");
  return {
    ...base,
    blocks,
    minutes: base.minutes && base.minutes > 0 ? base.minutes : Math.max(1, Math.round(words(blocks) / 230)),
    contents: blocks.filter((b): b is Extract<ArticleBlock, { kind: "h2" }> => b.kind === "h2").map((b) => ({ id: b.id, text: b.text })),
    pullQuote: quote ? { text: quote.text, cite: quote.cite } : null,
  };
}

function links(slugs: unknown, resolve: (slug: string) => string | null, href: (slug: string) => string): ArticleLink[] {
  if (!Array.isArray(slugs)) return [];
  const out: ArticleLink[] = [];
  for (const raw of slugs) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const label = resolve(raw.trim());
    if (label && !out.some((l) => l.href === href(raw.trim()))) out.push({ href: href(raw.trim()), label });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Free text → blocks (Knowledge Hub)
// ---------------------------------------------------------------------------

const BULLET = /^\s*(?:[•\-–*]|\d+[.)])\s+/;

/** "Intro line\n\n• a\n• b\n\nNext para" → paragraphs and lists. */
export function textToBlocks(text: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  for (const chunk of String(text).split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    let paragraph: string[] = [];
    let list: string[] = [];
    const flushP = () => {
      if (paragraph.length) blocks.push({ kind: "p", text: paragraph.join(" ") });
      paragraph = [];
    };
    const flushL = () => {
      if (list.length) blocks.push({ kind: "list", items: list });
      list = [];
    };
    for (const line of lines) {
      if (BULLET.test(line)) {
        flushP();
        list.push(line.replace(BULLET, ""));
      } else {
        flushL();
        paragraph.push(line);
      }
    }
    flushP();
    flushL();
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// /learn articles
// ---------------------------------------------------------------------------

export interface LearnArticle {
  slug: string;
  title: string;
  description: string;
  tags?: string[];
  category?: string;
  readingTime?: number;
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
  content: Array<{
    type: "h2" | "h3" | "p" | "list" | "blockquote" | "callout" | "study";
    text?: string;
    items?: string[];
    citation?: string;
    url?: string;
    variant?: "info" | "warning" | "tip";
  }>;
  crosslinks?: { conditions?: string[]; treatments?: string[]; resources?: string[]; articles?: string[] };
}

export function fromLearn(article: LearnArticle, targets: LinkTargets): ArticleView {
  const blocks: ArticleBlock[] = [];
  for (const b of article.content ?? []) {
    const text = b.text ? plain(b.text) : "";
    switch (b.type) {
      case "h2":
        if (text) blocks.push({ kind: "h2", id: "", text });
        break;
      case "h3":
        if (text) blocks.push({ kind: "h3", text });
        break;
      case "p":
        if (text) blocks.push({ kind: "p", text });
        break;
      case "list":
        if (b.items?.length) blocks.push({ kind: "list", items: b.items.map(plain) });
        break;
      case "blockquote":
        if (text) blocks.push({ kind: "quote", text, cite: b.citation ?? null });
        break;
      case "callout":
        if (text) blocks.push({ kind: "callout", text, tone: b.variant ?? "info" });
        break;
      case "study":
        if (text) blocks.push({ kind: "study", text, cite: b.citation ?? null, url: b.url ?? null });
        break;
    }
  }
  const cl = article.crosslinks ?? {};
  return finish({
    title: article.title,
    standfirst: article.description ?? null,
    minutes: article.readingTime,
    published: article.publishedAt ?? null,
    updated: article.updatedAt ?? null,
    author: realAuthor(article.author),
    reviewerIds: [],
    reviewed: null,
    topics: (article.tags ?? []).slice(0, 6),
    takeaways: [],
    blocks,
    related: {
      conditions: links(cl.conditions, targets.condition, (s) => `/conditions/${s}`),
      treatments: links(cl.treatments, targets.treatment, (s) => `/treatments/${s}`),
      resources: links(cl.resources, (s) => targets.resource(RESOURCE_ALIASES[s] ?? s), (s) => `/resources/${RESOURCE_ALIASES[s] ?? s}`),
      articles: links(cl.articles, (s) => targets.article(ARTICLE_ALIASES[s] ?? s), (s) => `/learn/${ARTICLE_ALIASES[s] ?? s}`),
    },
    references: [],
  });
}

/** Crosslinks that name a page by an old or short slug. */
export const RESOURCE_ALIASES: Record<string, string> = { asrs: "asrs-v1-1" };
export const ARTICLE_ALIASES: Record<string, string> = { "tapering-antidepressants": "tapering-off-antidepressants" };

// ---------------------------------------------------------------------------
// Knowledge Hub resources
// ---------------------------------------------------------------------------

export function fromKnowledgeHub(
  entity: {
    name?: string;
    slug?: string;
    description?: string | null;
    data?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    editorial?: unknown;
  },
  targets: LinkTargets
): ArticleView {
  const d = (entity.data ?? {}) as Record<string, unknown>;
  const meta = (entity.metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : []);

  const blocks: ArticleBlock[] = [];
  const intro = str(d.introduction);
  if (intro) blocks.push(...textToBlocks(plain(intro)));
  for (const raw of Array.isArray(d.sections) ? d.sections : []) {
    const s = (raw ?? {}) as Record<string, unknown>;
    const heading = str(s.heading) ?? str(s.title);
    const body = str(s.content) ?? str(s.text);
    if (heading) blocks.push({ kind: "h2", id: "", text: plain(heading) });
    if (body) blocks.push(...textToBlocks(plain(body)));
  }
  const conclusion = str(d.conclusion);
  if (conclusion) {
    blocks.push({ kind: "h2", id: "", text: "The bottom line" });
    blocks.push(...textToBlocks(plain(conclusion)));
  }

  const readTime = Number(String(d.reading_time ?? meta.read_time ?? "").match(/\d+/)?.[0] ?? 0);
  const author = realAuthor(d.author && typeof d.author === "object" ? str((d.author as Record<string, unknown>).name) : str(d.author));
  const editorial = ((entity.editorial && typeof entity.editorial === "object" ? entity.editorial : d.editorial) ?? {}) as Record<string, unknown>;
  const editorialDates = (editorial.dates && typeof editorial.dates === "object" ? editorial.dates : {}) as Record<string, unknown>;
  const references = (Array.isArray(d.references) ? d.references : [])
    .map((raw) => {
      const r = (raw ?? {}) as Record<string, unknown>;
      const title = str(r.title);
      if (!title) return null;
      let url = str(r.url);
      try {
        // Placeholder links are not sources.
        if (url && /(^|\.)example\.(com|org)$/.test(new URL(url).hostname)) url = null;
      } catch {
        url = null;
      }
      return { title, source: str(r.source), url };
    })
    .filter((r): r is { title: string; source: string | null; url: string | null } => Boolean(r));

  return finish({
    title: str(entity.name) ?? str(d.name) ?? "",
    standfirst: str(entity.description) ?? str(d.description) ?? str(d.summary),
    minutes: readTime,
    published: str(meta.published_date) ?? null,
    updated: str(editorial.lastUpdated) ?? str(editorialDates.lastUpdated),
    author,
    reviewerIds: arr(editorial.medicalReviewerIds),
    reviewed: str(editorial.lastReviewed) ?? str(editorialDates.lastMedicallyReviewed),
    topics: arr(meta.topics).slice(0, 6),
    takeaways: [...arr(d.key_takeaways), ...arr(d.learning_objectives)].slice(0, 6),
    blocks,
    related: {
      conditions: links(d.relatedConditionSlugs, targets.condition, (s) => `/conditions/${s}`),
      treatments: links(d.relatedMedicationSlugs, targets.treatment, (s) => `/treatments/${s}`),
      resources: links(d.relatedResourceSlugs, (s) => targets.resource(RESOURCE_ALIASES[s] ?? s), (s) => `/resources/${RESOURCE_ALIASES[s] ?? s}`),
      articles: [],
    },
    references,
  });
}
