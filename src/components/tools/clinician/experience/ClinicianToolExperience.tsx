/**
 * Clinician tool experience
 *
 * The clinician-facing profile of a practice tool, in the entity-page system
 * (art bible §13): the workstation object and the product's mark, what it is
 * in one line, what a buyer needs at a glance, then who it suits (reviewers'
 * notes), what it costs (with an estimate only from stated per-provider
 * prices), what it does, compliance with its sources, integrations,
 * alternatives, and the rest as a chapter guide.
 *
 * Compliance and capability claims are vendor-reported unless a source says
 * otherwise; EPCS always reads "requires verification".
 */

import Link from "next/link";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";
import { ToolMark } from "@/components/tools/ToolMark";
import { GuideChapters, type GuideChapter } from "@/components/guide/GuideChapters";
import type { ClinicianToolExperience as Model } from "@/domains/tools/clinician-experience/model";
import { provenanceLabel } from "@/domains/tools/clinician-experience/model";
import type { SpecializedRecommendation } from "@/lib/tools/alternatives";
import { FitExplorer, PricingExplorer } from "./ClinicianToolIslands";
import type { Outbound } from "@/lib/commercial/outbound";

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 py-12 sm:py-16">
      <h2 id={`${id}-title`} className="font-display text-label-primary text-[30px] leading-tight tracking-[-0.01em] sm:text-[36px]">
        {title}
      </h2>
      {intro && <p className="text-label-secondary mt-2 max-w-2xl text-[16px] leading-relaxed">{intro}</p>}
      <div className="mt-7">{children}</div>
    </section>
  );
}

const STATE_TEXT = { yes: "Yes", no: "No", unknown: "Not stated", na: "Not applicable" } as const;

export interface AlternativeLink {
  slug: string;
  name: string;
  href: string;
  oneLiner: string | null;
  price: string | null;
}

