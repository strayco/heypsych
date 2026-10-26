import type { Metadata } from "next";

/**
 * /psychiatrists is an interactive client page, so its metadata lives here.
 */
export const metadata: Metadata = {
  title: "Find a Psychiatrist",
  description:
    "Search a directory of psychiatrists by name, location, and specialty. Psychiatrists are medical doctors who can diagnose, prescribe medication, and provide ongoing mental health care.",
};

export default function PsychiatristsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
