/**
 * Search result shaping
 *
 * The database search (`search_entities_grouped`) answers "which rows mention
 * these words" and ranks them by Postgres `ts_rank`. On its own that produced
 * results that looked broken:
 *
 *  - rows filed in the wrong section (crisis hotlines and comparison articles
 *    are stored with treatment-like types, so they appeared as treatments and
 *    linked to 404s);
 *  - patient apps listed as "resources" whose page is an empty stub;
 *  - the same item several times (three "988 Suicide & Crisis Lifeline" rows,
 *    two "Guanfacine" rows);
 *  - ranking driven by body-text frequency, so "zoloft" put Autism Spectrum
 *    Disorder first and "depression" put Botox above depression treatments.
 *
 * Everything here is pure: rows in, display-ready results out. The route
 * over-fetches candidates, this module classifies, links, de-duplicates and
 * re-ranks them, and the route trims to the requested size.
 */

import { isResourceToolStub } from "@/lib/entities/entity-slugs.generated";
import { resolveTreatmentAlias } from "@/lib/treatments/treatment-aliases.generated";

export type SearchResultType = "condition" | "treatment" | "resource" | "tool";
export type SearchSection = "conditions" | "treatments" | "resources" | "tools";

export interface SearchSnippet {
  term: string;
  field: string;
  snippet: string;
}

export interface SearchResult {
  type: SearchResultType;
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  snippets: SearchSnippet[];
  /** Canonical URL for this result. */
  href: string;
}

/** A database row from `search_entities` / `search_entities_grouped`. */
export interface EntityRow {
  entity_type?: string | null;
  id?: string | null;
  type?: string | null;
  slug?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  metadata?: { category?: string | null } | null;
}

export const SECTION_FOR_TYPE: Record<SearchResultType, SearchSection> = {
  condition: "conditions",
  treatment: "treatments",
  resource: "resources",
  tool: "tools",
};

// ============================================================================
// QUERY PARSING
// ============================================================================

/** Lower-case, punctuation-free, single-spaced. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSearchTerms(query: string): string[] {
  return [...new Set(normalizeText(query).split(" ").filter(Boolean))];
}

// ============================================================================
// CLASSIFICATION AND LINKS
// ============================================================================

/**
 * Where a database row belongs and where it links, or null to drop it.
 *
 * The row's own `type` is the authority, not the function's `entity_type`
 * bucket, which files every non-condition, non-resource row as a treatment.
 */
export function classifyRow(
  row: EntityRow
): { type: SearchResultType; href: string } | null {
  const slug = (row.slug ?? "").trim();
  if (!slug) return null;

  const rawType = (row.type ?? row.entity_type ?? "").toLowerCase();
  const category = (row.category ?? row.metadata?.category ?? "").toLowerCase();

  if (rawType === "provider") return null;

  if (rawType === "condition") {
    return { type: "condition", href: `/conditions/${slug}` };
  }

  // Crisis lines are support resources that happen to be stored with a
  // treatment-like type. Their page is under /resources.
  if (rawType === "hotline" || category === "support-community") {
    return { type: "resource", href: `/resources/${slug}` };
  }

  // "Lexapro vs Zoloft" and friends live under /treatments/compare.
  if (rawType === "comparison") {
    return { type: "treatment", href: `/treatments/compare/${slug}` };
  }

  if (rawType === "resource") {
    // Most patient apps also have a resource row; the real page is the tool
    // review, and they belong with the other apps.
    if (isResourceToolStub(slug)) {
      return { type: "tool", href: `/tools/${slug}` };
    }
    return { type: "resource", href: `/resources/${slug}` };
  }

  // medication, therapy, stimulant, supplement, interventional, ...
  // Alias rows ("electroconvulsive-therapy-for-severe-depression") link to
  // their canonical page, which also lets de-duplication merge the two.
  return { type: "treatment", href: `/treatments/${resolveTreatmentAlias(slug) ?? slug}` };
}

/** Normalise a database row into a result, or null if it cannot be shown. */
export function rowToResult(row: EntityRow, terms: string[]): SearchResult | null {
  const placement = classifyRow(row);
  if (!placement) return null;

  const slug = (row.slug ?? "").trim();
  const name = (row.title ?? row.name ?? "").trim() || slug;
  const description = row.description?.trim() || null;
  const category = (row.category ?? row.metadata?.category ?? "").trim() || null;

  return {
    type: placement.type,
    id: (row.id ?? slug).toString(),
    slug,
    name,
    description,
    // Internal buckets are not useful labels for a reader.
    category: category && !HIDDEN_CATEGORIES.has(category) ? category : null,
    snippets: buildSnippets(name, description, terms),
    href: placement.href,
  };
}

