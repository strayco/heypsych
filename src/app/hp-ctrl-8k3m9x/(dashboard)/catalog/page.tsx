/**
 * Catalog review dashboard.
 *
 * This is an evidence and identity surface for the HeyPsych team. It is not
 * the illustrated world, and it does not recommend products. Clinicians never
 * see it.
 *
 * Adding a product remains a file-based editorial change: identify, classify,
 * map capabilities, attach evidence, price, review, preview, then publish.
 * This page shows what is already in the canonical registry and what still
 * needs a human.
 */

import Link from "next/link";
import {
  ClinicianToolService,
  isToolPublishable,
} from "@/lib/tools/clinician-tool-service";
import { isPublishReady } from "@/lib/schemas/clinician-tool-v4";
import {
  isAlias,
  listAliases,
  resolveCanonicalSlug,
} from "@/lib/tools/canonical-identity";
import { freshnessStateForClaim } from "@/lib/tools/evidence-freshness";
import { PRACTICE_GRADE_SLUGS } from "@/lib/tools/practice-grade-catalog";

export const metadata = {
  title: "Catalog review",
  robots: { index: false, follow: false },
};

const RESEARCH_QUEUE = [
  "simplepractice",
  "therapynotes",
  "theranest",
  "jane-app",
  "sessions-health",
  "intakeq-practiceq",
  "icanotes",
  "luminello",
  "valant-ehr-suite",
  "osmind",
  "mentalyc",
  "upheal",
  "blueprint",
  "doxy-me",
  "zoom-for-healthcare",
  "headway",
  "grow-therapy",
  "sondermind",
  "psychology-today",
  "zencare",
  "ivypay",
  "mentaya",
  "thrizer",
  "heard",
];

interface PageProps {
  searchParams: Promise<{ q?: string; filter?: string }>;
}

