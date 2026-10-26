import { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/brand/PageIntro";

export const metadata: Metadata = {
  title: "About",
  description:
    "HeyPsych helps people make better mental-health decisions. For patients and families: understand options and find support. For clinicians: build the right practice.",
};

const FOR_YOU = [
  {
    title: "Understand what you're experiencing",
    body: "Plain-language guides to symptoms and conditions, including how they're diagnosed and what to expect from treatment.",
    href: "/conditions",
  },
  {
    title: "Compare treatments",
    body: "Medications, therapies, and other approaches side by side, with the strength of the evidence and common side effects.",
    href: "/treatments",
  },
  {
    title: "Find care",
    body: "A directory of psychiatrists you can search by name, location, and specialty.",
    href: "/psychiatrists",
  },
  {
    title: "Choose apps and tools",
    body: "Digital tools for mood, sleep, stress, and more, compared on evidence, privacy, and price.",
    href: "/tools/for-patients",
  },
];

const FOR_CLINICIANS = [
  {
    title: "Practice Architect",
    body: "Design your practice room by room and see the tools it needs, with the reasons behind every suggestion.",
    href: "/architect",
  },
  {
    title: "Compare practice software",
    body: "EHR, billing, telehealth, and documentation tools side by side, with transparent pricing.",
    href: "/tools/for-clinicians",
  },
  {
    title: "Clinical reference",
    body: "Treatment information, condition reference, assessments, and patient education, free to use.",
    href: "/for-clinicians",
  },
];

function Column({
  heading,
  items,
}: {
  heading: string;
  items: { title: string; body: string; href: string }[];
}) {
  return (
    <section>
      <h2 className="text-label-primary text-[24px] sm:text-[28px]">{heading}</h2>
      <ul role="list" className="divide-separator border-separator mt-5 divide-y border-y">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group focus-visible:ring-accent flex items-start justify-between gap-4 py-5 focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none"
            >
              <span>
                <span className="text-label-primary group-hover:text-accent block text-[16px] font-semibold">
                  {item.title}
                </span>
                <span className="text-label-secondary mt-1 block text-[15px] leading-relaxed">
                  {item.body}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-label-quaternary group-hover:text-accent mt-0.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const linkClass =
  "font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent";

export default function AboutPage() {
  return (
    <div>
      <PageIntro
        title="About HeyPsych"
        object="doorway"
        width="reading"
        description="Better mental health starts with better decisions. HeyPsych helps patients, families, and clinicians understand their options and take a clear next step."
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="max-w-2xl">
          <h2 className="text-label-primary text-[24px] sm:text-[28px]">Why we exist</h2>
          <div className="text-label-secondary mt-4 space-y-4 text-[17px] leading-relaxed">
            <p>
              The hardest part of mental health often isn&apos;t finding information. It&apos;s
              knowing what to do with it. HeyPsych structures what&apos;s known so you can compare
              options, understand the tradeoffs, and decide what to do next.
            </p>
            <p>
              Everything here is held to one question:{" "}
              <span className="text-label-primary font-medium">
                does this help someone make a decision?
              </span>
            </p>
          </div>
        </section>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-14">
          <Column heading="For you and the people you care about" items={FOR_YOU} />
          <Column heading="For mental health professionals" items={FOR_CLINICIANS} />
        </div>

        <section className="mt-16 max-w-2xl">
          <h2 className="text-label-primary text-[24px] sm:text-[28px]">How we stay trustworthy</h2>
          <dl className="mt-5 space-y-5 text-[15px] leading-relaxed">
            <div>
              <dt className="text-label-primary font-semibold">Clinical review</dt>
              <dd className="text-label-secondary mt-1">
                Clinical content is reviewed by board-certified psychiatrists and licensed mental
                health professionals.{" "}
                <Link href="/about/medical-review-board" className={linkClass}>
                  Meet the medical review board
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-label-primary font-semibold">Editorial independence</dt>
              <dd className="text-label-secondary mt-1">
                Sponsors can&apos;t buy reviews, rankings, or favorable coverage.{" "}
                <Link href="/about/sponsorship-policy" className={linkClass}>
                  Read the sponsorship policy
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-label-primary font-semibold">Published methodology</dt>
              <dd className="text-label-secondary mt-1">
                We document how tools are evaluated: clinical evidence, privacy, pricing, and
                features.{" "}
                <Link href="/about/review-methodology" className={linkClass}>
                  See the review methodology
                </Link>
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          <div className="border-separator bg-surface rounded-2xl border p-5">
            <h2 data-heading="sans" className="text-label-primary text-[15px] font-semibold">
              Not medical advice
            </h2>
            <p className="text-label-secondary mt-1.5 text-[14px] leading-relaxed">
              HeyPsych provides decision-support information. It isn&apos;t a substitute for
              professional medical advice, diagnosis, or treatment. Always talk with a qualified
              provider about your care.
            </p>
          </div>
          <div className="border-negative-border bg-negative-tint rounded-2xl border p-5">
            <h2 data-heading="sans" className="text-label-primary text-[15px] font-semibold">
              If you&apos;re in crisis
            </h2>
            <p className="text-label-secondary mt-1.5 text-[14px] leading-relaxed">
              Call or text{" "}
              <a
                href="tel:988"
                className="text-label-primary font-semibold underline underline-offset-4"
              >
                988
              </a>{" "}
              (Suicide &amp; Crisis Lifeline, US), or go to your nearest emergency room.{" "}
              <Link href="/resources/support-community/immediate-crisis" className={linkClass}>
                More crisis resources
              </Link>
            </p>
          </div>
        </section>

        <p className="text-label-secondary mt-12 text-[15px]">
          General inquiries, media, and partnerships:{" "}
          <a href="mailto:hello@heypsych.com" className={linkClass}>
            hello@heypsych.com
          </a>
        </p>
      </div>
    </div>
  );
}
