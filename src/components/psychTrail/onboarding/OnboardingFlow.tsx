"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Users, Home, ArrowRight, Brain, Zap, Tag } from "lucide-react";
import type { LifeStage, Lens } from "@/lib/psychTrail/types";
import { saveUserProfile, initializeCampaignProgress } from "@/lib/psychTrail/storage";
import { LifeStageCard } from "./LifeStageCard";
import { LensCard } from "./LensCard";
import { Button } from "@/components/ui/button";

export function OnboardingFlow() {
  const router = useRouter();
  const [selectedStage, setSelectedStage] = useState<LifeStage | null>(null);
  const [selectedLens, setSelectedLens] = useState<Lens | null>(null);
  const [validationError, setValidationError] = useState<string>("");

  const handleStart = () => {
    // Validate life stage
    if (!selectedStage) {
      setValidationError("Please select a life stage.");
      return;
    }

    // Validate lens - MUST be social_anxiety
    if (selectedLens !== "social_anxiety") {
      setValidationError("Select Social Anxiety to begin.");
      return;
    }

    // Clear error
    setValidationError("");

    // Save profile with social_anxiety lens
    saveUserProfile(selectedStage, "social_anxiety", []);

    // Initialize campaign progress
    const profile = {
      lifeStage: selectedStage,
      lens: "social_anxiety" as const,
      contextTags: [],
      onboardedAt: Date.now(),
    };
    initializeCampaignProgress(profile);

    // Redirect to map
    router.push("/psychtrails/map");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-3 text-4xl font-bold text-neutral-900">
          Welcome to PsychTrails
        </h1>
        <p className="text-lg text-neutral-700">
          Choose your journey to start building mental health navigation skills
        </p>
      </div>

      {/* Life Stage Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">
          Choose Your Life Stage
        </h2>

        <div className="space-y-3">
          <LifeStageCard
            stage="teen"
            title="Teen (13-17)"
            description="Navigate high school, family, and early mental health experiences"
            icon={Users}
            selected={selectedStage === "teen"}
            disabled={false}
            onSelect={() => setSelectedStage("teen")}
          />

          <LifeStageCard
            stage="college"
            title="College (18-24)"
            description="Manage campus life, independence, and mental health care transitions"
            icon={GraduationCap}
            selected={selectedStage === "college"}
            disabled={false}
            onSelect={() => setSelectedStage("college")}
          />

          <LifeStageCard
            stage="parent"
            title="Parent (Mid-30s)"
            description="Balance parenting responsibilities with your own mental health needs"
            icon={Home}
            selected={selectedStage === "parent"}
            disabled={true}
            onSelect={() => setSelectedStage("parent")}
          />
        </div>
      </div>

      {/* Lens Pack Selection (REQUIRED) */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">
          Choose Your Lens <span className="text-sm font-normal text-red-600">(Required)</span>
        </h2>
        <p className="text-sm text-neutral-600">
          Scenarios are designed for specific challenges. Select your lens to continue.
        </p>

        <div className="space-y-3">
          <LensCard
            lens="social_anxiety"
            title="Social Anxiety"
            description="Practice navigating social situations, small talk, asking for help, and managing spotlight fears"
            icon={Brain}
            selected={selectedLens === "social_anxiety"}
            disabled={false}
            onSelect={() => setSelectedLens("social_anxiety")}
          />

          <LensCard
            lens="adhd"
            title="ADHD"
            description="Build systems for focus, time management, and executive function challenges"
            icon={Zap}
            selected={selectedLens === "adhd"}
            disabled={true}
            onSelect={() => setSelectedLens("adhd")}
          />
        </div>
      </div>

      {/* Context Packs (Disabled/Coming Soon) */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900 opacity-50">
          Context Packs <span className="text-sm font-normal">(Coming soon)</span>
        </h2>

        <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 opacity-50">
          <div className="flex items-center gap-3 text-neutral-500">
            <Tag className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Optional context tags will be available soon</p>
              <p className="mt-1 text-xs">Examples: First-gen, Family pressure, Care access friction, Stigma</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm font-semibold text-red-900">{validationError}</p>
        </div>
      )}

      {/* Start button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleStart}
          disabled={!selectedStage || !selectedLens}
          size="lg"
          className="gap-2 px-8 py-6 text-lg"
        >
          Start Your Journey
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Educational disclaimer */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-700">
        <p className="font-semibold text-neutral-900">Educational Disclaimer</p>
        <p className="mt-1">
          PsychTrails is an educational simulation for learning purposes only. It does not
          constitute medical advice. Real treatment decisions should always be made with
          qualified mental health professionals.
        </p>
      </div>
    </div>
  );
}
