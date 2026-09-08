"use client";

// Tool Outbound Links Component
// Client component for tracking outbound clicks to vendor websites
// Priority: affiliate_url > app stores > website
// Phase 6: Includes affiliate disclosure when commercial link is active

import { Download, ExternalLink, Sparkles, Info } from "lucide-react";
import { trackToolsVendorOutboundClick } from "@/lib/analytics/product-events";
import type { CommercialMetadata } from "@/lib/schemas/commercial";
import { needsDisclosure, getDisclosureText } from "@/lib/schemas/commercial";

interface ToolOutboundLinksProps {
  toolSlug: string;
  toolName: string;
  appStoreUrl?: string;
  googlePlayUrl?: string;
  websiteUrl?: string;
  affiliateUrl?: string; // Affiliate link for monetization
  /** Commercial metadata for disclosure (Phase 6) */
  commercial?: CommercialMetadata;
  /** Whether affiliate is disabled via kill switch (passed from server) */
  affiliateDisabled?: boolean;
}

export function ToolOutboundLinks({
  toolSlug,
  toolName,
  appStoreUrl,
  googlePlayUrl,
  websiteUrl,
  affiliateUrl,
  commercial,
  affiliateDisabled = false,
}: ToolOutboundLinksProps) {
  const hasAnyLink = affiliateUrl || appStoreUrl || googlePlayUrl || websiteUrl;

  if (!hasAnyLink) {
    return null;
  }

  // Determine if affiliate link should be used
  const useAffiliateLink = affiliateUrl && !affiliateDisabled;

  // Determine if disclosure is needed
  const showDisclosure = useAffiliateLink && needsDisclosure(commercial);

  return (
    <section className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
      <h2 className="text-lg font-bold text-neutral-900 mb-4">
        Get {toolName}
      </h2>
      <div className="flex flex-wrap gap-3">
        {/* Affiliate Link - Primary CTA when available and enabled */}
        {useAffiliateLink && (
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener nofollow sponsored"
            onClick={() => trackToolsVendorOutboundClick(toolSlug, "affiliate", "profile")}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Try {toolName}
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        )}

        {/* App Store Links */}
        {appStoreUrl && (
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackToolsVendorOutboundClick(toolSlug, "app_store", "profile")}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl font-medium border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 transition-all"
          >
            <Download className="h-4 w-4" />
            App Store
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        )}
        {googlePlayUrl && (
          <a
            href={googlePlayUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackToolsVendorOutboundClick(toolSlug, "play_store", "profile")}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl font-medium border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 transition-all"
          >
            <Download className="h-4 w-4" />
            Google Play
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        )}

        {/* Website - show if no affiliate link OR if affiliate is disabled */}
        {websiteUrl && (!affiliateUrl || affiliateDisabled) && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackToolsVendorOutboundClick(toolSlug, "website", "profile")}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl font-medium border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 transition-all"
          >
            Website
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        )}
      </div>

      {/* Affiliate Disclosure - Phase 6 */}
      {showDisclosure && (
        <p className="mt-3 text-xs text-neutral-500 flex items-center gap-1">
          <Info className="h-3 w-3" />
          {getDisclosureText(commercial?.status ?? "unknown", "medium")}
        </p>
      )}
    </section>
  );
}
