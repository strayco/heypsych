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
  const company = platform.company_info;
  const faqs = platform.seo?.faqs;

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
        <section className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Company info</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
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
                <dt className="text-gray-500">Funding</dt>
                <dd className="text-gray-900">{company.funding_status}</dd>
              </>
            )}
            {company.total_funding && (
              <>
                <dt className="text-gray-500">Total raised</dt>
                <dd className="text-gray-900">{company.total_funding}</dd>
              </>
            )}
          </dl>
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
