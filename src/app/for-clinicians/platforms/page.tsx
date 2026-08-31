// src/app/for-clinicians/platforms/page.tsx
// Provider platforms comparison page - "where to work" decisions for therapists

import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  ProviderPlatformService,
  PLATFORM_TYPES,
  type ProviderPlatform,
} from "@/lib/platforms/provider-platform-service";

export const metadata: Metadata = {
  title: "Compare Therapist Platforms: Headway vs Grow vs Alma vs Rula | HeyPsych",
  description:
    "Compare provider platforms for therapists. Headway, Grow Therapy, Alma, Rula, SonderMind - credentialing speed, pay rates, fee structures, and what you own.",
};

function PlatformCard({ platform }: { platform: ProviderPlatform }) {
  const pricing = platform.pricing;

  return (
    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{platform.name}</h3>
        {platform.featured && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Popular
          </span>
        )}
      </div>

      {platform.one_liner && (
        <p className="text-gray-600 text-sm mb-4">{platform.one_liner}</p>
      )}

      {/* Key Info */}
      <div className="space-y-2 mb-4">
        {pricing?.starting_price_display && (
          <div className="flex items-center text-sm">
            <span className="text-gray-500 w-24">Cost:</span>
            <span className="font-medium">{pricing.starting_price_display}</span>
          </div>
        )}
        {pricing?.model && (
          <div className="flex items-center text-sm">
            <span className="text-gray-500 w-24">Model:</span>
            <span className="capitalize">{pricing.model.replace(/-/g, " ")}</span>
          </div>
        )}
      </div>

      {/* Best For */}
      {platform.best_for && platform.best_for.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Best for
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            {platform.best_for.slice(0, 2).map((item, i) => (
              <li key={i} className="flex items-start">
                <span className="text-green-500 mr-2">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Not For */}
      {platform.not_for && platform.not_for.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Not ideal for
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            {platform.not_for.slice(0, 2).map((item, i) => (
              <li key={i} className="flex items-start">
                <span className="text-amber-500 mr-2">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/for-clinicians/platforms/${platform.slug}`}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        View details →
      </Link>
    </div>
  );
}

export default async function PlatformsPage() {
  const contractorPlatforms = await ProviderPlatformService.getTherapistContractorPlatforms();
  const w2Platforms = await ProviderPlatformService.getByType("w2-employer");
  const dtcPlatforms = await ProviderPlatformService.getByType("dtc-provider");
  const b2bPlatforms = await ProviderPlatformService.getByType("b2b-employer");

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Compare Provider Platforms
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl">
          Thinking about joining Headway, Grow, Alma, or another platform?
          These aren&apos;t software tools—they&apos;re &quot;where to work&quot; decisions that affect
          your income, autonomy, and practice ownership.
        </p>
      </div>

      {/* How these platforms work */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">
          How these platforms work
        </h2>
        <p className="text-gray-700 text-sm">
          With platforms like Headway, Grow, Alma, and Rula, you work as a contractor
          using their insurance credentials. If you leave, those credentials
          and client relationships typically stay with the platform. This is different
          from building your own independent practice with your own panels.
        </p>
      </div>

      {/* Practice Architect CTA */}
      <div className="border-2 border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
              Want to build your own practice instead?
            </p>
            <h3 className="font-semibold text-gray-900 mb-1">
              Practice Architect™
            </h3>
            <p className="text-gray-600 text-sm">
              Get personalized recommendations for EHRs, billing, and telehealth tools
              to build an independent practice where <strong>you</strong> own your credentials and client relationships.
            </p>
          </div>
          <Link
            href="/architect"
            className="group flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap"
          >
            Build Your Practice
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Therapist Contractor Platforms */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Therapist Contractor Platforms
        </h2>
        <p className="text-gray-600 mb-6">
          Join as a 1099 contractor. They handle credentialing and billing; you see clients.
          Trade a percentage fee for convenience.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contractorPlatforms.map((platform) => (
            <PlatformCard key={platform.slug} platform={platform} />
          ))}
        </div>
      </section>

      {/* W2 Employer Platforms */}
      {w2Platforms.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            W2 Employer Platforms
          </h2>
          <p className="text-gray-600 mb-6">
            Work as a W2 employee with benefits. Different tradeoff: stability and support,
            but less autonomy and typically productivity-based compensation.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {w2Platforms.map((platform) => (
              <PlatformCard key={platform.slug} platform={platform} />
            ))}
          </div>
        </section>
      )}

      {/* DTC Platforms */}
      {dtcPlatforms.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Direct-to-Consumer Platforms
          </h2>
          <p className="text-gray-600 mb-6">
            Consumer-facing platforms with provider networks. Often subscription-based
            for clients with provider payment per session.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dtcPlatforms.map((platform) => (
              <PlatformCard key={platform.slug} platform={platform} />
            ))}
          </div>
        </section>
      )}

      {/* B2B Note */}
      <section className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Looking for B2B / Employer Platforms?
        </h2>
        <p className="text-gray-600 mb-4">
          Platforms like Lyra Health, Spring Health, and Modern Health are
          enterprise mental health benefits—they contract with employers,
          not individual clinicians looking to build a practice.
        </p>
        <p className="text-gray-600">
          If you&apos;re a clinician wanting to work with these, they typically
          recruit through their own channels rather than open signup.
        </p>
      </section>
    </div>
  );
}
