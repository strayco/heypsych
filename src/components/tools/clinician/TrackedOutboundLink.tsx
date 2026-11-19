"use client";

/**
 * An outbound vendor link that reports a qualified vendor action.
 * Server-rendered as the same <a>; the click records the product slug
 * (clinician software, not health data), the link kind, and whether it is a
 * disclosed partner link. Commercial status never changes where it points.
 */

import { trackArchitectEvent } from "@/domains/architect/analytics";

export function TrackedOutboundLink({
  href,
  rel,
  className,
  productSlug,
  kind,
  partner = false,
  children,
}: {
  href: string;
  rel: string;
  className: string;
  productSlug: string;
  kind: "visit" | "pricing";
  partner?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={rel}
      className={className}
      // Three properties at most: the most this Vercel project has been seen to
      // record per custom event (the Pro plan documents two). Link type rides in source.
      onClick={() => trackArchitectEvent("architect_vendor_visit", { productSlug, isSponsored: partner, source: kind === "visit" ? "profile-visit" : "profile-pricing" })}
    >
      {children}
    </a>
  );
}
