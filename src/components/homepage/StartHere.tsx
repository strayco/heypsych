"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const randomPages = [
  // Specific conditions
  "/conditions/major-depressive-disorder",
  "/conditions/bipolar-i-disorder",
  "/conditions/panic-disorder",
  "/conditions/social-anxiety-disorder",
  "/conditions/attention-deficit-hyperactivity-disorder",
  "/conditions/posttraumatic-stress-disorder",
  "/conditions/obsessive-compulsive-disorder",
  "/conditions/anorexia-nervosa",
  "/conditions/schizophrenia",
  "/conditions/alcohol",
  // Specific treatments
  "/treatments/citalopram-celexa",
  "/treatments/escitalopram-lexapro",
  "/treatments/fluoxetine-prozac",
  "/treatments/bupropion-wellbutrin",
  "/treatments/transcranial-magnetic-stimulation",
  "/treatments/electroconvulsive-therapy",
  "/treatments/cognitive-behavioral-therapy",
  "/treatments/meditation",
  "/treatments/yoga-therapy",
  // Specific resources
  "/resources/phq-9",
  "/resources/gad-7",
  "/resources/headspace",
  "/resources/calm",
  // Articles & Knowledge Hub
  "/resources/knowledge-hub/research-and-science/mental-health-trends/ketamine-therapy-2024",
  "/resources/knowledge-hub/research-and-science/mental-health-trends/adhd-medication-shortage",
  "/resources/knowledge-hub/research-and-science/mental-health-trends/ai-therapy-apps",
  "/resources/knowledge-hub/research-and-science/psychology/exercise-antidepressant-study",
  "/resources/knowledge-hub/research-and-science/psychology/psychedelics-depression-study",
  "/resources/knowledge-hub/research-and-science/psychology/sleep-mental-health-link",
  "/resources/knowledge-hub/how-to-guides/therapy-access/finding-a-therapist",
  "/resources/knowledge-hub/how-to-guides/therapy-access/find-adhd-therapist",
  "/resources/knowledge-hub/how-to-guides/health-systems/manage-anxiety-attacks",
  "/resources/knowledge-hub/how-to-guides/health-systems/talk-to-doctor-antidepressants",
  "/resources/knowledge-hub/community-and-stories/personal-stories/adhd-women-thirties",
  "/resources/knowledge-hub/community-and-stories/personal-stories/bipolar-diagnosis-journey",
  "/resources/knowledge-hub/community-and-stories/personal-stories/ocd-intrusive-thoughts",
];

export function StartHere() {
  const router = useRouter();

  const handleRandomClick = () => {
    const randomPage = randomPages[Math.floor(Math.random() * randomPages.length)];
    router.push(randomPage);
  };

  return (
    <section className="bg-canvas px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <Button
          variant="primary"
          size="lg"
          className="min-h-12"
          onClick={handleRandomClick}
        >
          Take me anywhere
        </Button>
      </div>
    </section>
  );
}
