/**
 * HeyPsych Consensus Score — public display.
 *
 * Renders only the approved public projection (score, confidence, date,
 * original strengths and concerns, source names, a fixed explanation). No
 * hooks, so it renders on the server and inside client components alike.
 * Nothing renders without an approved score: no placeholder, no "N/A".
 */

import type { PublicConsensus } from "@/domains/consensus/public";
import { CONFIDENCE_TEXT } from "@/domains/consensus/public";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

const CONFIDENCE_STYLE: Record<PublicConsensus["confidence"], string> = {
  High: "bg-positive/10 text-label-primary",
  Moderate: "bg-fill-quaternary text-label-primary",
  Limited: "bg-caution-50 text-caution-600",
};

export function ConsensusBadge({ consensus, name }: { consensus: PublicConsensus; name?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 text-[13px]">
      <span className="text-label-primary font-semibold tabular-nums" aria-label={`HeyPsych Consensus Score ${consensus.score} out of 100${name ? ` for ${name}` : ""}`}>
        {consensus.score}
        <span className="text-label-tertiary font-normal">/100</span>
      </span>
      <span className="text-label-tertiary">Consensus · {consensus.confidence} confidence</span>
    </span>
  );
}

export function ConsensusScore({ consensus, name, headingLevel = "h3" }: { consensus: PublicConsensus; name: string; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const id = `consensus-${consensus.slug}`;
  return (
    <div className="border-separator bg-surface shadow-card-1 rounded-2xl border p-6" aria-labelledby={`${id}-title`} role="group">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading id={`${id}-title`} className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase" data-heading="sans">
            HeyPsych Consensus Score
          </Heading>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-label-primary text-[48px] leading-none tabular-nums">{consensus.score}</span>
            <span className="text-label-tertiary text-[18px]">/100</span>
            <span className="sr-only"> for {name}</span>
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block rounded-full px-3 py-1 text-[13px] font-medium ${CONFIDENCE_STYLE[consensus.confidence]}`}>{consensus.confidence} confidence</span>
          <p className="text-label-tertiary mt-2 text-[13px]">
            Updated <time dateTime={consensus.updatedAt}>{formatDate(consensus.updatedAt)}</time>
          </p>
        </div>
      </div>

      {(consensus.strengths.length > 0 || consensus.concerns.length > 0) && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {consensus.strengths.length > 0 && (
            <div>
              <p className="text-label-primary text-[15px] font-semibold">Reviewers often praise</p>
              <ul className="text-label-secondary mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-snug">
                {consensus.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {consensus.concerns.length > 0 && (
            <div>
              <p className="text-label-primary text-[15px] font-semibold">Common concerns</p>
              <ul className="text-label-secondary mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-snug">
                {consensus.concerns.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-label-secondary border-separator mt-6 border-t pt-4 text-[13.5px] leading-relaxed">
        {consensus.explanation} {CONFIDENCE_TEXT[consensus.confidence]}
      </p>
    </div>
  );
}
