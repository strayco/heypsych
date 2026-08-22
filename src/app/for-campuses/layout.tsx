import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PsychTrails for Campuses | HeyPsych",
  description:
    "Deploy PsychTrails at your university. Help students practice hard moments before they struggle. Privacy-first, zero burden on staff.",
};

export default function ForCampusesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
