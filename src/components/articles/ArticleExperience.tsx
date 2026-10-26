/**
 * Article experience
 *
 * The editorial reading page for /learn articles and Knowledge Hub
 * resources: the reading object from the Worlds, a serif title and
 * standfirst, reading time and byline, key takeaways when the record has
 * them, in-article contents beside a ~68ch measure, pull quotes from the
 * record, related pages that exist, and where to go next.
 * Same family as the condition and symptom pages (art bible §13).
 */

import Link from "next/link";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";
import type { ArticleBlock, ArticleLink, ArticleView } from "@/domains/articles/experience/model";
import { ArticleContents } from "./ArticleContents";

export interface ArticleReviewer {
  name: string;
  credentials: string | null;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

const CALLOUT_TONE: Record<"info" | "warning" | "tip", { box: string; label: string }> = {
  info: { box: "border-accent/25 bg-accent-tint", label: "Good to know" },
  warning: { box: "border-caution-border bg-caution-tint", label: "Important" },
  tip: { box: "border-positive/25 bg-positive-tint", label: "Tip" },
};

function Block({ block }: { block: ArticleBlock }) {
  switch (block.kind) {
    case "h2":
      return (
        <h2 id={block.id} className="font-display text-label-primary mt-14 mb-4 scroll-mt-28 text-[28px] leading-tight tracking-[-0.01em] first:mt-0 sm:text-[32px]">
          {block.text}
        </h2>
      );
    case "h3":
      return <h3 className="text-label-primary mt-8 mb-2 text-[19px] leading-snug font-semibold">{block.text}</h3>;
    case "p":
      return <p className="text-label-primary mb-5 text-[18px] leading-[1.7]">{block.text}</p>;
    case "list":
      return (
        <ul className="mb-6 space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="text-label-primary flex gap-3 text-[18px] leading-[1.6]">
              <span aria-hidden="true" className="bg-accent mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <figure className="my-10 border-l-2 border-accent pl-6">
          <blockquote className="font-display text-label-primary text-[24px] leading-snug tracking-[-0.01em] sm:text-[27px]">“{block.text}”</blockquote>
          {block.cite && <figcaption className="text-label-secondary mt-3 text-[14px]">— {block.cite}</figcaption>}
        </figure>
      );
    case "callout": {
      const tone = CALLOUT_TONE[block.tone] ?? CALLOUT_TONE.info;
      return (
        <aside className={`my-8 rounded-2xl border p-5 sm:p-6 ${tone.box}`}>
          <p className="text-label-secondary mb-1.5 text-[12px] font-semibold tracking-[0.06em] uppercase">{tone.label}</p>
          <p className="text-label-primary text-[17px] leading-relaxed">{block.text}</p>
        </aside>
      );
    }
    case "study":
      return (
        <aside className="border-separator bg-surface my-8 rounded-2xl border p-5 shadow-card-1 sm:p-6">
          <p className="text-treatment mb-1.5 text-[12px] font-semibold tracking-[0.06em] uppercase">What the research found</p>
          <p className="text-label-primary text-[17px] leading-relaxed">{block.text}</p>
          {block.cite && (
            <p className="text-label-secondary mt-3 text-[14px]">
              Source:{" "}
              {block.url ? (
                <a href={block.url} target="_blank" rel="noopener noreferrer" className="hover:text-label-primary underline underline-offset-2">
                  {block.cite}
                </a>
              ) : (
                block.cite
              )}
            </p>
          )}
        </aside>
      );
  }
}

function Chips({ title, links }: { title: string; links: ArticleLink[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <h3 className="text-label-tertiary mb-3 text-[12px] font-semibold tracking-[0.06em] uppercase">{title}</h3>
      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="border-separator bg-surface text-label-primary hover:border-accent hover:text-accent inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[15px] transition-colors"
            >
              {l.label} <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ArticleExperience({
  article: x,
  back,
  kicker,
  reviewer,
}: {
  article: ArticleView;
  back: { href: string; label: string };
  kicker: string | null;
  reviewer: ArticleReviewer | null;
}) {
  const Reading = DISCOVERY_OBJECTS.reading;
  const date = formatDate(x.updated ?? x.published);
  const reviewed = formatDate(x.reviewed);
  const hasRelated = x.related.conditions.length + x.related.treatments.length + x.related.resources.length > 0;

  const next: { href: string; title: string; note: string }[] = [
    ...x.related.articles.slice(0, 2).map((a) => ({ href: a.href, title: a.label, note: "Keep reading" })),
    ...x.related.conditions.slice(0, 1).map((c) => ({ href: c.href, title: c.label, note: "The full condition guide" })),
    { href: "/psychiatrists", title: "Find a psychiatrist", note: "When you want to talk it through with someone" },
  ].slice(0, 3);

  return (
    <div className="bg-canvas">
      {/* Opening ---------------------------------------------------------- */}
      <header className="px-4 pt-8 pb-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-end gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <Link href={back.href} className="text-label-secondary hover:text-label-primary text-[14px] font-medium">
              <span aria-hidden="true">←</span> {back.label}
            </Link>
            <div aria-hidden="true" className="mt-6 h-20 w-28 lg:hidden">
              <Reading />
            </div>
            {kicker && <p className="text-accent mt-6 text-[13px] font-semibold tracking-[0.06em] uppercase">{kicker}</p>}
            <h1 className="font-display text-label-primary mt-3 max-w-4xl text-[38px] leading-[1.06] font-normal tracking-[-0.025em] sm:text-[52px]">
              {x.title}
            </h1>
            {x.standfirst && <p className="text-label-primary mt-4 max-w-[62ch] text-[19px] leading-snug sm:text-[21px]">{x.standfirst}</p>}

            <p className="text-label-secondary mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
              <span>{x.minutes} min read</span>
              {date && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {x.updated ? "Updated " : ""}
                    <time dateTime={x.updated ?? x.published ?? undefined}>{date}</time>
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>By {x.author ?? "the HeyPsych editorial team"}</span>
            </p>
            {reviewer && (
              <p className="text-label-secondary mt-1.5 text-[14px]">
                <span className="bg-positive mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle" aria-hidden="true" />
                Medically reviewed by {reviewer.name}
                {reviewer.credentials ? `, ${reviewer.credentials}` : ""}
                {reviewed ? ` · ${reviewed}` : ""}
              </p>
            )}
          </div>
          <div aria-hidden="true" className="hidden h-[190px] lg:block">
            <Reading />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {x.takeaways.length > 0 && (
          <section aria-labelledby="takeaways-title" className="border-separator bg-surface mb-12 max-w-[68ch] rounded-2xl border p-6 shadow-card-1 sm:p-7 lg:ml-[256px]">
            <h2 id="takeaways-title" className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">
              Key takeaways
            </h2>
            <ul className="mt-4 space-y-3">
              {x.takeaways.map((t) => (
                <li key={t} className="text-label-primary flex gap-3 text-[17px] leading-snug">
                  <span aria-hidden="true" className="text-accent font-semibold">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="lg:grid lg:grid-cols-[220px_minmax(0,68ch)] lg:gap-9">
          <div className="hp-article-contents lg:sticky lg:top-24 lg:self-start">
            <ArticleContents items={x.contents} />
          </div>

          <article className="min-w-0 pb-6">
            {x.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}

            {x.references.length > 0 && (
              <details className="border-separator group mt-12 border-t pt-6">
                <summary className="text-label-primary cursor-pointer list-none text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                  Sources <span className="text-label-tertiary">· {x.references.length}</span>
                  <span aria-hidden="true" className="text-label-tertiary ml-2 inline-block transition-transform group-open:rotate-90">›</span>
                </summary>
                <ol className="mt-4 space-y-2">
                  {x.references.map((r, i) => (
                    <li key={i} className="text-label-secondary text-[15px] leading-snug">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-label-primary hover:text-accent underline underline-offset-2">
                          {r.title}
                        </a>
                      ) : (
                        <span className="text-label-primary">{r.title}</span>
                      )}
                      {r.source && <> · {r.source}</>}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </article>
        </div>

        {/* Related and next --------------------------------------------- */}
        <div className="lg:ml-[256px] lg:max-w-[68ch]">
          {(hasRelated || x.topics.length > 0) && (
            <section aria-label="Related" className="border-separator space-y-6 border-t py-10">
              <Chips title="Conditions in this article" links={x.related.conditions} />
              <Chips title="Treatments" links={x.related.treatments} />
              <Chips title="Tools and support" links={x.related.resources} />
              {x.topics.length > 0 && (
                <p className="text-label-tertiary text-[14px]">Topics: {x.topics.join(" · ")}</p>
              )}
            </section>
          )}

          <section aria-labelledby="next-title" className="border-separator border-t py-10">
            <h2 id="next-title" className="font-display text-label-primary text-[28px] leading-tight tracking-[-0.01em]">
              Where to go next
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {next.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="border-separator bg-surface group rounded-2xl border p-5 shadow-card-1 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-card-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">{n.note}</p>
                  <p className="text-label-primary group-hover:text-accent mt-2 text-[16px] leading-snug font-medium">
                    {n.title} <span aria-hidden="true">→</span>
                  </p>
                </Link>
              ))}
            </div>
            <p className="text-label-secondary mt-6 text-[15px]">
              In crisis or thinking about suicide?{" "}
              <a href="tel:988" className="text-label-primary font-medium underline underline-offset-2">
                Call or text 988
              </a>{" "}
              (US), any time.
            </p>
          </section>

          <footer className="border-separator mb-16 border-t pt-6">
            <p className="text-label-tertiary text-[13px] leading-relaxed">
              Educational information, not medical advice. Talk with a qualified clinician before starting, stopping or changing any treatment.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
