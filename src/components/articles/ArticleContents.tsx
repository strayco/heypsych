"use client";

/**
 * In-article contents: sticky beside the text on wide screens, a folded
 * "In this article" list on phones. Marks the section being read.
 */

import { useEffect, useState } from "react";

export function ArticleContents({ items }: { items: { id: string; text: string }[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;
    let frame = 0;
    // The section being read is the last heading that has scrolled past the
    // top quarter of the screen.
    const update = () => {
      frame = 0;
      const line = Math.min(160, window.innerHeight * 0.25);
      let current = items[0].id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= line) current = item.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  if (items.length < 2) return null;

  const list = (
    <ol className="space-y-1">
      {items.map((item, i) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            aria-current={active === item.id ? "true" : undefined}
            className={`focus-visible:ring-accent flex gap-3 rounded-lg px-2 py-1.5 text-[14px] leading-snug transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              active === item.id ? "text-label-primary bg-fill-quaternary font-medium" : "text-label-secondary hover:text-label-primary"
            }`}
          >
            <span className="text-label-tertiary w-4 shrink-0 tabular-nums">{i + 1}</span>
            <span>{item.text}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <details className="border-separator bg-surface group mb-8 rounded-2xl border px-4 py-3 lg:hidden">
        <summary className="text-label-primary cursor-pointer list-none text-[15px] font-medium [&::-webkit-details-marker]:hidden">
          In this article <span className="text-label-tertiary">· {items.length} sections</span>
        </summary>
        <nav aria-label="In this article" className="mt-3">
          {list}
        </nav>
      </details>
      <nav aria-label="In this article" className="hidden lg:block">
        <p className="text-label-tertiary mb-2 px-2 text-[12px] font-semibold tracking-[0.06em] uppercase">In this article</p>
        {list}
      </nav>
    </>
  );
}
