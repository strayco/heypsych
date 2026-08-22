"use client";

// Tool Outbound Links Component
// Client component for tracking outbound clicks to vendor websites

import { Download, ExternalLink } from "lucide-react";
import { trackToolsVendorOutboundClick } from "@/lib/analytics/product-events";

interface ToolOutboundLinksProps {
  toolSlug: string;
  toolName: string;
  appStoreUrl?: string;
  googlePlayUrl?: string;
  websiteUrl?: string;
}

export function ToolOutboundLinks({
  toolSlug,
  toolName,
  appStoreUrl,
  googlePlayUrl,
  websiteUrl,
}: ToolOutboundLinksProps) {
  if (!appStoreUrl && !googlePlayUrl && !websiteUrl) {
    return null;
  }

  return (
    <section className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
      <h2 className="text-lg font-bold text-neutral-900 mb-4">
        Get {toolName}
      </h2>
      <div className="flex flex-wrap gap-3">
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
        {websiteUrl && (
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
