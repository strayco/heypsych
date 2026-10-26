/**
 * HomeHero
 *
 * The first viewport: one headline, one question, two worlds.
 *
 * Owns the heading hierarchy and the decision. Everything visual inside the
 * worlds is rendered on the server as inline SVG, so the composition is
 * complete in the first HTML response with no image requests and no layout
 * shift. The only client code is the small link wrapper in WorldChoice.
 */

import Link from "next/link";
import { displayFont } from "@/components/brand/fonts";
import { WorldChoice } from "./WorldChoice";
import { WorldDefs } from "./worlds/WorldDefs";
import { PatientWorldScene } from "./worlds/PatientWorldScene";
import { ClinicianWorldScene } from "./worlds/ClinicianWorldScene";
import styles from "./worlds/worlds.module.css";

export function HomeHero() {
  return (
    <section
      aria-labelledby="home-heading"
      className={`${displayFont.variable} relative px-4 pt-8 pb-14 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14 lg:pb-20`}
    >
      <WorldDefs />

      <div className="mx-auto max-w-[1240px]">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            id="home-heading"
            className="font-display text-label-primary text-[38px] leading-[1.06] font-normal tracking-[-0.02em] sm:text-[52px] lg:text-[60px]"
          >
            A little clarity changes everything.
          </h1>
          <p className="text-label-secondary mx-auto mt-3 max-w-xl text-[16px] leading-relaxed sm:mt-4 sm:text-[19px]">
            Find the support you need. Or build the practice you imagine.
          </p>
        </div>

        <h2
          data-heading="sans"
          className="text-label-primary mt-7 text-center text-[15px] font-medium sm:mt-9 sm:text-[16px]"
        >
          Where would you like to begin?
        </h2>

        <ul
          className={`${styles.choices} mt-3 grid gap-7 sm:mt-4 md:grid-cols-2 md:gap-6 lg:gap-10`}
          role="list"
        >
          <li>
            <WorldChoice
              world="patient"
              href="/find-support"
              title="For me or someone I love"
              description="Find support, understand your options, and take the next step."
              action="Find my way"
            >
              <PatientWorldScene />
            </WorldChoice>
          </li>
          <li>
            <WorldChoice
              world="clinician"
              href="/architect"
              title="For my practice"
              description="Build a practice that works beautifully, from day one."
              action="Build my practice"
            >
              <ClinicianWorldScene />
            </WorldChoice>
          </li>
        </ul>

        {/* Crisis help is never behind the choice above. Plain text, not a
            banner: present and easy to find without alarming anyone who
            does not need it. */}
        <p className="text-label-secondary mt-10 text-center text-[14px] leading-relaxed lg:mt-12">
          Need help right now?{" "}
          <a
            href="tel:988"
            className="text-label-primary decoration-separator-opaque hover:decoration-label-primary focus-visible:ring-accent font-medium underline underline-offset-4 focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none"
          >
            Call or text 988
          </a>{" "}
          in the US, any time.{" "}
          <Link
            href="/resources/support-community/immediate-crisis"
            className="text-label-primary decoration-separator-opaque hover:decoration-label-primary focus-visible:ring-accent font-medium underline underline-offset-4 focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none"
          >
            More crisis resources
          </Link>
        </p>
      </div>
    </section>
  );
}
