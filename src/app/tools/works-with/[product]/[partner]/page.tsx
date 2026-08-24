/**
 * Works-With Compatibility Page
 *
 * Specific product-to-product compatibility check.
 * High buyer intent, very low SEO competition.
 *
 * URL: /tools/works-with/[product]/[partner]
 * Example: /tools/works-with/simplepractice/freed
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cable,
  ArrowLeftRight,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { IntegrationArchitectCTA } from "@/components/architect/ContextualArchitectCTA";

interface PageProps {
  params: Promise<{ product: string; partner: string }>;
}

// Integration status types
type IntegrationStatus = "verified" | "reported" | "none" | "unknown";

interface IntegrationDetails {
  status: IntegrationStatus;
  type?: "native" | "api" | "third-party" | "zapier" | "manual";
  bidirectional?: boolean;
  dataFlows?: string[];
  reliability?: "high" | "medium" | "low";
  setupComplexity?: "easy" | "moderate" | "complex";
  knownIssues?: string[];
  lastVerified?: string;
}

// Check if two products integrate (simplified - would use real integration data)
function checkIntegration(productA: ClinicianToolV4, productB: ClinicianToolV4): IntegrationDetails {
  // Check product A's integrations for product B
  const integrationA = productA.integrations?.find(
    (i) => i.slug === productB.slug || i.name.toLowerCase().includes(productB.name.toLowerCase())
  );

  // Check product B's integrations for product A
  const integrationB = productB.integrations?.find(
    (i) => i.slug === productA.slug || i.name.toLowerCase().includes(productA.name.toLowerCase())
  );

  if (integrationA?.verified || integrationB?.verified) {
    return {
      status: "verified",
      type: (integrationA?.integration_type || integrationB?.integration_type) as IntegrationDetails["type"],
      bidirectional: integrationA?.bidirectional || integrationB?.bidirectional,
      reliability: "high",
      setupComplexity: "easy",
    };
  }

  if (integrationA || integrationB) {
    return {
      status: "reported",
      type: (integrationA?.integration_type || integrationB?.integration_type) as IntegrationDetails["type"],
      reliability: "medium",
    };
  }

  // Check if they're in complementary categories (likely to integrate)
  const complementaryPairs = [
    ["ehr-practice-management", "ai-scribe-documentation"],
    ["ehr-practice-management", "billing-rcm"],
    ["ehr-practice-management", "telehealth-communication"],
  ];

  const isPotentialPair = complementaryPairs.some(
    ([catA, catB]) =>
      (productA.primary_category === catA && productB.primary_category === catB) ||
      (productA.primary_category === catB && productB.primary_category === catA)
  );

  if (isPotentialPair) {
    return { status: "unknown" };
  }

  return { status: "unknown" };
}

// Generate static params for known integration pairs
export async function generateStaticParams() {
  // For now, generate a subset of important pairs
  // In production, this would be driven by search data
  const importantPairs = [
    { product: "simplepractice", partner: "freed" },
    { product: "simplepractice", partner: "nabla" },
    { product: "therapynotes", partner: "freed" },
    { product: "therapynotes", partner: "nabla" },
    { product: "jane", partner: "freed" },
    { product: "valant", partner: "suki-ai" },
  ];

  return importantPairs;
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { product, partner } = await params;

  const productTool = await ClinicianToolService.getBySlug(product);
  const partnerTool = await ClinicianToolService.getBySlug(partner);

  if (!productTool || !partnerTool) {
    return { title: "Integration Not Found | HeyPsych" };
  }

  const title = `Does ${productTool.name} Work With ${partnerTool.name}? | Integration Check`;
  const description = `Check if ${productTool.name} integrates with ${partnerTool.name}. See compatibility details, data flows, setup complexity, and whether this combination works for mental health practices.`;

  return {
    title,
    description,
    keywords: [
      `${productTool.name} ${partnerTool.name} integration`,
      `does ${productTool.name} work with ${partnerTool.name}`,
      `${productTool.name} integrations`,
      `${partnerTool.name} compatibility`,
    ],
    alternates: {
      canonical: `${siteConfig.url}/tools/works-with/${product}/${partner}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/tools/works-with/${product}/${partner}`,
      type: "website",
    },
  };
}

export default async function WorksWithPage({ params }: PageProps) {
  const { product, partner } = await params;

  const productTool = await ClinicianToolService.getBySlug(product);
  const partnerTool = await ClinicianToolService.getBySlug(partner);

  if (!productTool || !partnerTool) {
    notFound();
  }

  const integration = checkIntegration(productTool, partnerTool);

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${productTool.name} + ${partnerTool.name} Integration`,
    description: `Check if ${productTool.name} integrates with ${partnerTool.name}`,
    url: `${siteConfig.url}/tools/works-with/${product}/${partner}`,
  };

  const StatusIcon = {
    verified: CheckCircle2,
    reported: HelpCircle,
    none: XCircle,
    unknown: HelpCircle,
  }[integration.status];

  const statusColor = {
    verified: "text-success",
    reported: "text-warning",
    none: "text-destructive",
    unknown: "text-label-tertiary",
  }[integration.status];

  const statusBg = {
    verified: "bg-success/10 border-success/20",
    reported: "bg-warning/10 border-warning/20",
    none: "bg-destructive/10 border-destructive/20",
    unknown: "bg-canvas border-separator",
  }[integration.status];

  const statusText = {
    verified: "Verified Integration",
    reported: "Reported to Work",
    none: "No Known Integration",
    unknown: "Integration Status Unknown",
  }[integration.status];

  const statusDescription = {
    verified: `${productTool.name} and ${partnerTool.name} have a verified integration that we've confirmed works.`,
    reported: `Users have reported that ${productTool.name} works with ${partnerTool.name}, but we haven't independently verified this.`,
    none: `We haven't found evidence that ${productTool.name} integrates with ${partnerTool.name}. They may still work together through manual workflows.`,
    unknown: `We don't have enough information about whether ${productTool.name} and ${partnerTool.name} integrate. Check with both vendors for the latest.`,
  }[integration.status];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-canvas">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/integrations/" className="text-label-secondary hover:text-treatment">
                Integrations
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Compatibility Check</span>
            </nav>

            {/* Product Pair Visual */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-treatment/10 border border-treatment/20 flex items-center justify-center mx-auto text-2xl font-bold text-treatment">
                  {productTool.name.charAt(0)}
                </div>
                <p className="mt-2 font-semibold text-label-primary">{productTool.name}</p>
                <p className="text-xs text-label-tertiary">{productTool.primary_category.replace(/-/g, " ")}</p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <ArrowLeftRight className="h-6 w-6 text-label-quaternary" />
                <Cable className="h-5 w-5 text-label-quaternary" />
              </div>

              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-2xl font-bold text-accent">
                  {partnerTool.name.charAt(0)}
                </div>
                <p className="mt-2 font-semibold text-label-primary">{partnerTool.name}</p>
                <p className="text-xs text-label-tertiary">{partnerTool.primary_category.replace(/-/g, " ")}</p>
              </div>
            </div>

            <h1 className="text-center text-2xl font-bold tracking-tight text-label-primary sm:text-3xl">
              Does {productTool.name} Work With {partnerTool.name}?
            </h1>
          </div>
        </section>

        {/* Integration Status */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className={`rounded-2xl border p-6 ${statusBg}`}>
              <div className="flex items-center gap-3 mb-3">
                <StatusIcon className={`h-8 w-8 ${statusColor}`} />
                <div>
                  <h2 className="text-xl font-semibold text-label-primary">{statusText}</h2>
                  {integration.type && (
                    <p className="text-sm text-label-tertiary">
                      Integration type: {integration.type}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-label-secondary">{statusDescription}</p>
            </div>
          </div>
        </section>

        {/* Integration Details */}
        {(integration.status === "verified" || integration.status === "reported") && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-lg font-semibold text-label-primary mb-6">
                Integration Details
              </h2>

              <div className="space-y-4">
                {integration.type && (
                  <div className="flex items-center justify-between py-3 border-b border-separator">
                    <span className="text-label-secondary">Integration Type</span>
                    <span className="font-medium text-label-primary capitalize">{integration.type}</span>
                  </div>
                )}

                {integration.bidirectional !== undefined && (
                  <div className="flex items-center justify-between py-3 border-b border-separator">
                    <span className="text-label-secondary">Data Flow</span>
                    <span className="font-medium text-label-primary">
                      {integration.bidirectional ? "Bidirectional" : "One-way"}
                    </span>
                  </div>
                )}

                {integration.reliability && (
                  <div className="flex items-center justify-between py-3 border-b border-separator">
                    <span className="text-label-secondary">Reliability</span>
                    <span className={`font-medium capitalize ${
                      integration.reliability === "high" ? "text-success" :
                      integration.reliability === "medium" ? "text-warning" : "text-destructive"
                    }`}>
                      {integration.reliability}
                    </span>
                  </div>
                )}

                {integration.setupComplexity && (
                  <div className="flex items-center justify-between py-3 border-b border-separator">
                    <span className="text-label-secondary">Setup Complexity</span>
                    <span className="font-medium text-label-primary capitalize">
                      {integration.setupComplexity}
                    </span>
                  </div>
                )}
              </div>

              {integration.knownIssues && integration.knownIssues.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-label-primary flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Known Issues
                  </h3>
                  <ul className="space-y-2">
                    {integration.knownIssues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-label-secondary flex items-start gap-2">
                        <span className="text-warning">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Architect CTA */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <IntegrationArchitectCTA productSlugs={[product, partner]} />
          </div>
        </section>

        {/* Compare These Products */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-lg font-semibold text-label-primary">
              Want to Compare Instead?
            </h2>
            <p className="mt-2 text-label-secondary">
              See a detailed feature-by-feature comparison
            </p>
            <Link
              href={`/tools/compare?tools=${product},${partner}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-primary hover:border-treatment/30 transition-colors"
            >
              Compare {productTool.name} vs {partnerTool.name}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Other Integrations */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-lg font-semibold text-label-primary mb-4">
              Explore More Integrations
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/tools/integrations/${product}`}
                className="rounded-lg border border-separator bg-surface px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-all"
              >
                All {productTool.name} integrations
              </Link>
              <Link
                href={`/tools/integrations/${partner}`}
                className="rounded-lg border border-separator bg-surface px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-all"
              >
                All {partnerTool.name} integrations
              </Link>
            </div>
          </div>
        </section>

        {/* Back Link */}
        <section className="bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <Link
              href="/tools/integrations/"
              className="group inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Integrations Hub
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;
