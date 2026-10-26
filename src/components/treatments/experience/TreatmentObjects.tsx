/**
 * Treatment objects
 *
 * The object that opens a treatment page, drawn with the Architect primitives
 * in the Worlds projection, palette and light (see
 * docs/active/design/HOMEPAGE_WORLDS_ART_BIBLE.md). Therapy reuses the
 * homepage armchair; procedures reuse the treatments card box, so a visitor
 * meets the same objects they saw on the homepage.
 *
 * Decorative: every object sits beside a visible title.
 */

import { iso } from "@/domains/architect/world/scene";
import { ContactShadow, IsoBox, IsoCylinder } from "@/app/architect/_components/world/primitives";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";
import type { TreatmentObject } from "@/domains/treatments/experience/model";

function Frame({ viewBox, children }: { viewBox: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
    >
      {children}
    </svg>
  );
}

/** A capped prescription bottle with two round tablets beside it. */
function PillBottle() {
  const body = iso(12, 12);
  return (
    <Frame viewBox="-40 -74 104 116">
      <ContactShadow origin={iso(5, 5)} w={14} d={14} opacity={0.14} />

      {/* Amber-toned body with a narrow paper label band. */}
      {/* Drawn as lower body, label, upper body, so the label's own top
          ellipse is covered and the band wraps the bottle. */}
      <IsoCylinder origin={body} radius={8} h={15} material="oak" />
      <IsoCylinder origin={{ x: body.x, y: body.y - 15 }} radius={8.05} h={12} material="paper" />
      <IsoCylinder origin={{ x: body.x, y: body.y - 27 }} radius={8} h={17} material="oak" />
      {/* Child-resistant cap, closed, in slate so it reads apart from the label. */}
      <IsoCylinder origin={{ x: body.x, y: body.y - 44 }} radius={8.6} h={8} material="slate" />

      {/* Two round tablets on the surface in front. */}
      <IsoCylinder origin={iso(21, 13)} radius={3.4} h={2} material="paper" />
      <IsoCylinder origin={iso(26, 11)} radius={3.4} h={2} material="ceramic" />
    </Frame>
  );
}

/** A supplement jar with a wooden lid. */
function SupplementJar() {
  const jar = iso(12, 12);
  return (
    <Frame viewBox="-56 -60 120 96">
      <ContactShadow origin={iso(2, 2)} w={20} d={20} opacity={0.12} />
      <IsoCylinder origin={jar} radius={11} h={30} material="ceramic" />
      <IsoCylinder origin={{ x: jar.x, y: jar.y - 8 }} radius={11.15} h={13} material="sage" />
      <IsoCylinder origin={{ x: jar.x, y: jar.y - 30 }} radius={11.4} h={6} material="walnut" />
      <IsoBox origin={iso(24, 20)} w={3.2} d={3.2} h={2.2} material="oak" />
    </Frame>
  );
}

export function TreatmentObjectArt({ object }: { object: TreatmentObject }) {
  switch (object) {
    case "medication":
      return <PillBottle />;
    case "supplement":
      return <SupplementJar />;
    case "therapy": {
      const Armchair = DISCOVERY_OBJECTS.armchair;
      return <Armchair />;
    }
    default: {
      const CardBox = DISCOVERY_OBJECTS.treatments;
      return <CardBox />;
    }
  }
}
