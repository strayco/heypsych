/**
 * Canonical Product Identity
 *
 * One product, one identity.
 *
 * The catalog contains records that are the same product entered twice, in
 * most cases because an importer created both a bare vendor name and a
 * product-suffixed variant ("valant" and "valant-ehr-suite"). Left unresolved
 * these surface as two independent purchases: a clinician can select both,
 * the overlap engine reports a conflict between a product and itself, and the
 * cost estimate charges for two subscriptions to one system.
 *
 * `data/tools-v4/entity-resolution/` already held redirect and duplicate maps,
 * but nothing read them. This module makes them authoritative and adds the
 * pairs confirmed since.
 *
 * Resolution never deletes a record. Deprecated slugs stay resolvable so
 * existing URLs, saved projects, and inbound links keep working.
 */

import redirectsData from "../../../data/tools-v4/entity-resolution/redirects.json";
import duplicatesData from "../../../data/tools-v4/entity-resolution/duplicates.json";

/** Why a slug is treated as an alias rather than its own product. */
export type AliasReason =
  | "duplicate-record"
  | "rebrand"
  | "acquisition"
  | "redirect";

export interface AliasEntry {
  alias: string;
  canonical: string;
  reason: AliasReason;
  /** What established that these are the same product. */
  evidence?: string;
}

/**
 * Duplicate pairs confirmed by inspecting the records directly.
 *
 * Each pair below resolves to the same `website_url` in the catalog, which is
 * why they are treated as one product. They are listed explicitly rather than
 * matched by a name-similarity heuristic, because collapsing two genuinely
 * different products of the same vendor would be a worse error than leaving a
 * duplicate in place.
 *
 * The canonical slug is the record carrying more capability evidence, so
 * resolution does not discard data.
 */
const CONFIRMED_DUPLICATES: AliasEntry[] = [
  {
    alias: "valant",
    canonical: "valant-ehr-suite",
    reason: "duplicate-record",
    evidence: "Identical website_url (valant.io); canonical holds 20 capabilities vs 18",
  },
  {
    alias: "kipu-emr",
    canonical: "kipu-health",
    reason: "duplicate-record",
    evidence: "Same vendor and site (kipuhealth.com); canonical holds 18 capabilities vs 16",
  },
  {
    alias: "qualifacts-insync-ehr",
    canonical: "qualifacts-insync",
    reason: "duplicate-record",
    evidence: "Same product on qualifacts.com; canonical holds 17 capabilities vs 0",
  },
  {
    alias: "talkiatry-mdhub",
    canonical: "mdhub",
    reason: "duplicate-record",
    evidence: "Identical website_url (mdhub.ai); both records named 'mdhub'",
  },
  {
    alias: "alleva-emr",
    canonical: "alleva",
    reason: "duplicate-record",
    evidence: "Identical website_url (helloalleva.com)",
  },
  {
    alias: "lightning-step-ehr",
    canonical: "lightning-step",
    reason: "duplicate-record",
    evidence: "Same site (lightningstep.com); alias points at a campaign page",
  },
  {
    alias: "mindstrong-health",
    canonical: "mindstrong",
    reason: "duplicate-record",
    evidence: "Identical website_url (mindstrong.com)",
  },
  {
    alias: "nextgen-enterprise-ehr",
    canonical: "nextgen-enterprise",
    reason: "duplicate-record",
    evidence: "Identical website_url (nextgen.com/products/nextgen-enterprise)",
  },
  {
    alias: "opus-ehr",
    canonical: "opus",
    reason: "duplicate-record",
    evidence: "Identical website_url (opusehr.com)",
  },
  {
    alias: "sunwave-emr",
    canonical: "sunwave",
    reason: "duplicate-record",
    evidence: "Identical website_url (sunwavehealth.com)",
  },
];

// ============================================================================
// INDEX
// ============================================================================

interface RedirectsFile {
  redirects: Record<string, string>;
}

