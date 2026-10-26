/**
 * ToolMark
 *
 * A neutral monogram tile for a product. Catalogue records do not carry
 * licensed logos (the old `logo_url` values were guessed `/logo.png` paths
 * that 404'd and rendered as broken images), and hotlinking vendor artwork is
 * fragile and a trademark question. A consistent monogram reads as
 * deliberate, never breaks, and keeps the page in the site's own palette.
 */

const TONES = [
  "bg-treatment/10 text-treatment border-treatment/20",
  "bg-accent/10 text-accent border-accent/20",
  "bg-positive/10 text-positive-600 border-positive/20",
  "bg-fill-tertiary text-label-secondary border-separator",
] as const;

const SIZES = {
  sm: "h-9 w-9 rounded-lg text-sm",
  md: "h-12 w-12 rounded-xl text-base",
  lg: "h-14 w-14 rounded-2xl text-lg",
} as const;

/** "TherapyNotes" → "TN", "Psychology Today" → "PT", "Doxy.me" → "D". */
export function monogram(name: string): string {
  const words = name
    .replace(/\([^)]*\)/g, " ")
    .split(/[\s/]+/)
    .filter((w) => /[A-Za-z0-9]/.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();

  const word = words[0] ?? name;
  // CamelCase brands: "TherapyNotes", "SimplePractice", "IntakeQ".
  const capitals = word.match(/[A-Z]/g) ?? [];
  if (capitals.length >= 2) return (capitals[0] + capitals[1]).toUpperCase();
  return (word[0] ?? "?").toUpperCase();
}

function toneFor(slug: string): string {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

export function ToolMark({
  name,
  slug,
  size = "md",
  className = "",
}: {
  name: string;
  slug: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center border font-semibold tracking-tight ${SIZES[size]} ${toneFor(slug)} ${className}`}
    >
      {monogram(name)}
    </span>
  );
}
