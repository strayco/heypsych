/**
 * /tools/for-patients/compare/<a>-vs-<b>: two apps side by side, from their
 * records only (src/domains/patient-tools/compare/model.ts). No winner and no
 * score. The popular pairs are prebuilt and indexed; other valid pairs render
 * on demand and are not indexed.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isListable } from "@/domains/patient-tools/finder/model";
import { siteConfig } from "@/lib/config/site";
import { ToolService } from "@/lib/tools/tool-service";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { KEY_COMPARISONS, REGULATORY_WARNINGS } from "@/lib/seo/patient-programmatic-seo-engine";
import { compareRows } from "@/domains/patient-tools/compare/model";
import { resolveOutbound } from "@/lib/commercial/outbound";
import { ToolMark } from "@/components/tools/ToolMark";
import { GetItLinks } from "@/components/commercial/GetItLinks";
import { ComparisonTracker } from "./ComparisonTracker";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const active = new Set((await ToolService.getAll()).filter(isListable).map((t) => t.slug));
  return KEY_COMPARISONS.filter((c) => active.has(c.a) && active.has(c.b)).map(({ a, b }) => ({ slug: `${a}-vs-${b}` }));
}

const isKey = (a: string, b: string) => KEY_COMPARISONS.some((c) => c.a === a && c.b === b);

async function load(slug: string): Promise<{ a: DigitalToolV3; b: DigitalToolV3 } | null> {
  const i = slug.indexOf("-vs-");
  if (i <= 0) return null;
  const sa = slug.slice(0, i);
  const sb = slug.slice(i + 4);
  if (!sa || !sb || sa === sb) return null;
  const [a, b] = await Promise.all([ToolService.getBySlug(sa), ToolService.getBySlug(sb)]);
  if (!a || !b || !isListable(a) || !isListable(b)) return null;
  return { a, b };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pair = await load(slug);
  if (!pair) return { title: "Comparison not found", robots: { index: false, follow: true } };
  const { a, b } = pair;
  const title = `${a.name} vs ${b.name}: how they compare`;
  const description = `${a.name} and ${b.name} side by side: cost, how you pay, privacy, research and who each suits. No winner, just the differences.`;
  const url = `${siteConfig.url}/tools/for-patients/compare/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isKey(a.slug, b.slug) ? undefined : { index: false, follow: true },
    openGraph: { images: ["/images/og/heypsych.png"], title, description, url, type: "article" },
  };
}

function outboundOf(t: DigitalToolV3) {
  return resolveOutbound({
    slug: t.slug,
    affiliateUrl: t.app_metadata?.affiliate_url,
    websiteUrl: t.app_metadata?.website,
    commercial: t.app_metadata?.commercial,
  });
}

function firstSentence(s: string | undefined | null): string | null {
  if (!s) return null;
  const m = s.trim().match(/^.+?[.!?](?=\s|$)/);
  return (m ? m[0] : s).trim();
}

export default async function PatientVsPage({ params }: PageProps) {
  const { slug } = await params;
  const pair = await load(slug);
  if (!pair) notFound();
  const { a, b } = pair;
  const rows = compareRows(a, b);
  const different = rows.filter((r) => !r.same);
  const shared = rows.filter((r) => r.same);
  const warnings = [a, b]
    .map((t) => ({ tool: t, warning: REGULATORY_WARNINGS[t.slug] }))
    .filter((w) => w.warning);
  const activeTools = (await ToolService.getAll()).filter(isListable);
  const names = new Map(activeTools.map((t) => [t.slug, t.name]));
  const others = KEY_COMPARISONS.filter(
    (c) =>
      (c.a === a.slug || c.b === a.slug || c.a === b.slug || c.b === b.slug) &&
      `${c.a}-vs-${c.b}` !== slug &&
      names.has(c.a) &&
      names.has(c.b)
  );
  const url = `${siteConfig.url}/tools/for-patients/compare/${slug}`;
  const reviewed = [a.governance?.last_reviewed, b.governance?.last_reviewed].filter(Boolean).sort()[0];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Apps and online care", item: `${siteConfig.url}/tools` },
        { "@type": "ListItem", position: 3, name: `${a.name} vs ${b.name}`, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${a.name} vs ${b.name}`,
      url,
      ...(reviewed ? { dateModified: reviewed } : {}),
      about: [a, b].map((t) => ({
        "@type": "SoftwareApplication",
        name: t.name,
        url: `${siteConfig.url}/tools/${t.slug}`,
        applicationCategory: "HealthApplication",
      })),
    },
  ];

  return (
    <>
      <ComparisonTracker toolASlug={a.slug} toolBSlug={b.slug} />
      {structuredData.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <div className="bg-canvas min-h-screen">
        <header className="border-separator border-b px-4 pt-8 pb-10 sm:px-6 sm:pt-12 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <Link href="/tools#compare" className="text-label-secondary hover:text-label-primary text-[14px] font-medium">
              <span aria-hidden="true">←</span> Apps and online care
            </Link>
            <div className="mt-6 flex items-center gap-3" aria-hidden="true">
              <ToolMark name={a.name} slug={a.slug} size="lg" />
              <span className="text-label-quaternary text-[15px]">vs</span>
              <ToolMark name={b.name} slug={b.slug} size="lg" />
            </div>
            <h1 className="font-display text-label-primary mt-5 text-[38px] leading-[1.05] tracking-[-0.025em] sm:text-[52px]">
              {a.name} vs {b.name}
            </h1>
            <p className="text-label-secondary mt-3 max-w-2xl text-[17px] leading-relaxed sm:text-[19px]">
              {different.length > 0
                ? `They differ on ${different.length} of ${rows.length} things we check. No winner here: the better one is the one that fits what you need and how you'd pay.`
                : "On the things we check, the two records read the same. Try both profiles for the details."}
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          {warnings.length > 0 && (
            <div className="mb-10 space-y-3">
              {warnings.map(({ tool, warning }) => (
                <aside key={tool.slug} className="border-caution-200 bg-caution-50 rounded-2xl border p-5">
                  <p className="text-label-primary text-[15px] font-semibold">
                    {tool.name}: {warning!.summary}
                  </p>
                  <ul className="text-label-secondary mt-2 list-disc space-y-1 pl-5 text-[14px]">
                    {warning!.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  <p className="text-label-tertiary mt-2 text-[12.5px]">
                    Sources:{" "}
                    {warning!.sources.map((src, i) => (
                      <span key={src.url}>
                        {i > 0 && " · "}
                        <a href={src.url} target="_blank" rel="noopener" className="underline underline-offset-2">
                          {src.label}
                        </a>
                      </span>
                    ))}
                    . Checked {warning!.checked}.
                  </p>
                </aside>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {[a, b].map((t) => (
              <section key={t.slug} aria-labelledby={`card-${t.slug}`} className="border-separator bg-surface flex flex-col rounded-2xl border p-6 shadow-card-1">
                <div className="flex items-center gap-3">
                  <ToolMark name={t.name} slug={t.slug} />
                  <h2 id={`card-${t.slug}`} className="text-label-primary text-[20px] font-semibold">
                    {t.name}
                  </h2>
                </div>
                <p className="text-label-secondary mt-3 text-[15px] leading-relaxed">
                  {firstSentence(t.patient_summary) ?? t.one_liner}
                </p>
                <div className="mt-auto pt-5">
                  <GetItLinks slug={t.slug} name={t.name} primary={outboundOf(t)} source="patient-compare" />
                  <Link href={`/tools/${t.slug}`} className="text-label-secondary hover:text-label-primary mt-3 inline-block text-[14px]">
                    Our full review of {t.name} →
                  </Link>
                </div>
              </section>
            ))}
          </div>

          <section aria-labelledby="diff-title" className="mt-14">
            <h2 id="diff-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
              Where they differ
            </h2>
            <dl className="border-separator mt-6 divide-y divide-[var(--color-separator)] border-y">
              {(different.length ? different : rows).map((r) => (
                <div key={r.id} className="grid gap-2 py-4 sm:grid-cols-[180px_1fr_1fr] sm:gap-6">
                  <dt className="text-label-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase sm:pt-0.5">{r.label}</dt>
                  <dd className="text-label-primary text-[15px] leading-snug">
                    <span className="text-label-tertiary text-[12px] sm:hidden">{a.name}: </span>
                    {r.a}
                  </dd>
                  <dd className="text-label-primary text-[15px] leading-snug">
                    <span className="text-label-tertiary text-[12px] sm:hidden">{b.name}: </span>
                    {r.b}
                  </dd>
                </div>
              ))}
            </dl>
            {shared.length > 0 && different.length > 0 && (
              <p className="text-label-tertiary mt-4 text-[14px]">
                The same for both: {shared.map((r) => `${r.label.toLowerCase()} (${r.a.toLowerCase()})`).join(", ")}.
              </p>
            )}
          </section>

          {others.length > 0 && (
            <nav aria-label="Other comparisons" className="mt-14">
              <h2 className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">Other comparisons</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {others.map((c) => (
                  <li key={`${c.a}-${c.b}`}>
                    <Link
                      href={`/tools/for-patients/compare/${c.a}-vs-${c.b}`}
                      className="border-separator text-label-secondary hover:text-label-primary hover:bg-fill-quaternary rounded-full border px-3 py-1.5 text-[14px]"
                    >
                      {names.get(c.a) ?? c.a} vs {names.get(c.b) ?? c.b}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <p className="text-label-tertiary mt-14 text-[13px] leading-relaxed">
            In crisis or thinking about suicide? In the US, call or text{" "}
            <a href="tel:988" className="underline underline-offset-2">
              988
            </a>
            . This page is information from our reviews, not medical advice.
          </p>
        </div>
      </div>
    </>
  );
}
