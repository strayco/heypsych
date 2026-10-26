/**
 * World Object Illustrations
 *
 * One illustration per registry object, composed entirely from the shared
 * isometric primitives so every object carries the same projection, light
 * direction, and material treatment.
 *
 * Each asset draws at its own local origin; the scene translates it to the
 * anchor from the object registry. No asset positions itself.
 *
 * Screens show an abstract, generic interface. They never depict a vendor's
 * actual product.
 */

import type { WorldObjectId } from "@/domains/architect/world/object-registry";
import {
  MATERIALS,
  faceColor,
  iso,
  polygon,
  shade,
} from "@/domains/architect/world/scene";
import {
  ContactShadow,
  IsoBox,
  IsoPanel,
  Placeholder,
  Screen,
  WallPlaque,
} from "./primitives";

const ORIGIN = { x: 0, y: 0 };

export interface ObjectArtProps {
  /** True once a tool has been assigned, or the function resolved. */
  installed: boolean;
}

type ArtComponent = (props: ObjectArtProps) => React.ReactElement;

// ============================================================================
// WELCOME ZONE
// ============================================================================

/** Exterior practice sign mounted beside the entrance. */
const PracticeSign: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={26} d={2} h={18} mount="wall" />;
  }
  return (
    <g>
      <WallPlaque origin={ORIGIN} w={28} h={20} axis="x" material="walnut">
        {/* Engraved plate inset. */}
        <IsoPanel
          origin={{ x: ORIGIN.x + 6, y: ORIGIN.y + 1.5 }}
          w={20}
          h={13}
          axis="x"
          material="limestone"
        />
      </WallPlaque>
      {/* Two engraved lines standing in for the practice name. */}
      {[7, 11].map((offset, index) => {
        const from = iso(8, 0, offset);
        const to = iso(index === 0 ? 24 : 19, 0, offset);
        return (
          <line
            key={offset}
            x1={ORIGIN.x + from.x}
            y1={ORIGIN.y + from.y}
            x2={ORIGIN.x + to.x}
            y2={ORIGIN.y + to.y}
            stroke={shade(MATERIALS.graphite, 1.5)}
            strokeWidth={index === 0 ? 2.2 : 1.6}
            strokeLinecap="round"
            opacity={0.65}
          />
        );
      })}
    </g>
  );
};

/** Desktop calendar display at the welcome desk. */
const ReceptionCalendar: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={16} d={12} h={16} />;
  }
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={16} d={12} opacity={0.08} />
      {/* Stand. */}
      <IsoBox origin={ORIGIN} w={16} d={12} h={3} material="aluminium" />
      {/* Upright display, angled toward the room. */}
      <g transform={`translate(${iso(2, 2, 3).x}, ${iso(2, 2, 3).y})`}>
        <IsoPanel origin={ORIGIN} w={12} h={16} axis="x" material="graphite" />
        <Screen
          origin={{ x: 1, y: -0.5 }}
          w={10}
          h={13}
          axis="x"
          active
          accent="#9BBFCE"
        />
        {/* A calendar grid reads instantly as scheduling. */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => {
            const p = iso(2 + col * 2.1, 0, 10.5 - row * 3);
            return (
              <rect
                key={`${row}-${col}`}
                x={p.x}
                y={p.y}
                width={2.6}
                height={1.9}
                rx={0.4}
                fill={row === 0 && col === 2 ? "#E8C9A0" : "#8FB3C2"}
                opacity={row === 0 && col === 2 ? 0.95 : 0.5}
              />
            );
          })
        )}
      </g>
    </g>
  );
};

