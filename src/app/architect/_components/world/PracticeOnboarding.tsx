/**
 * Step One: Your Practice
 *
 * The shortest honest set of questions needed to build a correct world.
 *
 * Two clinical rules shape this form:
 * - Services are asked directly, never inferred from job title. A psychologist
 *   who does not do testing must not be given a testing kit.
 * - Prescribing scope is asked explicitly, because prescribing authority
 *   depends on credential, state, and DEA registration, not on a role label.
 *
 * No patient information is collected here, and none is needed.
 */

"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  CLINICAL_ROLE_LABELS,
  DELIVERY_MODEL_LABELS,
  PRACTICE_SIZE_LABELS,
  US_STATES,
  type ClinicalRole,
  type DeliveryModel,
  type PracticeSizeBucket,
  type USState,
} from "@/domains/architect/schemas/fingerprint";
import {
  PAYMENT_MODEL_LABELS,
  PRACTICE_SERVICE_LABELS,
  PRACTICE_STAGE_LABELS,
  PRESCRIBING_SCOPE_LABELS,
  type PaymentModel,
  type PracticeProfile,
  type PracticeService,
  type PracticeStage,
  type PrescribingScope,
} from "@/domains/architect/schemas/practice-project";
import { hasPrescribingRole } from "@/domains/architect/adapters/profile-to-fingerprint";
import { ClinicianWorldScene } from "@/components/home/worlds/ClinicianWorldScene";
import { WorldDefs } from "@/components/home/worlds/WorldDefs";
import worldStyles from "@/components/home/worlds/worlds.module.css";

interface PracticeOnboardingProps {
  initialProfile: PracticeProfile;
  onComplete: (profile: PracticeProfile) => void;
}

type StepId = "roles" | "shape" | "services" | "prescribing";

