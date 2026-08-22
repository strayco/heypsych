import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How PsychTrails Works | HeyPsych",
  description:
    "Learn how PsychTrails builds real mental health skills through interactive scenarios. Practice anxiety, social situations, and everyday challenges.",
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
