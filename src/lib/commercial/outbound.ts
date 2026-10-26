/**
 * Where a "Visit" / "Get it" button goes, and what it must say.
 *
 * One rule for every surface (patient apps, clinician products, hubs,
 * profiles, comparisons): a partner (affiliate) link is used only when the
 * record's commercial status is an active affiliate agreement and the kill
 * switch allows it, and then the button carries a visible disclosure and
 * rel="sponsored". Otherwise the vendor's own site is used, untracked.
 *
 * Commercial status is read here and nowhere in candidate selection or
 * ordering (see DECISION_PLATFORM_IMPLEMENTATION.md §4).
 *
 * Server-only: the kill switch reads environment variables.
 */

import type { CommercialMetadata } from "@/lib/schemas/commercial";
import { DISCLOSURE_TEXT } from "@/lib/schemas/commercial";
import { shouldShowCommercialLink } from "./kill-switch";

export interface Outbound {
  href: string;
  /** True when the link pays HeyPsych; the UI must show `disclosure`. */
  partner: boolean;
  rel: string;
  disclosure: string | null;
}

function safeHttps(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function resolveOutbound(input: {
  slug: string;
  affiliateUrl?: string | null;
  websiteUrl?: string | null;
  fallbackUrls?: (string | null | undefined)[];
  commercial?: CommercialMetadata | null;
}): Outbound | null {
  const affiliate = safeHttps(input.affiliateUrl);
  const active =
    input.commercial?.status === "active_affiliate" &&
    affiliate !== null &&
    shouldShowCommercialLink(input.slug, input.commercial.partnerSlug);

  if (active && affiliate) {
    return {
      href: affiliate,
      partner: true,
      rel: "noopener nofollow sponsored",
      disclosure: DISCLOSURE_TEXT.affiliate.short,
    };
  }

  const direct = [input.websiteUrl, ...(input.fallbackUrls ?? [])].map(safeHttps).find(Boolean) ?? null;
  if (!direct) return null;
  return { href: direct, partner: false, rel: "noopener", disclosure: null };
}
