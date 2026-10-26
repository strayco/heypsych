/**
 * Patient tool experience
 *
 * The whole app/tool page in the entity-page system (art bible §13): the
 * phone from the Worlds, what it is in one line, the facts that decide most
 * choices (cost, insurance, platforms, privacy), and then the questions
 * people actually have — is it for me, what is it for, what does it cost,
 * is it safe and private, what else is there — before the full guide.
 *
 * Commercial behaviour is unchanged: the outbound links (affiliate kill
 * switch and sponsored disclosure included) arrive ready-made as `outbound`.
 */

import Link from "next/link";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";
import { GuideChapters, type GuideChapter } from "@/components/guide/GuideChapters";
import type { ToolAvailability, ToolExperience as Model } from "@/domains/patient-tools/experience/model";
import { FitCheck } from "./FitCheck";
import { SaveButton } from "@/components/patient-tools/shelves/SaveButton";
import { SavedTray } from "@/components/patient-tools/shelves/SavedTray";

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

function EvidenceMeter({ step, label }: { step: number; label: string }) {
  return (
    <div>
      <div className="flex gap-1.5" role="img" aria-label={`Evidence: ${label}`}>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} aria-hidden="true" className={`h-2 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-fill-tertiary"}`} />
        ))}
      </div>
      <p className="text-label-primary mt-2 text-[15px] font-medium">{label}</p>
    </div>
  );
}

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Vendor-checked availability, stated plainly with where we checked it. */
function AvailabilityNote({ a, name, hasAlternatives }: { a: ToolAvailability; name: string; hasAlternatives: boolean }) {
  const gone = a.state === "discontinued";
  return (
    <div
      role="note"
      className={`mt-5 max-w-2xl rounded-2xl px-4 py-3.5 ${gone ? "bg-fill-tertiary" : "bg-fill-quaternary"}`}
    >
      <p className="text-label-primary text-[15px] font-medium">
        {gone ? `${name} is no longer available.` : "Available with limits."}
      </p>
      {a.note && <p className="text-label-secondary mt-1 text-[14px] leading-relaxed">{a.note}</p>}
      <p className="text-label-tertiary mt-2 text-[12px]">
        Checked {a.checked}
        {a.sources.length > 0 && " · "}
        {a.sources.slice(0, 3).map((src, i) => (
          <span key={src}>
            {i > 0 && ", "}
            <a href={src} rel="noopener nofollow" target="_blank" className="hover:text-label-secondary underline underline-offset-2">
              {sourceHost(src)}
            </a>
          </span>
        ))}
        {gone && hasAlternatives && (
          <>
            {" · "}
            <a href="#compare" className="text-accent hover:underline">
              See alternatives
            </a>
          </>
        )}
      </p>
    </div>
  );
}

export interface ToolExperienceProps {
  tool: Model;
  reviewed: { label: string; url: string; date: string | null };
  /** Null when there is nothing to visit (a discontinued app). */
  outbound: React.ReactNode | null;
  related: { slug: string; name: string; oneLiner: string | null }[];
  compare: { slug: string; name: string; href: string }[];
  guide: GuideChapter[];
}

