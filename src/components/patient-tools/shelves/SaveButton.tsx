"use client";

import { useSavedApps } from "./saved";

/** Heart toggle. Sits above a card's stretched link (relative z-10). */
export function SaveButton({
  slug,
  name,
  variant = "icon",
  className = "",
}: {
  slug: string;
  name: string;
  variant?: "icon" | "pill";
  className?: string;
}) {
  const { has, toggle, ready } = useSavedApps();
  const on = ready && has(slug);
  const label = on ? `Remove ${name} from saved` : `Save ${name}`;

  const heart = (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-[18px] w-[18px] transition-transform duration-200 ${on ? "scale-110" : ""}`}>
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.9 3.6 4.5 7 4.5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.4 0 5.5 3.4 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z"
        fill={on ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={() => toggle({ slug, name })}
        aria-pressed={on}
        className={`focus-visible:ring-accent inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[15px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none ${
          on ? "border-accent bg-accent/10 text-accent" : "border-separator text-label-primary hover:bg-fill-quaternary"
        } ${className}`}
      >
        {heart}
        {on ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ slug, name });
      }}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`focus-visible:ring-accent relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none ${
        on ? "text-accent bg-accent/10" : "text-label-tertiary hover:text-label-primary hover:bg-fill-quaternary"
      } ${className}`}
    >
      {heart}
    </button>
  );
}
