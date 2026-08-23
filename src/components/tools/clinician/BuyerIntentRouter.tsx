"use client";

// BuyerIntentRouter Component
// Role selector and practice needs router for clinician tools

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Building2,
  Users,
  User,
  ChevronRight,
  Sparkles,
  Receipt,
  Video,
  Mic,
  Calendar,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BuyerIntentRouterProps {
  className?: string;
}

type Role = "psychiatrist" | "therapist" | "admin" | "group-practice";
type Need =
  | "documentation"
  | "billing"
  | "telehealth"
  | "ehr"
  | "scheduling"
  | "outcomes";

const roles: {
  id: Role;
  label: string;
  description: string;
  icon: typeof Stethoscope;
}[] = [
  {
    id: "psychiatrist",
    label: "Psychiatrist",
    description: "Prescribing clinician",
    icon: Stethoscope,
  },
  {
    id: "therapist",
    label: "Therapist / Counselor",
    description: "LCSW, LMFT, LPC, Psychologist",
    icon: User,
  },
  {
    id: "group-practice",
    label: "Group Practice",
    description: "Multi-provider team",
    icon: Users,
  },
  {
    id: "admin",
    label: "Practice Admin",
    description: "Operations & billing",
    icon: Building2,
  },
];

const needs: {
  id: Need;
  label: string;
  category: string;
  icon: typeof Mic;
}[] = [
  {
    id: "documentation",
    label: "Save time on notes",
    category: "ai-scribe-documentation",
    icon: Mic,
  },
  {
    id: "billing",
    label: "Streamline billing",
    category: "billing-rcm",
    icon: Receipt,
  },
  {
    id: "telehealth",
    label: "Telehealth platform",
    category: "telehealth-communication",
    icon: Video,
  },
  {
    id: "ehr",
    label: "EHR / Practice management",
    category: "ehr-practice-management",
    icon: Sparkles,
  },
  {
    id: "scheduling",
    label: "Scheduling & intake",
    category: "scheduling-intake",
    icon: Calendar,
  },
  {
    id: "outcomes",
    label: "Track outcomes",
    category: "measurement-outcomes",
    icon: LineChart,
  },
];

export function BuyerIntentRouter({ className }: BuyerIntentRouterProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [step, setStep] = useState<"role" | "need">("role");

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep("need");
  };

  const handleNeedSelect = (need: Need) => {
    const needData = needs.find((n) => n.id === need);
    if (needData) {
      // Build search URL with role and category filters
      const params = new URLSearchParams({
        category: needData.category,
        ...(selectedRole && { role: selectedRole }),
      });
      router.push(`/tools/for-clinicians/${needData.category}/?${params.toString()}`);
    }
  };

  const handleBack = () => {
    setStep("role");
    setSelectedRole(null);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-separator bg-surface p-6",
        className
      )}
    >
      {step === "role" ? (
        <>
          <h3 className="text-lg font-semibold text-label-primary">
            What&apos;s your role?
          </h3>
          <p className="mt-1 text-sm text-label-secondary">
            We&apos;ll tailor recommendations to your needs
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-separator p-4 text-left transition-all",
                    "hover:border-treatment/30 hover:bg-treatment/5"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-treatment/10">
                    <Icon className="h-5 w-5 text-treatment" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-label-primary group-hover:text-treatment transition-colors">
                      {role.label}
                    </p>
                    <p className="text-xs text-label-tertiary">{role.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-label-quaternary group-hover:text-treatment transition-colors" />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="text-sm text-label-secondary hover:text-label-primary transition-colors"
            >
              Back
            </button>
            <span className="text-label-quaternary">/</span>
            <span className="text-sm font-medium text-treatment">
              {roles.find((r) => r.id === selectedRole)?.label}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-label-primary">
            What do you need help with?
          </h3>
          <p className="mt-1 text-sm text-label-secondary">
            Select your primary need to see relevant tools
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {needs.map((need) => {
              const Icon = need.icon;
              return (
                <button
                  key={need.id}
                  onClick={() => handleNeedSelect(need.id)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-separator p-4 text-left transition-all",
                    "hover:border-treatment/30 hover:bg-treatment/5"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-label-primary group-hover:text-treatment transition-colors">
                      {need.label}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-label-quaternary group-hover:text-treatment transition-colors" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default BuyerIntentRouter;
