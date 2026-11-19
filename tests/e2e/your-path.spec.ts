import { test, expect, type Page } from "@playwright/test";

/**
 * Breakthrough release journeys, through the production paths:
 * collect → live decision board → map → brief, and Practice Architect's
 * draft → ledger → plan. (Engine tests alone don't show a journey works.)
 */

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
}

test.describe("Your Path (consumer)", () => {
  test("a first visit shows an empty map that teaches the model, nothing personal", async ({ page }) => {
    await open(page, "/");
    await expect(page.getByRole("link", { name: /Your path, \d+/ })).toHaveCount(0);
    await open(page, "/my-path");
    for (const lane of ["Noticed", "Exploring", "Considering", "Next step"]) {
      await expect(page.getByRole("heading", { level: 3, name: new RegExp(`^${lane}`) })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "+ Find your next step" })).toBeVisible();
  });

  test("collect, decide live, see connections, take the brief", async ({ page }) => {
    await open(page, "/symptoms/low-mood");
    await page.getByRole("button", { name: "I've noticed this" }).click();
    await page.getByRole("button", { name: "Months" }).click();

    // The condition page reacts to what was noticed before anything is saved.
    await open(page, "/conditions/major-depressive-disorder");
    await expect(page.getByText(/Connects to your path/)).toBeVisible();
    await page.getByRole("button", { name: "Save to your path" }).click();
    await expect(page.getByRole("button", { name: "In your path" })).toBeVisible();

    await open(page, "/treatments/sertraline-zoloft");
    await expect(page.getByText(/Connects to your path/)).toBeVisible();
    await page.getByRole("button", { name: "Add to your path" }).click();

    // Live board: safety first, then one screen that recomputes on every tap.
    await open(page, "/find-support?need=support");
    await page.getByRole("radio", { name: /I'm okay right now/ }).click();
    await expect(page.getByText("from your notes").first()).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /Mood & Motivation/ })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("checkbox", { name: /Talk to someone regularly/ }).click();
    await expect(page.locator("#journey-q")).toHaveText("Talk Therapy");
    await page.getByRole("checkbox", { name: /medication could help/ }).click();
    await expect(page.locator("#journey-q")).toHaveText("Integrated Care");
    await expect(page.getByText(/Changed from Talk Therapy because you added/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "What would change it" })).toBeVisible();
    await page.getByRole("button", { name: /Keep this and build my appointment brief/ }).click();

    // Map: everything connected; selecting lights up its links.
    await open(page, "/my-path");
    await page.getByRole("button", { name: /Major Depressive Disorder/ }).first().click();
    const inspector = page.getByRole("region", { name: "Major Depressive Disorder" });
    await expect(inspector.getByText("Adds to your brief")).toBeVisible();
    await expect(inspector.getByRole("button", { name: /Low Mood/ })).toBeVisible();
    await expect(inspector.getByRole("button", { name: /Sertraline/ })).toBeVisible();
    await page.keyboard.press("Escape");

    // Readiness fixes in place, and the brief is one tap away.
    await expect(page.getByRole("heading", { name: /appointment/ }).first()).toBeVisible();
    await page.getByRole("button", { name: /Prescribers will ask what else you take/ }).click();
    await page.getByRole("tab", { name: /Brief/ }).click();
    const brief = page.getByRole("article", { name: "Appointment brief" });
    await expect(brief.getByText("Integrated Care")).toBeVisible();
    await expect(brief.getByText(/^Low Mood, for months$/)).toBeVisible();
    await expect(brief.getByText(/boxed warning on its label/)).toBeVisible();
    await expect(brief.getByText(/everything I take/)).toBeVisible();
    await expect(brief.getByText(/988/).first()).toBeVisible();
  });

  test("crisis stops everything and shows only crisis help", async ({ page }) => {
    await open(page, "/find-support?need=support");
    await page.getByRole("radio", { name: /I'm in crisis/ }).click();
    await expect(page.getByRole("heading", { name: /don't have to go through this alone/ })).toBeVisible();
    await expect(page.locator('a[href="tel:988"]').first()).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await expect(page.locator("#next-step-result")).toHaveCount(0);
  });

  test("the workspace is not indexable", async ({ page, request }) => {
    await open(page, "/my-path");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /my-path");
  });
});

test.describe("Practice Architect (clinician)", () => {
  test("onboard, draft the practice in one step, leave with a plan", async ({ page }) => {
    await open(page, "/architect");
    const cont = () => page.locator("main button:has-text('Continue'), main button:has-text('Build'), main button:has-text('See'), main button:has-text('Show')").last().click();
    await page.getByRole("button", { name: "Therapists" }).click();
    await page.getByRole("button", { name: "Starting a new practice" }).click();
    await cont();
    await page.getByRole("button", { name: "Solo (1 provider)" }).click();
    await page.locator("select").first().selectOption("CA");
    await page.getByRole("button", { name: /^Hybrid/ }).click();
    await page.getByRole("button", { name: "Both private pay and insurance" }).click();
    await cont();
    await page.getByRole("button", { name: "Individual psychotherapy" }).click();
    await cont();

    await page.getByRole("button", { name: "Draft my practice" }).click();
    await expect(page.getByText(/^Drafted with \d+ tools?\./)).toBeVisible();
    const ledger = page.getByRole("region", { name: "Your plan so far" });
    await expect(ledger.getByText("Suggested").first()).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Functions decided" }).first()).not.toHaveAttribute("aria-valuenow", "0");

    await ledger.getByRole("button", { name: /See your practice plan/ }).click();
    await expect(page.getByRole("heading", { name: /practice plan$/ })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText("Verify before you sign").first()).toBeVisible();
  });
});
