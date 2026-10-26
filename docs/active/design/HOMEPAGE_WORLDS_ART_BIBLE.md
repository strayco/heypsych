# The HeyPsych Worlds — Art Bible

Status: **Active.** Governs every illustration on the homepage and its
relationship to the Practice Architect office.

The worlds are not separate artwork. They are drawn in code from the same
primitives, palette, and light as the Practice Architect scene. That is the
whole consistency strategy: there is no second illustration style to drift.

## 1. Sources of truth

| Concern | File |
| --- | --- |
| Projection, palette, materials, lighting | `src/domains/architect/world/scene.ts` |
| Drawing primitives (box, panel, cylinder, plaque, shadow, screen) | `src/app/architect/_components/world/primitives.tsx` |
| Architect office shell | `src/app/architect/_components/world/RoomShell.tsx` |
| Architect object art and anchors | `object-art.tsx`, `src/domains/architect/world/object-registry.ts` |
| Homepage framing, plinth, envelope | `src/components/home/worlds/geometry.ts`, `Diorama.tsx` |
| Patient world | `src/components/home/worlds/PatientWorldScene.tsx` |
| Clinician world | `src/components/home/worlds/ClinicianWorldScene.tsx` |
| Discovery objects | `src/components/home/worlds/DiscoveryObjects.tsx` |
| Interaction states | `src/components/home/worlds/worlds.module.css` |
| Shared SVG defs | `src/components/home/worlds/WorldDefs.tsx` |

Never draw a world object with a raw hex fill when a material exists. Never
position an Architect object anywhere other than its registry anchor.

## 2. Perspective and camera

- **Projection:** 2:1 isometric (`ISO_RUN = 2`, `ISO_RISE = 1`). One horizontal
  run of 2 per rise of 1. No other angle anywhere on the site.
- **Camera elevation:** fixed. The camera looks into the room over the open
  front corner; the two back walls are the left (light-facing) and right
  (shade) walls.
- **Reference space:** 1440 × 900. Both worlds use the Architect floor origin
  `(720, 290)` and floor of 210 × 210 units, with walls 150 units high.
- **Homepage frame:** `viewBox 262 104 916 668`, which holds the plinth, walls,
  and page shadow.

## 3. Scale

- One unit ≈ 1.5 cm in the fiction. A chair seat is 20 × 20 units at a height
  of about 15; a desk is about 28 high; a door is 92 high.
- Furniture in the patient world uses the same dimensions as the Architect
  office. A chair in one room must look like it would fit in the other.
- Discovery objects are drawn at furniture scale and framed individually.

## 4. Colour and materials

Palette and materials come only from `scene.ts`:

- Paper background `#FAF9F6`, floor `#EDEBE5`, plaster `#F2EFE8`.
- Woods: oak `#CBAE86`, walnut `#A07E58`.
- Textiles: sage `#829B8A`, textile `#D8CFC0`.
- Accents: slate `#688594`, interface accent `#456C7E`.

Homepage additions are light colours only, not materials: lamp and doorway
warmth (`#F6D9A6` family) and screen glow (`#CFE4EE`). Interface text uses
graphite `#252925` and secondary `#5E645F` (4.5:1 or better on the paper).

There are no gradients on objects, and no purple, neon, or glass effects.

## 5. Lighting and shadow

- **Direction:** light arrives from the upper left, always.
- **Faces:** top × 1.10, left × 1.00, right × 0.86, via the warm-weighted
  `shade()` falloff, so shadows stay warm rather than grey.
- **Contact shadows:** `ContactShadow`, offset down-right, blur 5.
- **Page shadow:** one wide, soft ellipse under the plinth (`hp-world-shadow`,
  blur 16, opacity 0.22 at rest, 0.32 when the world is lifted).
- **Cast light:** radial gradients for lamps and screens, a linear gradient
  for an open doorway. Light is additive and soft, never a halo or glow ring.

## 6. Edges and construction

- No outlines on volumes. Edges come from face contrast alone.
- Hairlines (1px) only where a real material changes: the plinth's oak and
  stone seam, the cut edge of a wall, an architrave.
- Each world is a cut-away miniature: a limestone plinth with an oak band at
  floor level, and visible thickness on the cut tops and ends of the walls.

## 7. Background treatment

The worlds stand directly on the page paper. They are never placed inside
cards, borders, or tinted panels. The header takes the same paper tone on the
homepage so the first viewport is one surface.

## 8. Animation behaviour

