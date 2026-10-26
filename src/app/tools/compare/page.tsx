// /tools/compare — compare any two or three clinician products (?tools=a,b),
// plus the curated head-to-heads. Not indexed with a selection; the bare page is.

import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { getAllPublishableCurated } from "@/lib/tools/curated-comparisons";
import { resolveOutbound } from "@/lib/commercial/outbound";
import { buildClinicianToolExperience } from "@/domains/tools/clinician-experience/model";
import { CLINICIAN_JOBS, formatReviewDate, jobSlugFor, sameJobComparisons, toHubProduct } from "@/domains/tools/clinician-hub/model";
import { CompareBuilder, type BuilderProduct } from "@/components/tools/clinician/compare/CompareBuilder";
import { PageIntro } from "@/components/brand/PageIntro";

const canonicalUrl = `${siteConfig.url}/tools/compare`;
const title = "Compare practice software side by side";
const description =
  "Line up any two or three EHRs, AI note tools, billing services, networks or telehealth apps: price, trial, who each suits, features and compliance.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl },
  openGraph: { images: ["/images/og/heypsych.png"], title, description, url: canonicalUrl, type: "website" },
};

export const revalidate = 86400;

const STATE = { yes: "Yes", no: "No", unknown: "Not stated", na: "Not applicable" } as const;

export default async function ComparePage() {
  const [tools, curated] = await Promise.all([ClinicianToolService.loadClinicianTools(), getAllPublishableCurated()]);
  const order = new Map(CLINICIAN_JOBS.map((j, i) => [j.slug, i]));
  const kind = new Map(CLINICIAN_JOBS.map((j) => [j.slug, j.kind]));
  const groupOrder: string[] = [];

  const products: BuilderProduct[] = tools
    .filter((t) => kind.has(jobSlugFor(t)))
    .map((t) => {
      const x = buildClinicianToolExperience(t);
      const hp = toHubProduct(t);
      // Security is covered by the compliance rows.
      const caps = x.capabilities.filter((g) => g.id !== "security");
      for (const g of caps) if (!groupOrder.includes(g.label)) groupOrder.push(g.label);
      return {
        slug: t.slug,
        name: t.name,
        job: jobSlugFor(t),
        jobKind: kind.get(jobSlugFor(t))!,
        href: hp.href,
        price: x.pricing.display ?? (x.pricing.quoteRequired ? "By quote" : "Not stated"),
        trial: x.pricing.trialDays > 0 ? `${x.pricing.trialDays}-day trial` : x.pricing.freeTier ? "Free plan" : "None stated",
        suits: hp.fit.map((f) => f.label),
        groups: Object.fromEntries(caps.map((g) => [g.label, g.items])),
        compliance: Object.fromEntries(
          x.compliance.map((c) => [c.label, `${STATE[c.state]}${c.detail ? ` (${c.detail})` : ""}`])
        ),
        epcs: x.epcs ? x.epcs.headline : null,
        reviewed: formatReviewDate(t.governance?.last_reviewed ?? null),
        visit: resolveOutbound({ slug: t.slug, affiliateUrl: t.affiliate_url, websiteUrl: t.website_url, commercial: t.commercial }),
      };
    })
    .sort((a, b) => (order.get(a.job)! - order.get(b.job)!) || a.name.localeCompare(b.name));

  const heads = sameJobComparisons(curated, tools);

  return (
    <div className="bg-canvas min-h-screen">
      <PageIntro
        title={title}
        description="Pick two or three. Everything shown comes from each product's record, with our reviewers' notes on who it suits."
        parent={{ label: "Practice software", href: "/tools/for-clinicians" }}
        object="clinician"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <CompareBuilder products={products} groupOrder={groupOrder} />

        {heads.length > 0 && (
          <section aria-labelledby="heads-title" className="mt-20">
            <h2 id="heads-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
              Our head-to-heads
            </h2>
            <p className="text-label-secondary mt-2 text-[16px]">Written comparisons with a bottom line and the details that decide it.</p>
            <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {CLINICIAN_JOBS.map((j) => ({ j, items: heads.filter((h) => h.job === j.slug) }))
                .filter((g) => g.items.length)
                .map(({ j, items }) => (
                  <div key={j.slug}>
                    <h3 className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">{j.kind}</h3>
                    <ul className="mt-3 space-y-2">
                      {items.map((h) => (
                        <li key={h.slug}>
                          <Link href={h.href} className="text-label-primary hover:text-accent text-[15px]">
                            {h.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
