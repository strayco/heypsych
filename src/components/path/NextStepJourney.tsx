"use client";

/**
 * Find your next step: the live decision board.
 *
 * Safety first: one question, always asked, never pre-filled. "In crisis"
 * shows crisis help only and nothing else.
 *
 * Then everything on one board: the answers as chips on one side, the
 * clinician-reviewed evaluator's result on the other, recomputed on every
 * tap. The board says when the step changed and why, how sure it is, what
 * would sharpen it, and which single change would lead somewhere else
 * (`whatIfs`, the same evaluator on one-answer variations). Nothing is a
 * diagnosis.
 *
 * Answers pre-selected from the visitor's own notes are labelled and
 * editable. Answers stay in this browser; the visitor chooses whether to keep
 * the result. Analytics carry step names, counts and the path id only.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getSupportPath } from "@/domains/patient-support/paths";
import {
  trackActionClicked,
  trackCrisisShown,
  trackStepCompleted,
  trackSupportJourneyCompleted,
  trackSupportJourneyStarted,
  trackSupportPathShown,
  trackUrgencyCompleted,
} from "@/domains/patient-support/analytics";
import type {
  InsurancePreference,
  PriorSupportLevel,
  SupportGoal,
  SupportPathResult,
  SymptomDuration,
  UrgencyLevel,
} from "@/domains/patient-support/types";
import type { SymptomCategory, SymptomCategoryMeta } from "@/domains/symptoms/types";
import {
  DURATION_LABELS,
  GOAL_LABELS,
  PAY_LABELS,
  PRIOR_LABELS,
  destinationsFor,
  evaluate,
  prefillFromNoticed,
  keepNextStep,
  whatIfs,
  type NextStepAnswers,
  type SymptomRef,
} from "@/domains/path";
import { markFirstInteraction, trackPathEvent } from "./analytics";
import { usePath } from "./store";

type Calm = Exclude<UrgencyLevel, "immediate-crisis">;
type Field = "concerns" | "duration" | "goals" | "prior" | "pay";

const URGENCY: { id: UrgencyLevel; label: string; hint: string }[] = [
  { id: "planning-ahead", label: "I'm okay right now", hint: "I'm looking into options" },
  { id: "struggling-now", label: "I'm struggling", hint: "I'd like help soon" },
  { id: "immediate-crisis", label: "I'm in crisis", hint: "Or thinking about harming myself" },
];

const CONFIDENCE: Record<SupportPathResult["confidence"], { level: 1 | 2 | 3; label: string; text: string }> = {
  "needs-exploration": { level: 1, label: "A starting point", text: "Little to go on yet. Each answer sharpens it." },
  "reasonable-options": { level: 2, label: "A reasonable place to start", text: "This fits, and so could the options below." },
  "clear-path": { level: 3, label: "A clear fit", text: "What you've told us points here fairly directly." },
};

const MISSING_FIELD: Record<string, Field> = {
  "what you're experiencing": "concerns",
  "how long this has been affecting you": "duration",
  "what you're hoping to get from support": "goals",
  "your prior experience with mental health support": "prior",
};

const JOURNEY_STEP: Record<Field, "concerns" | "duration" | "goals" | "prior-support" | "insurance"> = {
  concerns: "concerns",
  duration: "duration",
  goals: "goals",
  prior: "prior-support",
  pay: "insurance",
};

function Chip({
  on,
  onClick,
  children,
  disabled,
  multi,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={on}
      onClick={onClick}
      disabled={disabled}
      className={`focus-visible:ring-accent min-h-11 rounded-full border px-4 text-[15px] transition-[background-color,border-color,color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100 ${
        on ? "border-label-primary bg-label-primary text-canvas" : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
      }`}
    >
      {on && multi && <span aria-hidden="true">✓ </span>}
      {children}
    </button>
  );
}

function Group({
  id,
  title,
  hint,
  answered,
  fromNotes,
  multi,
  children,
}: {
  id: Field;
  title: string;
  hint?: string;
  answered: boolean;
  fromNotes?: boolean;
  multi?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset id={`q-${id}`} className="border-separator scroll-mt-32 border-t pt-5 first:border-t-0 first:pt-0">
      <legend className="flex w-full flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] transition-colors ${answered ? "bg-positive text-white" : "border-separator-opaque border"}`}
        >
          {answered ? "✓" : ""}
        </span>
        <span className="text-label-primary text-[17px] font-semibold">{title}</span>
        {fromNotes && <span className="bg-accent-tint text-label-secondary rounded-full px-2.5 py-0.5 text-[12px]">from your notes</span>}
      </legend>
      {hint && <p className="text-label-secondary mt-1 ml-7 text-[14px]">{hint}</p>}
      <div role={multi ? "group" : "radiogroup"} aria-label={title} className="mt-3 ml-7 flex flex-wrap gap-2">
        {children}
      </div>
    </fieldset>
  );
}

function ConfidenceMeter({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span aria-hidden="true" className="flex gap-1">
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-1.5 w-7 rounded-full transition-colors duration-300 ${n <= level ? "bg-canvas" : "bg-canvas/25"}`} />
      ))}
    </span>
  );
}

function CrisisView({ onBack, headingRef }: { onBack: () => void; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <section aria-labelledby="journey-q" className="space-y-6">
      <h2 id="journey-q" ref={headingRef} tabIndex={-1} className="font-display text-label-primary text-[32px] leading-tight focus:outline-none sm:text-[38px]">
        You don&apos;t have to go through this alone
      </h2>
      <p className="text-label-secondary text-[17px] leading-relaxed">Talk to a trained counselor now. It&apos;s free, confidential and open all day and night.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <a href="tel:988" className="bg-label-primary focus-visible:ring-accent flex min-h-16 flex-col justify-center rounded-2xl px-5 py-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
          <span className="text-canvas text-[19px] font-semibold">Call or text 988</span>
          <span className="text-canvas/80 text-[14px]">Suicide &amp; Crisis Lifeline (US)</span>
        </a>
        <a href="sms:741741&body=HOME" className="border-separator bg-surface focus-visible:ring-accent flex min-h-16 flex-col justify-center rounded-2xl border px-5 py-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
          <span className="text-label-primary text-[19px] font-semibold">Text HOME to 741741</span>
          <span className="text-label-secondary text-[14px]">Crisis Text Line</span>
        </a>
      </div>
      <p className="text-label-primary text-[16px]">If you&apos;re in immediate danger, call 911.</p>
      <p className="text-label-secondary text-[15px]">
        <Link href="/resources/support-community/immediate-crisis" className="font-medium underline underline-offset-2">
          More crisis resources
        </Link>
        {" · "}
        <button type="button" onClick={onBack} className="text-label-primary font-medium underline underline-offset-2">
          When you&apos;re ready, look at ongoing support
        </button>
      </p>
    </section>
  );
}

export function NextStepJourney({ categories, refs }: { categories: SymptomCategoryMeta[]; refs: SymptomRef[] }) {
  const { snapshot, ready, update } = usePath();
  const reduce = useReducedMotion();
  const [urgency, setUrgency] = useState<UrgencyLevel | null>(null);
  const [answers, setAnswers] = useState<NextStepAnswers>({ primaryConcerns: [], goals: [] });
  const [fromNotes, setFromNotes] = useState<{ concerns: boolean; duration: boolean; source: "notes" | "last" | null }>({ concerns: false, duration: false, source: null });
  const [changed, setChanged] = useState<{ from: string; because: string } | null>(null);
  const [kept, setKept] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const [resultVisible, setResultVisible] = useState(true);
  const seeded = useRef(false);
  const started = useRef(false);
  const completedOnce = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    trackSupportJourneyStarted("direct");
  }, []);

  // Seed answers once storage is read: last kept answers first, else the visitor's notes.
  useEffect(() => {
    if (!ready || seeded.current) return;
    seeded.current = true;
    if (snapshot.nextStep) {
      setAnswers(snapshot.nextStep.answers);
      setFromNotes({ concerns: snapshot.nextStep.answers.primaryConcerns.length > 0, duration: Boolean(snapshot.nextStep.answers.duration), source: "last" });
      return;
    }
    const p = prefillFromNoticed(snapshot.noticed, refs);
    if (p.fromNoticed > 0) {
      setAnswers((a) => ({ ...a, primaryConcerns: p.primaryConcerns, duration: p.duration }));
      setFromNotes({ concerns: p.primaryConcerns.length > 0, duration: Boolean(p.duration), source: "notes" });
    }
  }, [ready, snapshot, refs]);

  const calm = urgency && urgency !== "immediate-crisis" ? (urgency as Calm) : null;
  const result = useMemo(() => (calm ? evaluate(calm, answers) : null), [calm, answers]);
  const alternatives = useMemo(() => (calm ? whatIfs(calm, answers) : []), [calm, answers]);

  // Analytics: once per distinct path shown, never the answers.
  const lastShown = useRef<string | null>(null);
  useEffect(() => {
    if (!result || lastShown.current === result.primaryPath.id) return;
    lastShown.current = result.primaryPath.id;
    trackSupportPathShown(result.primaryPath.id, result.alternatives.length, result.confidence);
  }, [result]);

  useEffect(() => {
    if (urgency) heading.current?.focus();
  }, [urgency]);

  // The phone bar only shows while the result card is out of view.
  const onBoard = Boolean(urgency && urgency !== "immediate-crisis");
  useEffect(() => {
    const el = resultRef.current;
    if (!onBoard || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setResultVisible(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [onBoard]);

  const chooseUrgency = (u: UrgencyLevel) => {
    setUrgency(u);
    trackUrgencyCompleted();
    if (u === "immediate-crisis") trackCrisisShown("selection");
  };

  /** Apply an edit, and say so when it moves the step. */
  const edit = (field: Field, next: NextStepAnswers, because: string) => {
    if (calm) {
      const before = evaluate(calm, answers).primaryPath;
      const after = evaluate(calm, next).primaryPath;
      setChanged(before.id !== after.id ? { from: before.name, because } : null);
    }
    setAnswers(next);
    setKept(false);
    markFirstInteraction("journey");
    if (field === "concerns" || field === "duration") setFromNotes((f) => ({ ...f, [field]: false }));
    trackStepCompleted(JOURNEY_STEP[field], field === "concerns" ? { count: next.primaryConcerns.length } : undefined);
  };

  const toggleConcern = (c: SymptomCategoryMeta) => {
    const has = answers.primaryConcerns.includes(c.id);
    edit("concerns", { ...answers, primaryConcerns: has ? answers.primaryConcerns.filter((x) => x !== c.id) : [...answers.primaryConcerns, c.id as SymptomCategory].slice(0, 3) }, has ? `you removed ${c.name.toLowerCase()}` : `you added ${c.name.toLowerCase()}`);
  };
  const toggleGoal = (g: keyof typeof GOAL_LABELS) => {
    const has = answers.goals.includes(g);
    edit("goals", { ...answers, goals: has ? answers.goals.filter((x) => x !== g) : [...answers.goals, g as SupportGoal] }, has ? `you removed "${GOAL_LABELS[g].toLowerCase()}"` : `you added "${GOAL_LABELS[g].toLowerCase()}"`);
  };
  const setOne = <K extends "duration" | "priorSupport" | "insurancePreference">(key: K, field: Field, value: NextStepAnswers[K], label: string) => {
    const same = answers[key] === value;
    edit(field, { ...answers, [key]: same ? undefined : value }, same ? `you cleared "${label.toLowerCase()}"` : `you chose "${label.toLowerCase()}"`);
  };

  const keep = () => {
    if (!result) return false;
    const ok = update((doc) =>
      keepNextStep(doc, {
        savedAt: Date.now(),
        pathId: result.primaryPath.id,
        pathName: result.primaryPath.name,
        typicalFirst: result.primaryPath.typicalFirst,
        whyThisFits: result.primaryPath.whyThisFits,
        alternatives: result.alternatives.map((a) => ({ id: a.id, name: a.name })),
        confidence: result.confidence,
        missingInfo: result.missingInfo,
        answers,
        versions: result.versions,
      }, changed?.because ?? null)
    );
    setKept(ok);
    if (ok) {
      trackPathEvent("path_next_step_kept", { kind: "next-step", surface: "journey" });
      if (!completedOnce.current) {
        completedOnce.current = true;
        trackSupportJourneyCompleted(answered, result.primaryPath.id);
      }
    }
    return ok;
  };

  const answered = [answers.primaryConcerns.length > 0, Boolean(answers.duration), answers.goals.length > 0, Boolean(answers.priorSupport), Boolean(answers.insurancePreference)].filter(Boolean).length;

  // --- Safety gate --------------------------------------------------------
  if (!urgency) {
    return (
      <section aria-labelledby="journey-q" className="space-y-6">
        <div>
          <h2 id="journey-q" ref={heading} tabIndex={-1} className="font-display text-label-primary text-[30px] leading-tight tracking-[-0.01em] focus:outline-none sm:text-[38px]">
            First, how are you doing right now?
          </h2>
          <p className="text-label-secondary mt-2 text-[16px] leading-relaxed">
            One question before anything else. Then you&apos;ll see your next step take shape as you answer. Nothing leaves this device.
          </p>
        </div>
        <div role="radiogroup" aria-labelledby="journey-q" className="grid gap-3 sm:grid-cols-3">
          {URGENCY.map((u) => (
            <button
              key={u.id}
              type="button"
              role="radio"
              aria-checked={false}
              onClick={() => chooseUrgency(u.id)}
              className="border-separator bg-surface text-label-primary hover:border-label-primary focus-visible:ring-accent flex min-h-20 flex-col justify-center rounded-2xl border px-5 py-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="text-[17px] font-semibold">{u.label}</span>
              <span className="text-label-secondary text-[14px]">{u.hint}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (urgency === "immediate-crisis") return <CrisisView headingRef={heading} onBack={() => setUrgency(null)} />;
  if (!result) return null;

  // --- Board --------------------------------------------------------------
  const primary = result.primaryPath;
  const conf = CONFIDENCE[result.confidence];
  const actions = destinationsFor(primary.id, answers.insurancePreference).filter((a) => !a.href.startsWith("/my-path"));
  const anim = reduce ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } } : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

  const resultPanel = (
    <div id="next-step-result" className="bg-label-primary text-canvas rounded-3xl p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-canvas/70 text-[12px] font-semibold tracking-[0.08em] uppercase">Your next step</p>
        <span className="flex items-center gap-2" title={conf.label}>
          <span className="sr-only">{conf.label}.</span>
          <ConfidenceMeter level={conf.level} />
        </span>
      </div>
      <div aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          <motion.div key={primary.id} {...anim} transition={{ duration: 0.22 }}>
            <h2 ref={heading} tabIndex={-1} id="journey-q" className="font-display mt-2 text-[34px] leading-[1.05] tracking-[-0.02em] focus:outline-none sm:text-[40px]">
              {primary.name}
            </h2>
            {changed && (
              <p className="bg-canvas/10 text-canvas mt-3 rounded-xl px-3 py-2 text-[14px]">
                Changed from {changed.from} because {changed.because}.
              </p>
            )}
            <p className="text-canvas/85 mt-3 text-[15px] leading-relaxed">{primary.typicalFirst}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-canvas/75 mt-4 text-[14px]">
        <span className="text-canvas font-medium">{conf.label}.</span> {conf.text}
      </p>
      {primary.whyThisFits.length > 0 && (
        <ul className="text-canvas/80 mt-3 space-y-1 text-[14px]">
          {primary.whyThisFits.map((w) => (
            <li key={w}>✓ {w}</li>
          ))}
        </ul>
      )}
      {result.missingInfo.length > 0 && (
        <p className="text-canvas/75 mt-3 text-[14px]">
          Sharpen it:{" "}
          {result.missingInfo.map((m, i) => (
            <span key={m}>
              {i > 0 && ", "}
              {MISSING_FIELD[m] ? (
                <a href={`#q-${MISSING_FIELD[m]}`} className="text-canvas underline underline-offset-2">
                  <span className="text-canvas">{m}</span>
                </a>
              ) : (
                m
              )}
            </span>
          ))}
        </p>
      )}

      <ul className="mt-5 space-y-2">
        {actions.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              onClick={() => {
                trackActionClicked(a.type, primary.id);
                trackPathEvent("path_qualified_action", { surface: "journey", kind: "next-step" });
              }}
              className="bg-canvas flex min-h-12 items-center justify-between rounded-2xl px-5 text-[15px] font-medium"
            >
              <span className="text-label-primary">{a.label}</span>
              <span aria-hidden="true" className="text-label-primary">→</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="border-canvas/15 mt-5 border-t pt-4">
        {!kept && snapshot.nextStep && (
          <p className="text-canvas/75 mb-2 text-[13px]">
            {snapshot.nextStep.pathId === primary.id
              ? "This matches the step you kept."
              : `You kept ${snapshot.nextStep.pathName} before. Your answers now point here.`}
          </p>
        )}
        {kept ? (
          <Link href="/my-path" className="flex items-center justify-between text-[15px] font-medium">
            <span className="text-canvas">✓ Kept in your path. Open it</span>
            <span aria-hidden="true" className="text-canvas">→</span>
          </Link>
        ) : (
          <button type="button" onClick={keep} className="text-canvas hover:text-canvas/80 flex w-full items-center justify-between text-left text-[15px] font-medium">
            {snapshot.nextStep && snapshot.nextStep.pathId !== primary.id ? `Update my kept step to ${primary.name}` : "Keep this and build my appointment brief"} <span aria-hidden="true">+</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-label-secondary text-[15px]">
            <span className="text-label-primary font-medium tabular-nums">{answered} of 5</span> answered. Tap in any order; your next step updates as you go.
          </p>
          <button type="button" onClick={() => { setUrgency(null); setChanged(null); }} className="text-label-tertiary hover:text-label-primary text-[13px] underline underline-offset-2">
            Change how I&apos;m doing
          </button>
        </div>

        {fromNotes.source && (fromNotes.concerns || fromNotes.duration) && (
          <p className="bg-accent-tint text-label-secondary mb-6 rounded-xl px-4 py-3 text-[14px]">
            {fromNotes.source === "notes" ? "We started from what you noted on symptom pages." : "We started from your last answers."} Change anything that isn&apos;t right.
          </p>
        )}

        <div className="space-y-6">
          <Group id="concerns" title="What's been on your mind" hint="Up to three." answered={answers.primaryConcerns.length > 0} fromNotes={fromNotes.concerns} multi>
            {categories.map((c) => (
              <Chip key={c.id} multi on={answers.primaryConcerns.includes(c.id)} disabled={!answers.primaryConcerns.includes(c.id) && answers.primaryConcerns.length >= 3} onClick={() => toggleConcern(c)}>
                {c.name}
              </Chip>
            ))}
            <Link href="/symptoms" className="text-label-secondary hover:text-label-primary flex min-h-11 items-center px-2 text-[14px] underline underline-offset-2">
              Not sure? Look it up
            </Link>
          </Group>

          <Group id="duration" title="How long it's affected daily life" answered={Boolean(answers.duration)} fromNotes={fromNotes.duration}>
            {(Object.keys(DURATION_LABELS) as SymptomDuration[]).map((d) => (
              <Chip key={d} on={answers.duration === d} onClick={() => setOne("duration", "duration", d, DURATION_LABELS[d])}>
                {DURATION_LABELS[d]}
              </Chip>
            ))}
          </Group>

          <Group id="goals" title="What you're hoping for" hint="Any that fit." answered={answers.goals.length > 0} multi>
            {(Object.keys(GOAL_LABELS) as (keyof typeof GOAL_LABELS)[]).map((g) => (
              <Chip key={g} multi on={answers.goals.includes(g)} onClick={() => toggleGoal(g)}>
                {GOAL_LABELS[g]}
              </Chip>
            ))}
          </Group>

          <Group id="prior" title="Support you've had before" answered={Boolean(answers.priorSupport)}>
            {(Object.keys(PRIOR_LABELS) as PriorSupportLevel[]).map((p) => (
              <Chip key={p} on={answers.priorSupport === p} onClick={() => setOne("priorSupport", "prior", p, PRIOR_LABELS[p])}>
                {PRIOR_LABELS[p]}
              </Chip>
            ))}
          </Group>

          <Group id="pay" title="How you'd pay" hint="Points you to the right options. Nothing is filtered out." answered={Boolean(answers.insurancePreference)}>
            {(Object.keys(PAY_LABELS) as InsurancePreference[]).map((p) => (
              <Chip key={p} on={answers.insurancePreference === p} onClick={() => setOne("insurancePreference", "pay", p, PAY_LABELS[p])}>
                {PAY_LABELS[p]}
              </Chip>
            ))}
          </Group>
        </div>

        {/* What would change it ---------------------------------------- */}
        {alternatives.length > 0 && (
          <section aria-labelledby="what-if-title" className="border-separator mt-10 border-t pt-6">
            <h3 id="what-if-title" className="text-label-primary text-[17px] font-semibold">
              What would change it
            </h3>
            <p className="text-label-secondary mt-1 text-[14px]">The same rules, with one answer different. Tap one to try it.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {alternatives.map((w) => (
                <li key={w.pathId}>
                  <button
                    type="button"
                    onClick={() => {
                      const before = primary.name;
                      setAnswers(w.answers);
                      setKept(false);
                      setChanged({ from: before, because: w.label.replace(/^If /, "").replace(/^you /, "you ") });
                    }}
                    className="border-separator bg-surface hover:border-label-primary focus-visible:ring-accent flex h-full w-full flex-col items-start rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="text-label-secondary text-[14px]">{w.label}</span>
                    <span className="text-label-primary mt-0.5 text-[16px] font-semibold">→ {w.pathName}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Depth, on request -------------------------------------------- */}
        <div className="mt-8 space-y-2">
          <details className="group border-separator bg-surface rounded-2xl border">
            <summary className="text-label-primary flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
              About {primary.name.toLowerCase()} <span aria-hidden="true" className="text-label-tertiary transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="text-label-secondary space-y-3 px-5 pb-5 text-[15px] leading-relaxed">
              <p>{primary.description}</p>
              <ul className="space-y-1 text-[14px]">
                {primary.considerations.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
              <p className="text-[14px]">When something else may fit better: {primary.whenBetterFit}</p>
            </div>
          </details>
          {result.alternatives.length > 0 && (
            <details className="group border-separator bg-surface rounded-2xl border">
              <summary className="text-label-primary flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                Other good options: {result.alternatives.map((a) => a.name).join(", ")}
                <span aria-hidden="true" className="text-label-tertiary transition-transform group-open:rotate-45">+</span>
              </summary>
              <ul className="space-y-3 px-5 pb-5">
                {result.alternatives.map((alt) => {
                  const first = destinationsFor(alt.id, answers.insurancePreference)[0];
                  return (
                    <li key={alt.id} className="text-[14px]">
                      <p className="text-label-primary font-semibold">{alt.name}</p>
                      <p className="text-label-secondary">{getSupportPath(alt.id, []).description.split(/(?<=\.)\s/)[0]}</p>
                      {first?.href.startsWith("/") && (
                        <Link href={first.href} className="text-label-primary font-medium underline underline-offset-2">
                          {first.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>

        <p className="text-label-tertiary mt-8 text-[13px] leading-relaxed">
          {result.disclaimer} Rules version {result.versions.definition}/{result.versions.evaluator}.
        </p>
      </div>

      <aside ref={resultRef} aria-label="Your next step" className="order-first lg:sticky lg:top-24 lg:order-none">
        {resultPanel}
      </aside>

      {/* Phones: the live step stays in view while answering. */}
      <a
        href="#next-step-result"
        aria-hidden={resultVisible}
        tabIndex={resultVisible ? -1 : 0}
        className={`bg-label-primary fixed bottom-3 left-3 right-16 z-40 flex min-h-14 items-center justify-between rounded-2xl px-5 shadow-[0_12px_32px_rgba(37,41,37,0.3)] transition-[opacity,transform] duration-200 motion-reduce:transition-none lg:hidden ${
          resultVisible ? "pointer-events-none translate-y-4 opacity-0" : "opacity-100"
        }`}
      >
        <span className="text-canvas min-w-0 truncate text-[15px]">
          <span className="text-canvas/70">Next step · </span>
          <span className="font-semibold">{primary.name}</span>
        </span>
        <span aria-hidden="true" className="text-canvas">↓</span>
      </a>
    </div>
  );
}
