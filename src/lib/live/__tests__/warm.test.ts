import { afterEach, describe, expect, it, vi } from "vitest";
import { warmPaths } from "../warm";

function respond(cache: string | null, status = 200) {
  return new Response("ok", { status, headers: cache ? { "x-vercel-cache": cache } : {} });
}

describe("warmPaths", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("requests each page until it is no longer served stale", async () => {
    const seq: Record<string, (string | null)[]> = { "/a": ["STALE", "STALE", "HIT"], "/b": ["HIT", "HIT"] };
    const fetchMock = vi.fn(async (url: URL) => respond(seq[url.pathname].shift() ?? "HIT"));
    vi.stubGlobal("fetch", fetchMock);
    const r = await warmPaths("https://heypsych.com", ["/a", "/b", "/a"], { delayMs: 1 });
    expect(r).toEqual([
      { path: "/a", status: 200, fresh: true, attempts: 3 },
      { path: "/b", status: 200, fresh: true, attempts: 2 },
    ]);
    expect(fetchMock.mock.calls.every(([u]) => (u as URL).origin === "https://heypsych.com")).toBe(true);
  });

  it("is bounded and never throws", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    const r = await warmPaths("https://heypsych.com", ["/x"], { attempts: 2, delayMs: 1 });
    expect(r).toEqual([{ path: "/x", status: null, fresh: false, attempts: 2 }]);
  });
});
