import { Target, TrendingUp, Sparkles, Brain } from "lucide-react";

/**
 * Product Features - Quick proof of what PsychTrails does
 *
 * Design: Premium dark cards on slightly lighter background
 * Purpose: After the hero, immediately show what the product delivers
 */

const features = [
  {
    icon: Target,
    title: "Real scenarios",
    description: "Practice social anxiety, difficult conversations, and everyday challenges in safe simulations.",
  },
  {
    icon: Brain,
    title: "Build skills",
    description: "Learn through doing, not just reading. Each choice teaches something.",
  },
  {
    icon: TrendingUp,
    title: "Track progress",
    description: "See your improvement with mastery levels, routes discovered, and skills unlocked.",
  },
  {
    icon: Sparkles,
    title: "Transfer to life",
    description: "End each scenario with a concrete next step to try in the real world.",
  },
];

export function ProductFeatures() {
  return (
    <section className="bg-surface px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl bg-surface-grouped/50 border border-separator/30 p-5 text-center"
              >
                <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-tint border border-accent-600/20">
                  <IconComponent className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-label-primary">
                  {feature.title}
                </h3>
                <p className="text-sm text-label-tertiary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
