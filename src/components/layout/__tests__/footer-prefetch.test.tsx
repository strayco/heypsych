import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Record each Link's prefetch setting as a data attribute.
vi.mock("next/link", () => ({
  default: ({ href, prefetch, children, ...rest }: { href: string; prefetch?: boolean; children: React.ReactNode }) =>
    React.createElement("a", { href, "data-prefetch": String(prefetch), ...rest }, children),
}));

describe("footer prefetching", () => {
  it("does not prefetch the sitewide link grid, but keeps every link and the crisis link's prefetch", async () => {
    const { Footer } = await import("../footer");
    const html = renderToStaticMarkup(React.createElement(Footer));
    const links = [...html.matchAll(/<a href="([^"]+)" data-prefetch="([^"]+)"/g)].map((m) => ({ href: m[1], prefetch: m[2] }));

    expect(links.length).toBeGreaterThanOrEqual(17);
    expect(html).toContain('href="tel:988"');
    for (const l of links) {
      if (l.href === "/resources/support-community/immediate-crisis") expect(l.prefetch).toBe("undefined");
      else expect(l.prefetch, l.href).toBe("false");
    }
  });
});
