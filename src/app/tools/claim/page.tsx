/**
 * Vendor Claim Page
 *
 * Entry point for vendors to claim and manage their product profiles.
 * Part of the vendor capture strategy.
 *
 * URL: /tools/claim
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  BarChart3,
  MessageSquare,
  Star,
  Users,
  TrendingUp,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Claim Your Product Profile | Vendor Portal",
  description: "Claim and manage your mental health software product on HeyPsych. Update your listing, respond to buyer inquiries, and reach practices actively evaluating your category.",
  keywords: [
    "vendor portal",
    "claim product listing",
    "software vendor",
    "mental health software vendor",
    "product profile",
  ],
  alternates: {
    canonical: `${siteConfig.url}/tools/claim`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const BENEFITS = [
  {
    icon: CheckCircle2,
    title: "Verified Profile",
    description: "Get a verified badge that shows buyers your information is accurate and up-to-date.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "See how many practices are viewing and comparing your product.",
  },
  {
    icon: MessageSquare,
    title: "Respond to Inquiries",
    description: "Receive and respond to demo requests and buyer questions directly.",
  },
  {
    icon: Shield,
    title: "Data Accuracy",
    description: "Ensure your pricing, features, and integrations are correctly represented.",
  },
  {
    icon: TrendingUp,
    title: "Competitive Insights",
    description: "Understand how you compare to competitors in buyer evaluations.",
  },
  {
    icon: Users,
    title: "Reach Active Buyers",
    description: "Connect with practices actively researching your category.",
  },
];

const CLAIM_TIERS = [
  {
    name: "Claimed",
    price: "Free",
    description: "Verify and maintain your product information",
    features: [
      "Edit your product profile",
      "Verify pricing and features",
      "Add integrations",
      "Basic profile views",
      "Respond to direct inquiries",
    ],
    cta: "Claim Profile",
    ctaStyle: "border border-separator bg-canvas text-label-primary hover:border-treatment/30",
  },
  {
    name: "Verified",
    price: "$299/mo",
    description: "Enhanced visibility and buyer intelligence",
    features: [
      "Everything in Claimed",
      '"Verified" badge on profile',
      "Priority in incomplete data situations",
      "Detailed analytics dashboard",
      "Competitive comparison data",
      "Monthly buyer intent report",
    ],
    cta: "Get Verified",
    ctaStyle: "bg-treatment text-white hover:bg-treatment-600",
    popular: true,
  },
  {
    name: "Premium",
    price: "$699/mo",
    description: "Full buyer access and marketplace participation",
    features: [
      "Everything in Verified",
      "Featured in category listings",
      "Direct demo request routing",
      "Buyer qualification data",
      "Marketplace participation",
      "Custom reporting",
      "Dedicated support",
    ],
    cta: "Go Premium",
    ctaStyle: "bg-accent text-white hover:bg-accent-hover",
  },
];

export default function VendorClaimPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-separator bg-surface">
        <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-treatment/20 bg-treatment/5 px-4 py-1.5 text-sm font-medium text-treatment mb-6">
              <Star className="h-4 w-4" />
              For Software Vendors
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-label-primary sm:text-4xl lg:text-5xl">
              Claim Your Product Profile
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-label-secondary">
              Mental health practices use HeyPsych to research and compare software.
              Make sure your product is accurately represented and reach active buyers.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="#claim-form"
                className="inline-flex items-center gap-2 rounded-xl bg-treatment px-6 py-3 font-medium text-white hover:bg-treatment-600 transition-colors"
              >
                Claim Your Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tools/for-clinicians/"
                className="inline-flex items-center gap-2 rounded-xl border border-separator bg-canvas px-6 py-3 font-medium text-label-primary hover:border-treatment/30 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            <div>
              <p className="text-3xl font-bold text-treatment">10,000+</p>
              <p className="mt-1 text-sm text-label-secondary">Practices researching monthly</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-treatment">500+</p>
              <p className="mt-1 text-sm text-label-secondary">Products in database</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-treatment">15</p>
              <p className="mt-1 text-sm text-label-secondary">Software categories</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-separator bg-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold text-label-primary">
            Why Claim Your Profile?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-label-secondary">
            Practices are comparing you to competitors right now. Make sure they see accurate information.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="rounded-xl border border-separator bg-canvas p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-treatment/10">
                    <Icon className="h-5 w-5 text-treatment" />
                  </div>
                  <h3 className="mt-4 font-semibold text-label-primary">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-label-secondary">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="border-b border-separator bg-canvas px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold text-label-primary">
            Choose Your Level
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-label-secondary">
            Start free with a claimed profile. Upgrade for enhanced visibility and buyer access.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {CLAIM_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border ${
                  tier.popular ? "border-treatment shadow-soft" : "border-separator"
                } bg-surface p-6`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-treatment px-3 py-1 text-xs font-medium text-white">
                    Most Popular
                  </span>
                )}

                <h3 className="text-xl font-semibold text-label-primary">{tier.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-label-primary">{tier.price}</span>
                  {tier.price !== "Free" && (
                    <span className="text-label-tertiary"> / month</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-label-secondary">{tier.description}</p>

                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <span className="text-label-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors ${tier.ctaStyle}`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Claim Form */}
      <section id="claim-form" className="border-b border-separator bg-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-semibold text-label-primary">
            Start Your Claim
          </h2>
          <p className="mx-auto mt-2 text-center text-label-secondary">
            Tell us about your product and we'll get you set up.
          </p>

          <form className="mt-8 space-y-6">
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium text-label-primary">
                Product Name
              </label>
              <input
                type="text"
                id="product-name"
                className="mt-1 block w-full rounded-lg border border-separator bg-canvas px-4 py-2.5 text-label-primary placeholder:text-label-quaternary focus:border-treatment focus:ring-1 focus:ring-treatment"
                placeholder="e.g., SimplePractice"
              />
            </div>

            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-label-primary">
                Company Name
              </label>
              <input
                type="text"
                id="company-name"
                className="mt-1 block w-full rounded-lg border border-separator bg-canvas px-4 py-2.5 text-label-primary placeholder:text-label-quaternary focus:border-treatment focus:ring-1 focus:ring-treatment"
                placeholder="e.g., SimplePractice LLC"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-label-primary">
                Work Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full rounded-lg border border-separator bg-canvas px-4 py-2.5 text-label-primary placeholder:text-label-quaternary focus:border-treatment focus:ring-1 focus:ring-treatment"
                placeholder="you@company.com"
              />
              <p className="mt-1 text-xs text-label-tertiary">
                Must match your company domain for verification
              </p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-label-primary">
                Your Role
              </label>
              <select
                id="role"
                className="mt-1 block w-full rounded-lg border border-separator bg-canvas px-4 py-2.5 text-label-primary focus:border-treatment focus:ring-1 focus:ring-treatment"
              >
                <option value="">Select your role...</option>
                <option value="founder">Founder / CEO</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="product">Product</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-label-primary">
                Product Website
              </label>
              <input
                type="url"
                id="website"
                className="mt-1 block w-full rounded-lg border border-separator bg-canvas px-4 py-2.5 text-label-primary placeholder:text-label-quaternary focus:border-treatment focus:ring-1 focus:ring-treatment"
                placeholder="https://yourproduct.com"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-treatment px-4 py-3 font-medium text-white hover:bg-treatment-600 transition-colors"
            >
              Submit Claim Request
            </button>

            <p className="text-center text-xs text-label-tertiary">
              By submitting, you agree to our{" "}
              <Link href="/terms" className="text-treatment hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-treatment hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-canvas px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-semibold text-label-primary mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <details className="group rounded-xl border border-separator bg-surface">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                How does the claim verification process work?
                <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-label-secondary">
                We verify claims through email domain verification and may request additional
                documentation (like a LinkedIn profile showing your role at the company).
                Verification typically takes 1-2 business days.
              </div>
            </details>

            <details className="group rounded-xl border border-separator bg-surface">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                What if my product isn't listed yet?
                <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-label-secondary">
                Submit a claim request with your product details, and we'll add your product to our
                database. You'll be able to fill out your complete profile once verified.
              </div>
            </details>

            <details className="group rounded-xl border border-separator bg-surface">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                Can I edit my product information after claiming?
                <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-label-secondary">
                Yes! Claimed profiles can edit product information at any time. Changes are reviewed
                to ensure accuracy and typically go live within 24 hours.
              </div>
            </details>

            <details className="group rounded-xl border border-separator bg-surface">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                Does paying for a tier affect my ranking or comparison results?
                <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-label-secondary">
                No. Comparison results and fit scores are determined by objective data only.
                Paid tiers provide enhanced visibility (like featured placement in category listings)
                but cannot influence how your product compares to others.
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