/** Tablet lying on the welcome desk for client paperwork. */
const IntakeTablet: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={14} d={11} h={3} />;
  }
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={14} d={11} opacity={0.07} />
      {/* Slim body lying flat. */}
      <IsoBox
        origin={ORIGIN}
        w={14}
        d={11}
        h={1.6}
        material="graphite"
        topMaterial="graphite"
      />
      {/* Face of the tablet, showing a form. */}
      <polygon
        points={polygon([
          iso(1.4, 1.4, 1.7),
          iso(12.6, 1.4, 1.7),
          iso(12.6, 9.6, 1.7),
          iso(1.4, 9.6, 1.7),
        ])}
        fill="#F4F7F8"
      />
      {/* Form lines and a signature stroke. */}
      {[3, 4.8, 6.6].map((offset, index) => (
        <line
          key={offset}
          x1={iso(3, offset, 1.8).x}
          y1={iso(3, offset, 1.8).y}
          x2={iso(index === 1 ? 8.5 : 11, offset, 1.8).x}
          y2={iso(index === 1 ? 8.5 : 11, offset, 1.8).y}
          stroke="#A9BAC2"
          strokeWidth={1.1}
          strokeLinecap="round"
        />
      ))}
      <path
        d={`M ${iso(3.4, 8.2, 1.8).x} ${iso(3.4, 8.2, 1.8).y}
            q ${2.2} ${-2.2} ${4.4} ${0.4}
            t ${3.4} ${-0.8}`}
        fill="none"
        stroke={MATERIALS.slate}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </g>
  );
};

/** Desk phone for client communication. */
const CommunicationPhone: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={12} d={10} h={4} />;
  }
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={12} d={10} opacity={0.07} />
      <IsoBox origin={ORIGIN} w={12} d={10} h={3} material="graphite" />
      {/* Handset resting on the cradle. */}
      <IsoBox
        origin={{ x: iso(1, 1, 3).x, y: iso(1, 1, 3).y }}
        w={10}
        d={3.4}
        h={2.6}
        material="aluminium"
      />
      {/* Keypad. */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const p = iso(3 + col * 2.4, 5.4 + row * 1.4, 3.2);
          return (
            <circle
              key={`${row}-${col}`}
              cx={p.x}
              cy={p.y}
              r={0.8}
              fill="#8A9298"
            />
          );
        })
      )}
    </g>
  );
};

// ============================================================================
// CLINICAL ZONE
// ============================================================================

/** Monitor and keyboard on the clinician desk. */
const ClinicalComputer: ArtComponent = ({ installed }) => {
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={26} d={18} opacity={0.09} />
      {/* Keyboard stays present: the desk is furnished either way. */}
      <IsoBox
        origin={{ x: iso(2, 11, 0).x, y: iso(2, 11, 0).y }}
        w={18}
        d={6}
        h={1.2}
        material="limestone"
      />
      {/* Monitor stand. */}
      <IsoBox
        origin={{ x: iso(9, 4, 0).x, y: iso(9, 4, 0).y }}
        w={7}
        d={5}
        h={2}
        material="aluminium"
      />
      <IsoBox
        origin={{ x: iso(11.4, 5.8, 2).x, y: iso(11.4, 5.8, 2).y }}
        w={2.2}
        d={1.6}
        h={7}
        material="aluminium"
      />
      {/* Display panel. */}
      <g transform={`translate(${iso(2, 5, 9).x}, ${iso(2, 5, 9).y})`}>
        <IsoPanel origin={ORIGIN} w={21} h={15} axis="x" material="graphite" />
        <Screen
          origin={{ x: 1.6, y: -0.8 }}
          w={18}
          h={12.4}
          axis="x"
          active={installed}
          accent="#9BC5D6"
        />
      </g>
    </g>
  );
};

