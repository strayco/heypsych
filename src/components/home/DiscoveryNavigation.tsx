/**
 * DiscoveryNavigation
 *
 * The one secondary section under the hero: direct routes into HeyPsych's
 * existing libraries, and search. It deliberately sits below the worlds and
 * never competes with them.
 *
 * Every destination is an existing, canonical route. Labels are always visible;
 * the small objects only accompany them.
 */

import { displayFont } from "@/components/brand/fonts";
import { DiscoveryLink } from "./DiscoveryLink";
import { GlobalSearchEntry } from "./GlobalSearchEntry";
import { DISCOVERY_OBJECTS, type DiscoveryObjectId } from "./worlds/DiscoveryObjects";

const PATHWAYS: {
  id: DiscoveryObjectId;
  href: string;
  label: string;
  description: string;
}[] = [
  {
    id: "conditions",
    href: "/conditions",
    label: "Conditions",
    description: "Understand symptoms and diagnoses",
  },
  {
    id: "treatments",
    href: "/treatments",
    label: "Treatments",
    description: "Therapy, medication, and other approaches",
  },
  {
    id: "tools",
    href: "/tools",
    label: "Apps & Tools",
    description: "Compare mental health apps and services",
  },
  {
    id: "care",
    href: "/psychiatrists",
    label: "Find Care",
    description: "Search a directory of psychiatrists",
  },
  {
    id: "clinician",
    href: "/tools/for-clinicians",
    label: "Clinician Tools",
    description: "EHR, billing, and practice software",
  },
];

export function DiscoveryNavigation() {
  return (
    <section
      aria-labelledby="discovery-heading"
      className={`${displayFont.variable} border-separator border-t px-4 py-14 sm:px-6 lg:px-8 lg:py-20`}
    >
      <div className="mx-auto max-w-[1240px]">
        <h2
          id="discovery-heading"
          className="font-display text-label-primary text-[30px] leading-tight font-normal tracking-[-0.015em] sm:text-[38px]"
        >
          Explore what matters to you.
        </h2>

        <ul
          role="list"
          className="mt-8 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:mt-10 lg:grid-cols-5 lg:gap-4"
        >
          {PATHWAYS.map((pathway) => {
            const Art = DISCOVERY_OBJECTS[pathway.id];
            return (
              <li key={pathway.id}>
                <DiscoveryLink
                  href={pathway.href}
                  navItem={pathway.id}
                  className="group hover:bg-surface-grouped focus-visible:ring-accent flex items-center gap-4 rounded-2xl px-2 py-3 transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none lg:flex-col lg:items-start lg:gap-3 lg:p-4"
                >
                  <span className="block h-14 w-20 shrink-0 transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 lg:h-28 lg:w-full">
                    <Art />
                  </span>
                  <span className="min-w-0">
                    <span className="text-label-primary flex items-center gap-1.5 text-[16px] font-semibold">
                      {pathway.label}
                      <span
                        aria-hidden="true"
                        className="text-label-tertiary group-hover:text-accent transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      >
                        →
                      </span>
                    </span>
                    <span className="text-label-secondary mt-0.5 block text-[14px] leading-snug">
                      {pathway.description}
                    </span>
                  </span>
                </DiscoveryLink>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 lg:mt-12">
          <GlobalSearchEntry />
        </div>
      </div>
    </section>
  );
}