const HIDDEN_CATEGORIES = new Set(["other-conditions", "knowledge-hub", "medications"]);

// ============================================================================
// SNIPPETS
// ============================================================================

/** One readable line, from the description only, centred on the first match. */
export function buildSnippets(
  name: string,
  description: string | null,
  terms: string[]
): SearchSnippet[] {
  if (!description || description.length < 10) return [];

  const lower = description.toLowerCase();
  const term = terms.find((t) => lower.includes(t));

  // A match in the name is already visible; show the start of the description.
  if (!term) {
    return [
      { term: terms[0] ?? "", field: "Description", snippet: truncate(description, 180) },
    ];
  }

  const index = lower.indexOf(term);
  const start = Math.max(0, index - 70);
  const end = Math.min(description.length, index + term.length + 110);
  let snippet = description.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < description.length) snippet = `${snippet}…`;

  return [{ term, field: "Description", snippet }];
}

/** Whether a snippet already shows the reader why this result matched. */
export function snippetShowsMatch(result: SearchResult, terms: string[]): boolean {
  const text = `${result.name} ${result.snippets.map((s) => s.snippet).join(" ")}`.toLowerCase();
  return terms.some((t) => text.includes(t));
}

/** Fields that are machinery, not prose a reader should see. */
const SKIP_KEYS = /(^|_)(id|ids|slug|slugs|url|urls|href|keywords|image|images|icon|schema|canonical|color|gradient|status|type|version|date|dates|timestamp)$/i;

/** Field paths whose prose is most worth showing, best first. */
const PREFERRED_PATHS: RegExp[] = [
  /(description|summary|overview|one_liner|tagline)$/i,
  /faqs?\[\d+\]\.(a|answer)$/i,
  /(notes|best_for|not_for|caveats?|limitations?)/i,
];

/**
 * The most readable sentence in a record that contains a search term, for
 * results whose description does not mention it (Sesame's "cannot prescribe
 * Adderall" lives in its pricing notes and FAQ, not its description).
 */
