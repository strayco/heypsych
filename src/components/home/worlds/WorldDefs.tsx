/**
 * Shared SVG definitions for every HeyPsych World on the page.
 *
 * The Architect room shell and object art reference these ids by name
 * (`hp-soft-shadow`, `hp-daylight`, `hp-window-light`), so they are defined
 * exactly once per document rather than once per illustration.
 *
 * Rendered as a zero-size, presentation-only SVG. It is not `display: none`,
 * which would stop some browsers from resolving the filters.
 */

export function WorldDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* Identical to the Architect scene definitions. */}
        <filter id="hp-soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <radialGradient id="hp-daylight" cx="26%" cy="34%" r="62%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hp-window-light" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#CFE0E7" stopOpacity="0.25" />
        </linearGradient>

        {/* Homepage additions. */}
        {/* The wide, soft shadow a miniature casts on the page. */}
        <filter id="hp-world-shadow" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        {/* Warm light from a lamp or an open doorway. */}
        <radialGradient id="hp-warm-light" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F6D9A6" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#F3DDB6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F3DDB6" stopOpacity="0" />
        </radialGradient>
        {/* Cool light from a screen. */}
        <radialGradient id="hp-screen-light" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#CFE4EE" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#CFE4EE" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#CFE4EE" stopOpacity="0" />
        </radialGradient>
        {/* Light beyond an open door: brightest at the threshold. */}
        <linearGradient id="hp-doorway-light" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FBF1DE" />
          <stop offset="100%" stopColor="#F4DFBB" />
        </linearGradient>
        <linearGradient id="hp-door-spill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F6E2BE" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#F6E2BE" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
