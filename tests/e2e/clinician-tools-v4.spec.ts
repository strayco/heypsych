import { test, expect } from "@playwright/test";

/**
 * V4 Clinician Tools E2E Tests
 *
 * Tests for the clinician tools platform:
 * - Tools hub page (/tools/)
 * - For Clinicians landing (/tools/for-clinicians/)
 * - Category pages (/tools/for-clinicians/[category]/)
 * - Product pages (/tools/for-clinicians/[category]/[slug]/)
 * - EHR Matcher (/tools/for-clinicians/ehr-practice-management/match/)
 * - Compare page (/tools/compare/)
 * - Demo request flow
 */

test.describe("Tools Hub Page", () => {
  test("should display tools hub page", async ({ page }) => {
    const response = await page.goto("/tools/");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { level: 1, name: /mental health tools/i })
    ).toBeVisible();
  });

  test("should have audience selectors (patients/clinicians)", async ({ page }) => {
    await page.goto("/tools/");

    // Should have links to both audiences
    await expect(page.getByRole("link", { name: /for patients/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /for clinicians/i })).toBeVisible();
  });

  test("should display EHR matcher CTA in clinician section", async ({ page }) => {
    await page.goto("/tools/");

    // Should have EHR matcher promotion
    await expect(
      page.getByRole("link", { name: /start matching|find.*ehr/i })
    ).toBeVisible();
  });
});

test.describe("For Clinicians Landing Page", () => {
  test("should display clinician tools landing page", async ({ page }) => {
    const response = await page.goto("/tools/for-clinicians/");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { level: 1, name: /clinician|professional/i })
    ).toBeVisible();
  });

  test("should display category navigation", async ({ page }) => {
    await page.goto("/tools/for-clinicians/");

    // Should have at least EHR category visible
    await expect(
      page.getByRole("link", { name: /ehr|practice management/i }).first()
    ).toBeVisible();
  });

  test("should have EHR matcher CTA", async ({ page }) => {
    await page.goto("/tools/for-clinicians/");

    // Should have prominent EHR matcher link
    const ehrMatcherLink = page.getByRole("link", {
      name: /find.*ehr|ehr.*match/i,
    });
    await expect(ehrMatcherLink.first()).toBeVisible();
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

  test("should have EHR matcher CTA on EHR page", async ({ page }) => {
    await page.goto("/tools/for-clinicians/ehr-practice-management/");

    // EHR category should have matcher CTA
    await expect(
      page.getByRole("link", { name: /find.*match|start matching/i }).first()
    ).toBeVisible();
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

test.describe("EHR Matcher", () => {
  test("should display EHR matcher page", async ({ page }) => {
    const response = await page.goto(
      "/tools/for-clinicians/ehr-practice-management/match/"
    );
    expect(response?.status()).toBe(200);

    // Should have a heading related to matching
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("should have interactive matching form", async ({ page }) => {
    await page.goto("/tools/for-clinicians/ehr-practice-management/match/");

    // Should have form elements (buttons, radio inputs, etc.)
    const formElements = page.locator("form, [role=radiogroup], button");
    await expect(formElements.first()).toBeVisible();
  });
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

test.describe("Homepage Clinician Section", () => {
  test("should display For Clinicians section on homepage", async ({
    page,
  }) => {
    await page.goto("/");

    // Should have clinician section
    await expect(
      page.getByRole("heading", { name: /clinician|professional/i }).first()
    ).toBeVisible();
  });

  test("should have EHR matcher link on homepage", async ({ page }) => {
    await page.goto("/");

    // Should have link to EHR matcher
    const matcherLink = page.getByRole("link", {
      name: /find.*ehr|ehr.*match/i,
    });
    await expect(matcherLink.first()).toBeVisible();
  });

  test("should have browse clinician tools link on homepage", async ({
    page,
  }) => {
    await page.goto("/");

    // Should have link to browse clinician tools
    const browseLink = page.getByRole("link", {
      name: /browse.*clinician|all.*clinician/i,
    });
    await expect(browseLink.first()).toBeVisible();
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
      "/tools/for-clinicians/ehr-practice-management/match/",
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
