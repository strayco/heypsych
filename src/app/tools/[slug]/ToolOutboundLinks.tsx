"use client";

// Tool Outbound Links Component
// Client component for tracking outbound clicks to vendor websites
// Priority: affiliate_url > app stores > website

import { Download, ExternalLink, Sparkles } from "lucide-react";
import { trackToolsVendorOutboundClick } from "@/lib/analytics/product-events";

interface ToolOutboundLinksProps {
  toolSlug: string;
  toolName: string;
  appStoreUrl?: string;
  googlePlayUrl?: string;
  websiteUrl?: string;
  affiliateUrl?: string; // Affiliate link for monetization
}

export function ToolOutboundLinks({
  toolSlug,
  toolName,
  appStoreUrl,
  googlePlayUrl,
  websiteUrl,
  affiliateUrl,
}: ToolOutboundLinksProps) {
  const hasAnyLink = affiliateUrl || appStoreUrl || googlePlayUrl || websiteUrl;

  if (!hasAnyLink) {
    return null;
  }

  return (
    <section className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
      <h2 className="text-lg font-bold text-neutral-900 mb-4">
        Get {toolName}
      </h2>
      <div className="flex flex-wrap gap-3">
        {/* Affiliate Link - Primary CTA when available */}
        {affiliateUrl && (
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

        {/* Website - only show if no affiliate link */}
        {websiteUrl && !affiliateUrl && (
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

    </section>
  );
}