/** Wall-mounted video display for telehealth. */
const TelehealthDisplay: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={24} d={2} h={16} mount="wall" />;
  }
  return (
    <g>
      <WallPlaque origin={ORIGIN} w={26} h={18} axis="x" material="graphite">
        <Screen
          origin={{ x: 2, y: -1 }}
          w={22}
          h={15}
          axis="x"
          active
          accent="#A6CBD8"
        />
      </WallPlaque>
      {/* Two abstract participant tiles: a video call without faces. */}
      {[
        { gx: 4, w: 8 },
        { gx: 14, w: 8 },
      ].map((tile) => {
        const p = iso(tile.gx, 0, 5);
        return (
          <g key={tile.gx}>
            <rect
              x={p.x}
              y={p.y}
              width={tile.w * 2}
              height={6.5}
              rx={1}
              fill="#3E5560"
            />
            <circle
              cx={p.x + tile.w}
              cy={p.y + 2.6}
              r={1.7}
              fill="#89AEBD"
              opacity={0.9}
            />
          </g>
        );
      })}
    </g>
  );
};

/** Secure cabinet for records. */
const ClinicalCabinet: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={18} d={14} h={30} />;
  }
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={18} d={14} opacity={0.1} />
      <IsoBox origin={ORIGIN} w={18} d={14} h={32} material="walnut" />
      {/* Three drawer fronts on the lit face. */}
      {[6, 16, 26].map((z) => (
        <g key={z}>
          <polygon
            points={polygon([
              iso(0.2, 2, z),
              iso(0.2, 12, z),
              iso(0.2, 12, z + 8),
              iso(0.2, 2, z + 8),
            ])}
            fill={shade(MATERIALS.walnut, 1.06)}
          />
          <line
            x1={iso(0.1, 5.5, z + 4).x}
            y1={iso(0.1, 5.5, z + 4).y}
            x2={iso(0.1, 8.5, z + 4).x}
            y2={iso(0.1, 8.5, z + 4).y}
            stroke={MATERIALS.aluminium}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </g>
      ))}
      {/* A small lock, the one cue that this is about security. */}
      <circle
        cx={iso(0.1, 10.5, 30).x}
        cy={iso(0.1, 10.5, 30).y}
        r={1.5}
        fill={faceColor("aluminium", "top")}
      />
    </g>
  );
};

// ============================================================================
// SPECIALIST ZONE
// ============================================================================

/** Assessment materials stacked on the cabinet. */
const AssessmentKit: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={14} d={11} h={6} />;
  }
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={14} d={11} opacity={0.07} />
      {/* A stack of three booklets, slightly offset. */}
      {[
        { z: 0, inset: 0, material: "slate" as const },
        { z: 2.4, inset: 0.8, material: "sage" as const },
        { z: 4.8, inset: 1.6, material: "paper" as const },
      ].map((layer) => (
        <IsoBox
          key={layer.z}
          origin={{
            x: iso(layer.inset, layer.inset, layer.z).x,
            y: iso(layer.inset, layer.inset, layer.z).y,
          }}
          w={13 - layer.inset * 2}
          d={10 - layer.inset * 2}
          h={2.2}
          material={layer.material}
        />
      ))}
      {/* Scoring marks on the top sheet. */}
      {[3, 5, 7].map((offset) => (
        <line
          key={offset}
          x1={iso(3.4, offset, 7.1).x}
          y1={iso(3.4, offset, 7.1).y}
          x2={iso(9.6, offset, 7.1).x}
          y2={iso(9.6, offset, 7.1).y}
          stroke={MATERIALS.slate}
          strokeWidth={0.9}
          opacity={0.55}
        />
      ))}
    </g>
  );
};

