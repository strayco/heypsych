/**
 * Not found
 *
 * A wrong turn should still feel like HeyPsych: the doorway from the Worlds,
 * a plain explanation, a way to search, and the main ways back in. Crisis
 * help stays one tap away here too, because someone may arrive on a broken
 * link while looking for it.
 */

import Link from "next/link";
import { Search } from "lucide-react";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";

const WAYS_BACK = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Explore everything" },
  { href: "/find-support", label: "Find my way" },
  { href: "/architect", label: "Build my practice" },
];

export default function NotFound() {
  const Doorway = DISCOVERY_OBJECTS.doorway;

  return (
    <div className="bg-canvas px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        <div>
          <p className="text-label-tertiary text-[14px] font-medium">404</p>
          <h1 className="font-display text-label-primary mt-2 text-[38px] leading-[1.06] font-normal tracking-[-0.02em] sm:text-[52px]">
            This room doesn&apos;t exist.
          </h1>
          <p className="text-label-secondary mt-4 max-w-xl text-[17px] leading-relaxed">
            The page may have moved, or the link may be mistyped. Search for what you were looking
            for, or head back in through one of these doors.
          </p>

          <form action="/search" method="get" role="search" className="mt-8 max-w-xl">
            <label htmlFor="not-found-search" className="sr-only">
              Search HeyPsych
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="text-label-tertiary pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2"
              />
              <input
                id="not-found-search"
                name="q"
                type="search"
                placeholder="Search conditions, treatments, apps, tools"
                className="border-separator-opaque bg-surface text-label-primary placeholder:text-label-tertiary focus:border-accent h-12 w-full rounded-full border pr-28 pl-11 text-[16px] focus:outline-none"
              />
              <button
                type="submit"
                className="bg-label-primary hover:bg-accent absolute top-1/2 right-1.5 h-9 -translate-y-1/2 rounded-full px-4 text-[14px] font-medium text-white transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <ul role="list" className="mt-8 flex flex-wrap gap-2">
            {WAYS_BACK.map((way) => (
              <li key={way.href}>
                <Link
                  href={way.href}
                  className="border-separator-opaque bg-surface text-label-primary hover:border-label-primary focus-visible:ring-accent inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {way.label}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-label-secondary mt-10 text-[14px] leading-relaxed">
            Need help right now?{" "}
            <a
              href="tel:988"
              className="text-label-primary font-medium underline underline-offset-4"
            >
              Call or text 988
            </a>{" "}
            in the US, any time.
          </p>
        </div>

        <div aria-hidden="true" className="mx-auto h-[220px] w-[260px] lg:h-[300px] lg:w-[320px]">
          <Doorway />
        </div>
      </div>
    </div>
  );
}
