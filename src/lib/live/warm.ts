/**
 * Live updates: consume stale page renders after a publish.
 *
 * revalidateTag(tag, "max") is stale-while-revalidate: the first request
 * after a publish still receives the previous page while the new one renders.
 * (A hard expiry is not an option: routes with dynamicParams = false answer
 * 404 for an expired entry.) So the Admin route requests each affected page
 * itself, repeating while the platform reports a stale response, so that
 * visitors after the publish see the new state.
 *
 * Bounded: at most `attempts` requests per path and an overall timeout. A
 * failure here never fails the publish; it is reported to the admin.
 */

export interface WarmResult {
  path: string;
  status: number | null;
  fresh: boolean;
  attempts: number;
}

const STALE = /stale/i;

export async function warmPaths(origin: string, paths: string[], { attempts = 4, delayMs = 1200, timeoutMs = 20000 } = {}): Promise<WarmResult[]> {
  const deadline = Date.now() + timeoutMs;
  const one = async (path: string): Promise<WarmResult> => {
    let last: WarmResult = { path, status: null, fresh: false, attempts: 0 };
    for (let i = 1; i <= attempts && Date.now() < deadline; i += 1) {
      try {
        const res = await fetch(new URL(path, origin), {
          cache: "no-store",
          headers: { "x-hp-cache-warm": "1" },
          signal: AbortSignal.timeout(Math.max(1000, deadline - Date.now())),
        });
        await res.arrayBuffer();
        const cache = res.headers.get("x-vercel-cache") ?? res.headers.get("x-nextjs-cache") ?? "";
        // The first request after a publish may be the stale render; always look twice.
        const fresh = i > 1 && !STALE.test(cache);
        last = { path, status: res.status, fresh, attempts: i };
        if (fresh) return last;
      } catch {
        last = { ...last, attempts: i };
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return last;
  };
  return Promise.all([...new Set(paths)].map(one));
}
