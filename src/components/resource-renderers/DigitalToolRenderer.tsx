// src/components/resource-renderers/DigitalToolRenderer.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Star, Download, ExternalLink, Shield, Clock } from "lucide-react";
import { SEOMeta, SectionList, ReferencesTable, AutoFields } from "./shared";
import type { ResourceRendererProps } from "./index";

// Import V2 section components
import { PatientSummary } from "./sections/PatientSummary";
import { EfficacySection } from "./sections/EfficacySection";
import { PrivacySecuritySection } from "./sections/PrivacySecuritySection";
import { BestForSection } from "./sections/BestForSection";
import { PricingSection } from "./sections/PricingSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { PlatformComparisonSection } from "./sections/PlatformComparisonSection";
import { GettingStartedSection } from "./sections/GettingStartedSection";
import { AlternativesSection } from "./sections/AlternativesSection";
import { FAQSection } from "./sections/FAQSection";
import { ConditionChips } from "./sections/ConditionChips";

export function DigitalToolRenderer({ resource }: ResourceRendererProps) {
  const data = resource as any;
  const isV2 = data.version === "2.0" || data.patient_summary || data.clinical_metadata;

  // Helper to format large numbers
  const formatReviews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  return (
    <>
      <SEOMeta seo={data.seo} />

      {/* V2 Layout: Patient Summary at top */}
      {isV2 && data.patient_summary && (
        <PatientSummary text={data.patient_summary} />
      )}

      {/* Hero Card with Rating, Platforms, Download */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-indigo-600" />
              <div>
                <CardTitle>{data.name}</CardTitle>
                <p className="text-sm text-gray-600">
                  {data.metadata?.app_category || "Digital Mental Health Tool"}
                </p>
              </div>
            </div>
            {data.metadata?.privacy_certified && (
              <Badge variant="outline" className="border-green-500 text-green-700">
                <Shield className="mr-1 h-3 w-3" />
                Privacy Certified
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rating */}
          {data.app_rating && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-current text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{data.app_rating}</span>
              </div>
              {data.total_reviews && (
                <span className="text-sm text-gray-600">
                  {formatReviews(data.total_reviews)} reviews
                </span>
              )}
            </div>
          )}

          {/* Platforms */}
          {data.metadata?.platforms && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-700">Available On</h4>
              <div className="flex flex-wrap gap-2">
                {data.metadata.platforms.map((platform: string, i: number) => (
                  <Badge key={i} variant="outline">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Quick Info Badges */}
          <div className="flex flex-wrap gap-2">
            {data.metadata?.offline_access && (
              <Badge variant="default">Offline Access</Badge>
            )}
            {data.metadata?.data_export && (
              <Badge variant="default">Data Export</Badge>
            )}
            {data.metadata?.free_tier_available && (
              <Badge variant="success">Free Tier Available</Badge>
            )}
            {data.metadata?.hipaa_compliant && (
              <Badge variant="primary">HIPAA Compliant</Badge>
            )}
          </div>

          {/* Last Updated */}
          {data.metadata?.last_updated && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Last updated: {new Date(data.metadata.last_updated).toLocaleDateString()}
            </div>
          )}

          {/* Download Buttons */}
          <div className="flex flex-wrap gap-3">
            {data.app_store_url && (
              <a
                href={data.app_store_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download (iOS)
                </Button>
              </a>
            )}

            {data.google_play_url && (
              <a
                href={data.google_play_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download (Android)
                </Button>
              </a>
            )}

            {data.website && (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  Visit Website <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* V2 Sections: Render specialized components based on section type */}
      {isV2 && data.sections && data.sections.length > 0 && (
        <>
          {data.sections.map((section: any, i: number) => {
            // Efficacy Section
            if (section.type === "efficacy") {
              return (
                <EfficacySection
                  key={i}
                  metric={section.metric}
                  value={section.value}
                  comparison={section.comparison}
                  text={section.text}
                  patient_text={section.patient_text}
                  citation={section.citation}
                />
              );
            }

            // Best For Section
            if (section.type === "best_for") {
              return (
                <BestForSection
                  key={i}
                  text={section.text}
                  items={section.items}
                  not_recommended={section.not_recommended}
                />
              );
            }

            // Features Detail Section
            if (section.type === "features_detail") {
              return (
                <FeaturesSection
                  key={i}
                  heading={section.heading}
                  items={section.items}
                />
              );
            }

            // Pricing Section
            if (section.type === "pricing") {
              return (
                <PricingSection
                  key={i}
                  text={section.text}
                  plans={section.plans}
                  free_features={section.free_features}
                  discounts={section.discounts}
                  insurance={section.insurance}
                />
              );
            }

            // Platform Comparison Section
            if (section.type === "platform_comparison") {
              return (
                <PlatformComparisonSection
                  key={i}
                  heading={section.heading}
                  platforms={section.platforms}
                />
              );
            }

            // Privacy & Security Section
            if (section.type === "privacy_security") {
              return (
                <PrivacySecuritySection
                  key={i}
                  privacy_rating={data.privacy_rating}
                  summary={section.summary}
                  items={section.items}
                  concerns={section.concerns}
                  hipaa_note={section.hipaa_note}
                />
              );
            }

            // Getting Started Section
            if (section.type === "getting_started") {
              return (
                <GettingStartedSection
                  key={i}
                  heading={section.heading}
                  steps={section.steps}
                  tips={section.tips}
                  common_mistakes={section.common_mistakes}
                />
              );
            }

            // Alternatives Section
            if (section.type === "alternatives") {
              return (
                <AlternativesSection
                  key={i}
                  heading={section.heading}
                  items={section.items}
                />
              );
            }

            // Default: Use generic rendering for other section types
            return null;
          })}
        </>
      )}

      {/* Condition Links (V2) */}
      {isV2 && data.clinical_metadata?.linked_conditions && (
        <ConditionChips conditions={data.clinical_metadata.linked_conditions} />
      )}

      {/* FAQs (V2) */}
      {isV2 && data.faqs && data.faqs.length > 0 && (
        <FAQSection
          faqs={data.faqs}
          entityName={data.name}
          entityUrl={`https://heypsych.com/resources/${data.slug}`}
        />
      )}

      {/* V1 Fallback: Use original rendering if not V2 */}
      {!isV2 && (
        <>
          <AutoFields
            data={data}
            title="Technical Details"
            only={["system_requirements", "offline_access", "subscription_model", "data_export"]}
          />
          <SectionList sections={data.sections} />
        </>
      )}

      {/* References (both V1 and V2) */}
      <ReferencesTable refs={data.references} />
    </>
  );
}
