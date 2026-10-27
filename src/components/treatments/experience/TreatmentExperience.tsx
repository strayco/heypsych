/**
 * Treatment experience
 *
 * The opening of a treatment page: the treatment's object, what it is in one
 * line, three things to know at a glance, then the parts people actually
 * come for — what it treats, side effects, their own situation, and when to
 * get help — as things to explore rather than paragraphs to scan.
 *
 * Server-rendered. The three explorers are small client islands. The full
 * reference follows below this, unchanged, so nothing is lost for readers
 * who want every detail or for search engines.
 */

import Link from "next/link";
import type { TreatmentV3 } from "@/lib/schemas/treatment-v3";
import { buildTreatmentExperience, firstSentence } from "@/domains/treatments/experience/model";
import { TreatmentObjectArt } from "./TreatmentObjects";
import { UsesExplorer } from "./UsesExplorer";
import { SideEffectExplorer } from "./SideEffectExplorer";
import { SituationPicker } from "./SituationPicker";
import { FeelJourney } from "./FeelJourney";

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
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

export function TreatmentExperience({ treatment }: { treatment: TreatmentV3 }) {
  const x = buildTreatmentExperience(treatment);
  const reviewed = formatDate(treatment.editorial?.lastReviewed);
  const updated = formatDate(treatment.editorial?.lastUpdated);
  const [lead, ...rest] = (x.lede ?? "").split(/(?<=[.!?])\s+/);

  const nav = [
    x.feel && { id: "feels-like", label: "What it feels like" },
    x.uses.length > 0 && { id: "uses", label: "What it's for" },
    x.sideEffects.length > 0 && { id: "side-effects", label: "Side effects" },
    x.situations.length > 0 && { id: "situation", label: "Your situation" },
    (x.warnings.length > 0 || x.boxedWarning) && { id: "safety", label: "Get help if" },
    { id: "full-guide", label: "Full guide" },
  ].filter((n): n is { id: string; label: string } => Boolean(n));

  return (
    <div itemScope itemType="https://schema.org/MedicalWebPage">
      {/* Opening ------------------------------------------------------------ */}
      <header className="px-4 pt-8 pb-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mx-auto grid max-w-5xl items-end gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <Link
              href="/treatments"
              className="text-label-secondary hover:text-label-primary text-[14px] font-medium"
            >
              <span aria-hidden="true">←</span> Treatments
            </Link>

            <div aria-hidden="true" className="mt-6 h-24 w-32 lg:hidden">
              <TreatmentObjectArt object={x.object} />
            </div>

            {x.kind && <p className="text-label-tertiary mt-6 text-[14px] font-medium">{x.kind}</p>}
            <h1
              itemProp="name headline"
              className="font-display text-label-primary mt-1 text-[40px] leading-[1.04] font-normal tracking-[-0.025em] sm:text-[56px]"
            >
              {x.name}
            </h1>

            {lead && (
              <p itemProp="abstract" className="text-label-primary mt-4 max-w-2xl text-[19px] leading-snug sm:text-[21px]">
                {lead}
              </p>
            )}
            {rest.length > 0 && (
              <>
                {/* Desktop: the whole summary. Phones: folded, so the glance
                    tiles stay in the first screen. */}
                <p className="text-label-secondary mt-3 hidden max-w-2xl text-[16px] leading-relaxed sm:block">
                  {rest.join(" ")}
                </p>
                <details className="group mt-3 sm:hidden">
                  <summary className="text-accent cursor-pointer list-none text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Read more</span>
                    <span className="hidden group-open:inline">Less</span>
                  </summary>
                  <p className="text-label-secondary mt-2 text-[16px] leading-relaxed">{rest.join(" ")}</p>
                </details>
              </>
            )}

            {x.facts.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {x.facts.map((fact) => (
                  <li key={fact} className="bg-fill-quaternary text-label-secondary rounded-full px-3 py-1 text-[13px]">
                    {fact}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-label-tertiary mt-5 text-[13px]">
              Reviewed by the{" "}
              <Link href="/about/medical-review-board" className="text-accent hover:underline">
                HeyPsych Medical Review Board
              </Link>
              {reviewed ? ` · Reviewed ${reviewed}` : updated ? ` · Updated ${updated}` : ""}
            </p>
          </div>

          <div aria-hidden="true" className="hidden h-[200px] lg:block">
            <TreatmentObjectArt object={x.object} />
          </div>
        </div>

        {/* At a glance */}
        {x.glance.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-3">
            {x.glance.map((tile) => (
              <a
                key={tile.id}
                href={tile.href}
                className={`focus-visible:ring-accent group rounded-2xl border p-5 transition-[transform,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-0.5 hover:shadow-card-2 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                  tile.tone === "caution"
                    ? "border-caution-200 bg-caution-50"
                    : "border-separator bg-surface shadow-card-1"
                }`}
              >
                <p className={`text-[12px] font-semibold tracking-[0.06em] uppercase ${tile.tone === "caution" ? "text-caution-600" : "text-label-tertiary"}`}>
                  {tile.label}
                </p>
                <p className="text-label-primary mt-2 text-[16px] leading-snug">{tile.value}</p>
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Section bar --------------------------------------------------------- */}
      {nav.length > 1 && (
      <nav
        aria-label="On this page"
        className="border-separator bg-canvas/90 sticky top-16 z-20 border-y backdrop-blur"
      >
        <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
          {nav.map((item) => (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                className="text-label-secondary hover:bg-fill-quaternary hover:text-label-primary block rounded-full px-3.5 py-1.5 text-[14px] font-medium"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {x.feel && (
          <Section
            id="feels-like"
            title="What it feels like"
            intro={x.feel.intro ?? "What people describe, week by week. Step along to see what's normal at each point."}
          >
            <FeelJourney journey={x.feel} />
          </Section>
        )}

        {x.uses.length > 0 && (
          <Section id="uses" title="What it's for" intro="Choose a condition to see how it's used for it.">
            <UsesExplorer uses={x.uses} treatmentName={x.name.replace(/\s*\(.*\)$/, "")} />
          </Section>
        )}

        {x.sideEffects.length > 0 && (
          <Section
            id="side-effects"
            title="Side effects"
            intro="How many people in 100 notice each one in clinical studies. Many early side effects fade within a few weeks."
          >
            <SideEffectExplorer effects={x.sideEffects} />
          </Section>
        )}

        {x.situations.length > 0 && (
          <Section id="situation" title="Your situation" intro="Choose what applies to you.">
            <SituationPicker situations={x.situations} />
          </Section>
        )}

        {(x.warnings.length > 0 || x.boxedWarning) && (
          <Section id="safety" title="Get help right away if">
            <div className="border-negative/30 bg-negative-50 rounded-2xl border p-6 sm:p-8">
              {x.warnings.length > 0 && (
                <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {x.warnings.map((warning) => (
                    <li key={warning.headline}>
                      {warning.detail ? (
                        <details className="group">
                          <summary className="text-label-primary flex cursor-pointer list-none gap-2.5 rounded-lg py-1 text-[16px] leading-snug [&::-webkit-details-marker]:hidden">
                            <span aria-hidden="true" className="bg-negative mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                            <span className="flex-1">{warning.headline}</span>
                            <span aria-hidden="true" className="text-label-tertiary transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none">+</span>
                          </summary>
                          <p className="text-label-secondary mt-1 pl-4 text-[14px] leading-relaxed">{warning.detail}</p>
                        </details>
                      ) : (
                        <p className="text-label-primary flex gap-2.5 py-1 text-[16px] leading-snug">
                          <span aria-hidden="true" className="bg-negative mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                          {warning.headline}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {x.boxedWarning && (
                <p className={`text-label-secondary text-[15px] leading-relaxed ${x.warnings.length > 0 ? "border-negative/20 mt-6 border-t pt-5" : ""}`}>
                  <strong className="text-label-primary">Boxed warning. </strong>
                  {x.boxedWarningPlain ?? firstSentence(x.boxedWarning, 400)}
                  <span className="text-label-tertiary mt-2 block text-[13px]">
                    Official wording: {firstSentence(x.boxedWarning, 400)}
                  </span>
                </p>
              )}
              <p className="text-label-primary mt-5 text-[15px] font-medium">
                Thoughts of suicide? Call or text{" "}
                <a href="tel:988" className="text-negative underline">988</a>, any time.
              </p>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
