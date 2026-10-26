/**
 * Explore (/browse)
 *
 * Every area of HeyPsych in one place, each shown with its object from the
 * Worlds — the same object that opens that section — so this page doubles as
 * a map of the site. Patient and family areas come first; clinician areas
 * follow. The two guided starts close the page for anyone still unsure.
 *
 * Header navigation "Explore" points here.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/brand/PageIntro";
import {
  DISCOVERY_OBJECTS,
  type DiscoveryObjectId,
} from "@/components/home/worlds/DiscoveryObjects";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Explore HeyPsych: mental health conditions, symptoms, treatments, apps and tools, care, support communities, guides, and tools for clinicians.",
};

interface Area {
  name: string;
  href: string;
  description: string;
  object: DiscoveryObjectId;
}

const FOR_YOU: Area[] = [
  {
    name: "Conditions",
    href: "/conditions",
    description: "What a condition can feel like, how it's diagnosed, and how it's treated.",
    object: "conditions",
  },
  {
    name: "Symptoms",
    href: "/symptoms",
    description: "Describe what you're noticing in your own words.",
    object: "notebook",
  },
  {
    name: "Treatments",
    href: "/treatments",
    description: "Therapy, medication, and other approaches, side by side.",
    object: "treatments",
  },
  {
    name: "Apps & Tools",
    href: "/tools",
    description: "Online therapy, psychiatry and apps, matched to what you need and how you'd pay.",
    object: "tools",
  },
  {
    name: "Find Care",
    href: "/psychiatrists",
    description: "Search a directory of psychiatrists.",
    object: "care",
  },
  {
    name: "Support & community",
    href: "/resources/support-community",
    description: "Helplines, organizations, and groups, including for families.",
    object: "armchair",
  },
  {
    name: "Learn",
    href: "/learn",
    description: "Short, plain-language guides and research explained.",
    object: "reading",
  },
];

const FOR_CLINICIANS: Area[] = [
  {
    name: "Practice Architect",
    href: "/architect",
    description: "Design your practice and see the tools it needs.",
    object: "clinician",
  },
  {
    name: "Practice software",
    href: "/tools/for-clinicians",
    description: "EHRs, AI notes, billing, networks and telehealth, by the job each does.",
    object: "clinician",
  },
  {
    name: "Clinical reference",
    href: "/for-clinicians",
    description: "Treatment information, condition reference, and assessments.",
    object: "reading",
  },
];

function AreaGrid({ areas }: { areas: Area[] }) {
  return (
    <ul role="list" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {areas.map((area) => {
        const Art = DISCOVERY_OBJECTS[area.object];
        return (
          <li key={area.href}>
            <Link
              href={area.href}
              className="group border-separator bg-surface hover:border-separator-opaque hover:shadow-elevated focus-visible:ring-accent focus-visible:ring-offset-canvas flex h-full items-center gap-5 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span aria-hidden="true" className="block h-20 w-24 shrink-0">
                <Art />
              </span>
              <span className="min-w-0">
                <span className="text-label-primary flex items-center gap-1.5 text-[17px] font-semibold">
                  {area.name}
                  <span
                    aria-hidden="true"
                    className="text-label-quaternary group-hover:text-accent transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  >
                    →
                  </span>
                </span>
                <span className="text-label-secondary mt-1 block text-[14px] leading-snug">
                  {area.description}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function BrowsePage() {
  return (
    <div className="bg-canvas min-h-screen">
      <PageIntro
        title="Explore HeyPsych"
        description="Everything on HeyPsych, in one place. Start anywhere: each area links to the others when it helps."
      />

      <div className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <section aria-labelledby="explore-you">
            <h2 id="explore-you" className="text-label-primary text-[26px] sm:text-[30px]">
              For you and the people you care about
            </h2>
            <AreaGrid areas={FOR_YOU} />
          </section>

          <section aria-labelledby="explore-clinicians" className="mt-14 lg:mt-16">
            <h2 id="explore-clinicians" className="text-label-primary text-[26px] sm:text-[30px]">
              For mental health professionals
            </h2>
            <AreaGrid areas={FOR_CLINICIANS} />
          </section>

          <section
            aria-labelledby="explore-unsure"
            className="border-separator bg-surface-grouped mt-14 grid gap-6 rounded-[28px] border p-6 sm:p-8 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
          >
            <div>
              <h2 id="explore-unsure" className="text-label-primary text-[24px] sm:text-[28px]">
                Not sure where to start?
              </h2>
              <p className="text-label-secondary mt-2 max-w-xl text-[15px] leading-relaxed">
                Two short guided starts: one for finding support, one for building a practice.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/find-support"
                className="group bg-label-primary hover:bg-accent focus-visible:ring-accent inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Find my way
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
              <Link
                href="/architect"
                className="group border-separator-opaque bg-surface text-label-primary hover:border-label-primary focus-visible:ring-accent inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-[15px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Build my practice
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
