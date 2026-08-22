import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Pill } from "lucide-react";

/**
 * Resources Teaser - De-emphasized content layer
 *
 * Design: Subtle section that acknowledges content exists
 * but positions it as supporting material, not the main product.
 */

const resourceLinks = [
  {
    icon: Brain,
    label: "Conditions",
    description: "200+ mental health conditions explained",
    href: "/conditions",
  },
  {
    icon: Pill,
    label: "Treatments",
    description: "500+ medications, therapies, and approaches",
    href: "/treatments",
  },
  {
    icon: BookOpen,
    label: "Guides",
    description: "Articles, research, and how-to guides",
    href: "/resources/knowledge-hub",
  },
];

export function ResourcesTeaser() {
  return (
    <section className="border-t border-separator bg-canvas px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-label-primary0">
            Supporting Resources
          </p>
          <h2 className="text-xl font-semibold text-label-secondary">
            Learn more about mental health
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {resourceLinks.map((resource) => {
            const IconComponent = resource.icon;
            return (
              <Link
                key={resource.label}
                href={resource.href}
                className="group flex items-start gap-3 rounded-xl bg-canvas border border-separator p-4 transition-all hover:border-separator hover:bg-surface"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-grouped transition-colors group-hover:bg-fill-secondary">
                  <IconComponent className="h-5 w-5 text-label-tertiary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-label-secondary group-hover:text-label-primary">{resource.label}</span>
                    <ArrowRight className="h-3 w-3 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-label-tertiary" />
                  </div>
                  <p className="mt-0.5 text-sm text-label-primary0">{resource.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/resources"
            className="text-sm text-label-primary0 transition-colors hover:text-label-secondary"
          >
            View all resources →
          </Link>
        </div>
      </div>
    </section>
  );
}
