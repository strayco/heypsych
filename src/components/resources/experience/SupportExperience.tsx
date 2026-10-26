/**
 * Support organisation / hotline page
 *
 * The armchair object from the Worlds, then the thing people came for: how
 * to reach them (call, text, chat, web) in one prominent card, with who it
 * is for, hours and cost beside it. Everything comes from the record.
 * Same family as the condition and symptom pages (art bible §13).
 */

import Link from "next/link";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";
import type { Channel, SupportView } from "@/domains/resources/experience/support";
import { textToBlocks } from "@/domains/articles/experience/model";

const VERB: Record<Channel["kind"], string> = {
  call: "Call",
  text: "Text",
  chat: "Chat",
  whatsapp: "WhatsApp",
  tty: "TTY",
  video: "Video",
  web: "Web",
};

function ChannelRow({ c, primary }: { c: Channel; primary: boolean }) {
  const external = c.href?.startsWith("http");
  const body = (
    <>
      <span
        aria-hidden="true"
        className={`flex h-10 w-14 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold tracking-[0.04em] uppercase ${
          primary ? "bg-accent text-white" : "bg-fill-quaternary text-label-secondary"
        }`}
      >
        {VERB[c.kind]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-label-primary block text-[16px] leading-snug font-medium">
          {c.label}
          {c.region && <span className="text-label-tertiary font-normal"> · {c.region}</span>}
        </span>
        {c.value && <span className={`block tabular-nums ${primary ? "text-label-primary text-[22px] font-semibold tracking-[-0.01em]" : "text-label-secondary text-[15px]"}`}>{c.value}</span>}
        {c.note && <span className="text-label-tertiary block text-[14px]">{c.note}</span>}
      </span>
      {c.href && (
        <span aria-hidden="true" className="text-label-tertiary group-hover:text-accent text-[18px]">
          {external ? "↗" : "→"}
        </span>
      )}
    </>
  );
  const cls = "group flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors";
  if (!c.href) return <li className={cls}>{body}</li>;
  return (
    <li>
      <a
        href={c.href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`${cls} hover:bg-fill-quaternary focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none`}
      >
        {body}
      </a>
    </li>
  );
}

export function SupportExperience({ support: x }: { support: SupportView }) {
  const Armchair = DISCOVERY_OBJECTS.armchair;
  const firstDialable = x.channels.findIndex((c) => c.kind !== "web" && c.value);
  const facts = [
    x.availability ? { label: "Hours", value: x.availability } : null,
    x.cost.length ? { label: "Cost", value: x.cost.join(", ") } : x.free ? { label: "Cost", value: "Free" } : null,
    x.audience.length ? { label: "Who it's for", value: x.audience.join(", ") } : null,
    x.regions.length ? { label: "Where", value: x.regions.join(", ") } : null,
  ].filter((f): f is { label: string; value: string } => Boolean(f));
  const org = x.org && x.org !== x.name ? x.org : null;

  return (
    <div className="bg-canvas">
      <header className="px-4 pt-8 pb-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mx-auto grid max-w-5xl items-end gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <Link href="/resources" className="text-label-secondary hover:text-label-primary text-[14px] font-medium">
              <span aria-hidden="true">←</span> Support and resources
            </Link>
            <div aria-hidden="true" className="mt-6 h-20 w-28 lg:hidden">
              <Armchair />
            </div>
            <p className="text-accent mt-6 text-[13px] font-semibold tracking-[0.06em] uppercase">
              {x.crisis ? "Helpline" : "Support organisation"}
              {x.verified && <span className="text-label-tertiary font-medium normal-case tracking-normal"> · Details verified</span>}
            </p>
            <h1 className="font-display text-label-primary mt-3 text-[38px] leading-[1.06] font-normal tracking-[-0.025em] sm:text-[52px]">{x.name}</h1>
            {x.summary && <p className="text-label-primary mt-4 max-w-2xl text-[19px] leading-snug sm:text-[21px]">{x.summary}</p>}
            {org && <p className="text-label-tertiary mt-3 text-[14px]">Run by {org}</p>}
            {(x.is247 || x.free || x.focus.length > 0) && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {x.is247 && <li className="bg-positive-tint text-label-primary rounded-full px-3.5 py-1.5 text-[14px] font-medium">Open 24/7</li>}
                {x.free && <li className="bg-accent-tint text-label-primary rounded-full px-3.5 py-1.5 text-[14px] font-medium">Free</li>}
                {x.focus.map((f) => (
                  <li key={f} className="bg-fill-quaternary text-label-secondary rounded-full px-3.5 py-1.5 text-[14px]">
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div aria-hidden="true" className="hidden h-[190px] lg:block">
            <Armchair />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {x.channels.length > 0 && (
            <section aria-labelledby="reach-title" className="border-separator bg-surface rounded-3xl border p-4 shadow-card-2 sm:p-6">
              <h2 id="reach-title" className="font-display text-label-primary px-3 text-[26px] leading-tight tracking-[-0.01em]">
                How to reach them
              </h2>
              <ul className="mt-3 space-y-1">
                {x.channels.map((c, i) => (
                  <ChannelRow key={`${c.kind}-${c.label}-${c.value}-${i}`} c={c} primary={i === firstDialable} />
                ))}
              </ul>
            </section>
          )}

          {facts.length > 0 && (
            <dl className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {facts.map((f) => (
                <div key={f.label} className="border-separator bg-surface rounded-2xl border p-5 shadow-card-1">
                  <dt className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">{f.label}</dt>
                  <dd className="text-label-primary mt-1.5 text-[16px] leading-snug">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {(x.bestFor.length > 0 || x.notFor.length > 0) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { title: "A good fit for", items: x.bestFor, dot: "bg-positive" },
              { title: "Not the right place for", items: x.notFor, dot: "bg-label-tertiary" },
            ]
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <div key={g.title} className="border-separator bg-surface rounded-2xl border p-5 sm:p-6">
                  <h2 className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">{g.title}</h2>
                  <ul className="mt-3 space-y-2">
                    {g.items.map((item) => (
                      <li key={item} className="text-label-primary flex gap-2.5 text-[15px] leading-snug">
                        <span aria-hidden="true" className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${g.dot}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}

        {x.sections.length > 0 && (
          <div className="max-w-[68ch] py-8">
            {x.sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-28 pt-10">
                <h2 id={`${s.id}-title`} className="font-display text-label-primary text-[26px] leading-tight tracking-[-0.01em] sm:text-[30px]">
                  {s.title}
                </h2>
                <div className="mt-4">
                  {textToBlocks(s.text).map((b, i) =>
                    b.kind === "list" ? (
                      <ul key={i} className="mb-5 space-y-2">
                        {b.items.map((item, j) => (
                          <li key={j} className="text-label-primary flex gap-3 text-[17px] leading-[1.6]">
                            <span aria-hidden="true" className="bg-accent mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : b.kind === "p" ? (
                      <p key={i} className="text-label-primary mb-4 text-[17px] leading-[1.7]">
                        {b.text}
                      </p>
                    ) : null
                  )}
                </div>
              </section>
            ))}
          </div>
        )}

        <section aria-label="If you need help now" className="border-separator mt-8 mb-6 rounded-2xl border border-l-4 border-l-negative bg-surface p-5 sm:p-6">
          <p className="text-label-primary text-[16px] leading-relaxed">
            <strong className="font-semibold">In immediate danger?</strong> Call 911 or your local emergency number. In the US you can call or text{" "}
            <a href="tel:988" className="font-semibold underline underline-offset-2">
              988
            </a>{" "}
            any time.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
            <Link href="/resources" className="text-accent font-medium">
              More support options →
            </Link>
            <Link href="/psychiatrists" className="text-label-secondary hover:text-label-primary">
              Find a psychiatrist
            </Link>
          </p>
        </section>

        <footer className="mb-16 pt-4">
          <p className="text-label-tertiary max-w-3xl text-[13px] leading-relaxed">
            Details come from the organisation's public information. Check their website for the latest hours and services.
          </p>
        </footer>
      </div>
    </div>
  );
}
