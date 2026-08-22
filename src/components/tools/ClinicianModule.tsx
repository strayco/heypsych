"use client";

import Link from "next/link";
import { Stethoscope, CheckCircle, Info, ArrowRight } from "lucide-react";
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
    <section className="bg-gradient-to-br from-blue-50 via-surface to-indigo-50 border-y border-accent-border">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent-tint-hover rounded-lg">
            <Stethoscope className="h-5 w-5 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-label-primary">For Clinicians</h2>
        </div>

        {/* How Clinicians Use It */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-label-secondary uppercase tracking-wide mb-3">
            How Clinicians Use This
          </h3>
          <ul className="space-y-2">
            {clinician.how_clinicians_use_it.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span className="text-label-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Workflow Fit Chips */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-label-secondary uppercase tracking-wide mb-3">
            Workflow Fit
          </h3>
          <div className="flex flex-wrap gap-2">
            {workflowConfigs.map((wf) => (
              <span
                key={wf.workflowSlug}
                className="px-3 py-1.5 bg-accent-tint-hover text-accent-700 text-sm font-medium rounded-full"
              >
                {wf.chip_label}
              </span>
            ))}
          </div>
        </div>

        {/* Implementation Notes */}
        {clinician.implementation_notes && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-label-secondary uppercase tracking-wide mb-3">
              Implementation Notes
            </h3>
            <div className="flex items-start gap-2 p-4 bg-surface border border-accent-border rounded-lg">
              <Info className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <p className="text-label-secondary">{clinician.implementation_notes}</p>
            </div>
          </div>
        )}

        {/* Integrations */}
        {clinician.integrations && clinician.integrations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-label-secondary uppercase tracking-wide mb-3">
              Known Integrations
            </h3>
            <div className="flex flex-wrap gap-2">
              {clinician.integrations.map((integration) => (
                <span
                  key={integration}
                  className="px-3 py-1.5 bg-surface-grouped text-label-secondary text-sm rounded-full"
                >
                  {integration}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Billing Notes */}
        {clinician.billing_notes && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-label-secondary uppercase tracking-wide mb-3">
              Billing Notes
            </h3>
            <p className="text-label-secondary bg-surface p-4 border border-separator rounded-lg">
              {clinician.billing_notes}
            </p>
          </div>
        )}

        {/* Related Clinician Hubs */}
        {hubLinks.length > 0 && (
          <div className="pt-4 border-t border-accent-border">
            <h3 className="text-sm font-semibold text-label-secondary uppercase tracking-wide mb-3">
              Explore More Clinician Tools
            </h3>
            <div className="flex flex-wrap gap-3">
              {hubLinks.map((hub) => hub && (
                <Link
                  key={hub.slug}
                  href={hub.url}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-surface border border-accent-border rounded-lg text-sm font-medium text-accent-700 hover:bg-accent-tint hover:border-accent-600 transition-colors"
                >
                  {hub.display_name}
                  <ArrowRight className="h-3 w-3" />
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
