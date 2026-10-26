/**
 * Condition category hub (e.g. /conditions/anxiety-fear).
 *
 * Server component (despite the legacy file name): it receives the category's
 * conditions and renders a shelf of them in the Worlds style, plus the other
 * categories to move sideways. Only small items reach the browser.
 */

import Link from "next/link";
import type { Entity } from "@/lib/types/database";
import { CONDITION_CATEGORIES, type CategoryConfig } from "@/lib/config/condition-categories";
import { PageIntro } from "@/components/brand/PageIntro";
import { HubBrowser } from "@/components/hubs/HubBrowser";
import { conditionOneLiner, type HubItem } from "@/domains/hubs/model";

// Client-safe category config (without React component icon)
type SerializableCategoryConfig = Omit<CategoryConfig, "icon">;

interface ConditionsCategoryClientProps {
  conditions: Entity[];
  category: SerializableCategoryConfig;
}

export function ConditionsCategoryClient({ conditions, category }: ConditionsCategoryClientProps) {
  const items: HubItem[] = (conditions ?? [])
    .filter((c) => c.slug && c.name)
    .map((c) => ({
      href: `/conditions/${c.slug}`,
      title: c.name,
      subtitle: conditionOneLiner(c.data) ?? `About ${c.name}: what it can feel like, how it's diagnosed, and how it's treated.`,
      groups: [category.slug],
      facets: [],
      keywords: [],
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const siblings = CONDITION_CATEGORIES.filter((c) => c.slug !== category.slug);

  return (
    <div className="bg-canvas min-h-screen">
      <PageIntro
        title={category.displayTitle}
        object="conditions"
        parent={{ label: "All conditions", href: "/conditions" }}
        description={category.subtitle}
        footnote={`${items.length} ${items.length === 1 ? "condition" : "conditions"}. Educational information, not a diagnosis.`}
      />

      {items.length > 0 ? (
        <div className="pt-8">
          <HubBrowser
            items={items}
            listTitle={`In ${category.displayTitle}`}
            searchLabel={`Search ${category.displayTitle}`}
            searchPlaceholder="Search this category"
            showSearch={items.length > 8}
            noun="conditions"
          />
        </div>
      ) : (
        <p className="text-label-secondary mx-auto max-w-6xl px-4 py-12 text-[16px] sm:px-6 lg:px-8">
          We don&apos;t have conditions in this category yet.
        </p>
      )}

      <section aria-labelledby="other-categories" className="border-separator border-t px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 id="other-categories" className="font-display text-label-primary text-[24px]">
            Other kinds of condition
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {siblings.map((s) => (
              <li key={s.slug}>
                <Link
                  href={s.href}
                  className="border-separator bg-surface text-label-primary hover:border-accent hover:text-accent inline-flex rounded-full border px-4 py-2 text-[14px] transition-colors"
                >
                  {s.displayTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
