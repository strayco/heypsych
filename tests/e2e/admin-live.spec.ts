import { test, expect, type APIRequestContext } from "@playwright/test";
import { createHmac, randomBytes } from "crypto";

/**
 * Admin authentication / authorization and the live-update path.
 *
 * Runs against a server started with ADMIN_PASSWORD (the same value must be in
 * this process's env as E2E_ADMIN_PASSWORD) and a reachable SUPABASE_DB_URL.
 * The signed-session tests mint a cookie exactly as src/lib/auth/admin-auth.ts
 * does, so they prove the server verifies the HMAC — not that a login form works.
 * Mutating tests always restore what they change (rollback) before finishing.
 */

const SECRET = process.env.E2E_ADMIN_PASSWORD;
const API = "/api/hp-ctrl-8k3m9x/live";

function sessionToken(secret: string, ageMs = 0): string {
  const data = `${Date.now() - ageMs}.${randomBytes(32).toString("hex")}`;
  return `${data}.${createHmac("sha256", secret).update(data).digest("hex")}`;
}

function cookieHeader(token: string) {
  return { cookie: `admin_session=${token}` };
}

async function origin(_request: APIRequestContext) {
  // Same-origin header the admin UI sends; the route compares it to Host.
  return new URL(test.info().project.use.baseURL ?? "http://localhost:3000").origin;
}

test.describe("Admin authorization (no session)", () => {
  test("live API rejects reads and writes without a session", async ({ request }) => {
    const get = await request.get(`${API}?view=overview`);
    expect(get.status()).toBe(401);
    const post = await request.post(API, {
      data: { action: "publish-value", kind: "flag", key: "home.resume-strip", value: { enabled: false } },
      headers: { origin: await origin(request) },
    });
    expect(post.status()).toBe(401);
  });

  test("admin pages redirect to login and are not indexable", async ({ page }) => {
    const res = await page.goto("/hp-ctrl-8k3m9x/live");
    expect(page.url()).toContain("/hp-ctrl-8k3m9x/login");
    expect(res?.status()).toBeLessThan(400);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toMatch(/noindex/);
  });

  test("a forged or tampered cookie is rejected", async ({ request }) => {
    const forged = sessionToken("not-the-real-secret");
    expect((await request.get(`${API}?view=overview`, { headers: cookieHeader(forged) })).status()).toBe(401);
    if (SECRET) {
      const real = sessionToken(SECRET);
      const tampered = real.replace(/^\d+/, (t) => String(Number(t) + 1));
      expect((await request.get(`${API}?view=overview`, { headers: cookieHeader(tampered) })).status()).toBe(401);
      // Expired (older than the 24h session max-age)
      const old = sessionToken(SECRET, 1000 * 60 * 60 * 25);
      expect((await request.get(`${API}?view=overview`, { headers: cookieHeader(old) })).status()).toBe(401);
    }
  });
});

test.describe("Admin live updates (signed session)", () => {
  test.skip(!SECRET, "E2E_ADMIN_PASSWORD not set");

  test("reads work with a valid session; writes need a same-origin request", async ({ request }) => {
    const h = cookieHeader(sessionToken(SECRET!));
    const ov = await request.get(`${API}?view=overview`, { headers: h });
    expect(ov.status()).toBe(200);
    const body = await ov.json();
    expect(Array.isArray(body.tools)).toBe(true);

    const body2 = { action: "publish-value", kind: "flag", key: "home.resume-strip", value: { enabled: true } };
    expect((await request.post(API, { data: body2, headers: h })).status()).toBe(403);
    expect(
      (await request.post(API, { data: body2, headers: { ...h, origin: "https://evil.example" } })).status(),
    ).toBe(403);
  });

  test("invalid values are refused and nothing is published", async ({ request }) => {
    const h = { ...cookieHeader(sessionToken(SECRET!)), origin: await origin(request) };
    const bad = [
      { action: "publish-value", kind: "flag", key: "not.a.flag", value: { enabled: true } },
      { action: "publish-value", kind: "copy", key: "home.hero.subtitle", value: { text: "<script>x</script>" } },
      { action: "publish-value", kind: "copy", key: "home.hero.subtitle", value: { text: "x".repeat(500) } },
      // Locked field: commercial/compliance data can't be overlaid
      { action: "save-draft", kind: "tool", key: "simplepractice", value: { affiliate: { enabled: true } } },
      // A missing price must never be treated as zero
      { action: "save-draft", kind: "tool", key: "simplepractice", value: { pricing: { model: "per-provider-month", starting_price_cents: -5 } } },
    ];
    for (const data of bad) {
      const res = await request.post(API, { data, headers: h });
      expect(res.status(), JSON.stringify(data)).toBeGreaterThanOrEqual(400);
      expect(res.status(), JSON.stringify(data)).toBeLessThan(500);
    }
  });

  test("published copy reaches server HTML without a rebuild, and reverting restores it", async ({ request, page }) => {
    const h = { ...cookieHeader(sessionToken(SECRET!)), origin: await origin(request) };
    // Copy change is visible in server-rendered HTML on the next request.
    const marker = `Plain guides and a private path ${Date.now() % 100000}`;
    const pub = await request.post(API, {
      data: { action: "publish-value", kind: "copy", key: "home.hero.subtitle", value: { text: marker }, note: "e2e" },
      headers: h,
    });
    expect(pub.status()).toBe(200);
    await pub.json();
    await expect.poll(async () => (await (await request.get("/")).text()).includes(marker), { timeout: 15_000 }).toBe(true);

    // Roll back to the default (publishing the default value as a restore).
    const rb = await request.post(API, {
      data: { action: "publish-value", kind: "copy", key: "home.hero.subtitle", value: null, note: "e2e restore" },
      headers: h,
    });
    expect(rb.status()).toBe(200);
    await expect.poll(async () => (await (await request.get("/")).text()).includes(marker), { timeout: 15_000 }).toBe(false);

    // Public SEO surface is untouched by the change (title, robots, one h1;
    // a tool profile keeps its canonical).
    await page.goto("/");
    await expect(page).toHaveTitle("HeyPsych | Make Better Mental Health Decisions");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
    await page.goto("/tools/for-clinicians/ehr-practice-management/simplepractice");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });

  test("the editor shows the just-published price at once (no stale cache read)", async ({ request }) => {
    const h = { ...cookieHeader(sessionToken(SECRET!)), origin: await origin(request) };
    const view = async () => (await (await request.get(`${API}?view=tool&slug=simplepractice`, { headers: h })).json()) as {
      base: { pricing: Record<string, unknown> & { tiers?: unknown[] } };
      effective: { pricing: { starting_price_cents?: number } };
    };
    const before = await view();
    const pricing = { ...before.base.pricing, starting_price_cents: 6300, starting_price_display: "$63/provider/month" };
    const pub = await request.post(API, { data: { action: "publish-value", kind: "tool", key: "simplepractice", value: { pricing }, note: "e2e editor freshness" }, headers: h });
    expect(pub.status()).toBe(200);
    try {
      // Read immediately: the public cache may still hold $49, the editor must not.
      expect((await view()).effective.pricing.starting_price_cents).toBe(6300);
    } finally {
      const rb = await request.post(API, { data: { action: "publish-value", kind: "tool", key: "simplepractice", value: null, note: "e2e restore" }, headers: h });
      expect(rb.status()).toBe(200);
    }
    expect((await view()).effective.pricing.starting_price_cents).toBe(4900);
  });
});
