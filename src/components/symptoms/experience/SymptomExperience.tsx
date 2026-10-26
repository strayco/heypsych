/**
 * Symptom experience
 *
 * The whole symptom page: the notebook object from the Worlds, the
 * experience in one line and in people's own search words, a way to note it
 * privately, what it can look like, where it can come from (mental health and
 * otherwise), what it often comes with, a screener, and when to get help.
 * Same pattern as treatment and condition pages (art bible §13).
 */

import Link from "next/link";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";
import type { SymptomExperience as Model } from "@/domains/symptoms/experience/model";
import { ExampleStepper, NoticedButton, SourceExplorer } from "./SymptomIslands";

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

export function SymptomExperience({ symptom: x }: { symptom: Model }) {
  const Notebook = DISCOVERY_OBJECTS.notebook;

  const nav = [
    x.examples.length > 0 ? { id: "looks-like", label: "What it looks like" } : null,
    x.conditions.length > 0 || x.otherCauses.length > 0 ? { id: "causes", label: "Where it comes from" } : null,
    x.related.length > 0 ? { id: "comes-with", label: "Often comes with" } : null,
    x.assessments.length > 0 ? { id: "check-in", label: "Check in" } : null,
    { id: "get-help", label: "Get help" },
  ].filter((n): n is { id: string; label: string } => Boolean(n));

  return (
    <div itemScope itemType="https://schema.org/MedicalWebPage">
      {/* Opening ------------------------------------------------------------ */}
      <header className="px-4 pt-8 pb-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mx-auto grid max-w-5xl items-end gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <Link
              href={x.category ? `/symptoms?category=${x.category.id}` : "/symptoms"}
              className="text-label-secondary hover:text-label-primary text-[14px] font-medium"
            >
              <span aria-hidden="true">←</span> {x.category?.name ?? "Symptoms"}
            </Link>
            <div aria-hidden="true" className="mt-6 h-20 w-28 lg:hidden">
              <Notebook />
            </div>
            <h1 itemProp="name headline" className="font-display text-label-primary mt-6 text-[40px] leading-[1.04] font-normal tracking-[-0.025em] sm:text-[56px]">
              {x.name}
            </h1>
            <p itemProp="abstract" className="text-label-primary mt-4 max-w-2xl text-[19px] leading-snug sm:text-[21px]">
              {x.lede}
            </p>

            {x.phrases.length > 0 && (
              <ul aria-label="How people describe it" className="mt-5 flex flex-wrap gap-2">
                {x.phrases.map((phrase) => (
                  <li key={phrase} className="bg-fill-quaternary text-label-secondary rounded-2xl rounded-bl-md px-3.5 py-1.5 text-[14px] italic">
                    “{phrase}”
                  </li>
                ))}
              </ul>
            )}
            {x.aliases.length > 0 && (
              <p className="text-label-tertiary mt-4 text-[14px]">Also called {x.aliases.join(", ")}.</p>
            )}

            <NoticedButton slug={x.slug} name={x.name} />
          </div>
          <div aria-hidden="true" className="hidden h-[190px] lg:block">
            <Notebook />
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
        {x.examples.length > 0 && (
          <Section id="looks-like" title="What it can look like" intro="Everyday moments people describe.">
            <ExampleStepper examples={x.examples} />
          </Section>
        )}

        {(x.conditions.length > 0 || x.otherCauses.length > 0) && (
          <Section id="causes" title="Where it can come from" intro="Many things can cause this. Only a clinician can tell which applies to you.">
            <SourceExplorer conditions={x.conditions} otherCauses={x.otherCauses} symptomName={x.name} />
          </Section>
        )}

        {x.related.length > 0 && (
          <Section id="comes-with" title="Often comes with">
            <ul className="flex flex-wrap gap-2">
              {x.related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/symptoms/${r.slug}`}
                    className="border-separator bg-surface text-label-primary hover:border-accent hover:text-accent inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[15px] transition-colors"
                  >
                    {r.name} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {x.assessments.length > 0 && (
          <Section id="check-in" title="Check in with yourself" intro="A short, validated questionnaire can help you put words to it before an appointment.">
            <div className="grid gap-3 sm:grid-cols-2">
              {x.assessments.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="border-separator bg-surface hover:border-accent group rounded-2xl border p-5 shadow-card-1 transition-colors"
                >
                  <p className="text-label-primary group-hover:text-accent text-[17px] font-medium">
                    {a.label} <span aria-hidden="true">→</span>
                  </p>
                  {a.relevance && <p className="text-label-secondary mt-1 text-[14px]">{a.relevance}</p>}
                </Link>
              ))}
            </div>
          </Section>
        )}

        <Section id="get-help" title="When to get help">
          <div className="border-accent/25 bg-accent-tint rounded-2xl border p-6 sm:p-8">
            {x.whenToSeekHelp.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {x.whenToSeekHelp.map((item) => (
                  <li key={item} className="text-label-primary flex gap-2.5 text-[16px] leading-snug">
                    <span aria-hidden="true" className="bg-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/psychiatrists" className="bg-accent hover:bg-accent-hover rounded-full px-5 py-2.5 text-[15px] font-medium text-white">
                Find a psychiatrist
              </Link>
              <a href="tel:988" className="border-separator bg-surface text-label-primary rounded-full border px-5 py-2.5 text-[15px] font-medium">
                In crisis? Call or text 988
              </a>
              <Link href="/symptoms" className="text-label-secondary hover:text-label-primary self-center px-2 text-[15px]">
                Explore other symptoms
              </Link>
            </div>
          </div>
        </Section>

        <footer className="border-separator mb-16 border-t pt-6">
          <p className="text-label-tertiary max-w-3xl text-[13px] leading-relaxed">
            General information about a common experience, not a diagnosis or medical advice. What you are going through may have many explanations; a qualified professional can help you understand yours.
            {x.lastReviewed && <> Reviewed {x.lastReviewed}.</>}
          </p>
        </footer>
      </div>
    </div>
  );
}
