"use client";

/**
 * The opening call to action on an app or product profile: the vendor's site
 * (or a labelled partner link), plus app-store links when the record has them.
 */

import type { Outbound } from "@/lib/commercial/outbound";
import { trackToolsVendorOutboundClick } from "@/lib/analytics/product-events";

const secondary =
  "border-separator bg-surface text-label-primary hover:border-label-tertiary focus-visible:ring-accent inline-flex items-center rounded-full border px-4 py-2.5 text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

export function GetItLinks({
  slug,
  name,
  primary,
  appStoreUrl,
  googlePlayUrl,
  source,
}: {
  slug: string;
  name: string;
  primary: Outbound | null;
  appStoreUrl?: string | null;
  googlePlayUrl?: string | null;
  source: string;
}) {
  if (!primary && !appStoreUrl && !googlePlayUrl) return null;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        {primary && (
          <a
            href={primary.href}
            target="_blank"
            rel={primary.rel}
            onClick={() => trackToolsVendorOutboundClick(slug, primary.partner ? "affiliate" : "website", source)}
            className="bg-label-primary text-white focus-visible:ring-accent inline-flex items-center rounded-full px-5 py-2.5 text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Visit {name}
            <span aria-hidden="true" className="ml-1.5">↗</span>
          </a>
        )}
        {appStoreUrl && (
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener"
            onClick={() => trackToolsVendorOutboundClick(slug, "app_store", source)}
            className={secondary}
          >
            App Store<span aria-hidden="true" className="ml-1.5">↗</span>
          </a>
        )}
        {googlePlayUrl && (
          <a
            href={googlePlayUrl}
            target="_blank"
            rel="noopener"
            onClick={() => trackToolsVendorOutboundClick(slug, "play_store", source)}
            className={secondary}
          >
            Google Play<span aria-hidden="true" className="ml-1.5">↗</span>
          </a>
        )}
      </div>
      {primary?.partner && (
        <p className="text-label-tertiary mt-2 text-[12.5px]">
          Partner link: we may earn a commission if you sign up. It doesn&rsquo;t affect what we recommend.
        </p>
      )}
    </div>
  );
}
