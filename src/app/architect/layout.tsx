// src/app/architect/layout.tsx
// Practice Architect Application Shell
// Landing page shows normal site header; workspace routes have their own layout

import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Practice Architect™",
    template: "%s | Practice Architect™",
  },
};

export default function ArchitectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Landing page uses normal site layout with header/footer
  // Workspace routes under (workspace)/ have their own layout that hides them
  return <>{children}</>;
}
