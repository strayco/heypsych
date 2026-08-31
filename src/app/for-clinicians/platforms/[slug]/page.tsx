// src/app/for-clinicians/platforms/[slug]/page.tsx
// Individual provider platform detail page

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ProviderPlatformService,
  type ProviderPlatform,
} from "@/lib/platforms/provider-platform-service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await ProviderPlatformService.getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const platform = await ProviderPlatformService.getBySlug(slug);

  if (!platform) {
    return { title: "Platform Not Found" };
  }

  return {
    title: platform.seo?.title || `${platform.name} Review | HeyPsych`,
    description:
      platform.seo?.meta_description ||
      platform.short_description ||
      `${platform.name} platform review for therapists.`,
  };
}

export default async function PlatformDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const platform = await ProviderPlatformService.getBySlug(slug);

  if (!platform) {
    notFound();
  }

  const pricing = platform.pricing;
  const company = platform.company_info as any;
  const faqs = platform.seo?.faqs;
  const fairness = (platform as any).fairness_rating;
  const gotchas = (platform as any).hidden_gotchas;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/for-clinicians/platforms" className="hover:text-gray-700">
          Platforms
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{platform.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{platform.name}</h1>
        {platform.one_liner && (
          <p className="text-xl text-gray-600">{platform.one_liner}</p>
        )}
      </header>

      {/* Key Info Card */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-6">
          {pricing?.starting_price_display && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Cost to join</p>
              <p className="font-semibold text-lg">{pricing.starting_price_display}</p>
            </div>
          )}
          {pricing?.model && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Pricing model</p>
              <p className="font-semibold text-lg capitalize">
                {pricing.model.replace(/-/g, " ")}
              </p>
            </div>
          )}
          {company?.founded_year && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Founded</p>
              <p className="font-semibold text-lg">{company.founded_year}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {platform.long_description && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 leading-relaxed">{platform.long_description}</p>
        </section>
      )}

      {/* Best For / Not For */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {platform.best_for && platform.best_for.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Best for</h2>
            <ul className="space-y-2">
              {platform.best_for.map((item, i) => (
                <li key={i} className="flex items-start text-gray-700">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {platform.not_for && platform.not_for.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Not ideal for</h2>
            <ul className="space-y-2">
              {platform.not_for.map((item, i) => (
                <li key={i} className="flex items-start text-gray-700">
                  <span className="text-amber-500 mr-3 mt-1">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Pricing Details */}
      {pricing?.notes && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing details</h2>
          <p className="text-gray-700">{pricing.notes}</p>
        </section>
      )}

      {/* Fairness Rating */}
      {fairness && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">HeyPsych Fairness Rating</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={`text-4xl font-bold px-4 py-2 rounded-lg ${
                fairness.grade === 'A' ? 'bg-green-100 text-green-800' :
                fairness.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                fairness.grade?.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                fairness.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {fairness.grade}
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{fairness.overall_score}/100</p>
                <p className="text-sm text-gray-500">Overall fairness score</p>
              </div>
            </div>

            {fairness.breakdown && (
              <div className="space-y-3">
                {Object.entries(fairness.breakdown).map(([key, data]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">{data.notes}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.score >= 70 ? 'bg-green-500' :
                            data.score >= 50 ? 'bg-yellow-500' :
                            data.score >= 30 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${data.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{data.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {fairness.methodology && (
              <p className="text-xs text-gray-500 mt-4 pt-4 border-t">{fairness.methodology}</p>
            )}
          </div>
        </section>
      )}

      {/* Hidden Gotchas */}
      {gotchas && Object.keys(gotchas).length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What to watch out for</h2>
          <div className="space-y-4">
            {Object.entries(gotchas).map(([key, data]: [string, any]) => (
              <div key={key} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2 capitalize">
                  {key.replace(/_/g, ' ')}
                </h3>
                {data.issue && <p className="text-amber-800 text-sm mb-1"><strong>Issue:</strong> {data.issue}</p>}
                {data.impact && <p className="text-amber-800 text-sm mb-1"><strong>Impact:</strong> {data.impact}</p>}
                {data.mitigation && <p className="text-amber-800 text-sm"><strong>Mitigation:</strong> {data.mitigation}</p>}
                {data.context && <p className="text-amber-700 text-sm italic">{data.context}</p>}
                {data.note && <p className="text-amber-700 text-sm italic">{data.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {faqs && faqs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Company Info */}
      {company && (
        <section className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Company info</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
            {company.headquarters && (
              <>
                <dt className="text-gray-500">Headquarters</dt>
                <dd className="text-gray-900">{company.headquarters}</dd>
              </>
            )}
            {company.employee_count && (
              <>
                <dt className="text-gray-500">Employees</dt>
                <dd className="text-gray-900">{company.employee_count}</dd>
              </>
            )}
            {company.funding_status && (
              <>
                <dt className="text-gray-500">Funding status</dt>
                <dd className="text-gray-900">{company.funding_status}</dd>
              </>
            )}
            {company.funding?.total_raised && (
              <>
                <dt className="text-gray-500">Total raised</dt>
                <dd className="text-gray-900 font-medium">{company.funding.total_raised}</dd>
              </>
            )}
            {company.funding?.valuation && (
              <>
                <dt className="text-gray-500">Valuation</dt>
                <dd className="text-gray-900 font-medium">{company.funding.valuation}</dd>
              </>
            )}
            {company.funding?.latest_round && (
              <>
                <dt className="text-gray-500">Latest round</dt>
                <dd className="text-gray-900">{company.funding.latest_round}{company.funding.latest_round_amount ? ` (${company.funding.latest_round_amount})` : ''}</dd>
              </>
            )}
            {company.clinician_founded !== undefined && (
              <>
                <dt className="text-gray-500">Clinician-founded</dt>
                <dd className={company.clinician_founded ? "text-green-700 font-medium" : "text-gray-600"}>
                  {company.clinician_founded ? "Yes ✓" : "No"}
                </dd>
              </>
            )}
          </dl>

          {/* Founders */}
          {company.founders && company.founders.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Founders</h3>
              <div className="space-y-3">
                {company.founders.map((founder: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${founder.is_clinician ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {founder.name}
                        {founder.credentials && <span className="text-gray-500 ml-1">({founder.credentials.join(', ')})</span>}
                      </p>
                      <p className="text-sm text-gray-600">{founder.title}</p>
                      {founder.background && <p className="text-xs text-gray-500">{founder.background}</p>}
                      {founder.status === 'departed' && <span className="text-xs text-gray-400 italic">(departed)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investors */}
          {company.funding?.key_investors && company.funding.key_investors.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Key investors</h3>
              <p className="text-sm text-gray-600">{company.funding.key_investors.join(', ')}</p>
            </div>
          )}

          {/* Context note */}
          {company.funding?.context && (
            <p className="text-xs text-gray-500 mt-4 pt-4 border-t italic">{company.funding.context}</p>
          )}
        </section>
      )}

      {/* Back link */}
      <div className="mt-12 pt-8 border-t">
        <Link
          href="/for-clinicians/platforms"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Compare all platforms
        </Link>
      </div>
    </div>
  );
}