All motion is CSS, driven by `:hover`, `:focus-visible`, and
`[data-selected]` on the world link.

| State | Behaviour |
| --- | --- |
| Rest | Static. Nothing loops or idles. |
| Hover / focus | Miniature lifts 6px and scales 1.2% over 420ms; light warms over 420ms; revealed objects rise 8 units and fade in over 320ms (staggered 60–120ms); the other world drops to 72% opacity. |
| Press | 120ms settle to 99.2%. |
| Selected | Lifts 8px and scales 3% over 520ms while the next route loads. The other world fades to 45%. Navigation is never delayed. |
| Touch (`hover: none`) | Scenes rest in the lit, revealed state. Nothing depends on hover. |
| Reduced motion | No transforms or transitions. Light and reveal states still change, instantly. |

Easing: `cubic-bezier(0.22, 0.61, 0.36, 1)`. Nothing bounces.

## 9. World content rules

**Patient world:** a reading room. It shows no people, symptoms, clinical
furniture, or diagnosis imagery. Details: window daylight, an armchair with a
lamp, a bookshelf, a writing desk with a small map, an open door with warm light
beyond, plants. On interest, the lights warm and a mug appears on the desk.

**Clinician world:** the canonical Architect office shell plus a small set of
canonical objects at their registry anchors (practice sign, telehealth display,
calendar, computer, payment terminal). On interest, the sign comes into focus,
the computer and calendar light up, and the intake tablet appears. It shows no
products, vendor names, prices, or configured-practice state.

## 10. Responsive crops

There is one SVG per world. Containers set the crop:

- `md` and up: `aspect-ratio 916 / 668`, the full miniature.
- Below `md`: `aspect-ratio 16 / 10` with `preserveAspectRatio="xMidYMid
  slice"`, a tighter band through the furnished centre of the room. This keeps
  both worlds in the first mobile viewport.

## 11. Asset naming and export

- Components are named for their role: `<Audience>WorldScene`,
  `DiscoveryObjects.<id>`.
- Shared SVG ids are prefixed `hp-` and defined once per document in
  `WorldDefs`. The Architect shell depends on `hp-soft-shadow`, `hp-daylight`,
  and `hp-window-light`.
- **Export format:** inline SVG rendered on the server. There are no raster
  assets, image requests, or runtime animation libraries on the homepage. If a
  static export is ever needed (social image, press), render the component to
  SVG and rasterise at 2×.

## 12. Site-wide application

The Worlds are the identity of the whole site, not only the homepage.

- **Tokens.** `src/app/globals.css` maps every design token to the Worlds
  palette: paper canvas `#FAF9F6`, graphite labels, warm hairline separators,
  slate-teal accent `#456C7E`, sage positive, ochre caution, terracotta
  negative, dusk-violet treatment, sage-teal tools. Shadows are warm.
- **Default palette remap.** Tailwind's stock palettes (and shadcn-style names
  such as `primary`, `success`, `destructive`) are re-tuned in the same
  file (blue/sky/cyan to accent, indigo/violet/purple/fuchsia to treatment,
  green/emerald/lime to positive, teal to tools, amber/yellow/orange to caution,
  red/rose/pink to negative, gray/neutral/stone and slate/zinc to warm
  neutrals). A hard-coded `bg-blue-600` therefore can never render stock SaaS
  blue. Prefer tokens in new code anyway.
- **Type.** Newsreader is loaded once in the root layout (`--font-newsreader`).
  Every `h1` and `h2` is set in it by an unlayered rule; add
  `data-heading="sans"` to a heading that must stay in the interface sans.
  `font-display` is the utility for anything else.
- **Mark and wordmark.** A neutral stone cube in the Worlds projection and
  light, beside the name in the display serif. Full specification, assets,
  and regeneration steps: [`BRAND.md`](./BRAND.md).
- **Section openings.** `src/components/brand/PageIntro.tsx` opens every hub:
  serif title, one plain line, an optional control, and the section's object.
  No eyebrow labels and no white hero band.

| Section | Object |
| --- | --- |
| Conditions | `conditions` (books) |
| Symptoms | `notebook` |
| Treatments | `treatments` (card box) |
| Apps & Tools, tool hubs | `tools` (phone) |
| Find Care | `care` (map and pin) |
| Clinicians, Practice Architect | `clinician` (workstation) |
| Learn, Guides, Resources | `reading` (book on a stand) |
| Support & community, error page | `armchair` |
| About, 404 | `doorway` |

