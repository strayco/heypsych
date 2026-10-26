# HeyPsych Brand

Status: **Active.** The single reference for the HeyPsych mark, colour, type,
and brand assets. Illustration rules live in
[`HOMEPAGE_WORLDS_ART_BIBLE.md`](./HOMEPAGE_WORLDS_ART_BIBLE.md).

## 1. The mark

A single neutral cube, drawn in the site's 2:1 isometric projection with light
from the upper left.

| Face | Colour | Role |
| --- | --- | --- |
| Top | `#E6E0D5` | catches the light |
| Left | `#B5AD9F` | mid-tone |
| Right | `#7F776A` | in shade |

- **Geometry (32 × 32 box).** Top `16,2.25 29,8.75 16,15.25 3,8.75`; left
  `3,8.75 16,15.25 16,29.75 3,23.25`; right `16,15.25 29,8.75 29,23.25 16,29.75`.
  The vertical edge equals the top edge, so it reads as a true cube.
- **No outline, no gradient, no shadow.** Faces only.
- **Legibility.** Checked at 16, 24, 32, and 64 px on white, Chrome dark
  (`#202124`), and paper (`#FAF9F6`).
- **Source of truth:** `src/components/brand/Wordmark.tsx`
  (`BrandMark`, `Wordmark`, `BRAND_MARK_COLORS`). Never redraw the cube by
  hand elsewhere.

### Wordmark

Mark + "HeyPsych" in Newsreader (weight 500, optical size 28, tracking
−0.02em), name at 0.86 × the mark height, gap 0.31 × the mark height, cap
height centred on the cube. In the interface use `<Wordmark />`; the default
size in the header and footer is 26.

`public/logo.svg` is the same lockup with the name **outlined to paths**, so it
renders identically where the font is not installed (press, partners, email
clients that allow SVG).

### Clear space and misuse

- Keep clear space of at least half the mark's height on every side.
- Do not recolour, rotate, outline, add effects, or set the name in another
  face. Do not place the mark on saturated colour; use paper, white, or
  graphite backgrounds.

## 2. Colour

Tokens are defined once in `src/app/globals.css` and mirrored for
illustration in `src/domains/architect/world/scene.ts`.

| Role | Token | Value |
| --- | --- | --- |
| Paper (page) | `canvas` | `#FAF9F6` |
| Surface (cards) | `surface` | `#FFFFFF` |
| Grouped surface | `surface-grouped` | `#F3F0EA` |
| Ink | `label-primary` | `#252925` |
| Secondary text | `label-secondary` | `#565C57` |
| Tertiary text | `label-tertiary` | `#6F746E` |
| Hairline | `separator` / `separator-opaque` | warm 16% / `#DCD7CC` |
| Accent | `accent` | `#456C7E` slate teal |
| Positive | `positive` | `#487D66` sage |
| Caution | `caution` | `#A98243` ochre |
| Negative | `negative` | `#AD655E` terracotta |
| Treatment | `treatment` | `#6E6A8E` dusk violet |
| Tools | `tools` | `#5E8C86` sage teal |

- Tailwind's default palettes (blue, purple, gray, green, red…) and the
  shadcn-style names (`primary`, `success`, `warning`, `destructive`, `error`)
  all resolve into this palette. Prefer the semantic tokens in new code.
- Arbitrary hex values in class names are not used. The audit in section 6
  keeps it that way.
- No gradients, glass, or neon. Depth comes from warm shadows
  (`shadow-subtle` … `shadow-floating`, `shadow-card-1…3`).

## 3. Type

| Use | Face | How |
| --- | --- | --- |
| Titles, section headings, wordmark | Newsreader | every `h1`/`h2` automatically; `font-display` elsewhere |
| Interface and body | Inter | default `font-sans` |

Both are loaded once in `src/components/brand/fonts.ts` and applied on
`<html>` in the root layout. Headings opt out of the serif with
`data-heading="sans"`.

## 4. Interface conventions

- **Primary action:** graphite capsule, slate teal on hover
  (`<Button variant="primary">`). One primary action per view.
- **Secondary action:** white capsule with an opaque hairline.
- **Cards:** white on paper, warm hairline, 16–28px radius; interactive cards
  lift 2px with `shadow-elevated` on hover (none under reduced motion).
- **Section openings:** `src/components/brand/PageIntro.tsx` with the
  section's object from the Worlds.

## 5. Assets

All files are rendered from the mark and wordmark above.

| File | Size | Purpose |
| --- | --- | --- |
| `public/favicon.ico` | 16, 32, 48 | legacy browsers, `/favicon.ico` requests |
| `public/favicon.svg` | vector | modern browser tabs |
| `public/favicon-{16,32,48,96,192}x….png` | as named | tabs; Google Search (needs a multiple of 48px) |
| `public/apple-touch-icon.png` | 180 | iOS home screen (paper background) |
| `public/android-chrome-{192,512}x….png` | as named | Android / PWA, maskable-safe padding |
| `public/logo.svg` | 308 × 67 | wordmark, outlined |
| `public/logo-mark.svg` | 32 × 32 | mark only |
| `public/images/logo.png` | 512 × 512 | **Organization logo** for structured data (square, on white) |
| `public/images/logo-wordmark.png` | 616 × 134 | wordmark raster (email header) |
| `public/images/og/heypsych.png` | 1200 × 630 | default social image for every page |

Wiring:

- Icons, manifest, theme colour (`#FAF9F6`): `src/app/layout.tsx`.
- Structured-data logo: always `${SITE_CONFIG.url}/images/logo.png`
  (`src/lib/seo/config.ts`), 512 × 512.
- Social image: every `openGraph`/`twitter` metadata block names
  `/images/og/heypsych.png` unless the page supplies its own. Next merges
  metadata shallowly, so a page that declares `openGraph` without `images`
  would otherwise share with no picture.
- Email: `src/lib/notifications/demo-request-notifier.ts` uses the same
  values with email-safe fallbacks (Georgia / system sans).

`tests/e2e/brand.spec.ts` checks that every asset resolves and that pages
declare the icon set, theme colour, social image, and canonical logo.

## 6. Regenerating assets

When the mark, palette, or wordmark changes, re-render every asset in
section 5 from `Wordmark.tsx` at the listed sizes:

1. Mark PNGs: render `BrandMark` full-bleed on a transparent background at 16,
   32, 48, 96, 192, and 256 px; build `favicon.ico` from the 256px render at
   16/32/48.
2. Home-screen icons: mark at 62% (Apple) or 58% (Android) of the canvas,
   centred on `#FAF9F6`.
3. Organization logo: mark at 70% of a 512px white square.
4. `logo.svg`: instance Newsreader at `wght 500, opsz 28`, take glyph positions
   from a browser render of "HeyPsych" at the wordmark tracking (so kerning
   matches), and outline with fontTools.
5. Social image: the two Worlds and the homepage headline at 1200 × 630.

Then run the brand audit: no arbitrary hex classes
(`grep -rnE -e '-\[#[0-9A-Fa-f]{3,6}\]' src` returns nothing), no gradients
(`bg-gradient-to|bg-linear-to|bg-clip-text`), and `tests/e2e/brand.spec.ts`.
