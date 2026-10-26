# Practice World Asset System

The illustrated office is a layered 2.5D SVG scene. Illustration geometry is
separate from clinical and vendor logic: objects bind to capability IDs, never
to product slugs.

## Projection

- Camera: fixed 3/4 isometric, 2:1 run/rise (`ISO_RUN = 2`, `ISO_RISE = 1`).
- Reference scene: 1440 × 900. A single camera transform scales the room to
  the viewport; object anchors stay in reference space.
- Light: upper left. Face multipliers live in `FACE_LIGHT`
  (top 1.10, left 1.00, right 0.86). Shade preserves warmth rather than
  greying faces.

## Palette and materials

Canonical colours are in `src/domains/architect/world/scene.ts`
(`PALETTE`, `MATERIALS`). Objects reference a material name, never a
one-off hex, except for a single specular highlight on screens.

## Primitives

Every illustrated object is composed from:

- `IsoBox` — furniture and devices.
- `IsoPanel` / `WallPlaque` — wall-mounted surfaces. `WallPlaque` draws a
  contact shadow on the wall plane so the object reads as attached.
- `IsoCylinder` — pots, lamp stems, stools.
- `ContactShadow` — floor contact, offset down-right with the shared light.
- `Screen` — abstract, vendor-agnostic interface.
- `Placeholder` — reserved volume for an unconfigured capability. Wall
  placeholders use `mount="wall"`.

Do not introduce WebGL or Three.js unless this approach is shown to be
insufficient. Do not position objects with per-breakpoint CSS offsets.

## Asset families

| Family | Source |
| --- | --- |
| Architectural shell | `RoomShell.tsx` |
| Base furniture | `RoomShell.tsx` (desks, chairs, sofa, lamp, rug, plant, shelf) |
| Functional objects | `object-art.tsx`, registered in `object-registry.ts` |
| Interaction overlays | `PracticeScene.tsx` (hover halo, focus ring, name label) |

Decorative shell elements have no hit target and never open the inspector.

## Functional states

Each object has two drawn states (`installed` true/false) plus scene overlays:

- Unselected / available: placeholder or idle object.
- Selected: `installed` art plus a selection halo.
- Needs review: overlap badge and inspector copy, not a separate asset.
- Not applicable: omitted from `deriveWorldState`.
- Focused: accessible focus ring.
- Active inspector: selection halo.

Do not generate per-vendor skins. Screens never depict a real product.

## Naming

- Registry `objectId`: snake_case (`clinical_computer`).
- `assetId`: kebab-case (`clinical-computer`).
- Art component: PascalCase (`ClinicalComputer`).

## Review

Art changes are reviewed visually in the browser against:

- Empty (new practice).
- Partially selected.
- Fully selected.
- Prescribing / testing / group variants.

Versioning is git history on the files above. There is no parallel asset CDN.
