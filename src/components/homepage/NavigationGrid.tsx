import Link from "next/link";
import { Brain, Pill, BookOpen, Users, ArrowRight } from "lucide-react";

/**
 * Core Navigation Grid - 2×2
 *
 * Purpose: Efficient routing for intent-driven users
 * Minimal, chic design with neutral colors
 */

const navigationItems = [
  {
    title: "Treatments",
    stat: "500+ Treatment Options",
    description: "Explore evidence-based mental health treatments and therapies",
    cta: "Explore Treatments",
    href: "/treatments",
    icon: Pill,
  },
  {
    title: "Conditions",
    stat: "200+ Conditions Covered",
    description: "Learn about mental health conditions and symptoms",
    cta: "Explore Conditions",
    href: "/conditions",
    icon: Brain,
  },
  {
    title: "Resources",
    stat: "100+ Clinical Resources",
    description: "Access clinical tools, assessments, and educational materials",
    cta: "Explore Resources",
    href: "/resources",
    icon: BookOpen,
  },
  {
    title: "Find Psychiatrists",
    stat: "60,000+ Psychiatrists",
    description: "Connect with qualified psychiatrists",
    cta: "Explore Find Psychiatrists",
    href: "/psychiatrists",
    icon: Users,
  },
];

export function NavigationGrid() {
  return (
    <section className="bg-canvas px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group block">
                <div className="h-full rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-neutral-300 hover:shadow-soft">
                  <div className="flex items-start gap-4 mb-4">
                    <IconComponent className="h-6 w-6 text-label-tertiary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-label-primary group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-label-tertiary mt-0.5">{item.stat}</p>
                    </div>
                  </div>
                  <p className="text-sm text-label-secondary mb-4">{item.description}</p>
                  <div className="flex items-center gap-2 text-sm font-medium text-label-primary">
                    <span>{item.cta}</span>
                    <ArrowRight className="h-4 w-4 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
