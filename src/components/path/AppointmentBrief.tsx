"use client";

/**
 * The appointment brief: the visitor's path as one page to print, save as a
 * PDF, or copy into a portal message. Rendered as a sheet of paper so it
 * reads the same on screen and in print.
 */

import { useState } from "react";
import { briefToText, type Brief } from "@/domains/path";
import { trackPathEvent } from "./analytics";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-separator pt-4">
      <h3 className="text-[12px] font-semibold tracking-[0.08em] text-label-secondary uppercase">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function AppointmentBrief({
  brief,
  onAddQuestion,
  onRemoveQuestion,
  canAddQuestion,
}: {
  brief: Brief;
  onAddQuestion: (q: string) => boolean;
  onRemoveQuestion: (index: number) => void;
  canAddQuestion: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const print = () => {
    trackPathEvent("path_brief_printed", { surface: "workspace" });
    // Print a top-level copy of the sheet, with everything else display:none,
    // so the page count is the brief's alone (visibility tricks leave blank pages).
    const sheet = document.querySelector("[data-brief-print]");
    const root = document.createElement("div");
    root.setAttribute("data-print-root", "");
    if (sheet) root.appendChild(sheet.cloneNode(true));
    document.body.appendChild(root);
    document.body.dataset.printBrief = "1";
    const done = () => {
      delete document.body.dataset.printBrief;
      root.remove();
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(briefToText(brief));
      setCopied("done");
      trackPathEvent("path_brief_copied", { surface: "workspace" });
    } catch {
      setCopied("failed");
    }
    window.setTimeout(() => setCopied("idle"), 2500);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddQuestion(draft)) setDraft("");
  };

  const topics = [...brief.reading, ...brief.considering];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2" data-no-print>
        <button
          type="button"
          onClick={print}
          disabled={brief.isEmpty}
          className="bg-label-primary text-canvas focus-visible:ring-accent inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
        >
          Print or save as PDF
        </button>
        <button
          type="button"
          onClick={copy}
          disabled={brief.isEmpty}
          className="border-separator bg-surface text-label-primary hover:border-label-tertiary focus-visible:ring-accent inline-flex min-h-11 items-center rounded-full border px-5 text-[15px] font-medium focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
        >
          {copied === "done" ? "Copied" : copied === "failed" ? "Couldn't copy" : "Copy as text"}
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied === "done" ? "Brief copied to the clipboard." : copied === "failed" ? "Copying was blocked by the browser." : ""}
        </span>
      </div>

      {/* The sheet. Brand tokens, so screen and print match. */}
      <article
        data-brief-print
        aria-label="Appointment brief"
        className="rounded-2xl border border-separator bg-surface p-6 text-label-primary shadow-card-1 sm:p-9"
      >
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-[28px] leading-tight">My appointment notes</h2>
          <p className="text-[13px] text-label-secondary">Prepared {today}</p>
        </header>
        <p className="mt-1 text-[14px] text-label-secondary">Things I want to make sure we talk about.</p>

        {brief.isEmpty ? (
          <p className="mt-6 text-[15px] text-label-secondary">
            Your brief fills in as you keep things: symptoms you&apos;ve noticed, conditions and treatments you&apos;re reading about, and your next step.
          </p>
        ) : (
          <div className="mt-6 space-y-5 text-[15px] leading-relaxed">
            {brief.lookingFor && (
              <Block title="What I'm looking for">
                <p className="font-medium">{brief.lookingFor.path}</p>
                {brief.lookingFor.details.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-[14px] text-label-secondary">
                    {brief.lookingFor.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
              </Block>
            )}

            {brief.noticed.length > 0 && (
              <Block title="What I've noticed">
                <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {brief.noticed.map((n) => (
                    <li key={n.name} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>
                        {n.name}
                        {n.duration && <span className="text-label-secondary">, {n.duration}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {brief.tried.length > 0 && (
              <Block title="What I've tried">
                <ul className="space-y-1">
                  {brief.tried.map((t) => (
                    <li key={t} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {brief.alsoCheck.length > 0 && (
              <Block title="Other things that can cause this (worth asking about)">
                <ul className="space-y-1">
                  {brief.alsoCheck.map((t) => (
                    <li key={t} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {(topics.length > 0 || brief.ownQuestions.length > 0 || canAddQuestion) && (
              <Block title="Questions I'd like to ask">
                {brief.ownQuestions.length > 0 && (
                  <ol className="mb-4 space-y-1.5">
                    {brief.ownQuestions.map((q, i) => (
                      <li key={q} className="flex items-start justify-between gap-3">
                        <span className="flex gap-2">
                          <span aria-hidden="true">☐</span>
                          {q}
                        </span>
                        <button
                          type="button"
                          data-no-print
                          onClick={() => onRemoveQuestion(i)}
                          aria-label={`Remove question: ${q}`}
                          className="shrink-0 rounded-full px-2 text-[13px] text-label-secondary hover:text-label-primary"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ol>
                )}

                {topics.map((t) => (
                  <div key={t.name} className="mb-4 break-inside-avoid last:mb-0">
                    <p className="font-medium">
                      {t.name} <span className="text-[13px] font-normal text-label-secondary">· {t.label}</span>
                    </p>
                    <ol className="mt-1 space-y-2">
                      {t.questions.map((q) => (
                        <li key={q.text} className="flex gap-2">
                          <span aria-hidden="true">☐</span>
                          <span>
                            {q.text}
                            {q.basis && <span className="mt-0.5 block text-[13px] leading-snug text-label-secondary">{q.basis}</span>}
                          </span>
                        </li>
                      ))}
                    </ol>
                    {t.provenance && <p className="mt-1 text-[12px] text-label-tertiary">From {t.provenance}</p>}
                  </div>
                ))}

                {canAddQuestion && (
                  <form onSubmit={add} className="mt-3 flex flex-wrap gap-2" data-no-print>
                    <label htmlFor="own-question" className="sr-only">
                      Add your own question
                    </label>
                    <input
                      id="own-question"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={200}
                      placeholder="Add your own question"
                      className="focus:border-accent focus:ring-accent/20 min-h-11 min-w-0 flex-1 rounded-xl border border-separator bg-surface px-3.5 text-[15px] focus:ring-2 focus:outline-none"
                    />
                    <button type="submit" disabled={!draft.trim()} className="min-h-11 rounded-xl border border-separator px-4 text-[15px] font-medium disabled:opacity-40">
                      Add
                    </button>
                  </form>
                )}
              </Block>
            )}

            {brief.apps.length > 0 && (
              <Block title="Apps and services I'm looking at">
                <p>{brief.apps.join(" · ")}</p>
              </Block>
            )}
          </div>
        )}

        <footer className="mt-6 space-y-2 border-t border-separator pt-4 text-[12px] leading-relaxed text-label-secondary">
          <p className="font-medium text-label-primary">{brief.crisis}</p>
          <p>{brief.disclaimer}</p>
          <p>heypsych.com</p>
        </footer>
      </article>
    </div>
  );
}
