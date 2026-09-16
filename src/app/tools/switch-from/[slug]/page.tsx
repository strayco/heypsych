/**
 * Switch-From Redirect
 *
 * Consolidated with /tools/alternatives/[slug] to eliminate URL cannibalization.
 * Preserves migration guide content on the alternatives page.
 *
 * SEO rationale: Both pages targeted overlapping "switch from X" and "X alternatives"
 * keywords, causing cannibalization. Consolidating to alternatives preserves value
 * while signaling clear topical authority.
 *
 * URL: /tools/switch-from/[product-slug] → /tools/alternatives/[product-slug]
 */

import { redirect } from "next/navigation";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for published products (for 301 redirects)
export async function generateStaticParams() {
  const tools = await ClinicianToolService.loadClinicianTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export default async function SwitchFromRedirect({ params }: PageProps) {
  const { slug } = await params;

  // Permanent redirect to alternatives page
  redirect(`/tools/alternatives/${slug}`);
}
