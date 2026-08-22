import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * How It Works Preview - Quick explanation before committing
 *
 * Design: Clean dark section with numbered steps
 * Purpose: Show the 3-step process so users understand what they're getting into
 */

const steps = [
  {
    number: "1",
    title: "Choose a scenario",
    description: "Pick from real-life situations like social anxiety, difficult conversations, or asking for help.",
  },
  {
    number: "2",
    title: "Make choices",
    description: "Navigate through branching decisions. Each path teaches different patterns and skills.",
  },
  {
    number: "3",
    title: "Build skills",
    description: "See what worked, what showed up, and get a concrete next step for real life.",
  },
];

export function HowItWorksPreview() {
  return (
    <section className="bg-canvas px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-10 text-center text-2xl font-semibold text-label-primary sm:text-3xl">
          How it works
        </h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connection line on desktop */}
              {index < steps.length - 1 && (
                <div className="absolute top-5 left-[calc(50%+28px)] hidden h-px w-[calc(100%-56px)] bg-fill-secondary sm:block" />
              )}

              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent-600 text-base font-bold text-white shadow-soft">
                  {step.number}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-label-primary">
                  {step.title}
                </h3>
                <p className="text-sm text-label-tertiary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent-700"
          >
            Learn more about the science
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
