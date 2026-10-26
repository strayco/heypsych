"use client";

/**
 * What it feels like: the weeks people describe, as a track to step along.
 * Each stage shows what people say in their own words and what is normal at
 * that point. Topics that are not a point in time ("Sexual side effects")
 * sit beside the track as their own tabs.
 */

import { useState } from "react";
import type { FeelJourney as Journey, FeelStage } from "@/domains/treatments/experience/model";

export function FeelJourney({ journey }: { journey: Journey }) {
  const all = [...journey.stages, ...journey.topics];
  const [selectedId, setSelectedId] = useState(all[0]?.id);
  const current = all.find((s) => s.id === selectedId) ?? all[0];
  if (!current) return null;

  const stageIndex = journey.stages.findIndex((s) => s.id === current.id);
  const step = (delta: number) => {
    const next = journey.stages[stageIndex + delta];
    if (next) setSelectedId(next.id);
  };

  return (
    <div>
      {/* The track ---------------------------------------------------------- */}
      {journey.stages.length > 0 && (
        <div role="group" aria-label="Over time" className="relative">
          <div aria-hidden="true" className="bg-fill-tertiary absolute top-[11px] right-4 left-4 h-[2px] rounded-full" />
          <div
            aria-hidden="true"
            className="bg-treatment absolute top-[11px] left-4 h-[2px] rounded-full transition-[width] duration-500 motion-reduce:transition-none"
            style={{
              width:
                stageIndex >= 0 && journey.stages.length > 1
                  ? `calc((100% - 2rem) * ${stageIndex / (journey.stages.length - 1)})`
                  : 0,
            }}
          />
          <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${journey.stages.length}, minmax(0, 1fr))` }}>
            {journey.stages.map((stage, i) => {
              const reached = stageIndex >= i;
              const isCurrent = stage.id === current.id;
              return (
                <li key={stage.id} className={i === 0 ? "text-left" : i === journey.stages.length - 1 ? "text-right" : "text-center"}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(stage.id)}
                    aria-pressed={isCurrent}
                    className={`focus-visible:ring-accent group inline-flex flex-col gap-2 rounded-xl px-1 pb-1 focus-visible:ring-2 focus-visible:outline-none ${
                      i === 0 ? "items-start" : i === journey.stages.length - 1 ? "items-end" : "items-center"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mx-3 block h-6 w-6 rounded-full border-2 transition-all duration-300 motion-reduce:transition-none ${
                        isCurrent
                          ? "border-treatment bg-treatment scale-110"
                          : reached
                            ? "border-treatment bg-surface"
                            : "border-separator-opaque bg-surface group-hover:border-label-tertiary"
                      }`}
                    />
                    <span className={`text-[13px] font-semibold sm:text-[14px] ${isCurrent ? "text-label-primary" : "text-label-tertiary group-hover:text-label-secondary"}`}>
                      {stage.when}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {journey.topics.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-label-tertiary mr-1 text-[13px]">Also people talk about</span>
          {journey.topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => setSelectedId(topic.id)}
              aria-pressed={topic.id === current.id}
              className={`focus-visible:ring-accent rounded-full border px-3.5 py-1.5 text-[14px] transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none ${
                topic.id === current.id
                  ? "border-label-primary bg-label-primary text-canvas"
                  : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
              }`}
            >
              {topic.title}
            </button>
          ))}
        </div>
      )}

      {/* The stage ---------------------------------------------------------- */}
      <Stage stage={current} />

      {stageIndex >= 0 && journey.stages.length > 1 && (
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={stageIndex === 0}
            className="text-label-secondary hover:text-label-primary text-[14px] disabled:invisible"
          >
            ← Earlier
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={stageIndex === journey.stages.length - 1}
            className="text-accent hover:text-accent-hover text-[14px] font-medium disabled:invisible"
          >
            Later →
          </button>
        </div>
      )}
    </div>
  );
}

function Stage({ stage }: { stage: FeelStage }) {
  return (
    <div aria-live="polite" className="mt-6">
      <h3 className="font-display text-label-primary text-[26px] leading-tight sm:text-[30px]">
        {stage.when && <span className="text-label-tertiary">{stage.when} · </span>}
        {stage.title}
      </h3>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {stage.quotes.map((quote, i) => (
          <li
            key={quote}
            className="bg-surface border-separator relative rounded-2xl rounded-bl-md border px-5 py-4 shadow-card-1 motion-safe:animate-[fadeInUp_420ms_cubic-bezier(0.22,0.61,0.36,1)_both]"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <p className="text-label-primary text-[16px] leading-snug">“{quote}”</p>
          </li>
        ))}
      </ul>
      {stage.note && (
        <p className="bg-treatment/10 text-label-primary mt-4 rounded-2xl px-5 py-4 text-[15px] leading-relaxed">
          <span className="font-semibold">What’s normal: </span>
          {stage.note}
        </p>
      )}
    </div>
  );
}
