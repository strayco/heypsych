/**
 * TrustEditorial
 *
 * How HeyPsych's information is put together, stated plainly.
 *
 * Every sentence here restates the published review methodology
 * (/about/review-methodology), the sponsorship policy, and the evidence-
 * freshness rules in src/lib/tools/evidence-freshness.ts. Nothing claims more
 * than those do. If the methodology changes, change this copy with it.
 */

import Link from "next/link";
import { displayFont } from "@/components/brand/fonts";

const POINTS: { title: string; body: string }[] = [
  {
    title: "How it's researched",
    body: "Information comes from published research, public sources, and vendors' own documentation. Prices are checked against vendor websites.",
  },
  {
    title: "How evidence is weighed",
    body: "We note whether an approach or tool has peer-reviewed research, clinical trials, or FDA clearance — and we say so when it doesn't. Our medical review board reviews clinical content where applicable.",
  },
  {
    title: "How tool claims are checked",
    body: "Claims like HIPAA support, BAA availability, and pricing are checked against vendor documentation and dated. When a check gets old, the claim is flagged for review again rather than assumed to still hold.",
  },
  {
    title: "Where uncertainty remains",
    body: "Evidence for many apps and services is still early or mixed, and nothing is right for everyone. We don't call anything “the best” for all people.",
  },
  {
    title: "Why it stays independent",
    body: "Payment never influences reviews, rankings, or what we suggest. Sponsorships are disclosed.",
  },
];

export function TrustEditorial() {
  return (
    <section
      aria-labelledby="trust-heading"
      className={`${displayFont.variable} border-separator border-t px-4 py-14 sm:px-6 lg:px-8 lg:py-20`}
    >
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <h2
            id="trust-heading"
            className="font-display text-label-primary text-[30px] leading-tight font-normal tracking-[-0.015em] sm:text-[38px]"
          >
            Better information. Clearer choices.
          </h2>
          <p className="text-label-secondary mt-4 max-w-md text-[16px] leading-relaxed">
            HeyPsych helps you compare options and decide on a next step. It offers education and
            decision support, not medical advice, diagnosis, or treatment.
          </p>
          <ul role="list" className="mt-6 space-y-2 text-[15px]">
            {[
              { href: "/about/review-methodology", label: "Our review methodology" },
              { href: "/about/medical-review-board", label: "Medical review board" },
              { href: "/about/sponsorship-policy", label: "Sponsorship policy" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-accent decoration-accent/30 hover:decoration-accent focus-visible:ring-accent font-medium underline underline-offset-4 focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {POINTS.map((point) => (
            <div key={point.title} className="border-separator border-t pt-4">
              <dt className="text-label-primary text-[15px] font-semibold">{point.title}</dt>
              <dd className="text-label-secondary mt-1.5 text-[15px] leading-relaxed">
                {point.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
