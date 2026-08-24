// src/app/architect/_components/ArchitectLoading.tsx
// Loading state for Architect workspace

"use client";

import { Building2 } from "lucide-react";

export function ArchitectLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <Building2 className="h-8 w-8 text-accent animate-pulse" />
        </div>
        <p className="mt-4 text-label-secondary">Loading Architect...</p>
      </div>
    </div>
  );
}
