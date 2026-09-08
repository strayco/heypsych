import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search HeyPsych for conditions, treatments, and mental health resources.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