/** Compact prescribing workstation on the clinician desk. */
const PrescribingStation: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={14} d={11} h={14} />;
  }
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={14} d={11} opacity={0.08} />
      <IsoBox origin={ORIGIN} w={14} d={11} h={2.4} material="limestone" />
      {/* Upright terminal. */}
      <g transform={`translate(${iso(1.5, 2, 2.4).x}, ${iso(1.5, 2, 2.4).y})`}>
        <IsoPanel origin={ORIGIN} w={11} h={13} axis="x" material="graphite" />
        <Screen
          origin={{ x: 1, y: -0.6 }}
          w={9}
          h={10.5}
          axis="x"
          active
          accent="#A8C3B4"
        />
      </g>
      {/* A single capsule glyph, the clearest non-clinical cue for meds. */}
      <g
        transform={`translate(${iso(8, 8, 3).x}, ${iso(8, 8, 3).y}) rotate(-28)`}
      >
        <rect
          x={-4}
          y={-1.9}
          width={8}
          height={3.8}
          rx={1.9}
          fill={faceColor("ceramic", "top")}
        />
        <path
          d="M 0 -1.9 h 4 a 1.9 1.9 0 0 1 0 3.8 h -4 z"
          fill={shade(MATERIALS.sage, 1.0)}
        />
      </g>
    </g>
  );
};

/** Shared desk for additional clinicians. */
const TeamWorkspace: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={34} d={22} h={14} />;
  }
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={34} d={22} opacity={0.09} />
      {/* Shared surface. */}
      <IsoBox
        origin={ORIGIN}
        w={34}
        d={22}
        h={13}
        material="oak"
        topMaterial="limestone"
      />
      {/* Two small stations facing opposite ways. */}
      {[
        { gx: 4, gy: 4 },
        { gx: 19, gy: 12 },
      ].map((seat) => (
        <g key={`${seat.gx}`}>
          <IsoBox
            origin={{
              x: iso(seat.gx, seat.gy, 13).x,
              y: iso(seat.gx, seat.gy, 13).y,
            }}
            w={10}
            d={6}
            h={0.9}
            material="aluminium"
          />
          <g
            transform={`translate(${iso(seat.gx, seat.gy + 1, 13.9).x}, ${
              iso(seat.gx, seat.gy + 1, 13.9).y
            })`}
          >
            <IsoPanel
              origin={ORIGIN}
              w={9}
              h={6}
              axis="x"
              material="graphite"
            />
          </g>
        </g>
      ))}
    </g>
  );
};

// ============================================================================
// OPERATIONS ZONE
// ============================================================================

/** Card terminal on the operations surface. */
const PaymentTerminal: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={10} d={9} h={9} />;
  }
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={10} d={9} opacity={0.07} />
      {/* Angled body. */}
      <IsoBox origin={ORIGIN} w={10} d={9} h={4} material="graphite" />
      <IsoBox
        origin={{ x: iso(1, 1, 4).x, y: iso(1, 1, 4).y }}
        w={8}
        d={7}
        h={2.6}
        material="graphite"
        topMaterial="screen"
      />
      {/* Keypad dots. */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const p = iso(2.4 + col * 2.1, 2.4 + row * 1.8, 6.8);
          return (
            <circle
              key={`${row}-${col}`}
              cx={p.x}
              cy={p.y}
              r={0.7}
              fill="#8FA7B2"
              opacity={0.85}
            />
          );
        })
      )}
      {/* Card slot catching the light. */}
      <line
        x1={iso(1.4, 4.5, 4.1).x}
        y1={iso(1.4, 4.5, 4.1).y}
        x2={iso(8.6, 4.5, 4.1).x}
        y2={iso(8.6, 4.5, 4.1).y}
        stroke={shade(MATERIALS.aluminium, 0.9)}
        strokeWidth={1.4}
      />
    </g>
  );
};