export default async function CatalogReviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const filter = params.filter ?? "needs-review";

  const tools = await ClinicianToolService.loadAllToolsIncludingDrafts();
  const aliases = listAliases();
  const slugs = new Set(tools.map((t) => t.slug));

  const publishable = tools.filter((t) => isPublishReady(t));
  const publicCatalog = tools.filter(isToolPublishable);
  const needsReview = tools.filter((t) => t.governance.needs_review);
  const baaUnknown = tools.filter(
    (t) =>
      !t.compliance?.baa_available || t.compliance.baa_available === "unknown"
  );
  const epcsClaims = tools.filter((t) =>
    (t.capabilities ?? []).includes("epcs-controlled")
  );
  const aliasRecords = tools.filter((t) => isAlias(t.slug));
  const missingFromQueue = RESEARCH_QUEUE.filter((slug) => !slugs.has(slug));
  const staleReviews = tools.filter(
    (t) =>
      freshnessStateForClaim(t.governance.last_reviewed, "features") ===
      "needs_freshness_review"
  );
  const epcsUnverified = epcsClaims.filter(
    (t) =>
      t.governance.needs_review ||
      freshnessStateForClaim(t.governance.last_reviewed, "epcs") !== "current"
  );

  const filtered = tools.filter((tool) => {
    if (query) {
      const hay = `${tool.name} ${tool.slug} ${tool.company_name ?? ""}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    switch (filter) {
      case "publishable":
        return isPublishReady(tool);
      case "needs-review":
        return tool.governance.needs_review;
      case "baa-unknown":
        return (
          !tool.compliance?.baa_available ||
          tool.compliance.baa_available === "unknown"
        );
      case "epcs":
        return (tool.capabilities ?? []).includes("epcs-controlled");
      case "aliases":
        return isAlias(tool.slug);
      default:
        return true;
    }
  });

  const shown = filtered.slice(0, 200);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-label-primary">
          Catalog review
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-label-secondary">
          Research archive of every clinician-tool record. The public directory
          and Practice Architect only publish the {PRACTICE_GRADE_SLUGS.size}
          practice-grade products. This page does not write to the catalog.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Records" value={tools.length} />
        <Stat label="Public catalog" value={publicCatalog.length} />
        <Stat label="Publishable" value={publishable.length} href="?filter=publishable" />
        <Stat label="Needs review" value={needsReview.length} href="?filter=needs-review" />
        <Stat label="BAA unknown" value={baaUnknown.length} href="?filter=baa-unknown" />
        <Stat label="EPCS claims" value={epcsClaims.length} href="?filter=epcs" />
        <Stat
          label="EPCS unverified"
          value={epcsUnverified.length}
          href="?filter=epcs"
        />
        <Stat label="Stale reviews" value={staleReviews.length} />
        <Stat label="Alias records" value={aliasRecords.length} href="?filter=aliases" />
        <Stat label="Known aliases" value={aliases.length} />
        <Stat label="Queue gaps" value={missingFromQueue.length} />
      </dl>

      {missingFromQueue.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-label-primary">
            Research queue not yet in the catalog
          </h2>
          <p className="mt-1 text-xs text-label-tertiary">
            Names from the 3.1 coverage list. Absence is not a reason to
            invent a record. Add only with primary sources and
            <code className="mx-1">needs_review: true</code>
            until evidence is attached.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {missingFromQueue.map((slug) => (
              <li
                key={slug}
                className="rounded-full border border-separator bg-surface px-2.5 py-1 text-xs text-label-secondary"
              >
                {slug}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form className="flex flex-wrap items-end gap-3">
        <label className="block text-xs font-medium text-label-secondary">
          Search
          <input
            name="q"
            defaultValue={params.q}
            className="mt-1 block w-64 rounded-lg border border-separator bg-surface px-3 py-2 text-sm"
            placeholder="Name or slug"
          />
        </label>
        <input type="hidden" name="filter" value={filter} />
        <button
          type="submit"
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
        <Link href="?filter=all" className="text-xs text-accent hover:underline">
          Show all
        </Link>
      </form>

      <p className="text-xs text-label-tertiary">
        Showing {shown.length}
        {filtered.length > shown.length ? ` of ${filtered.length}` : ""} matching
        records.
      </p>

      <div className="overflow-x-auto rounded-xl border border-separator bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-separator bg-fill-quaternary text-label-tertiary">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Published</th>
              <th className="px-3 py-2 font-medium">BAA</th>
              <th className="px-3 py-2 font-medium">Review</th>
              <th className="px-3 py-2 font-medium">Canonical</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((tool) => {
              const canonical = resolveCanonicalSlug(tool.slug);
              return (
                <tr key={tool.slug} className="border-b border-separator last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-medium text-label-primary">
                      {tool.name}
                    </div>
                    <div className="text-label-tertiary">{tool.slug}</div>
                  </td>
                  <td className="px-3 py-2 text-label-secondary">
                    {tool.primary_category}
                  </td>
                  <td className="px-3 py-2">
                    {isPublishReady(tool) ? "yes" : "no"}
                  </td>
                  <td className="px-3 py-2 text-label-secondary">
                    {tool.compliance?.baa_available ?? "unknown"}
                  </td>
                  <td className="px-3 py-2 text-label-secondary">
                    {tool.governance.needs_review
                      ? "needs review"
                      : tool.governance.last_reviewed ?? "never"}
                  </td>
                  <td className="px-3 py-2 text-label-secondary">
                    {canonical === tool.slug ? "—" : canonical}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border border-separator bg-fill-quaternary p-4 text-sm text-label-secondary">
        <h2 className="font-semibold text-label-primary">
          Adding a tool
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Identify: search this page and the alias table for the name, former names, and website.</li>
          <li>Classify: vendor, product, category, edition. Do not merge different products that share a parent company.</li>
          <li>Map capabilities from the controlled taxonomy, not marketing copy.</li>
          <li>Attach source URLs, limitations, and a review date. Unknown stays unknown.</li>
          <li>Enter pricing or mark it unpublished. Never invent a midpoint.</li>
          <li>Route EPCS, BAA, and specialty claims to clinical review.</li>
          <li>Preview directory, detail, comparison, and Architect eligibility locally.</li>
          <li>Publish only approved claims. Keep <code>needs_review</code> true until then.</li>
        </ol>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <>
      <dt className="text-[11px] uppercase tracking-wide text-label-tertiary">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-label-primary">{value}</dd>
    </>
  );

  if (!href) {
    return (
      <div className="rounded-xl border border-separator bg-surface p-3">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-xl border border-separator bg-surface p-3 transition-colors hover:bg-fill-quaternary"
    >
      {inner}
    </Link>
  );
}