function buildAliasIndex(): Map<string, AliasEntry> {
  const index = new Map<string, AliasEntry>();

  // Pre-existing redirect map: rebrands and acquisitions.
  const redirects = (redirectsData as RedirectsFile).redirects ?? {};
  for (const [alias, canonical] of Object.entries(redirects)) {
    index.set(alias, {
      alias,
      canonical,
      reason: "redirect",
      evidence: "data/tools-v4/entity-resolution/redirects.json",
    });
  }

  // Curated per-product redirects recorded alongside each duplicate cluster.
  //
  // Only the explicit from/to pairs are used. The sibling `acquisitions` and
  // `rebrands` lists in the same file describe company history, not product
  // identity: "Therapy Brands became Ensora Health" does not make TheraNest
  // and Fusion Web Clinic the same product. Merging on a shared parent company
  // would collapse genuinely different systems, so those lists are left to the
  // vendor-history surfaces that need them.
  const resolution = duplicatesData as {
    duplicates?: Array<{
      canonical_slug?: string;
      redirects?: Array<{ from?: string; to?: string }>;
      notes?: string;
    }>;
  };

  for (const entry of resolution.duplicates ?? []) {
    for (const redirect of entry.redirects ?? []) {
      if (!redirect.from || !redirect.to || redirect.from === redirect.to) continue;
      index.set(redirect.from, {
        alias: redirect.from,
        canonical: redirect.to,
        reason: "duplicate-record",
        evidence: entry.notes ?? "entity-resolution/duplicates.json",
      });
    }
  }

  // Pairs confirmed directly against the records. These take precedence.
  for (const entry of CONFIRMED_DUPLICATES) {
    index.set(entry.alias, entry);
  }

  return index;
}

let aliasIndex: Map<string, AliasEntry> | null = null;

function getIndex(): Map<string, AliasEntry> {
  if (!aliasIndex) aliasIndex = buildAliasIndex();
  return aliasIndex;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Resolve a slug to its canonical form.
 *
 * Chains are followed so an alias of an alias still resolves, with a hop limit
 * in case the data ever contains a cycle. An unknown slug is returned as-is:
 * a product we have no alias information about is its own canonical identity.
 */
export function resolveCanonicalSlug(slug: string): string {
  const index = getIndex();
  let current = slug;

  for (let hops = 0; hops < 8; hops++) {
    const entry = index.get(current);
    if (!entry || entry.canonical === current) return current;
    current = entry.canonical;
  }

  return current;
}

/** True when this slug is a deprecated alias of some other product. */
export function isAlias(slug: string): boolean {
  return resolveCanonicalSlug(slug) !== slug;
}

/** Why a slug was treated as an alias, for admin and audit surfaces. */
export function getAliasEntry(slug: string): AliasEntry | undefined {
  return getIndex().get(slug);
}

/** Every known alias pointing at a canonical slug. */
export function getAliasesFor(canonicalSlug: string): string[] {
  return [...getIndex().values()]
    .filter((entry) => resolveCanonicalSlug(entry.alias) === canonicalSlug)
    .map((entry) => entry.alias)
    .sort();
}

/** The whole alias table, for the admin catalog view and tests. */
export function listAliases(): AliasEntry[] {
  return [...getIndex().values()].sort((a, b) => a.alias.localeCompare(b.alias));
}

/**
 * Collapse a list of records to one per canonical product.
 *
 * Where both an alias and its canonical record are present, the canonical is
 * kept. Where only the alias is present it is kept, so a product never
 * disappears because its canonical twin was not published.
 */
export function dedupeByCanonicalSlug<T>(
  items: T[],
  getSlug: (item: T) => string
): T[] {
  const bySlug = new Map<string, T>();
  const kept = new Map<string, T>();

  for (const item of items) bySlug.set(getSlug(item), item);

  for (const item of items) {
    const slug = getSlug(item);
    const canonical = resolveCanonicalSlug(slug);

    // Prefer the canonical record when it is also present in this list.
    const preferred = bySlug.get(canonical) ?? item;
    kept.set(canonical, preferred);
  }

  return [...kept.values()];
}
