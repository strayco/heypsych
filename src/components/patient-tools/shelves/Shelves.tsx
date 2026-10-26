/**
 * App Store–style building blocks for the patient side of Apps & Tools:
 * a compact app card, a horizontal shelf of them, the "what are you looking
 * for" tiles, and an at-a-glance strip of honest numbers for a set.
 * Server components; the save heart is the only island.
 */

import Link from "next/link";
import { DISCOVERY_OBJECTS, type DiscoveryObjectId } from "@/components/home/worlds/DiscoveryObjects";
import { type Glance, type IntentDefinition, type IntentId } from "@/domains/patient-tools/shelves/model";
import { AppCard } from "./AppCard";

export { AppCard };

// ---------------------------------------------------------------------------
// What are you looking for

const INTENT_OBJECT: Record<IntentId, DiscoveryObjectId> = {
  "online-therapy": "armchair",
  "online-psychiatry": "treatments",
  "self-guided": "tools",
  "free-apps": "notebook",
  "takes-insurance": "care",
  "peer-support": "doorway",
};

export function IntentTiles({
  intents,
  counts,
  current,
}: {
  intents: IntentDefinition[];
  counts: Record<string, number>;
  current?: IntentId;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {intents
        .filter((i) => i.id !== current && (counts[i.id] ?? 0) >= 2)
        .map((intent) => {
          const Art = DISCOVERY_OBJECTS[INTENT_OBJECT[intent.id]];
          return (
            <li key={intent.id}>
              <Link
                href={intent.href}
                className="border-separator bg-surface shadow-card-1 hover:shadow-card-2 focus-visible:ring-accent group flex h-full flex-col rounded-2xl border p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5"
              >
                <span aria-hidden="true" className="block h-12 w-16 transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none">
                  <Art />
                </span>
                <span className="text-label-primary group-hover:text-accent mt-3 text-[16px] leading-tight font-semibold sm:text-[17px]">
                  {intent.label}
                </span>
                <span className="text-label-tertiary mt-1 text-[13px] leading-snug">
                  {intent.line} · {counts[intent.id]}
                </span>
              </Link>
            </li>
          );
        })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// At a glance

export function GlanceStrip({ glance, noun = "options" }: { glance: Glance; noun?: string }) {
  const items: { value: string; label: string }[] = [{ value: String(glance.total), label: noun }];
  if (glance.insurance) items.push({ value: String(glance.insurance), label: "take insurance" });
  if (glance.freeToStart) items.push({ value: String(glance.freeToStart), label: "free or free to start" });
  if (glance.withPeople && glance.onYourOwn) {
    items.push({ value: String(glance.withPeople), label: "with a real person" });
    items.push({ value: String(glance.onYourOwn), label: "you use on your own" });
  }
  if (glance.typicalMonthly) {
    items.push({ value: `$${glance.typicalMonthly}`, label: `typical listed price a month (${glance.priced} list one)` });
  }
  return (
    <dl className="border-separator grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-[var(--color-separator)] sm:grid-cols-3 lg:grid-cols-6">
      {items.map((i) => (
        <div key={i.label} className="bg-surface px-4 py-3.5">
          <dt className="sr-only">{i.label}</dt>
          <dd>
            <span className="text-label-primary font-display block text-[26px] leading-none tabular-nums">{i.value}</span>
            <span className="text-label-tertiary mt-1.5 block text-[12.5px] leading-snug">{i.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