export function contextSnippet(record: unknown, terms: string[], max = 200): string | null {
  if (terms.length === 0) return null;
  const found: { path: string; text: string }[] = [];

  const walk = (value: unknown, path: string, key: string) => {
    if (SKIP_KEYS.test(key)) return;
    if (typeof value === "string") {
      if (value.length >= 20 && terms.some((t) => value.toLowerCase().includes(t))) {
        found.push({ path, text: value });
      }
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`, key));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, k);
    }
  };
  walk(record, "", "");
  if (found.length === 0) return null;

  const rank = (path: string) => {
    const index = PREFERRED_PATHS.findIndex((re) => re.test(path));
    return index === -1 ? PREFERRED_PATHS.length : index;
  };
  found.sort((a, b) => rank(a.path) - rank(b.path));

  const text = found[0].text.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  const term = terms.find((t) => lower.includes(t))!;
  const at = lower.indexOf(term);

  // The sentence around the match, trimmed to fit.
  // Start after the last sentence break before the match, or at the start of
  // the text when there is none (lastIndexOf returns -1, which must not
  // become "skip one character").
  const breaks = [". ", "? ", "! "]
    .map((p) => text.lastIndexOf(p, at))
    .filter((i) => i !== -1)
    .map((i) => i + 2);
  const start = breaks.length ? Math.max(...breaks) : 0;
  const endCandidates = [". ", "? ", "! "]
    .map((p) => text.indexOf(p, at + term.length))
    .filter((i) => i !== -1);
  const end = endCandidates.length ? Math.min(...endCandidates) + 1 : text.length;
  let sentence = text.slice(start, end).trim();

  if (sentence.length > max) {
    const local = sentence.toLowerCase().indexOf(term);
    const from = Math.max(0, local - Math.floor(max / 3));
    sentence = `${from > 0 ? "…" : ""}${sentence.slice(from, from + max).trim()}…`;
  }
  return sentence;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

// ============================================================================
// RELEVANCE
// ============================================================================

/**
 * Names carry aliases in parentheses: "Sertraline (Zoloft)",
 * "Guanfacine (Tenex, Intuniv)". Each alias counts as a name.
 */
function nameVariants(name: string): string[] {
  const variants = [normalizeText(name.replace(/\([^)]*\)/g, " "))];
  for (const group of name.matchAll(/\(([^)]*)\)/g)) {
    for (const alias of group[1].split(/[,/]/)) {
      const normalized = normalizeText(alias);
      if (normalized) variants.push(normalized);
    }
  }
  variants.push(normalizeText(name));
  return variants.filter(Boolean);
}

const SUFFIXES = ["ations", "ation", "ities", "ions", "ives", "ity", "ion", "ive", "ies", "ing", "ers", "es", "ed", "er", "al", "s"];

/**
 * A deliberately crude English stem, enough that "depression" finds
 * "Depressive Disorder" and "anxiety" finds "Anxious Distress". The database
 * already stems for matching; this only aligns the name check with it.
 */
export function stem(word: string): string {
  for (const suffix of SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

/** Whether some word in `text` starts with `term` (or shares its stem). */
function matchesWord(text: string, term: string): boolean {
  const termStem = stem(term);
  return text.split(" ").some((word) => word.startsWith(term) || stem(word).startsWith(termStem));
}

/**
 * How directly a result answers the query. Higher is better; the database
 * order breaks ties, so full-text relevance still decides among equals.
 *
 *   100  name or alias is the query          "zoloft" → Sertraline (Zoloft)
 *    80  name or alias starts with it        "bipolar" → Bipolar I Disorder
 *    60  every term matches a word in name   "depression" → Major Depressive Disorder
 *    40  some term matches a word in name    "ocd treatment" → Exposure Therapy for OCD
 *    20  every term matches the description
 *     0  matched only in body text
 *
 * Within the name tiers, up to 10 more points for how much of the name the
 * query covers, so "Major Depressive Disorder" beats "Depressive Disorder Due
 * to Another Medical Condition".
 */
export function relevanceScore(result: SearchResult, query: string, terms: string[]): number {
  const direct = scorePhrase(result, normalizeText(query), terms);
  const expanded = expandAcronyms(query);
  if (!expanded) return direct;
  return Math.max(direct, scorePhrase(result, expanded, getSearchTerms(expanded)));
}

/**
 * Clinical abbreviations people search by, spelled out the way condition
 * names are written. Only used for scoring; the database already matched.
 */
const ACRONYMS: Record<string, string> = {
  adhd: "attention deficit hyperactivity",
  add: "attention deficit",
  ocd: "obsessive compulsive",
  ptsd: "posttraumatic stress",
  cptsd: "complex posttraumatic stress",
  gad: "generalized anxiety",
  mdd: "major depressive",
  bpd: "borderline personality",
  pmdd: "premenstrual dysphoric",
  asd: "autism spectrum",
  arfid: "avoidant restrictive food intake",
  ssri: "selective serotonin reuptake inhibitor",
  snri: "serotonin norepinephrine reuptake inhibitor",
  maoi: "monoamine oxidase inhibitor",
  cbt: "cognitive behavioral therapy",
  dbt: "dialectical behavior therapy",
  emdr: "eye movement desensitization",
  erp: "exposure and response prevention",
  tms: "transcranial magnetic stimulation",
  ect: "electroconvulsive therapy",
};

function expandAcronyms(query: string): string | null {
  const words = normalizeText(query).split(" ");
  if (!words.some((w) => ACRONYMS[w])) return null;
  return words.map((w) => ACRONYMS[w] ?? w).join(" ");
}

function scorePhrase(result: SearchResult, phrase: string, terms: string[]): number {
  if (!phrase || terms.length === 0) return 0;

  const variants = nameVariants(result.name);
  const [baseName, ...aliases] = variants;
  if (variants.some((v) => v === phrase)) return 100;
  // A spelled-out alias ("DBSA (Depression and Bipolar Support Alliance)")
  // starting with the query is a weaker signal than the name itself doing so.
  if (baseName.startsWith(phrase)) return 80 + coverage(baseName, terms);
  if (aliases.some((v) => v.startsWith(phrase))) return 60 + coverage(baseName, terms);

  const fullName = variants.join(" ");
  const inName = terms.filter((t) => matchesWord(fullName, t)).length;
  if (inName === terms.length) return 60 + coverage(variants[0], terms);
  if (inName > 0) return 40 + coverage(variants[0], terms);

  const description = normalizeText(result.description ?? "");
  if (description && terms.every((t) => matchesWord(description, t))) return 20;

  return 0;
}

/** 0–10: the share of the name's words that the query accounts for. */
function coverage(name: string, terms: string[]): number {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 0) return 0;
  const matched = words.filter((w) => terms.some((t) => w.startsWith(t) || stem(w).startsWith(stem(t))));
  return Math.round((matched.length / words.length) * 10);
}

/** Stable re-rank by relevance; the incoming order is the tiebreaker. */
export function rankResults(results: SearchResult[], query: string): SearchResult[] {
  const terms = getSearchTerms(query);
  return results
    .map((result, index) => ({ result, index, score: relevanceScore(result, query, terms) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.result);
}

// ============================================================================
// DE-DUPLICATION AND GROUPING
// ============================================================================

/**
 * When the same name appears in several sections, the one kept is the most
 * specific page: a treatment's comparison page over a resource article of the
 * same title, a crisis line's resource page over its app stub.
 */
const TYPE_PRIORITY: Record<SearchResultType, number> = {
  condition: 0,
  treatment: 1,
  resource: 2,
  tool: 3,
};

/** The key two results share when they are the same item. */
function identity(name: string): string {
  // "Sertraline (Zoloft)" and "Sertraline" are one drug; "International OCD
  // Foundation (IOCDF)" and "International OCD Foundation" one charity.
  return normalizeText(name.replace(/\([^)]*\)/g, " "));
}

/**
 * The same item twice: the same link, or the same name. Among same-named
 * items the higher-priority type wins; otherwise the earlier one does.
 */
export function dedupeResults(results: SearchResult[]): SearchResult[] {
  const ordered = results
    .map((result, index) => ({ result, index }))
    .sort((a, b) => TYPE_PRIORITY[a.result.type] - TYPE_PRIORITY[b.result.type] || a.index - b.index);

  const seenHref = new Set<string>();
  const seenName = new Set<string>();
  const kept = new Set<SearchResult>();

  for (const { result } of ordered) {
    const href = result.href.replace(/\/$/, "");
    const name = identity(result.name);
    if (seenHref.has(href) || (name && seenName.has(name))) continue;
    seenHref.add(href);
    if (name) seenName.add(name);
    kept.add(result);
  }
  // Preserve the caller's order.
  return results.filter((r) => kept.has(r));
}

export type GroupedResults = Record<SearchSection, SearchResult[]>;

/** Classify, de-duplicate and rank every candidate into its section. */
export function groupResults(results: SearchResult[], query: string): GroupedResults {
  const grouped: GroupedResults = { conditions: [], treatments: [], resources: [], tools: [] };
  for (const result of dedupeResults(results)) {
    grouped[SECTION_FOR_TYPE[result.type]].push(result);
  }
  for (const section of Object.keys(grouped) as SearchSection[]) {
    grouped[section] = rankResults(grouped[section], query);
  }
  return grouped;
}

/** Default reading order when sections are equally relevant. */
const SECTION_ORDER: SearchSection[] = ["conditions", "treatments", "tools", "resources"];

/**
 * Sections ordered by how well their best result answers the query, so a
 * search for "talkspace" opens on apps and "couples" on Couples Therapy, not
 * on conditions that merely mention the word.
 */
export function orderSections(grouped: GroupedResults, query: string): SearchSection[] {
  const terms = getSearchTerms(query);
  // Scores within the same tier (80-89, 60-69, ...) count as a tie, so a
  // slightly better article title does not push the conditions below it.
  const best = (section: SearchSection) => {
    const top = grouped[section][0];
    return top ? Math.floor(relevanceScore(top, query, terms) / 20) : -1;
  };
  return [...SECTION_ORDER].sort(
    (a, b) => best(b) - best(a) || SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b)
  );
}

/**
 * Clinician catalogue search matches substrings anywhere ("ab" finds
 * "tablet"). Keep only tools the query actually names or describes.
 */
export function isRelevant(result: SearchResult, query: string): boolean {
  return relevanceScore(result, query, getSearchTerms(query)) > 0;
}
