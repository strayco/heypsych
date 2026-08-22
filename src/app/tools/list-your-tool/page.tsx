// src/app/tools/list-your-tool/page.tsx
// Vendor listing page - explains how to get a tool listed on HeyPsych

import { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle,
  FileText,
  Shield,
  Clock,
  ArrowRight,
  Mail,
  ExternalLink,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";

const canonicalUrl = `${siteConfig.url}/tools/list-your-tool/`;

export const metadata: Metadata = {
  title: "List Your Tool | HeyPsych Tools Directory",
  description:
    "Submit your mental health app or software for listing on HeyPsych. Learn about our review process, eligibility requirements, and editorial standards.",
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "List Your Tool | HeyPsych",
    description: "Submit your mental health app or software for listing on HeyPsych.",
    url: canonicalUrl,
    type: "website",
  },
};

export default function ListYourToolPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-label-primary sm:text-4xl lg:text-5xl">
            List Your Tool on HeyPsych
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-label-secondary">
            Help mental health professionals and patients discover your product.
            Our directory serves clinicians, therapists, and individuals seeking
            evidence-based tools.
          </p>
        </div>
      </section>

      {/* What We List */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-label-primary">What We List</h2>
          <p className="mt-2 text-label-secondary">
            We consider mental health technology products across several categories:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-separator bg-surface p-5">
              <h3 className="font-semibold text-label-primary">For Patients & Consumers</h3>
              <ul className="mt-3 space-y-2 text-sm text-label-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                  <span>Therapy and mental health apps</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                  <span>Meditation and mindfulness tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                  <span>Mood trackers and journals</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                  <span>Peer support platforms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                  <span>Teletherapy and psychiatry platforms</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-separator bg-surface p-5">
              <h3 className="font-semibold text-label-primary">For Clinicians</h3>
              <ul className="mt-3 space-y-2 text-sm text-label-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-treatment" />
                  <span>AI scribes and documentation tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-treatment" />
                  <span>EHR and practice management software</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-treatment" />
                  <span>Billing and coding solutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-treatment" />
                  <span>Clinical decision support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-treatment" />
                  <span>Patient engagement platforms</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Listing Process */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-label-primary">Listing Process</h2>
          <p className="mt-2 text-label-secondary">
            Our process ensures accurate, trustworthy information for users.
          </p>

          <div className="mt-8 space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                1
              </div>
              <div>
                <h3 className="font-semibold text-label-primary">Submit Your Tool</h3>
                <p className="mt-1 text-sm text-label-secondary">
                  Contact us with basic information about your product: name, website,
                  description, target audience, and key features.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                2
              </div>
              <div>
                <h3 className="font-semibold text-label-primary">Eligibility Review</h3>
                <p className="mt-1 text-sm text-label-secondary">
                  We verify that your tool meets basic eligibility criteria: active product,
                  mental health focus, available in supported markets, and no safety concerns.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                3
              </div>
              <div>
                <h3 className="font-semibold text-label-primary">Information Collection</h3>
                <p className="mt-1 text-sm text-label-secondary">
                  We gather product details including pricing, platforms, privacy practices,
                  clinical evidence (if applicable), and appropriate use cases.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                4
              </div>
              <div>
                <h3 className="font-semibold text-label-primary">Listing Publication</h3>
                <p className="mt-1 text-sm text-label-secondary">
                  Your tool is published with accurate attribution of information sources.
                  Listings clearly indicate what has been verified vs. vendor-provided.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Review States */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-label-primary">Review States</h2>
          <p className="mt-2 text-label-secondary">
            Listings have different review levels based on verification depth.
            We do not claim uniform review for all tools.
          </p>

          <div className="mt-6 overflow-hidden rounded-xl border border-separator">
            <table className="w-full text-sm">
              <thead className="bg-fill-secondary">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-label-primary">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-label-primary">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator bg-surface">
                <tr>
                  <td className="px-4 py-3 text-label-primary">Listing</td>
                  <td className="px-4 py-3 text-label-secondary">Basic directory entry from public sources</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-label-primary">Vendor-Verified</td>
                  <td className="px-4 py-3 text-label-secondary">Information confirmed by the vendor</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-label-primary">Facts Verified</td>
                  <td className="px-4 py-3 text-label-secondary">Key claims independently verified</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-label-primary">Editorially Reviewed</td>
                  <td className="px-4 py-3 text-label-secondary">Full editorial review by HeyPsych team</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-label-primary">Clinically Reviewed</td>
                  <td className="px-4 py-3 text-label-secondary">Clinical review by qualified professional</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Required Information */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-label-primary">Required Information</h2>
          <p className="mt-2 text-label-secondary">
            To list your tool, please prepare the following:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h4 className="font-medium text-label-primary">Product name and website</h4>
                <p className="text-sm text-label-tertiary">Official product name and URL</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h4 className="font-medium text-label-primary">Product description</h4>
                <p className="text-sm text-label-tertiary">What your tool does (100-500 words)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h4 className="font-medium text-label-primary">Privacy practices</h4>
                <p className="text-sm text-label-tertiary">HIPAA status, data handling, privacy policy</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h4 className="font-medium text-label-primary">Pricing information</h4>
                <p className="text-sm text-label-tertiary">Free tier, subscription costs, etc.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Independence */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-label-primary">Editorial Independence</h2>
          <div className="mt-4 rounded-xl border border-caution/30 bg-caution/5 p-5">
            <p className="text-sm text-label-primary">
              <strong>Important:</strong> Listing is separate from sponsorship.
              Payment does not influence:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-label-secondary">
              <li>- Listing approval or rejection</li>
              <li>- Review scores or ratings</li>
              <li>- Privacy grades or evidence assessments</li>
              <li>- Organic ranking in search results</li>
              <li>- Editorial content or recommendations</li>
            </ul>
            <p className="mt-3 text-sm text-label-secondary">
              See our{" "}
              <Link href="/about/sponsorship-policy/" className="text-accent hover:underline">
                sponsorship policy
              </Link>{" "}
              for details on how we maintain editorial independence.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-accent/5 to-treatment/5 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-label-primary">Ready to Get Listed?</h2>
          <p className="mt-2 text-label-secondary">
            Contact us to submit your tool for listing.
          </p>
          <a
            href={`mailto:${siteConfig.email}?subject=Tool%20Listing%20Request`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-accent-hover"
          >
            <Mail className="h-5 w-5" />
            Contact Us to Submit
          </a>
          <p className="mt-4 text-sm text-label-tertiary">
            Interested in sponsored placements?{" "}
            <Link href="/tools/become-a-partner/" className="text-accent hover:underline">
              Learn about partnership options
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
