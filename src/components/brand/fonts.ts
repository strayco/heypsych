import { Inter, Newsreader } from "next/font/google";

/**
 * HeyPsych type system
 *
 * - Display (Newsreader): page titles, section headings, the wordmark.
 *   globals.css sets every h1 and h2 in it; `font-display` applies it anywhere.
 * - Interface (Inter): body copy, controls, labels, data. `font-sans`.
 *
 * Both are self-hosted by next/font with metric-matched fallbacks, applied
 * once on <html> in the root layout, and exposed as CSS variables that the
 * Tailwind theme reads (`--font-newsreader`, `--font-inter`).
 */
export const displayFont = Newsreader({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  variable: "--font-newsreader",
});

export const interfaceFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
