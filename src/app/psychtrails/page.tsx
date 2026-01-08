import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { OnboardingFlow } from "@/components/psychTrail/onboarding/OnboardingFlow";

export const metadata: Metadata = {
  title: "PsychTrails - Start Your Journey | HeyPsych",
  description: "Begin your mental health navigation journey with PsychTrails. Choose your life stage and start building confidence through interactive scenarios.",
};

/**
 * PsychTrails - Onboarding Entry Point
 *
 * User selects life stage, lens (optional), and context tags (optional)
 * Saves selections to localStorage and redirects to map
 */
export default function PsychTrailsOnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
            <Compass className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Onboarding Flow */}
        <OnboardingFlow />

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
            FAQ
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                What is PsychTrails™?
              </h3>
              <p className="text-base text-neutral-700">
                An interactive, story based platform that turns mental health learning into skill building simulations. Users explore fictional scenarios and practice decisions in a safe, engaging way.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Who is it for?
              </h3>
              <p className="text-base text-neutral-700">
                Schools and SEL programs, college campuses, clinics, and community organizations. Also great for individuals who want a low pressure way to explore and build coping skills.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                What makes it different?
              </h3>
              <p className="text-base text-neutral-700">
                Highly customizable. Scenarios can be tailored by audience, setting, and goals so the experience feels relevant and real.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Is it therapy or medical advice?
              </h3>
              <p className="text-base text-neutral-700">
                No. PsychTrails is educational and fictional, designed to support learning and skill building.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                What skills does it build?
              </h3>
              <p className="text-base text-neutral-700">
                Practical skills like coping strategies, decision making, and help seeking, delivered through interactive storytelling.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                How long does a scenario take?
              </h3>
              <p className="text-base text-neutral-700">
                Most take 5 to 12 minutes, and users can replay different paths.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Do you offer partnerships?
              </h3>
              <p className="text-base text-neutral-700">
                Yes. We work with schools, SEL programs, campuses, and clinics. Email{" "}
                <a
                  href="mailto:hello@heypsych.com"
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  hello@heypsych.com
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