- **Continuity into Architect.** The Architect onboarding shows the same
  clinician miniature in its lit state beside the questions, so choosing
  "Build my practice" visibly enters the room that was previewed.
- **Social image.** `public/images/og/heypsych.png` is a static render of
  the two worlds and the headline, declared on every page. Re-render it if the
  worlds change.

## 13. Entity pages (treatments and conditions)

Every treatment and condition page follows one pattern. Text is never
removed; it is reorganised so the interactive parts come first and the full
reference waits until asked for.

1. **Opening.** Back link, the section's object (pill bottle, jar, armchair or
   card box for treatments by modality; books for conditions), a kicker
   (drug class, or the short name such as "ADHD"), the name in the display
   serif, one lead sentence, fact pills, the review line, and up to three
   "at a glance" tiles that jump to their section. A boxed warning is the
   only caution-toned tile.
2. **Section bar.** Sticky under the header, shown only when there is more
   than one section.
3. **Explorers**, each from the record's own data, never inferred:
   - Treatments: What it feels like (week-by-week journey) → What it's for
     (condition chips) → Side effects (bars + 100-dot field) → Your situation
     (toggles) → Get help right away if.
   - Symptoms (whole page, no guide needed): opening with people's own
     search phrases and a private "I've noticed this" list (duration, print
     for an appointment; `localStorage` only) → What it can look like
     (example stepper) → Where it can come from (mental health conditions /
     other causes toggle) → Often comes with → Check in (screeners) → When to
     get help. Object: `notebook`.
   - Conditions: How common (natural frequencies, "1 in 20") → What it can look
     like (symptom groups; no scoring, no quiz) → In their words → daily life
     → How it's treated (approaches + linked treatment pages) → Day to day
     (checklist stored on the device only) → When to get help.
4. **The full guide.** A grouped index of chapters with teaser and reading
   time. A chapter opens in a reading sheet (right on desktop, bottom on
   phones), like the Architect inspector. Closed chapters stay in the DOM,
   `hidden`, for search and find-in-page; `#guide-<id>` opens one. Guides of
   two chapters or fewer render inline.

Rules: motion is CSS only and off under reduced motion; every control is a
real button with a visible focus ring; crisis information (988) is in the
server HTML; nothing a visitor ticks or chooses leaves their device.

Code: `src/domains/{treatments,conditions}/experience/model.ts` (pure),
`src/components/{treatments,conditions}/experience/`,
`src/components/guide/GuideChapters.tsx`.

### 13.1 Other page families (same system)

- **Hubs** (`/conditions`, category hubs, `/treatments`, `/symptoms`):
  opening with the section object, instant search, category tiles with
  counts, an A–Z list. Every item link is in the server HTML; items past the
  first 48 are present but hidden. `/symptoms` surfaces the visitor's
  "noticed" list when there is one. Code: `src/domains/hubs/`,
  `src/components/hubs/`.
- **Patient apps** (`/tools/[slug]`): phone object; fit check (good fit /
  look elsewhere, a summary line, never a score); what it's for; cost;
  privacy & safety with an evidence meter; alternatives; guide chapters.
  Code: `src/domains/patient-tools/experience/`, `src/components/patient-tools/experience/`.
- **Clinician tools** (`/tools/for-clinicians/[category]/[slug]`,
  `/tools/alternatives/[slug]`): workstation object + ToolMark; who it's for
  (positioning notes); plan cards with a provider-count estimate only when
  the record prices a tier (labelled an estimate); capabilities;
  compliance with provenance (unknown reads "Not stated"; EPCS always
  "requires verification" unless reviewed). Code:
  `src/domains/tools/clinician-experience/`, `src/components/tools/clinician/experience/`.
- **Articles** (`/learn/*`, knowledge-hub resources): reading object,
  standfirst, minutes, byline, key takeaways when present, sticky contents,
  ~68ch measure; articles are read in place, not chaptered. **Support
  orgs/hotlines**: armchair object and a "How to reach them" card (tel:/sms:
  links only from the record). **Assessments**: notebook object, a short
  shell, the unchanged questionnaire; answers never leave the device or the
  console. Code: `src/domains/{articles,resources}/experience/`,
  `src/components/{articles,resources/experience}/`.
- Server-safe text helpers for guides live in `src/components/guide/guide-text.ts`
  (GuideChapters itself is a client component).
- `html, body` use `overflow-x: clip` (hidden as fallback) so sticky bars work.

