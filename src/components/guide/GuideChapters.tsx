"use client";

/**
 * The full guide, as chapters.
 *
 * A quiet index of everything there is to read, grouped by what people are
 * trying to find out, with a one-line teaser and reading time per chapter.
 * Nothing opens until someone chooses it. A chapter then opens in a reading
 * sheet — beside the page on desktop, from the bottom on phones — the way an
 * object opens its inspector in Practice Architect, so the index stays where
 * it was and the next chapter is one tap away.
 *
 * Every chapter's text is always in the page (closed chapters are `hidden`,
 * not absent), so search engines and find-in-page see the whole guide, and
 * `#guide-<id>` links open a chapter directly.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface GuideChapter {
  id: string;
  title: string;
  teaser: string | null;
  group: string;
  minutes: number;
  content: React.ReactNode;
}

export function GuideChapters({
  chapters,
  groupOrder,
  subject,
}: {
  chapters: GuideChapter[];
  groupOrder: string[];
  subject: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = useCallback((id: string | null) => {
    if (id && !returnFocus.current) returnFocus.current = document.activeElement as HTMLElement | null;
    setOpenId(id);
    try {
      const url = id ? `#guide-${id}` : `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", url);
    } catch {
      // History may be unavailable in some embedded contexts.
    }
    if (!id) {
      returnFocus.current?.focus();
      returnFocus.current = null;
    }
  }, []);

  // Deep links: /treatments/x#guide-dosing opens that chapter, on load and
  // when an in-page link changes the hash (which does not reload the page).
  const chapterIds = chapters.map((c) => c.id).join("|");
  useEffect(() => {
    const ids = new Set(chapterIds.split("|"));
    const fromHash = () => {
      const id = window.location.hash.replace(/^#guide-/, "");
      if (id && ids.has(id)) setOpenId(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [chapterIds]);

  // Escape closes; a newly opened chapter starts at its top with focus in it.
  useEffect(() => {
    if (!openId) return;
    sheetRef.current?.scrollTo({ top: 0 });
    sheetRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") open(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, open]);

  const groups = [
    ...groupOrder.filter((g) => chapters.some((c) => c.group === g)),
    ...[...new Set(chapters.map((c) => c.group))].filter((g) => !groupOrder.includes(g)),
  ];
  const ordered = groups.flatMap((g) => chapters.filter((c) => c.group === g));
  const index = ordered.findIndex((c) => c.id === openId);
  const current = index >= 0 ? ordered[index] : null;
  const totalMinutes = chapters.reduce((sum, c) => sum + c.minutes, 0);

  // A short record (one overview, say) reads better as plain text than as an
  // index of one chapter.
  if (ordered.length <= 2) {
    return (
      <div className="space-y-10">
        {ordered.map((chapter) => (
          <article key={chapter.id} id={`guide-panel-${chapter.id}`} aria-labelledby={`guide-title-${chapter.id}`}>
            {ordered.length > 1 && (
              <h3 id={`guide-title-${chapter.id}`} className="font-display text-label-primary text-[26px] leading-tight">
                {chapter.title}
              </h3>
            )}
            <div className={ordered.length > 1 ? "mt-4" : ""}>{chapter.content}</div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="text-label-tertiary text-[14px]">
        {chapters.length} chapters · about {totalMinutes} min to read it all. Open any one.
      </p>

      {/* Index ---------------------------------------------------------------- */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-x-10">
        {groups.map((group) => (
          <div key={group}>
            <h3 data-heading="sans" className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">
              {group}
            </h3>
            <ul className="border-separator mt-2 divide-y divide-[var(--color-separator)] border-y">
              {chapters
                .filter((c) => c.group === group)
                .map((chapter) => {
                  const isOpen = chapter.id === openId;
                  return (
                    <li key={chapter.id}>
                      <button
                        type="button"
                        onClick={() => open(isOpen ? null : chapter.id)}
                        aria-expanded={isOpen}
                        aria-controls="guide-sheet"
                        className="focus-visible:ring-accent group flex w-full items-start gap-4 py-3.5 text-left focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                      >
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[16px] font-medium transition-colors duration-200 ${isOpen ? "text-accent" : "text-label-primary group-hover:text-accent"}`}>
                            {chapter.title}
                          </span>
                          {chapter.teaser && (
                            <span className="text-label-secondary mt-0.5 line-clamp-1 text-[14px]">{chapter.teaser}</span>
                          )}
                        </span>
                        <span className="text-label-tertiary mt-0.5 shrink-0 text-[13px] tabular-nums">{chapter.minutes} min</span>
                        <span aria-hidden="true" className={`mt-0.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none ${isOpen ? "text-accent" : "text-label-tertiary"}`}>
                          ›
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>

      {/* Reading sheet ------------------------------------------------------- */}
      <div
        aria-hidden="true"
        onClick={() => open(null)}
        className={`fixed inset-0 z-40 bg-[rgba(37,41,37,0.18)] transition-opacity duration-300 motion-reduce:transition-none ${
          current ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        id="guide-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="false"
        aria-label={current ? `${current.title}, part of the guide to ${subject}` : `Guide to ${subject}`}
        tabIndex={-1}
        className={`bg-canvas fixed z-50 overflow-y-auto overscroll-contain shadow-[0_24px_64px_rgba(37,41,37,0.18)] transition-transform duration-[420ms] [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] focus:outline-none motion-reduce:transition-none
          inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl
          sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[min(640px,92vw)] sm:rounded-none sm:rounded-l-3xl
          ${current ? "translate-x-0 translate-y-0" : "translate-y-full sm:translate-x-full sm:translate-y-0"}`}
      >
        <div className="bg-canvas/95 border-separator sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-6 py-3 backdrop-blur sm:px-10">
          <p className="text-label-tertiary truncate text-[13px]">
            {current ? `${current.group} · ${index + 1} of ${ordered.length} · ${current.minutes} min` : ""}
          </p>
          <button
            type="button"
            onClick={() => open(null)}
            className="text-label-secondary hover:text-label-primary hover:bg-fill-quaternary focus-visible:ring-accent shrink-0 rounded-full px-3 py-1.5 text-[14px] font-medium focus-visible:ring-2 focus-visible:outline-none"
          >
            Close
          </button>
        </div>

        <div className="px-6 pt-6 pb-10 sm:px-10">
          {ordered.map((chapter) => (
            <article key={chapter.id} id={`guide-panel-${chapter.id}`} hidden={chapter.id !== openId} aria-labelledby={`guide-title-${chapter.id}`}>
              <h3 id={`guide-title-${chapter.id}`} className="font-display text-label-primary text-[30px] leading-tight sm:text-[34px]">
                {chapter.title}
              </h3>
              <div className="mt-6">{chapter.content}</div>
            </article>
          ))}

          {current && (
            <nav aria-label="Chapters" className="border-separator mt-10 grid grid-cols-2 gap-3 border-t pt-6">
              {index > 0 ? (
                <button type="button" onClick={() => open(ordered[index - 1].id)} className="hover:bg-fill-quaternary rounded-2xl p-3 text-left">
                  <span className="text-label-tertiary block text-[12px]">Previous</span>
                  <span className="text-label-primary text-[15px]">← {ordered[index - 1].title}</span>
                </button>
              ) : (
                <span />
              )}
              {index < ordered.length - 1 ? (
                <button type="button" onClick={() => open(ordered[index + 1].id)} className="hover:bg-fill-quaternary rounded-2xl p-3 text-right">
                  <span className="text-label-tertiary block text-[12px]">Next</span>
                  <span className="text-accent text-[15px] font-medium">{ordered[index + 1].title} →</span>
                </button>
              ) : (
                <span className="text-label-tertiary self-center text-right text-[14px]">End of the guide</span>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

// Text helpers live in a plain module so server components can call them
// (functions exported from a "use client" file are references on the server).
export { readingMinutes, sectionText, teaserFrom } from "./guide-text";