export function ClinicianToolExperience({
  tool: x,
  slug,
  category,
  visit,
  alternatives,
  recommendations,
  recommendationHref,
  comparisons,
  related,
  guide,
}: {
  /** Related tools in the same category, rendered by the page. */
  related?: React.ReactNode;
  tool: Model;
  slug: string;
  category: { label: string; href: string };
  /** Where "Visit" goes, resolved server-side (partner links carry a disclosure). */
  visit: Outbound | null;
  alternatives: AlternativeLink[];
  recommendations: SpecializedRecommendation[];
  recommendationHref: (slug: string, primaryCategory: string) => string;
  comparisons: { slug: string; label: string }[];
  guide: GuideChapter[];
}) {
  const Workstation = DISCOVERY_OBJECTS.clinician;

  const nav = [
    x.fit.length > 0 || x.bestFor.length > 0 ? { id: "fit", label: "Who it's for" } : null,
    { id: "pricing", label: "Pricing" },
    x.capabilities.length > 0 ? { id: "features", label: "What it does" } : null,
    { id: "compliance", label: "Compliance" },
    x.integrations.length > 0 ? { id: "integrations", label: "Integrations" } : null,
    { id: "alternatives", label: "Alternatives" },
    guide.length > 0 ? { id: "full-guide", label: "Full guide" } : null,
  ].filter((n): n is { id: string; label: string } => Boolean(n));

  return (
    <div>
      {/* Opening ------------------------------------------------------------ */}
      <header className="pt-8 pb-10 sm:pt-12">
        <div className="mx-auto grid max-w-5xl items-end gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:px-8">
          <div className="min-w-0">
            <Link href={category.href} className="text-label-secondary hover:text-label-primary text-[14px] font-medium">
              <span aria-hidden="true">←</span> {category.label}
            </Link>
            <div className="mt-6 flex items-center gap-3">
              <ToolMark name={x.name} slug={slug} size="lg" />
              {x.company && <p className="text-label-tertiary text-[14px] font-medium">{x.company}</p>}
            </div>
            <h1 className="font-display text-label-primary mt-4 text-[40px] leading-[1.04] font-normal tracking-[-0.025em] sm:text-[56px]">
              {x.name}
            </h1>
            {x.oneLiner && <p className="text-label-primary mt-4 max-w-2xl text-[19px] leading-snug sm:text-[21px]">{x.oneLiner}</p>}

            {x.facts.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {x.facts.map((fact) => (
                  <li key={fact} className="bg-fill-quaternary text-label-secondary rounded-full px-3 py-1 text-[13px]">
                    {fact}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {visit && (
                <a href={visit.href} target="_blank" rel={visit.rel} className="bg-label-primary text-white rounded-full px-5 py-2.5 text-[15px] font-medium">
                  Visit {x.name} <span aria-hidden="true">↗</span>
                </a>
              )}
              {x.pricing.url && (
                <a href={x.pricing.url} target="_blank" rel="noopener noreferrer" className="border-separator bg-surface text-label-primary rounded-full border px-5 py-2.5 text-[15px] font-medium">
                  Vendor pricing ↗
                </a>
              )}
              <Link href={`/tools/alternatives/${slug}`} className="text-label-secondary hover:text-label-primary px-2 text-[15px]">
                Alternatives
              </Link>
            </div>
            {visit?.partner && (
              <p className="text-label-tertiary mt-2 text-[12.5px]">
                Partner link: we may earn a commission if you sign up. It doesn&rsquo;t affect what we recommend.
              </p>
            )}
          </div>
          <div aria-hidden="true" className="hidden h-[190px] lg:block">
            <Workstation />
          </div>
        </div>

        {x.glance.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-5xl gap-3 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
            {x.glance.map((tile) => (
              <a
                key={tile.id}
                href={tile.href}
                className={`focus-visible:ring-accent rounded-2xl border p-5 transition-[transform,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-0.5 hover:shadow-card-2 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                  tile.tone === "caution" ? "border-caution-200 bg-caution-50" : "border-separator bg-surface shadow-card-1"
                }`}
              >
                <p className={`text-[12px] font-semibold tracking-[0.06em] uppercase ${tile.tone === "caution" ? "text-caution-600" : "text-label-tertiary"}`}>{tile.label}</p>
                <p className="text-label-primary mt-2 line-clamp-3 text-[16px] leading-snug">{tile.value}</p>
              </a>
            ))}
          </div>
        )}
      </header>

      {nav.length > 1 && (
        <nav aria-label="On this page" className="border-separator bg-canvas/90 sticky top-16 z-20 border-y backdrop-blur">
          <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            {nav.map((item) => (
              <li key={item.id} className="shrink-0">
                <a href={`#${item.id}`} className="text-label-secondary hover:bg-fill-quaternary hover:text-label-primary block rounded-full px-3.5 py-1.5 text-[14px] font-medium">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {(x.fit.length > 0 || x.bestFor.length > 0 || x.notFor.length > 0) && (
          <Section id="fit" title="Who it's for" intro={x.fit.length > 1 ? "Choose a kind of practice to see how it fits." : undefined}>
            <FitExplorer fit={x.fit} bestFor={x.bestFor} notFor={x.notFor} toolName={x.name} />
          </Section>
        )}

        <Section id="pricing" title="What it costs" intro={x.pricing.options.length > 1 ? "Choose a plan to see it, and an estimate where the price is per provider." : undefined}>
          <PricingExplorer pricing={x.pricing} />
        </Section>

        {x.capabilities.length > 0 && (
          <Section id="features" title="What it does" intro="As the vendor describes it.">
            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {x.capabilities.map((group) => (
                <div key={group.id}>
                  <h3 data-heading="sans" className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">
                    {group.label}
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {group.items.map((item) => (
                      <li key={item} className="text-label-primary flex gap-2 text-[15px] leading-snug">
                        <span aria-hidden="true" className="bg-accent mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section id="compliance" title="Compliance" intro="What the vendor states, with sources where we have them. Confirm before signing a BAA.">
          <div className="border-separator bg-surface divide-y divide-[var(--color-separator)] overflow-hidden rounded-2xl border shadow-card-1">
            {x.compliance.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-4">
                <div>
                  <p className="text-label-primary text-[15px] font-medium">{item.label}</p>
                  {item.source && (
                    <a href={item.source.url} target="_blank" rel="noopener noreferrer" className="text-label-tertiary hover:text-accent text-[13px]">
                      {provenanceLabel(item.source.status)}
                      {item.source.date ? ` · ${item.source.date}` : ""} ↗
                    </a>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[13px] font-medium ${
                    item.state === "yes" ? "bg-positive/10 text-positive-700" : item.state === "no" ? "bg-negative-50 text-negative" : "bg-fill-quaternary text-label-tertiary"
                  }`}
                >
                  {STATE_TEXT[item.state]}
                  {item.detail ? ` · ${item.detail}` : ""}
                </span>
              </div>
            ))}
          </div>
          {x.epcs && (
            <div className="border-caution-200 bg-caution-50 mt-4 rounded-2xl border p-5">
              <p className="text-label-primary text-[15px] font-semibold">{x.epcs.headline}</p>
              <p className="text-label-secondary mt-1 text-[14px] leading-relaxed">{x.epcs.detail}</p>
            </div>
          )}
        </Section>

        {x.integrations.length > 0 && (
          <Section id="integrations" title="Works with">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {x.integrations.map((i) => (
                <li key={i.name} className="border-separator bg-surface rounded-2xl border p-4 shadow-card-1">
                  <p className="text-label-primary flex items-center justify-between gap-3 text-[15px] font-medium">
                    {i.name}
                    {i.type && <span className="text-label-tertiary text-[12px] font-normal">{i.type}</span>}
                  </p>
                  {i.notes && <p className="text-label-secondary mt-1 text-[13px] leading-snug">{i.notes}</p>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {(
          <Section id="alternatives" title={`Alternatives to ${x.name}`}>
            {recommendations.length > 0 && (
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.segment}
                    href={recommendationHref(rec.tool.slug, rec.tool.primary_category)}
                    className="border-separator bg-surface hover:border-accent group rounded-2xl border p-5 shadow-card-1 transition-colors"
                  >
                    <p className="text-accent text-[12px] font-semibold tracking-[0.06em] uppercase">{rec.label}</p>
                    <p className="text-label-primary group-hover:text-accent mt-1 text-[18px] font-medium">{rec.tool.name}</p>
                    <p className="text-label-secondary mt-1.5 text-[14px] leading-snug">{rec.reason}</p>
                  </Link>
                ))}
              </div>
            )}
            {alternatives.length > 0 && <ul className="border-separator divide-y divide-[var(--color-separator)] border-y">
              {alternatives.map((alt) => (
                <li key={alt.slug}>
                  <Link href={alt.href} className="group flex items-center gap-4 py-3.5">
                    <ToolMark name={alt.name} slug={alt.slug} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="text-label-primary group-hover:text-accent block text-[16px] font-medium">{alt.name}</span>
                      {alt.oneLiner && <span className="text-label-secondary line-clamp-1 text-[14px]">{alt.oneLiner}</span>}
                    </span>
                    {alt.price && <span className="text-label-tertiary hidden shrink-0 text-[13px] sm:block">{alt.price}</span>}
                    <span aria-hidden="true" className="text-label-tertiary">›</span>
                  </Link>
                </li>
              ))}
            </ul>}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              <Link href={`/tools/alternatives/${slug}`} className="text-accent hover:text-accent-hover text-[15px] font-medium">
                All {x.name} alternatives →
              </Link>
              {comparisons.map((c) => (
                <Link key={c.slug} href={`/tools/compare/${c.slug}`} className="text-label-secondary hover:text-label-primary text-[15px]">
                  {c.label}
                </Link>
              ))}
              {comparisons.length > 0 && (
                <Link href="/tools/compare" className="text-label-secondary hover:text-label-primary text-[15px]">
                  All comparisons
                </Link>
              )}
            </div>
            {related}
          </Section>
        )}

        {guide.length > 0 && (
          <section id="full-guide" aria-labelledby="full-guide-title" className="scroll-mt-32 py-12 sm:py-16">
            <h2 id="full-guide-title" className="font-display text-label-primary text-[30px] leading-tight sm:text-[36px]">
              {guide.length > 2 ? "The full guide" : `More about ${x.name}`}
            </h2>
            {guide.length > 2 && <p className="text-label-secondary mt-2 text-[16px]">Everything we know about {x.name}, section by section.</p>}
            <div className="mt-7">
              <GuideChapters chapters={guide} groupOrder={["About", "Buying", "Questions"]} subject={x.name} />
            </div>
          </section>
        )}

        <footer className="border-separator mb-16 border-t pt-6">
          <p className="text-label-tertiary max-w-3xl text-[13px] leading-relaxed">
            Details come from the vendor and public sources and can change. Check pricing, BAA terms and compliance directly with the vendor before you buy.
          </p>
        </footer>
      </div>
    </div>
  );
}
