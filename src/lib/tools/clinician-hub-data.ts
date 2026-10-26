/**
 * Server loaders for the clinician hub and job pages. File-backed (no
 * database), so the pages are static with daily revalidation.
 */

import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { getSponsoredPlacement, type SponsoredPlacement } from "@/lib/commercial/placements";
import { getAllPublishableCurated } from "@/lib/tools/curated-comparisons";
import {
  CLINICIAN_JOBS,
  buildClinicianHub,
  buildJobView,
  getJob,
  sameJobComparisons,
  type ClinicianHub,
  type HubComparison,
  type JobView,
} from "@/domains/tools/clinician-hub/model";


export async function loadClinicianHub(): Promise<{
  hub: ClinicianHub;
  comparisons: HubComparison[];
  placement: SponsoredPlacement | null;
}> {
  const [tools, curated, placement] = await Promise.all([
    ClinicianToolService.loadClinicianTools(),
    getAllPublishableCurated(),
    getSponsoredPlacement({ audience: "clinician" }),
  ]);
  const hub = buildClinicianHub(tools);
  return {
    hub,
    comparisons: sameJobComparisons(curated, tools),
    placement,
  };
}

export async function loadJobView(
  slug: string
): Promise<{
  job: JobView;
  comparisons: HubComparison[];
  otherJobs: { slug: string; name: string }[];
  placement: SponsoredPlacement | null;
} | null> {
  const definition = getJob(slug);
  if (!definition) return null;
  const [tools, curated] = await Promise.all([
    ClinicianToolService.loadClinicianTools(),
    getAllPublishableCurated(),
  ]);
  const job = buildJobView(definition, tools);
  if (job.products.length === 0) return null;
  const placement = await getSponsoredPlacement({ audience: "clinician", hub: slug });
  const otherJobs = CLINICIAN_JOBS.filter((j) => j.slug !== slug)
    .filter((j) => buildJobView(j, tools).products.length > 0)
    .map(({ slug: s, name }) => ({ slug: s, name }));
  return {
    job,
    comparisons: sameJobComparisons(curated, tools).filter((c) => c.job === slug),
    otherJobs,
    placement,
  };
}

/** Job slugs that have at least one published product. */
export async function liveJobSlugs(): Promise<string[]> {
  const tools = await ClinicianToolService.loadClinicianTools();
  return CLINICIAN_JOBS.filter((j) => buildJobView(j, tools).products.length > 0).map((j) => j.slug);
}