/** Billing ledger: a bound book with claim tabs. */
const BillingLedger: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={14} d={11} h={5} />;
  }
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={14} d={11} opacity={0.07} />
      <IsoBox origin={ORIGIN} w={14} d={11} h={3.4} material="slate" />
      {/* Page block, slightly inset from the cover. */}
      <IsoBox
        origin={{ x: iso(0.8, 0.8, 3.4).x, y: iso(0.8, 0.8, 3.4).y }}
        w={12.4}
        d={9.4}
        h={1.4}
        material="paper"
      />
      {/* Ruled lines and a column of ticks. */}
      {[2.6, 4.4, 6.2].map((offset) => (
        <line
          key={offset}
          x1={iso(2.6, offset, 4.9).x}
          y1={iso(2.6, offset, 4.9).y}
          x2={iso(11, offset, 4.9).x}
          y2={iso(11, offset, 4.9).y}
          stroke="#B6C3CA"
          strokeWidth={0.9}
        />
      ))}
      {/* Tabs down the fore-edge, reading as claim categories. */}
      {[
        { offset: 2.2, material: "sage" as const },
        { offset: 4.6, material: "warning" as const },
      ].map((tab) => (
        <rect
          key={tab.offset}
          x={iso(13.4, tab.offset, 2.2).x}
          y={iso(13.4, tab.offset, 2.2).y}
          width={3}
          height={2}
          rx={0.5}
          fill={
            tab.material === "sage"
              ? shade(MATERIALS.sage, 1.05)
              : shade("#A98243", 1.05)
          }
        />
      ))}
    </g>
  );
};

/** Accounting folder standing in a holder. */
const AccountingFolder: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={11} d={9} h={10} />;
  }
  return (
    <g>
      <ContactShadow origin={ORIGIN} w={11} d={9} opacity={0.07} />
      {/* Holder. */}
      <IsoBox origin={ORIGIN} w={11} d={9} h={2.4} material="aluminium" />
      {/* Two upright folders, leaning. */}
      {[
        { gx: 2, material: "oak" as const, h: 11 },
        { gx: 5.4, material: "sage" as const, h: 9.4 },
      ].map((folder) => (
        <IsoBox
          key={folder.gx}
          origin={{
            x: iso(folder.gx, 1.6, 2.4).x,
            y: iso(folder.gx, 1.6, 2.4).y,
          }}
          w={2.6}
          d={6}
          h={folder.h}
          material={folder.material}
        />
      ))}
    </g>
  );
};

/** Framed liability certificate on the wall. */
const InsuranceFrame: ArtComponent = ({ installed }) => {
  if (!installed) {
    return <Placeholder origin={ORIGIN} w={18} d={2} h={14} mount="wall" />;
  }
  return (
    <g>
      <WallPlaque origin={ORIGIN} w={20} h={16} axis="x" material="walnut">
        <IsoPanel
          origin={{ x: 4, y: 1 }}
          w={14}
          h={11}
          axis="x"
          material="paper"
        />
      </WallPlaque>
      {/* Certificate text lines and a seal. */}
      {[4, 6.4, 8.8].map((z, index) => (
        <line
          key={z}
          x1={iso(6, 0, z).x}
          y1={iso(6, 0, z).y}
          x2={iso(index === 0 ? 16 : index === 1 ? 14 : 12, 0, z).x}
          y2={iso(index === 0 ? 16 : index === 1 ? 14 : 12, 0, z).y}
          stroke="#B9B2A4"
          strokeWidth={1}
          strokeLinecap="round"
        />
      ))}
      <circle
        cx={iso(15, 0, 4.4).x}
        cy={iso(15, 0, 4.4).y}
        r={2.2}
        fill={shade("#A98243", 1.1)}
        opacity={0.9}
      />
    </g>
  );
};

// ============================================================================
// REGISTRY
// ============================================================================

export const OBJECT_ART: Record<WorldObjectId, ArtComponent> = {
  practice_sign: PracticeSign,
  reception_calendar: ReceptionCalendar,
  intake_tablet: IntakeTablet,
  communication_phone: CommunicationPhone,
  clinical_computer: ClinicalComputer,
  telehealth_display: TelehealthDisplay,
  clinical_cabinet: ClinicalCabinet,
  assessment_kit: AssessmentKit,
  prescribing_station: PrescribingStation,
  team_workspace: TeamWorkspace,
  payment_terminal: PaymentTerminal,
  billing_ledger: BillingLedger,
  accounting_folder: AccountingFolder,
  insurance_frame: InsuranceFrame,
};
