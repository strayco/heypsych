/**
 * Condition experience
 *
 * The opening of a condition page: the conditions object from the Worlds,
 * the condition in one line, three things to know at a glance, then how
 * common it is, what it can look like, what it is like in people's own
 * words, how it is treated, things to try, and when to get help. The full
 * reference follows below, unchanged.
 */

import Link from "next/link";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";
import type { ConditionExperience as Model, Frequency } from "@/domains/conditions/experience/model";
import type { TreatmentForCondition } from "@/domains/treatments/experience/treatments-for-condition";
import { ApproachExplorer, HelpChecklist, QuoteCarousel, SymptomExplorer } from "./ConditionIslands";
import type { ConditionApps } from "@/lib/tools/apps-for-condition";
import { ToolMark } from "@/components/tools/ToolMark";

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

/** "1 in 20 children": one filled dot among the rest, in rows of 10. */
function FrequencyCard({ f }: { f: Frequency }) {
  return (
    <div className="border-separator bg-surface rounded-2xl border p-6 shadow-card-1">
      <p className="font-display text-label-primary text-[40px] leading-none">{f.display}</p>
      <p className="text-label-secondary mt-1 text-[15px]">{f.group}</p>
      {f.dots && (
        <div role="img" aria-label={`${f.display} ${f.group}`} className="mt-5 grid grid-cols-10 gap-[5px]" style={{ maxWidth: 200 }}>
          {Array.from({ length: f.dots.total }, (_, i) => (
            <span key={i} aria-hidden="true" className={`aspect-square rounded-full ${i < f.dots!.filled ? "bg-accent" : "bg-fill-tertiary"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ConditionExperience({
  slug,
  experience: x,
  treatments,
  category,
  apps = null,
}: {
  slug: string;
  experience: Model;
  treatments: TreatmentForCondition[];
  category?: { title: string; href: string };
  /** Apps and online care for this condition (Apps & Tools bridge). */
  apps?: ConditionApps | null;
}) {
  const Books = DISCOVERY_OBJECTS.conditions;

  const nav = [
    x.frequencies.length > 0 || x.prevalenceText ? { id: "how-common", label: "How common" } : null,
    x.symptoms.length > 0 ? { id: "symptoms", label: "What it looks like" } : null,
    x.quotes.length > 0 ? { id: "in-their-words", label: "In their words" } : null,
    x.approaches.length > 0 || treatments.length > 0 ? { id: "treatment", label: "Treatment" } : null,
    apps ? { id: "apps", label: "Apps & online care" } : null,
    x.selfHelp.length > 0 ? { id: "day-to-day", label: "Day to day" } : null,
    x.whenToSeekHelp || x.warningSigns.length > 0 ? { id: "get-help", label: "Get help" } : null,
    { id: "full-guide", label: "Full guide" },
  ].filter((n): n is { id: string; label: string } => Boolean(n));

  return (
    <div>
      {/* Opening ------------------------------------------------------------ */}
      <header className="px-4 pt-8 pb-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mx-auto grid max-w-5xl items-end gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <Link href={category?.href ?? "/conditions"} className="text-label-secondary hover:text-label-primary text-[14px] font-medium">
              <span aria-hidden="true">←</span> {category?.title ?? "Conditions"}
            </Link>
            <div aria-hidden="true" className="mt-6 h-20 w-28 lg:hidden">
              <Books />
            </div>
            {x.shortName && <p className="text-label-tertiary mt-6 text-[14px] font-medium">{x.shortName}</p>}
            <h1 itemProp="name headline" className={`font-display text-label-primary ${x.shortName ? "mt-1" : "mt-6"} text-[40px] leading-[1.04] font-normal tracking-[-0.025em] sm:text-[56px]`}>
              {x.name}
            </h1>
            {x.lede && (
              <p itemProp="abstract" className="text-label-primary mt-4 max-w-2xl text-[19px] leading-snug sm:text-[21px]">
                {x.lede}
              </p>
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
            </p>
          </div>
          <div aria-hidden="true" className="hidden h-[190px] lg:block">
            <Books />
          </div>
        </div>

        {x.glance.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-3">
            {x.glance.map((tile) => (
              <a
                key={tile.id}
                href={tile.href}
                className="border-separator bg-surface focus-visible:ring-accent rounded-2xl border p-5 shadow-card-1 transition-[transform,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-0.5 hover:shadow-card-2 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">{tile.label}</p>
                <p className="text-label-primary mt-2 text-[16px] leading-snug">{tile.value}</p>
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
        {(x.frequencies.length > 0 || x.prevalenceText) && (
          <Section id="how-common" title="How common it is" intro={x.frequencies.length > 0 ? x.prevalenceText ?? undefined : undefined}>
            {x.frequencies.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {x.frequencies.map((f) => (
                  <FrequencyCard key={f.group} f={f} />
                ))}
              </div>
            ) : (
              <p className="text-label-primary max-w-2xl text-[18px] leading-relaxed">{x.prevalenceText}</p>
            )}
            <p className="text-label-tertiary mt-4 text-[13px]">You are not the only one.</p>
          </Section>
        )}

        {x.symptoms.length > 0 && (
          <Section id="symptoms" title="What it can look like" intro="Signs are grouped the way clinicians describe them. Recognising some is a reason to talk to someone, not a diagnosis.">
            <SymptomExplorer groups={x.symptoms} />
          </Section>
        )}

        {x.quotes.length > 0 && (
          <Section id="in-their-words" title="In their words">
            <QuoteCarousel quotes={x.quotes} />
          </Section>
        )}

        {x.impact.length > 0 && (
          <section aria-labelledby="daily-life-title" className="pb-4">
            <h3 id="daily-life-title" className="font-display text-label-primary mb-4 text-[22px]">How it can show up in daily life</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {x.impact.slice(0, 6).map((i) => (
                <div key={i.id} className="bg-fill-quaternary rounded-2xl p-5">
                  <p className="text-label-primary text-[15px] font-semibold">{i.label}</p>
                  <p className="text-label-secondary mt-1.5 text-[14px] leading-relaxed">{i.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(x.approaches.length > 0 || treatments.length > 0) && (
          <Section id="treatment" title="How it's treated" intro="Most people do best with a combination. Choose a kind of treatment to see what it involves.">
            <ApproachExplorer approaches={x.approaches} treatments={treatments} conditionName={x.name.replace(/\s*\(.*\)$/, "")} />
          </Section>
        )}

        {apps && (
          <Section id="apps" title="Apps and online care" intro="Ways to start that you can sign up for yourself, from our reviews. Not a substitute for an assessment.">
            <ul className="grid gap-3 sm:grid-cols-3">
              {apps.apps.map((a) => (
                <li key={a.slug} className="border-separator bg-surface relative rounded-2xl border p-5 shadow-card-1 transition-shadow hover:shadow-card-2">
                  <div className="flex items-center gap-3">
                    <ToolMark name={a.name} slug={a.slug} size="sm" />
                    <Link href={a.href} className="text-label-primary text-[16px] font-semibold after:absolute after:inset-0 after:rounded-2xl">
                      {a.name}
                    </Link>
                  </div>
                  {a.summary && <p className="text-label-secondary mt-3 line-clamp-3 text-[14px] leading-relaxed">{a.summary}</p>}
                  <p className="text-label-tertiary mt-3 text-[12.5px]">{[a.cost, a.evidence].filter(Boolean).join(" · ")}</p>
                </li>
              ))}
            </ul>
            <Link
              href={apps.need.href}
              className="text-accent mt-5 inline-flex text-[15px] font-medium hover:underline"
            >
              See all {apps.total} options for {apps.need.label.toLowerCase()} →
            </Link>
          </Section>
        )}

        {x.selfHelp.length > 0 && (
          <Section id="day-to-day" title="Things that help day to day" intro="Small things to try alongside care. Tick off what you've tried.">
            <HelpChecklist items={x.selfHelp} storageKey={`hp:selfhelp:${slug}`} />
          </Section>
        )}

        {(x.whenToSeekHelp || x.warningSigns.length > 0) && (
          <Section id="get-help" title="When to get help">
            <div className="border-accent/25 bg-accent-tint rounded-2xl border p-6 sm:p-8">
              {x.whenToSeekHelp && <p className="text-label-primary max-w-3xl text-[17px] leading-relaxed">{x.whenToSeekHelp}</p>}
              {x.warningSigns.length > 0 && (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {x.warningSigns.map((sign) => (
                    <li key={sign} className="text-label-primary flex gap-2.5 text-[15px] leading-snug">
                      <span aria-hidden="true" className="bg-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                      {sign}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/find-support" className="bg-accent hover:bg-accent-hover rounded-full px-5 py-2.5 text-[15px] font-medium text-white">
                  Find support
                </Link>
                <a href="tel:988" className="border-separator bg-surface text-label-primary rounded-full border px-5 py-2.5 text-[15px] font-medium">
                  In crisis? Call or text 988
                </a>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
