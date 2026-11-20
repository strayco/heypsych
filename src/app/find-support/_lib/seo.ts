import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";

export const FIND_SUPPORT_CANONICAL = `${SITE_CONFIG.url}/find-support`;

const BASE = {
  title: "Find Your Way",
  description:
    "Choose a starting point: understand what you're experiencing, explore treatment and support, help someone you care about, or find a professional. Not a diagnosis.",
  alternates: { canonical: FIND_SUPPORT_CANONICAL },
} satisfies Metadata;

/**
 * The bare /find-support entry is a public, generic page and is indexable.
 * Any query string (?need=support starts the journey) is a session view:
 * never indexed, links not followed. Answers never reach the URL or the
 * server; they stay in the visitor's browser.
 */
export function findSupportMetadata(params: Record<string, string | string[] | undefined>): Metadata {
  const isEntry = Object.keys(params).length === 0;
  return { ...BASE, robots: isEntry ? { index: true, follow: true } : { index: false, follow: false } };
}