export function PracticeOnboarding({
  initialProfile,
  onComplete,
}: PracticeOnboardingProps) {
  const [profile, setProfile] = useState<PracticeProfile>(initialProfile);
  const [stepIndex, setStepIndex] = useState(0);

  const set = <K extends keyof PracticeProfile>(
    key: K,
    value: PracticeProfile[K]
  ) => setProfile((prev) => ({ ...prev, [key]: value }));

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  // The prescribing question only appears when a prescribing role is present.
  const steps = useMemo<StepId[]>(() => {
    const base: StepId[] = ["roles", "shape", "services"];
    return hasPrescribingRole(profile.roles) ? [...base, "prescribing"] : base;
  }, [profile.roles]);

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex >= steps.length - 1;

  const canAdvance = (() => {
    switch (step) {
      case "roles":
        return profile.roles.length > 0;
      case "shape":
        return Boolean(
          profile.size && profile.states.length > 0 && profile.delivery && profile.payment
        );
      case "services":
        return profile.services.length > 0;
      case "prescribing":
        return Boolean(profile.prescribing);
    }
  })();

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
    <div className="w-full max-w-xl">
      <h1 className="sr-only">Practice Architect: tell us about your practice</h1>
      {/* Progress */}
      <div className="mb-8 flex items-center gap-1.5" aria-hidden>
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? "bg-accent" : "bg-fill-tertiary"
            }`}
          />
        ))}
      </div>

      {step === "roles" && (
        <Fieldset
          title="Who works in your practice?"
          hint="Choose everyone who sees patients or runs the business."
        >
          <OptionGrid>
            {(Object.keys(CLINICAL_ROLE_LABELS) as ClinicalRole[]).map(
              (role) => (
                <Choice
                  key={role}
                  selected={profile.roles.includes(role)}
                  onClick={() => set("roles", toggle(profile.roles, role))}
                >
                  {CLINICAL_ROLE_LABELS[role]}
                </Choice>
              )
            )}
          </OptionGrid>

          <SubField label="Where is your practice right now?">
            <OptionGrid>
              {(Object.keys(PRACTICE_STAGE_LABELS) as PracticeStage[]).map(
                (stage) => (
                  <Choice
                    key={stage}
                    selected={profile.stage === stage}
                    onClick={() => set("stage", stage)}
                  >
                    {PRACTICE_STAGE_LABELS[stage]}
                  </Choice>
                )
              )}
            </OptionGrid>
          </SubField>
        </Fieldset>
      )}

      {step === "shape" && (
        <Fieldset
          title="How does your practice run?"
          hint="This determines which tools are even available to you."
        >
          <SubField label="How many providers?">
            <OptionGrid>
              {(Object.keys(PRACTICE_SIZE_LABELS) as PracticeSizeBucket[]).map(
                (size) => (
                  <Choice
                    key={size}
                    selected={profile.size === size}
                    onClick={() => set("size", size)}
                  >
                    {PRACTICE_SIZE_LABELS[size]}
                  </Choice>
                )
              )}
            </OptionGrid>
          </SubField>

          <SubField label="Which state do you primarily practise in?">
            <select
              value={profile.states[0] ?? ""}
              onChange={(e) =>
                set("states", e.target.value ? [e.target.value as USState] : [])
              }
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2.5 text-sm text-label-primary"
            >
              <option value="">Select a state</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </SubField>

          <SubField label="How do you see patients?">
            <OptionGrid>
              {(Object.keys(DELIVERY_MODEL_LABELS) as DeliveryModel[]).map(
                (delivery) => (
                  <Choice
                    key={delivery}
                    selected={profile.delivery === delivery}
                    onClick={() => set("delivery", delivery)}
                  >
                    {DELIVERY_MODEL_LABELS[delivery]}
                  </Choice>
                )
              )}
            </OptionGrid>
          </SubField>

          <SubField label="How do you get paid?">
            <OptionGrid>
              {(Object.keys(PAYMENT_MODEL_LABELS) as PaymentModel[]).map(
                (payment) => (
                  <Choice
                    key={payment}
                    selected={profile.payment === payment}
                    onClick={() => set("payment", payment)}
                  >
                    {PAYMENT_MODEL_LABELS[payment]}
                  </Choice>
                )
              )}
            </OptionGrid>
          </SubField>
        </Fieldset>
      )}

      {step === "services" && (
        <Fieldset
          title="What do you actually offer?"
          hint="We build your office from the work you do, not from your job title."
        >
          <OptionGrid>
            {(Object.keys(PRACTICE_SERVICE_LABELS) as PracticeService[]).map(
              (service) => (
                <Choice
                  key={service}
                  selected={profile.services.includes(service)}
                  onClick={() =>
                    set("services", toggle(profile.services, service))
                  }
                >
                  {PRACTICE_SERVICE_LABELS[service]}
                </Choice>
              )
            )}
          </OptionGrid>
        </Fieldset>
      )}

      {step === "prescribing" && (
        <Fieldset
          title="Do you prescribe?"
          hint="Controlled substances require EPCS-certified prescribing, which rules some tools out."
        >
          <OptionGrid>
            {(
              Object.keys(PRESCRIBING_SCOPE_LABELS) as PrescribingScope[]
            ).map((scope) => (
              <Choice
                key={scope}
                selected={profile.prescribing === scope}
                onClick={() => set("prescribing", scope)}
              >
                {PRESCRIBING_SCOPE_LABELS[scope]}
              </Choice>
            ))}
          </OptionGrid>
        </Fieldset>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium text-label-secondary transition-colors hover:bg-fill-quaternary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:invisible"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          onClick={() =>
            isLast ? onComplete(profile) : setStepIndex((i) => i + 1)
          }
          disabled={!canAdvance}
          className="inline-flex items-center gap-1.5 rounded-full bg-label-primary px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-label-primary"
        >
          {isLast ? "Build my practice" : "Continue"}
          {isLast ? (
            <Check className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>

      {/* The office the visitor chose on the homepage, waiting to be
          furnished. It is the same miniature, shown in its lit state so
          arriving here reads as stepping into it. It is not configured:
          nothing in it reflects these answers until the practice is built. */}
      <aside aria-hidden="true" className="hidden lg:block">
        <WorldDefs />
        <div className={worldStyles.world} data-selected="true">
          <div className="relative aspect-[916/668] w-full">
            <ClinicianWorldScene />
          </div>
        </div>
        <p className="mx-auto mt-2 max-w-sm text-center text-[14px] leading-relaxed text-label-tertiary">
          Your answers decide what this room needs. Next, you&apos;ll furnish it one
          function at a time.
        </p>
      </aside>
    </div>
  );
}

// ============================================================================
// PIECES
// ============================================================================

function Fieldset({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] text-label-primary sm:text-[2.4rem]">
        {title}
      </legend>
      <p className="mt-2 text-[15px] text-label-secondary">{hint}</p>
      <div className="mt-6 space-y-6">{children}</div>
    </fieldset>
  );
}

function SubField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-label-primary">{label}</p>
      {children}
    </div>
  );
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
  );
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border px-3.5 py-3 text-left text-sm transition-colors ${
        selected
          ? "border-accent bg-accent/8 font-medium text-label-primary"
          : "border-separator bg-surface text-label-secondary hover:bg-fill-quaternary"
      }`}
    >
      {children}
    </button>
  );
}
