import Link from "next/link";
import { Brain, Pill, BookOpen, Users, ArrowRight } from "lucide-react";

/**
 * Core Navigation Grid - 2×2
 *
 * Purpose: Efficient routing for intent-driven users
 *
 * Spec Requirements:
 * - 4 tiles in 2×2 grid:
 *   1. Conditions — "Understand your symptoms"
 *   2. Treatments — "Explore your options"
 *   3. Resources — "Tools & Assessments"
 *   4. Find Psychiatrists — "Connect with care"
 * - Use existing Card component
 * - Desktop: strict 2×2 grid
 * - Mobile/tablet: stack or 2-across
 * - Hover states must match current card behavior
 */

const navigationItems = [
  {
    title: "Treatments",
    stat: "500+ Treatment Options",
    description: "Explore evidence-based mental health treatments and therapies",
    cta: "Explore Treatments",
    href: "/treatments",
    icon: Pill,
    gradient: "from-purple-500 to-pink-500",
    hoverGradient: "group-hover:from-purple-600 group-hover:to-pink-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    emoji: "💊",
  },
  {
    title: "Conditions",
    stat: "200+ Conditions Covered",
    description: "Learn about mental health conditions and symptoms",
    cta: "Explore Conditions",
    href: "/conditions",
    icon: Brain,
    gradient: "from-blue-500 to-cyan-500",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-cyan-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    emoji: "🧠",
  },
  {
    title: "Resources",
    stat: "100+ Clinical Resources",
    description: "Access clinical tools, assessments, and educational materials",
    cta: "Explore Resources",
    href: "/resources",
    icon: BookOpen,
    gradient: "from-emerald-500 to-teal-500",
    hoverGradient: "group-hover:from-emerald-600 group-hover:to-teal-600",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
    emoji: "📚",
  },
  {
    title: "Find Psychiatrists",
    stat: "60,000+ Psychiatrists",
    description: "Connect with qualified psychiatrists",
    cta: "Explore Find Psychiatrists",
    href: "/psychiatrists",
    icon: Users,
    gradient: "from-amber-500 to-orange-500",
    hoverGradient: "group-hover:from-amber-600 group-hover:to-orange-600",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
    emoji: "👥",
  },
];

export function NavigationGrid() {
  return (
    <section className="bg-gradient-to-br from-white via-slate-50 to-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group block">
                <div className="relative h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg transition-all duration-500 group-hover:-translate-y-1 hover:shadow-xl">
                  {/* Gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} ${item.hoverGradient} opacity-5 transition-opacity duration-500 group-hover:opacity-10`}
                  />

                  {/* Content */}
                  <div className="relative p-6 flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`inline-flex rounded-xl p-3 ${item.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                        <IconComponent className={`h-6 w-6 ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="text-xl font-bold text-neutral-900">
                            {item.title}
                          </h3>
                          <span className="text-xl">{item.emoji}</span>
                        </div>
                        <p className="text-lg font-semibold text-neutral-700">{item.stat}</p>
                      </div>
                    </div>
                    <p className="text-base text-neutral-700 mb-4 flex-1">{item.description}</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-900 group-hover:gap-3 transition-all">
                      <span>{item.cta}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Hover ring effect */}
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 group-hover:ring-slate-200" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
