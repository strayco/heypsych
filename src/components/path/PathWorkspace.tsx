"use client";

/**
 * Your Path — the workspace at /my-path
 *
 * A living decision workspace, not a report:
 *  - Readiness: how prepared the visitor's notes are for an appointment, and
 *    the one most useful thing to do next, fixable in place.
 *  - Map: what they noticed, are exploring, are considering, and their next
 *    step, connected through reviewed content. Select anything to see what it
 *    links to and what it adds to the brief.
 *  - Brief: the printable artifact, one tap away rather than the whole page.
 *
 * Reads only this browser's storage. Server render and first client render
 * are an identical skeleton; storage is read in an effect.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  addQuestion,
  buildBrief,
  readiness,
  removeQuestion,
  setAppointment,
  nodeId,
  PATH_LIMITS,
  type SymptomRef,
} from "@/domains/path";
import { loadProject } from "@/domains/architect/persistence/project-persistence";
import type { PracticeProject } from "@/domains/architect/schemas/practice-project";
import { AppointmentBrief } from "./AppointmentBrief";
import { PathMap } from "./PathMap";
import { daysBucket, itemsBucket, trackPathEvent } from "./analytics";
import { clearEverything, recordVisit, storageAvailable, todayIso, usePath } from "./store";

type View = "map" | "brief";

function PracticeCard({ project }: { project: PracticeProject }) {
  const tools = project.assignments.map((a) => a.productName);
  const done = project.setupTasks.filter((t) => t.status === "done").length;
  return (
    <section aria-labelledby="practice-title" className="border-separator bg-surface shadow-card-1 flex flex-col gap-3 rounded-3xl border p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.08em] uppercase">For your practice</p>
        <h2 id="practice-title" className="font-display text-label-primary mt-1 text-[24px] leading-tight">
          {project.name}
        </h2>
        <p className="text-label-secondary mt-1 text-[15px]">
          {tools.length > 0 ? `${tools.length} ${tools.length === 1 ? "tool" : "tools"}: ${tools.slice(0, 4).join(", ")}${tools.length > 4 ? "…" : ""}.` : "No tools chosen yet."}
          {done > 0 && ` ${done} setup ${done === 1 ? "task" : "tasks"} done.`}
        </p>
      </div>
      <Link href="/architect" className="bg-label-primary inline-flex min-h-11 shrink-0 items-center rounded-full px-5 text-[15px] font-medium">
        <span className="text-canvas">Open Practice Architect →</span>
      </Link>
    </section>
  );
}

export function PathWorkspace({ refs }: { refs: SymptomRef[] }) {
  const { snapshot: path, ready, count, update } = usePath();
  const [project, setProject] = useState<PracticeProject | null>(null);
  const [canStore, setCanStore] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [view, setView] = useState<View>("map");
  const [selected, setSelected] = useState<string | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [welcomeBack, setWelcomeBack] = useState<number | null>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (!ready || opened.current) return;
    opened.current = true;
    setToday(todayIso());
    setCanStore(storageAvailable());
    try {
      setProject(loadProject());
    } catch {
      setProject(null);
    }
    if (window.location.hash === "#brief") setView("brief");
    const days = count > 0 ? recordVisit() : null;
    trackPathEvent("path_opened", { surface: "workspace", items: itemsBucket(count) });
    if (days !== null && days >= 1) {
      setWelcomeBack(days);
      trackPathEvent("path_returned", { surface: "workspace", days: daysBucket(days), items: itemsBucket(count) });
    }
  }, [ready, count]);

  const brief = useMemo(() => buildBrief(path, refs), [path, refs]);
  const prep = useMemo(() => (today ? readiness(path, today) : null), [path, today]);

  const switchView = (v: View) => {
    setView(v);
    if (v === "brief") trackPathEvent("path_brief_viewed", { surface: "workspace", items: itemsBucket(count) });
    setSelected(null);
    history.replaceState(null, "", v === "brief" ? "#brief" : window.location.pathname);
  };

  if (!ready || !prep) {
    return (
      <div aria-busy="true" className="space-y-4">
        <div className="bg-fill-quaternary h-28 animate-pulse rounded-3xl motion-reduce:animate-none" />
        <div className="grid gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-fill-quaternary h-40 animate-pulse rounded-2xl motion-reduce:animate-none" />
          ))}
        </div>
        <p className="sr-only">Loading your path</p>
      </div>
    );
  }

  const questionCount = brief.ownQuestions.length + [...brief.reading, ...brief.considering].reduce((n, t) => n + t.questions.length, 0);
  const isEmpty = count === 0 && path.tried.length === 0 && path.questions.length === 0;

  /** Do the readiness step in place where we can; otherwise go where it's done. */
  const doNext = () => {
    const step = prep.next;
    if (!step) return;
    if (step.id === "durations" && prep.missingDurations[0]) {
      setView("map");
      setSelected(nodeId("symptom", prep.missingDurations[0]));
    } else if (step.id === "appointment") {
      dateInput.current?.focus();
      dateInput.current?.showPicker?.();
    }
  };
  const nextHref: Record<string, string> = {
    "next-step": "/find-support?need=support",
    noticed: "/symptoms",
    questions: "/conditions",
    tried: path.conditions[0] ? `/conditions/${path.conditions[0].slug}#day-to-day` : "/conditions",
  };

  return (
    <div className="space-y-7">
      {!canStore && (
        <p role="alert" className="border-caution-200 bg-caution-50 text-label-primary rounded-2xl border px-5 py-4 text-[15px]">
          This browser is blocking storage (often a private window), so nothing can be kept between visits.
        </p>
      )}

      {/* Readiness ------------------------------------------------------------ */}
      <section aria-labelledby="prep-title" className="border-separator bg-surface shadow-card-1 rounded-3xl border p-5" data-no-print>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            {welcomeBack !== null && (
              <p className="text-label-tertiary mb-1 text-[13px]">
                Welcome back. Last here {welcomeBack === 1 ? "yesterday" : `${welcomeBack} days ago`}.
              </p>
            )}
            <h2 id="prep-title" className="text-label-primary text-[17px] font-semibold">
              {prep.ready ? "Ready for your appointment" : "Getting ready for your appointment"}
              <span className="text-label-tertiary ml-2 text-[15px] font-normal tabular-nums">
                {prep.done} of {prep.total}
              </span>
            </h2>
            <div aria-hidden="true" className="bg-fill-tertiary mt-3 flex h-1.5 w-56 max-w-full gap-0.5 overflow-hidden rounded-full sm:hidden">
              {prep.steps.map((s) => (
                <span key={s.id} className={`h-full flex-1 ${s.done ? "bg-positive" : ""}`} />
              ))}
            </div>
            <ol aria-label="Steps" className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
              {prep.steps.map((s) => (
                <li
                  key={s.id}
                  className={`rounded-full px-2.5 py-0.5 text-[12px] ${s.done ? "bg-positive/10 text-label-primary" : s.optional ? "bg-fill-quaternary text-label-secondary" : "bg-fill-tertiary text-label-primary"}`}
                >
                  <span aria-hidden="true">{s.done ? "✓ " : ""}</span>
                  {s.label}
                  <span className="sr-only">{s.done ? " (done)" : s.optional ? " (optional, not done)" : " (not done)"}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <label className="text-label-secondary flex items-center gap-2 text-[14px]">
              <span>Appointment</span>
              <input
                ref={dateInput}
                type="date"
                min={today ?? undefined}
                value={path.appointment ?? ""}
                onChange={(e) => update((d) => setAppointment(d, e.target.value || null))}
                className="border-separator bg-canvas text-label-primary focus:border-accent min-h-10 rounded-xl border px-3 text-[14px] focus:outline-none"
              />
            </label>
            {prep.daysToAppointment !== null && (
              <p className="text-label-primary text-[14px] font-medium">
                {prep.daysToAppointment === 0 ? "Today" : prep.daysToAppointment === 1 ? "Tomorrow" : `In ${prep.daysToAppointment} days`}
              </p>
            )}
          </div>
        </div>

        {(prep.next || prep.nudges.length > 0) && (
          <div className="border-separator mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
            {prep.next &&
              (nextHref[prep.next.id] ? (
                <Link href={nextHref[prep.next.id]} className="bg-label-primary inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-medium">
                  <span className="text-canvas">Next: {prep.next.todo} →</span>
                </Link>
              ) : (
                <button type="button" onClick={doNext} className="bg-label-primary text-canvas inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-medium">
                  Next: {prep.next.todo} →
                </button>
              ))}
            {prep.nudges.map((n, i) =>
              n.question ? (
                <button
                  key={n.id}
                  data-extra={i > 0 || undefined}
                  type="button"
                  onClick={() => {
                    update((d) => addQuestion(d, n.question!));
                    trackPathEvent("path_item_saved", { kind: "question", surface: "workspace" });
                  }}
                  className="border-separator text-label-primary hover:border-label-primary inline-flex min-h-11 items-center rounded-full border px-4 text-left text-[14px] data-[extra]:hidden sm:data-[extra]:inline-flex"
                >
                  + {n.text}
                </button>
              ) : (
                <Link key={n.id} href={n.href!} data-extra={i > 0 || undefined} className="border-separator hover:border-label-primary min-h-11 items-center rounded-full border px-4 text-[14px] data-[extra]:hidden inline-flex sm:data-[extra]:inline-flex">
                  <span className="text-label-primary">{n.text} →</span>
                </Link>
              )
            )}
          </div>
        )}
      </section>

      {/* View switch ------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-3" data-no-print>
        <div role="tablist" aria-label="Your path view" className="bg-fill-quaternary inline-flex rounded-full p-1">
          {(
            [
              ["map", "Map"],
              ["brief", `Brief${questionCount ? ` · ${questionCount} questions` : ""}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              id={`tab-${id}`}
              aria-selected={view === id}
              aria-controls={`panel-${id}`}
              onClick={() => switchView(id)}
              className={`min-h-10 rounded-full px-5 text-[15px] font-medium transition-colors ${view === id ? "bg-surface text-label-primary shadow-card-1" : "text-label-secondary hover:text-label-primary"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "map" && !isEmpty && <p className="text-label-tertiary text-[14px]">Select anything to see what it connects to.</p>}
      </div>

      {view === "map" ? (
        <div role="tabpanel" id="panel-map" aria-labelledby="tab-map">
          <PathMap path={path} refs={refs} update={update} selected={selected} onSelect={setSelected} />
          {isEmpty && (
            <p className="text-label-secondary mt-6 max-w-2xl text-[15px] leading-relaxed">
              As you look around HeyPsych, keep what matters to you. Each thing you keep lands here, connects to the rest, and adds questions to your brief.
            </p>
          )}
        </div>
      ) : (
        <div role="tabpanel" id="panel-brief" aria-labelledby="tab-brief" className="mx-auto max-w-3xl">
          <AppointmentBrief
            brief={brief}
            canAddQuestion={path.questions.length < PATH_LIMITS.questions}
            onAddQuestion={(q) => {
              const before = path.questions.length;
              update((d) => addQuestion(d, q));
              const added = q.trim().length > 0 && before < PATH_LIMITS.questions;
              if (added) trackPathEvent("path_item_saved", { kind: "question" });
              return added;
            }}
            onRemoveQuestion={(i) => update((d) => removeQuestion(d, i))}
          />
        </div>
      )}

      {project && <PracticeCard project={project} />}

      <section aria-labelledby="privacy-title" className="border-separator border-t pt-6" data-no-print>
        <h2 id="privacy-title" className="text-label-primary text-[15px] font-semibold">
          Private by design
        </h2>
        <p className="text-label-secondary mt-1 max-w-2xl text-[14px] leading-relaxed">
          Your path is kept in this browser on this device. It isn&apos;t sent to HeyPsych, it isn&apos;t tied to an account, and it disappears if you clear your browser data. On a shared device, clear it when you&apos;re done.
        </p>
        <div className="mt-3">
          {confirmClear ? (
            <span className="flex flex-wrap items-center gap-3">
              <span className="text-label-primary text-[14px]">Remove everything from this device?</span>
              <button
                type="button"
                onClick={() => {
                  clearEverything();
                  setConfirmClear(false);
                  setSelected(null);
                  trackPathEvent("path_cleared", { surface: "workspace" });
                }}
                className="bg-negative min-h-10 rounded-full px-4 text-[14px] font-medium text-white"
              >
                Yes, clear it
              </button>
              <button type="button" onClick={() => setConfirmClear(false)} className="text-label-secondary min-h-10 px-2 text-[14px] font-medium">
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={isEmpty}
              className="text-label-secondary hover:text-label-primary text-[14px] font-medium underline underline-offset-2 disabled:no-underline disabled:opacity-40"
            >
              Clear my path from this device
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
