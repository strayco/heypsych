/**
 * One kind of treatment (/treatments/medications, /therapy, …), in the same
 * hub pattern as /treatments and /conditions: object intro, search, "what
 * it's for" chips, A–Z. Medications are also shelved by family.
 */

import Link from "next/link";
import { PageIntro } from "@/components/brand/PageIntro";
import { HubBrowser } from "@/components/hubs/HubBrowser";
import { buildGroups, topFacets } from "@/domains/hubs/model";
import { loadTreatmentHub, MEDICATION_FAMILIES } from "@/domains/hubs/treatment-hub";

const OTHER_KINDS = [
  { id: "medication", label: "Medications", href: "/treatments/medications" },
  { id: "therapy", label: "Therapies", href: "/treatments/therapy" },
  { id: "interventional", label: "Procedures & devices", href: "/treatments/interventional" },
  { id: "supplement", label: "Supplements", href: "/treatments/supplements" },
  { id: "alternative", label: "Lifestyle & alternative", href: "/treatments/alternative" },
  { id: "investigational", label: "Investigational", href: "/treatments/investigational" },
];

export async function TreatmentKindHub({
  modality,
  title,
  description,
  noun,
  searchPlaceholder,
  caution,
}: {
  modality: string;
  title: string;
  description: string;
  noun: string;
  searchPlaceholder: string;
  /** One quiet line under the intro, e.g. for investigational treatments. */
  caution?: string;
}) {
  const { items, conditionNames } = await loadTreatmentHub(modality);
  const groups =
    modality === "medication"
      ? buildGroups(items, [
          ...MEDICATION_FAMILIES.map(({ id, label, description }) => ({ id, label, description })),
          { id: "other", label: "Other medicines", description: "Medicines that don't fit the families above." },
        ])
      : undefined;
  const facets = topFacets(items, conditionNames, 14);

  return (
    <div className="bg-canvas min-h-screen">
      <PageIntro
        title={title}
        object="treatments"
        description={description}
        footnote={`${items.length} ${noun} documented. ${caution ?? "Talk with a clinician before starting or changing any treatment."}`}
      >
        <nav aria-label="Other kinds of treatment" className="flex flex-wrap gap-2">
          <Link
            href="/treatments"
            className="border-separator text-label-secondary hover:text-label-primary rounded-full border px-3 py-1.5 text-[14px]"
          >
            ← All treatments
          </Link>
          {OTHER_KINDS.filter((k) => k.id !== modality).map((k) => (
            <Link
              key={k.id}
              href={k.href}
              className="border-separator text-label-secondary hover:text-label-primary hover:bg-fill-quaternary rounded-full border px-3 py-1.5 text-[14px]"
            >
              {k.label}
            </Link>
          ))}
        </nav>
      </PageIntro>
      <div className="pt-8">
        <HubBrowser
          items={items}
          groups={groups && groups.length > 1 ? groups : undefined}
          facets={facets}
          groupsTitle="Jump to a family"
          sectioned={modality === "medication"}
          facetsTitle="What it's for"
          listTitle={modality === "medication" ? "By family" : `All ${noun}, A–Z`}
          searchLabel={`Search ${noun}`}
          searchPlaceholder={searchPlaceholder}
          noun={noun}
        />
        <p className="text-label-tertiary mx-auto max-w-6xl px-4 pt-10 pb-16 text-[14px] sm:px-6 lg:px-8">
          Weighing two options?{" "}
          <Link href="/treatments/compare" className="text-accent hover:underline">
            Compare treatments side by side
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
