/**
 * HeyPsych brand mark and wordmark
 *
 * The mark is a single neutral cube, drawn in the same 2:1 isometric
 * projection and upper-left light as the Worlds: the top face catches the
 * light, the left face is mid-tone, the right face falls into shade. It is
 * proportioned to read as a true cube (vertical edge equal to the top edge),
 * and its tones are chosen to stay legible from a 16px browser tab to a large
 * social image, on light and dark backgrounds alike.
 *
 * This file is the single source of truth for the mark. Favicons, app icons,
 * public/logo*.svg, public/images/logo*.png, and the social images are all
 * rendered from these exact values (see docs/active/design/BRAND.md).
 */

/** Brand mark face colours. Do not use elsewhere as UI colours. */
export const BRAND_MARK_COLORS = {
  top: "#E6E0D5",
  left: "#B5AD9F",
  right: "#7F776A",
} as const;

/** Cube geometry in a 32 × 32 box. */
const FACES = {
  top: "16,2.25 29,8.75 16,15.25 3,8.75",
  left: "3,8.75 16,15.25 16,29.75 3,23.25",
  right: "16,15.25 29,8.75 29,23.25 16,29.75",
} as const;

export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <polygon points={FACES.left} fill={BRAND_MARK_COLORS.left} />
      <polygon points={FACES.right} fill={BRAND_MARK_COLORS.right} />
      <polygon points={FACES.top} fill={BRAND_MARK_COLORS.top} />
    </svg>
  );
}

interface WordmarkProps {
  /** Height of the mark in pixels; the name scales with it. */
  size?: number;
  /** Show only the mark (tight spaces). */
  markOnly?: boolean;
  className?: string;
}

/**
 * Mark plus name. The name is set in the display serif at 0.82 × the mark
 * height, with the cube's optical centre aligned to the x-height.
 */
export function Wordmark({ size = 26, markOnly = false, className }: WordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <BrandMark size={size} />
      {!markOnly && (
        <span
          className="font-display text-label-primary"
          style={{
            fontSize: Math.round(size * 0.86),
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          HeyPsych
        </span>
      )}
    </span>
  );
}
