"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";

interface ClinicianModuleProps {
  tool: DigitalToolV3;
}

/**
 * ClinicianModule Component
 *
 * Conditional module that appears on tool pages when the tool is clinician-relevant.
 * Displays how clinicians use the tool, workflow fit, and implementation notes.
 */
export function ClinicianModule({ tool }: ClinicianModuleProps) {
  // Only render if tool is clinician-relevant
  if (!tool.clinician?.is_clinician_relevant) {
    return null;
  }

  const { clinician } = tool;

  // Get workflow display names
  const workflowConfigs = clinician.clinician_workflows.map((wf) => {
    const config = TaxonomyService.getClinicianWorkflow(wf);
    return config ? { workflowSlug: wf, ...config } : { workflowSlug: wf, slug: wf, chip_label: wf.replace(/_/g, " ") };
  });

  // Get hub links
  const hubLinks = clinician.primary_clinician_hubs.map((hubSlug) => {
    const hub = TaxonomyService.getClinicianHub(hubSlug);
    return hub ? { slug: hubSlug, display_name: hub.display_name, url: hub.url } : null;
  }).filter(Boolean);

  return (
    <section className="border-t border-separator bg-canvas">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
          Clinical Use
        </p>
        <h2 className="mt-1 text-xl font-semibold text-label-primary">For Clinicians</h2>

        {/* How Clinicians Use It */}
        <div className="mt-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-label-tertiary mb-3">
            How Clinicians Use This
          </h3>
          <ul className="space-y-2">
            {clinician.how_clinicians_use_it.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-label-tertiary mt-0.5 shrink-0" />
                <span className="text-label-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Workflow Fit Chips */}
        <div className="mt-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-label-tertiary mb-3">
            Workflow Fit
          </h3>
          <div className="flex flex-wrap gap-2">
            {workflowConfigs.map((wf) => (
              <span
                key={wf.workflowSlug}
                className="px-3 py-1.5 bg-surface border border-separator text-label-secondary text-sm rounded-lg"
              >
                {wf.chip_label}
              </span>
            ))}
          </div>
        </div>

        {/* Implementation Notes */}
        {clinician.implementation_notes && (
          <div className="mt-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-label-tertiary mb-3">
              Implementation Notes
            </h3>
            <p className="text-label-secondary p-4 bg-surface border border-separator rounded-xl">
              {clinician.implementation_notes}
            </p>
          </div>
        )}

        {/* Integrations */}
        {clinician.integrations && clinician.integrations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-label-tertiary mb-3">
              Known Integrations
            </h3>
            <div className="flex flex-wrap gap-2">
              {clinician.integrations.map((integration) => (
                <span
                  key={integration}
                  className="px-3 py-1.5 bg-surface border border-separator text-label-secondary text-sm rounded-lg"
                >
                  {integration}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Billing Notes */}
        {clinician.billing_notes && (
          <div className="mt-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-label-tertiary mb-3">
              Billing Notes
            </h3>
            <p className="text-label-secondary p-4 bg-surface border border-separator rounded-xl">
              {clinician.billing_notes}
            </p>
          </div>
        )}

        {/* Related Clinician Hubs */}
        {hubLinks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-separator">
            <h3 className="text-xs font-medium uppercase tracking-wider text-label-tertiary mb-3">
              Explore More Clinician Tools
            </h3>
            <div className="flex flex-wrap gap-2">
              {hubLinks.map((hub) => hub && (
                <Link
                  key={hub.slug}
                  href={hub.url}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 border border-separator rounded-lg text-sm text-label-secondary hover:border-neutral-300 hover:text-accent transition-colors"
                >
                  {hub.display_name}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default ClinicianModule;
