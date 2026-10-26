import { test, expect } from "@playwright/test";

/**
 * V4 Clinician Tools E2E Tests
 *
 * Tests for the clinician tools platform:
 * - Tools hub page (/tools/)
 * - For Clinicians landing (/tools/for-clinicians/)
 * - Category pages (/tools/for-clinicians/[category]/)
 * - Product pages (/tools/for-clinicians/[category]/[slug]/)
 * - Retired clinician landers redirect into the hub (2026-10-23)
 * - Compare page (/tools/compare/)
 * - Demo request flow
 */

test.describe("Tools Hub Page (patient app finder)", () => {
  test("opens with the finder and a crisis line", async ({ page }) => {
    const response = await page.goto("/tools");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: /right app/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "988" })).toBeVisible();
  });

  test("narrows by need, help and payment", async ({ page }) => {
    await page.goto("/tools");
    await page.getByRole("button", { name: "Anxiety or stress" }).click();
    await page.getByRole("button", { name: /An app I use on my own/ }).click();
    await page.getByRole("button", { name: "Free", exact: true }).click();
    await expect(page.locator("#finder-results")).toHaveText(/\d+ match/);
  });

  test("links clinicians to practice software", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.getByRole("link", { name: /practice software/i })).toBeVisible();
  });
});

test.describe("Retired patient pages", () => {
  for (const [from, to] of [
    ["/tools/for-patients", /\/tools$/],
    ["/tools/for-patients/guides/best-anxiety-apps", /\/tools\/anxiety-stress$/],
    ["/tools/find-support/therapy-platforms", /\/tools\/find-support\?help=therapist$/],
  ] as const) {
    test(`${from} redirects`, async ({ page }) => {
      await page.goto(from);
      await expect(page).toHaveURL(to);
    });
  }
});