export function ToolExperience({ tool: x, reviewed, outbound, related, compare, guide }: ToolExperienceProps) {
  const Phone = DISCOVERY_OBJECTS.tools;

  const nav = [
    x.fit.good.length + x.fit.poor.length > 0 ? { id: "fit", label: "Is it for you" } : null,
    x.uses.length > 0 || x.conditions.length > 0 ? { id: "uses", label: "What it's for" } : null,
    { id: "cost", label: "Cost" },
    { id: "privacy", label: "Privacy & safety" },
    related.length > 0 || compare.length > 0 ? { id: "compare", label: "Alternatives" } : null,
    guide.length > 0 ? { id: "full-guide", label: "Full guide" } : null,
  ].filter((n): n is { id: string; label: string } => Boolean(n));

  return (
    <div itemScope itemType="https://schema.org/MedicalWebPage">
      {/* Opening ------------------------------------------------------------ */}
      <header className="px-4 pt-8 pb-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mx-auto grid max-w-5xl items-end gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <Link href="/tools" className="text-label-secondary hover:text-label-primary text-[14px] font-medium">
              <span aria-hidden="true">←</span> Apps & tools
            </Link>
            <div aria-hidden="true" className="mt-6 h-20 w-28 lg:hidden">
              <Phone />
            </div>
            {x.kind && <p className="text-label-tertiary mt-6 text-[14px] font-medium">{x.kind}</p>}
            <h1 itemProp="name headline" className="font-display text-label-primary mt-1 text-[40px] leading-[1.04] font-normal tracking-[-0.025em] sm:text-[56px]">
              {x.name}
            </h1>
            <p itemProp="abstract" data-speakable className="direct-answer text-label-primary mt-4 max-w-2xl text-[19px] leading-snug sm:text-[21px]">
              {x.lede}
            </p>
            {x.availability && <AvailabilityNote a={x.availability} name={x.name} hasAlternatives={related.length + compare.length > 0} />}
            {x.summary && x.summary !== x.lede && (
              <p className="text-label-secondary mt-3 max-w-2xl text-[16px] leading-relaxed">{x.summary}</p>
            )}

            {x.facts.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {x.facts.map((fact) => (
                  <li
                    key={fact.label}
                    className={`rounded-full px-3 py-1 text-[13px] ${fact.tone === "positive" ? "bg-positive/10 text-positive-600" : "bg-fill-quaternary text-label-secondary"}`}
                  >
                    {fact.label}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-label-tertiary mt-5 text-[13px]">
              <a href={reviewed.url} className="text-accent hover:underline">
                {reviewed.label}
              </a>
              {reviewed.date ? ` · ${reviewed.date}` : ""}
            </p>

            <div className="mt-6 flex max-w-xl flex-col gap-3">
              {outbound}
              <div>
                <SaveButton slug={x.slug} name={x.name} variant="pill" />
                <span className="text-label-tertiary ml-3 text-[13px]">Save it to compare later. Stays on this device.</span>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="hidden h-[200px] self-start lg:mt-16 lg:block">
            <Phone />
          </div>
        </div>

        {x.glance.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {x.glance.map((tile) => (
              <a
                key={tile.id}
                href={tile.href}
                className={`focus-visible:ring-accent rounded-2xl border p-5 transition-[transform,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-0.5 hover:shadow-card-2 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                  tile.tone === "caution" ? "border-caution-200 bg-caution-50" : "border-separator bg-surface shadow-card-1"
                }`}
              >
                <p className={`text-[12px] font-semibold tracking-[0.06em] uppercase ${tile.tone === "caution" ? "text-caution-600" : "text-label-tertiary"}`}>
                  {tile.label}
                </p>
                <p className="text-label-primary mt-2 text-[16px] leading-snug font-medium">{tile.value}</p>
                {tile.sub && <p className="text-label-tertiary mt-1.5 line-clamp-2 text-[13.5px] leading-snug">{tile.sub}</p>}
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
        {x.fit.good.length + x.fit.poor.length > 0 && (
          <Section id="fit" title="Is it right for you?" intro="Both sides, from our review. Tap what describes you.">
            <FitCheck
              good={x.fit.good}
              poor={x.fit.poor}
              toolName={x.name}
              alternativesHref={related.length > 0 || compare.length > 0 ? "#compare" : null}
            />
          </Section>
        )}

        {(x.uses.length > 0 || x.conditions.length > 0) && (
          <Section id="uses" title="What it's for">
            {x.uses.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {x.uses.map((use) => (
                  <li key={use} className="bg-fill-quaternary text-label-primary rounded-full px-4 py-2 text-[15px]">
                    {use}
                  </li>
                ))}
              </ul>
            )}
            {x.conditions.length > 0 && (
              <div className={x.uses.length > 0 ? "mt-6" : ""}>
                <p className="text-label-tertiary mb-2.5 text-[12px] font-semibold tracking-[0.06em] uppercase">Conditions it can help with</p>
                <ul className="flex flex-wrap gap-2">
                  {x.conditions.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/conditions/${c.slug}`}
                        className="border-separator bg-surface text-label-primary hover:border-accent hover:text-accent inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[15px] transition-colors"
                      >
                        {c.name} <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}

        <Section id="cost" title="What it costs">
          <div className="border-separator bg-surface grid gap-6 rounded-3xl border p-6 shadow-card-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:p-8">
            <div>
              <p className="text-label-tertiary text-[13px]">{x.cost.model}</p>
              <p className="font-display text-label-primary mt-1 text-[36px] leading-tight sm:text-[44px]">{x.cost.headline}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {x.cost.freeTier && <span className="bg-positive/10 text-positive-600 rounded-full px-3 py-1 text-[13px]">Free tier</span>}
                {x.cost.insurance && <span className="bg-positive/10 text-positive-600 rounded-full px-3 py-1 text-[13px]">Insurance may cover it</span>}
              </div>
              {x.cost.year && (
                <div className="bg-fill-quaternary mt-5 rounded-2xl px-4 py-3.5">
                  <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">Over a year</p>
                  <p className="text-label-primary mt-1 text-[20px] font-medium">{x.cost.year.headline}</p>
                  <p className="text-label-secondary mt-0.5 text-[14px]">{x.cost.year.working}</p>
                  {x.cost.year.note && <p className="text-label-secondary mt-2 text-[14px] leading-snug">{x.cost.year.note}</p>}
                  <p className="text-label-tertiary mt-2 text-[12px]">Worked out from the listed price. Check the vendor for today&rsquo;s price.</p>
                </div>
              )}
              <p className="text-label-primary mt-5 text-[15px]">
                <span className="text-label-tertiary">How you start: </span>
                {x.start}
              </p>
            </div>
            <div className="sm:border-separator sm:border-l sm:pl-6">
              <p className="text-label-secondary text-[16px] leading-relaxed">
                {x.cost.notes ?? "Prices change. Check the current price on the official site before you sign up."}
              </p>
            </div>
          </div>
        </Section>

        <Section id="privacy" title="Privacy, evidence & safety">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="border-separator bg-surface rounded-2xl border p-6 shadow-card-1">
              <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">Privacy</p>
              <div className="mt-3 flex items-center gap-4">
                <span
                  className={`font-display flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[26px] ${
                    x.privacy.grade ? "bg-accent text-white" : "bg-fill-tertiary text-label-tertiary text-[13px]"
                  }`}
                >
                  {x.privacy.grade ?? "N/R"}
                </span>
                <p className="text-label-secondary text-[14px]">{x.privacy.grade ? "Our privacy grade" : "Not yet rated"}</p>
              </div>
              <dl className="mt-4 space-y-2">
                {x.privacy.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-[14px]">
                    <dt className="text-label-secondary">{row.label}</dt>
                    <dd className={`font-medium ${row.good === true ? "text-positive-600" : row.good === false ? "text-negative" : "text-label-tertiary"}`}>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-separator bg-surface rounded-2xl border p-6 shadow-card-1">
              <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">Research</p>
              <div className="mt-4">
                <EvidenceMeter step={x.evidence.step} label={x.evidence.label} />
              </div>
              {x.tradeoffs.length > 0 && (
                <>
                  <p className="text-label-tertiary mt-5 text-[12px] font-semibold tracking-[0.06em] uppercase">Trade-offs</p>
                  <ul className="mt-2 space-y-1.5">
                    {x.tradeoffs.map((t) => (
                      <li key={t} className="text-label-secondary text-[14px] leading-snug">
                        {t}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="border-separator bg-surface rounded-2xl border p-6 shadow-card-1">
              <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">What we couldn&apos;t verify</p>
              {x.uncertainties.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {x.uncertainties.map((u) => (
                    <li key={u} className="text-label-secondary text-[14px] leading-snug">
                      {u}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-label-secondary mt-3 text-[14px]">Nothing outstanding in our review.</p>
              )}
              {x.privacy.notes && <p className="text-label-tertiary border-separator mt-4 border-t pt-3 text-[13px] leading-relaxed">{x.privacy.notes}</p>}
            </div>
          </div>

          <p className="text-label-primary bg-negative-50 border-negative/20 mt-4 rounded-2xl border px-5 py-4 text-[15px]">
            {x.crisisCaveat ? `${x.name} is not for a crisis. ` : "Apps are not for emergencies. "}
            If you are thinking about suicide or in danger, call or text{" "}
            <a href="tel:988" className="text-negative font-medium underline">
              988
            </a>{" "}
            any time.
          </p>
        </Section>

        {(related.length > 0 || compare.length > 0) && (
          <Section id="compare" title="Alternatives & comparisons">
            {related.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/tools/${r.slug}`} className="border-separator bg-surface hover:border-accent group block h-full rounded-2xl border p-5 shadow-card-1 transition-colors">
                      <p className="text-label-primary group-hover:text-accent text-[17px] font-medium">
                        {r.name} <span aria-hidden="true">→</span>
                      </p>
                      {r.oneLiner && <p className="text-label-secondary mt-1 line-clamp-2 text-[14px]">{r.oneLiner}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {compare.length > 0 && (
              <div className={related.length > 0 ? "mt-6" : ""}>
                <p className="text-label-tertiary mb-2.5 text-[12px] font-semibold tracking-[0.06em] uppercase">Side by side</p>
                <ul className="flex flex-wrap gap-2">
                  {compare.map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} className="border-separator bg-surface text-label-primary hover:border-accent hover:text-accent inline-flex rounded-full border px-4 py-2 text-[15px] transition-colors">
                        {x.name} vs {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}

        {guide.length > 0 && (
          <section id="full-guide" aria-labelledby="full-guide-title" className="scroll-mt-32 py-12 sm:py-16">
            <h2 id="full-guide-title" className="font-display text-label-primary text-[30px] leading-tight sm:text-[36px]">
              {guide.length > 2 ? "The full guide" : `More about ${x.name}`}
            </h2>
            {guide.length > 2 && <p className="text-label-secondary mt-2 mb-6 text-[16px]">Everything we know about {x.name}, chapter by chapter.</p>}
            <div className={guide.length > 2 ? "" : "mt-6"}>
              <GuideChapters chapters={guide} groupOrder={["About it", "Questions", "Go further"]} subject={x.name} />
            </div>
          </section>
        )}
      </div>
      <SavedTray />
    </div>
  );
}
