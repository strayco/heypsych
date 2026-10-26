/**
 * GlobalSearchEntry
 *
 * A plain GET form to the existing /search page, so it works before (and
 * without) JavaScript and produces a shareable, crawlable URL. It searches
 * whatever /search already covers; the copy names only those areas.
 */

import { Search } from "lucide-react";

export function GlobalSearchEntry() {
  return (
    <form action="/search" method="get" role="search" className="max-w-xl">
      <label htmlFor="home-search" className="text-label-primary block text-[14px] font-medium">
        Or search for something specific
      </label>
      <div className="relative mt-2">
        <Search
          aria-hidden="true"
          className="text-label-tertiary pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2"
        />
        <input
          id="home-search"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Conditions, treatments, apps, tools"
          className="border-separator-opaque text-label-primary placeholder:text-label-tertiary focus:border-accent focus:ring-accent/25 h-12 w-full rounded-full border bg-white pr-28 pl-11 text-[16px] transition-colors focus:ring-2 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-label-primary hover:bg-accent focus-visible:ring-accent absolute top-1/2 right-1.5 h-9 -translate-y-1/2 rounded-full px-4 text-[14px] font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Search
        </button>
      </div>
    </form>
  );
}