test.describe("For Clinicians Landing Page", () => {
  test("should display clinician tools landing page", async ({ page }) => {
    const response = await page.goto("/tools/for-clinicians/");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { level: 1, name: /practice software/i })
    ).toBeVisible();
  });

  test("should display category navigation", async ({ page }) => {
    await page.goto("/tools/for-clinicians/");

    // Should have at least EHR category visible
    await expect(
      page.getByRole("link", { name: /ehr|practice management/i }).first()
    ).toBeVisible();
  });

  test("shortlists a job for a kind of practice, with reviewers' notes", async ({ page }) => {
    await page.goto("/tools/for-clinicians");
    await page.getByRole("button", { name: /run the practice/i }).click();
    await page.getByRole("button", { name: /^solo therapist$/i }).click();
    await expect(page.getByRole("heading", { name: /picks? for solo therapist practices/i })).toBeVisible();
    // The interventional-psychiatry EHR is never a solo-therapist pick.
    const picks = page.locator("[aria-live=polite] ul").first();
    await expect(picks.getByRole("link", { name: /^osmind$/i })).toHaveCount(0);
  });

  test("preselects the practice from the URL", async ({ page }) => {
    await page.goto("/tools/for-clinicians?practice=group-practice");
    await expect(page.getByRole("button", { name: /^group practice$/i })).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("EHR Category Page", () => {
  test("should display EHR category page", async ({ page }) => {
    const response = await page.goto(
      "/tools/for-clinicians/ehr-practice-management/"
    );
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("should display tool cards with links to active tools", async ({ page }) => {
    await page.goto("/tools/for-clinicians/ehr-practice-management/");
    await page.waitForLoadState("networkidle");

    // Should have links to known active EHR tools
    // At least one of the 9 publish-ready tools should be visible
    const knownTools = [
      "SimplePractice",
      "TherapyNotes",
      "Jane App",
      "ICANotes",
      "Sessions Health",
    ];

    let foundTools = 0;
    for (const toolName of knownTools) {
      const link = page.getByRole("link", { name: new RegExp(toolName, "i") });
      if ((await link.count()) > 0) {
        foundTools++;
      }
    }

    // Should find at least 2 of the known tools
    expect(foundTools).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Product Page", () => {
  test("should display a product page", async ({ page }) => {
    // Try known tools that should be active
    const knownSlugs = [
      "simplepractice",
      "therapynotes",
      "jane-app",
      "icanotes",
    ];

    let foundWorkingPage = false;

    for (const slug of knownSlugs) {
      const response = await page.goto(
        `/tools/for-clinicians/ehr-practice-management/${slug}/`
      );

      if (response?.status() === 200) {
        foundWorkingPage = true;
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        break;
      }
    }

    // At least one product page should work
    expect(foundWorkingPage).toBe(true);
  });

  test("should display demo request CTA on product page", async ({ page }) => {
    const response = await page.goto(
      "/tools/for-clinicians/ehr-practice-management/simplepractice/"
    );

    // SimplePractice should be an active tool
    expect(response?.status()).toBe(200);

    // Should have the product heading
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Should have a demo request button visible
    const demoCTA = page.getByRole("button", {
      name: /demo|request|get started/i,
    });
    await expect(demoCTA.first()).toBeVisible();
  });
});

test.describe("Retired clinician landers", () => {
  const cases: [string, RegExp][] = [
    ["/tools/for-clinicians/ehr-practice-management/match", /\/tools\/for-clinicians\/ehr-practice-management$/],
    ["/tools/for-therapists", /\/tools\/for-clinicians\?practice=solo-therapist$/],
    ["/tools/best/ehr-software-2026", /\/tools\/for-clinicians\/ehr-practice-management$/],
    ["/tools/switch-from/simplepractice", /\/tools\/alternatives\/simplepractice$/],
    ["/tools/stacks", /\/architect$/],
  ];
  for (const [from, to] of cases) {
    test(`${from} redirects`, async ({ page }) => {
      const response = await page.goto(from);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(to);
    });
  }
});

test.describe("Compare Page", () => {
  test("should display compare page", async ({ page }) => {
    const response = await page.goto("/tools/compare/");
    expect(response?.status()).toBe(200);
  });

  test("should load with category parameter", async ({ page }) => {
    const response = await page.goto(
      "/tools/compare/?category=ehr-practice-management"
    );
    expect(response?.status()).toBe(200);

    // Should show comparison content
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("should load with vendor parameters", async ({ page }) => {
    // Test with known vendors
    const response = await page.goto(
      "/tools/compare/?category=ehr-practice-management&vendors=simplepractice,therapynotes"
    );
    expect(response?.status()).toBe(200);
  });
});

test.describe("Demo Request API Security", () => {
  // Helper to create valid camelCase request body
  // Uses canonical enum values from DemoRequestZ schema
  const createValidRequest = (overrides: Record<string, unknown> = {}) => ({
    email: "test-e2e@example.com",
    firstName: "Test",
    lastName: "User",
    practiceSize: "solo",
    practiceSetting: "solo-practice", // Valid enum: solo-practice, group-practice, etc.
    role: "psychiatrist",
    toolSlug: "simplepractice",
    toolName: "SimplePractice",
    agreedToTerms: true,
    marketingConsent: false,
    website: "", // Empty honeypot
    formLoadedAt: Date.now() - 60000, // 60 seconds ago (valid timing)
    ...overrides,
  });

  test("should reject requests missing required fields", async ({ request }) => {
    const response = await request.post("/api/tools/demo-request", {
      data: {
        email: "test@example.com",
        // Missing firstName, lastName, etc.
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Validation failed");
  });

  test("should silently reject honeypot-filled requests (fake success)", async ({
    request,
  }) => {
    const response = await request.post("/api/tools/demo-request", {
      data: createValidRequest({
        website: "http://spam.com", // Honeypot filled
      }),
    });

    // Bot defense returns fake success to not tip off bots
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    // But ID will be prefixed with "hp-" (honeypot)
    expect(body.id).toMatch(/^hp-/);
  });

  test("should silently reject too-fast submissions (fake success)", async ({
    request,
  }) => {
    const response = await request.post("/api/tools/demo-request", {
      data: createValidRequest({
        formLoadedAt: Date.now() - 500, // Only 0.5 seconds - too fast
      }),
    });

    // Bot defense returns fake success
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    // ID will be prefixed with "tm-" (timing)
    expect(body.id).toMatch(/^tm-/);
  });

  test("should reject invalid tool slugs with 400", async ({ request }) => {
    const response = await request.post("/api/tools/demo-request", {
      data: createValidRequest({
        toolSlug: "non-existent-fake-tool-12345",
        toolName: "Fake Tool",
      }),
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Invalid tool");
  });

  test("should handle duplicate submissions gracefully", async ({ request }) => {
    // Use unique email per test run to avoid cross-test interference
    const uniqueEmail = `dup-test-${Date.now()}@example.com`;

    // First submission - should succeed
    const firstResponse = await request.post("/api/tools/demo-request", {
      data: createValidRequest({ email: uniqueEmail }),
    });

    // First request: 200 success OR 429 rate limit (if tests run too fast)
    if (firstResponse.status() === 429) {
      // Rate limited - skip duplicate test (rate limiter working correctly)
      return;
    }
    expect(firstResponse.status()).toBe(200);
    const firstBody = await firstResponse.json();
    expect(firstBody.success).toBe(true);

    // Second submission with same email+tool - should return duplicate flag
    const secondResponse = await request.post("/api/tools/demo-request", {
      data: createValidRequest({ email: uniqueEmail }),
    });

    // Duplicate: 200 with duplicate:true OR 429 rate limit
    if (secondResponse.status() === 429) {
      return; // Rate limiter triggered - acceptable
    }
    expect(secondResponse.status()).toBe(200);
    const secondBody = await secondResponse.json();
    expect(secondBody.success).toBe(true);
    // Duplicate submissions should be flagged
    expect(secondBody.duplicate).toBe(true);
  });
});

test.describe("Homepage Clinician Entry", () => {
  test("clinician world enters Practice Architect", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /build my practice/i }).click();
    await expect(page).toHaveURL(/\/architect$/);
  });

  test("homepage links to clinician tools", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /^clinician tools/i }).first()
    ).toHaveAttribute("href", "/tools/for-clinicians");
  });
});

test.describe("Route Integrity - Clinician Tools", () => {
  test("should return 200 for all primary clinician tool routes", async ({
    page,
  }) => {
    const routes = [
      "/tools/",
      "/tools/for-clinicians/",
      "/tools/for-clinicians/ehr-practice-management/",
      "/tools/compare/",
    ];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), `Route ${route} should return 200`).toBe(200);
    }
  });
});

test.describe("Accessibility", () => {
  test("clinician tools landing should have proper heading structure", async ({
    page,
  }) => {
    await page.goto("/tools/for-clinicians/");

    // Should have exactly one H1
    const h1Elements = page.getByRole("heading", { level: 1 });
    await expect(h1Elements).toHaveCount(1);

    // Should have at least one H2 for sections
    const h2Elements = page.getByRole("heading", { level: 2 });
    expect(await h2Elements.count()).toBeGreaterThanOrEqual(1);
  });

  test("tool links should be keyboard accessible", async ({ page }) => {
    await page.goto("/tools/for-clinicians/");

    // Tab to first link
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should be able to focus links
    const focusedElement = page.locator(":focus");
    expect(await focusedElement.count()).toBe(1);
  });
});
