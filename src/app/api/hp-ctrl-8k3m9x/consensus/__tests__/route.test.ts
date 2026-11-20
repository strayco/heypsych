/**
 * Consensus Score Admin API against a real Postgres (LIVE_TEST_DB): session
 * and CSRF guards, validation, approval rules, publish / unpublish / rollback,
 * cache invalidation, and that public reads see only the approved projection.
 *
 * Point LIVE_TEST_DB at a disposable database (migrations 047 + 048 applied).
 * The test deletes its consensus rows before and after.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const auth = vi.hoisted(() => ({ signedIn: true }));
const revalidateTag = vi.hoisted(() => vi.fn());
const warmPaths = vi.hoisted(() => vi.fn(async (_origin: string, paths: string[]) => paths.map((path) => ({ path, status: 200, fresh: true, attempts: 2 }))));

vi.mock("@/lib/auth/admin-auth", () => ({ isAdminAuthenticated: async () => auth.signedIn }));
vi.mock("@/lib/live/warm", () => ({ warmPaths }));
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  revalidateTag,
  // No data cache in tests: every public read hits the database.
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const DB = process.env.LIVE_TEST_DB;
const SLUG = "simplepractice";
const ORIGIN = "http://localhost";

function obs(id: string, source: string, rating: number, reviewCount: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    source,
    url: `https://reviews.example/${id}`,
    listingName: "SimplePractice",
    match: "exact",
    scope: "full-product",
    rating,
    ratingScale: 5,
    reviewCount,
    observedAt: new Date().toISOString().slice(0, 10),
    acquisition: "manual-public-page",
    permission: "public-display-permitted",
    themes: { positive: ["scheduling"], negative: ["support wait times"] },
    note: "PRIVATE-NOTE-MARKER",
    ...extra,
  };
}
const editorial = { strengths: ["Reviewers often praise the scheduling and client portal."], concerns: ["Some reviewers report slow responses from support."] };
const strongRecord = {
  observations: [obs("cap", "capterra", 4.6, 1200), obs("tr", "trustradius", 4.5, 300), obs("tp", "other", 4.5, 600, { sourceName: "Trustpilot" })],
  editorial,
};

async function post(body: Record<string, unknown>, headers: Record<string, string> = { origin: ORIGIN }) {
  const { POST } = await import("../route");
  const res = await POST(
    new NextRequest(`${ORIGIN}/api/hp-ctrl-8k3m9x/consensus`, {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost", ...headers },
      body: JSON.stringify(body),
    })
  );
  return { status: res.status, data: await res.json() };
}
async function get(query = "") {
  const { GET } = await import("../route");
  const res = await GET(new NextRequest(`${ORIGIN}/api/hp-ctrl-8k3m9x/consensus${query}`, { headers: { host: "localhost" } }));
  return { status: res.status, data: await res.json() };
}
async function publicScores() {
  const { getPublicConsensus } = await import("@/lib/live/state");
  return getPublicConsensus();
}
async function clean() {
  const { getDbPool } = await import("@/lib/config/db-pool");
  await (await getDbPool()).query("delete from public.hp_live_revisions where kind = 'consensus'");
}

describe.skipIf(!DB)("Consensus Score admin flow (LIVE_TEST_DB)", () => {
  beforeAll(async () => {
    process.env.SUPABASE_DB_URL = DB;
    process.env.DATABASE_SSL = "disable";
    await clean();
  });
  afterAll(clean);
  beforeEach(() => {
    auth.signedIn = true;
    revalidateTag.mockClear();
    warmPaths.mockClear();
  });

  it("refuses signed-out reads and writes, cross-site writes and non-pilot products", async () => {
    auth.signedIn = false;
    expect((await get()).status).toBe(401);
    expect((await post({ action: "save-draft", slug: SLUG, record: strongRecord })).status).toBe(401);
    auth.signedIn = true;
    expect((await post({ action: "save-draft", slug: SLUG, record: strongRecord }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await post({ action: "save-draft", slug: SLUG, record: strongRecord }, {})).status).toBe(403);
    expect((await post({ action: "save-draft", slug: "theranest", record: strongRecord })).status).toBe(404);
    expect((await get("?slug=theranest")).status).toBe(404);
  });

  it("validates evidence before storing it", async () => {
    const bad = await post({ action: "save-draft", slug: SLUG, record: { observations: [obs("x", "capterra", 7, 10)], editorial } });
    expect(bad.status).toBe(422);
    const dupIds = await post({ action: "save-draft", slug: SLUG, record: { observations: [obs("x", "capterra", 4, 10), obs("x", "trustradius", 4, 10)], editorial } });
    expect(dupIds.status).toBe(422);
  });

  it("withholds thin evidence and refuses to approve it", async () => {
    expect((await post({ action: "save-draft", slug: SLUG, record: { observations: [obs("cap", "capterra", 4.9, 5000)], editorial } })).status).toBe(200);
    const detail = await get(`?slug=${SLUG}`);
    expect(detail.data.calculation.status).toBe("withheld");
    const approve = await post({ action: "approve", slug: SLUG });
    expect(approve.status).toBe(409);
    expect(approve.data.error).toMatch(/withheld/);
    expect((await post({ action: "publish", slug: SLUG })).status).toBe(409);
    expect(await publicScores()).toEqual({});
  });

  it("requires strengths and concerns, then approval of exactly what publishes", async () => {
    await post({ action: "save-draft", slug: SLUG, record: { ...strongRecord, editorial: { strengths: [], concerns: [] } } });
    expect((await post({ action: "approve", slug: SLUG })).status).toBe(409);

    await post({ action: "save-draft", slug: SLUG, record: strongRecord });
    expect((await post({ action: "publish", slug: SLUG })).status).toBe(409); // not approved
    const approved = await post({ action: "approve", slug: SLUG });
    expect(approved.status).toBe(200);
    expect(approved.data.revision.approvalCurrent).toBe(true);

    // Editing after approval clears it.
    await post({ action: "save-draft", slug: SLUG, record: { ...strongRecord, editorial: { ...editorial, strengths: ["Reviewers often praise the easy online booking."] } } });
    expect((await post({ action: "publish", slug: SLUG })).status).toBe(409);
    expect(await publicScores()).toEqual({});
  });

  it("publishes the approved projection only, invalidates the cache, and exposes no private data", async () => {
    await post({ action: "save-draft", slug: SLUG, record: strongRecord });
    await post({ action: "approve", slug: SLUG });
    const pub = await post({ action: "publish", slug: SLUG });
    expect(pub.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("hp-live-consensus", "max");
    // Every public surface that shows the score is re-rendered before responding.
    const warmed = (pub.data.warmed as { path: string }[]).map((w) => w.path);
    expect(warmed).toContain("/tools/for-clinicians/ehr-practice-management/simplepractice");
    expect(warmed).toContain("/architect");
    expect(warmed.some((p) => p.startsWith("/tools/compare/") && p.includes("simplepractice"))).toBe(true);

    const scores = await publicScores();
    const p = scores[SLUG];
    expect(p.score).toBeGreaterThan(80);
    expect(p.confidence).toBe("High");
    expect(p.sourceNames).toEqual(["Capterra", "TrustRadius", "Trustpilot"]);
    const text = JSON.stringify(scores);
    expect(text).not.toMatch(/reviews\.example|PRIVATE-NOTE-MARKER|support wait times|reviewCount|observations|approval|hash/);

    const overview = await get();
    expect(overview.data.products.find((x: { slug: string }) => x.slug === SLUG).published.score).toBe(p.score);
  });

  it("rolls back to an earlier approved revision and unpublishes", async () => {
    const first = (await publicScores())[SLUG].score;
    const weaker = { ...strongRecord, observations: [obs("cap", "capterra", 3.9, 1200), obs("tr", "trustradius", 3.8, 300), obs("tp", "other", 4.0, 600, { sourceName: "Trustpilot" })] };
    await post({ action: "save-draft", slug: SLUG, record: weaker });
    await post({ action: "approve", slug: SLUG });
    await post({ action: "publish", slug: SLUG });
    const second = (await publicScores())[SLUG].score;
    expect(second).toBeLessThan(first);

    const history = (await get(`?slug=${SLUG}`)).data.history as { id: number; status: string; score: number }[];
    const earlier = history.find((h) => h.status === "superseded" && h.score === first)!;
    revalidateTag.mockClear();
    expect((await post({ action: "rollback", slug: SLUG, revisionId: earlier.id })).status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("hp-live-consensus", "max");
    expect((await publicScores())[SLUG].score).toBe(first);

    // Rollback only accepts this product's revisions.
    expect((await post({ action: "rollback", slug: "mentalyc", revisionId: earlier.id })).status).toBe(404);

    expect((await post({ action: "unpublish", slug: SLUG })).status).toBe(200);
    expect(await publicScores()).toEqual({});
    expect((await post({ action: "unpublish", slug: SLUG })).status).toBe(409);
  });

  it("drops a published row whose evidence no longer matches its approval", async () => {
    await post({ action: "save-draft", slug: SLUG, record: strongRecord });
    await post({ action: "approve", slug: SLUG });
    await post({ action: "publish", slug: SLUG });
    expect((await publicScores())[SLUG]).toBeTruthy();
    const { getDbPool } = await import("@/lib/config/db-pool");
    await (await getDbPool()).query(
      `update public.hp_live_revisions set value = jsonb_set(value, '{observations,0,rating}', '5') where kind = 'consensus' and key = $1 and status = 'published'`,
      [SLUG]
    );
    expect(await publicScores()).toEqual({});
  });

  it("the generic live-updates route cannot edit consensus records or export them", async () => {
    const live = await import("../../live/route");
    const res = await live.POST(
      new NextRequest(`${ORIGIN}/api/hp-ctrl-8k3m9x/live`, {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost", origin: ORIGIN },
        body: JSON.stringify({ action: "publish-value", kind: "consensus", key: SLUG, value: strongRecord }),
      })
    );
    expect(res.status).toBe(400);
    const snap = await live.GET(new NextRequest(`${ORIGIN}/api/hp-ctrl-8k3m9x/live?view=snapshot`, { headers: { host: "localhost" } }));
    const body = await snap.text();
    expect(body).not.toMatch(/consensus|reviews\.example/);
  });
});
