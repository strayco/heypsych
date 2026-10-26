import { describe, expect, it } from "vitest";
import { glance, matchesIntent, parsePrice, shelf, whatYouGet, yearCost, INTENTS } from "../model";
import type { FinderApp } from "../../finder/model";

const app = (slug: string, patch: Partial<FinderApp> = {}): FinderApp => ({
  slug,
  name: slug,
  href: `/tools/${slug}`,
  summary: null,
  goodFor: null,
  cost: "",
  needs: [],
  help: [],
  pay: [],
  evidence: null,
  privacy: null,
  platforms: null,
  open: true,
  limited: null,
  notFirstStop: false,
  approaches: [],
  costTier: null,
  storeRating: null,
  rank: 0,
  ...patch,
});

describe("prices", () => {
  it("reads monthly, yearly, weekly and session prices", () => {
    expect(parsePrice("Free, or from $69.99/year or $12.99/month")).toMatchObject({ perYear: [69.99, 69.99], perMonth: [12.99, 12.99] });
    expect(parsePrice("$65-$100/week").perWeek).toEqual([65, 100]);
    expect(parsePrice("$299 per visit").perSession).toEqual([299, 299]);
    expect(parsePrice("Paid").perMonth).toBeNull();
  });

  it("works out a year and the annual saving", () => {
    expect(yearCost("Free, or from $69.99/year or $12.99/month")).toEqual({
      headline: "About $156 a year",
      working: "$12.99 a month × 12",
      note: "The annual plan ($69.99) saves about $86 over paying monthly.",
    });
    expect(yearCost("$65-$100/week")?.headline).toBe("About $3,380–$5,200 a year");
    expect(yearCost("15-day trial, then about $99.99/year")?.headline).toBe("$99.99 a year");
    expect(yearCost("Takes insurance")).toBeNull();
  });
});

describe("intents and shelves", () => {
  const apps = [
    app("t1", { help: ["therapist"], pay: ["insurance"] }),
    app("t2", { help: ["therapist", "prescriber"], pay: ["self-pay"] }),
    app("s1", { help: ["self-guided"], pay: ["free"] }),
    app("s2", { help: ["self-guided"], pay: ["free", "self-pay"] }),
  ];

  it("matches intents on record fields only", () => {
    const therapy = INTENTS.find((i) => i.id === "online-therapy")!;
    expect(apps.filter((a) => matchesIntent(a, therapy)).map((a) => a.slug)).toEqual(["t1", "t2"]);
  });

  it("labels what you get, strongest first", () => {
    expect(whatYouGet(apps[1])).toBe("Therapy and medication");
    expect(whatYouGet(apps[2])).toBe("On your own");
  });

  it("drops shelves with fewer than two options", () => {
    const def = { id: "x", title: "x", line: "x", href: null };
    expect(shelf(apps, def, (a) => a.help.includes("self-guided"))?.total).toBe(2);
    expect(shelf(apps, def, (a) => a.help.includes("prescriber"))).toBeNull();
  });

  it("summarises a set honestly", () => {
    const prices: Record<string, string> = { t1: "$100/month", t2: "$200/month", s2: "$10/month" };
    const g = glance(apps, (s) => prices[s] ?? null);
    // Too few listed prices to call anything "typical".
    expect(g).toMatchObject({ total: 4, insurance: 1, freeToStart: 2, withPeople: 2, onYourOwn: 2, typicalMonthly: null, priced: 3 });
    const many = ["a", "b", "c", "d", "e"].map((s) => app(s, { pay: ["self-pay"] }));
    const monthly: Record<string, string> = { a: "$10/month", b: "$20/month", c: "$30/month", d: "$40/month", e: "$65/week" };
    expect(glance(many, (s) => monthly[s]).typicalMonthly).toBe(30);
  });
});
