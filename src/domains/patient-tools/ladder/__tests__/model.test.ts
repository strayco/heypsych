import { describe, expect, it } from "vitest";
import { STEPS, nearestWithOptions, onStep, stepCounts, viewStep } from "../model";
import { isEmployerOnly, type FinderApp } from "../../finder/model";

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

const apps = [
  app("calm", { help: ["self-guided"], needs: ["sleep", "anxiety-stress"], pay: ["free", "self-pay"], storeRating: { store: "App Store", rating: 4.8, count: 900000 } }),
  app("cbti", { help: ["self-guided"], needs: ["sleep"], pay: ["free"], evidence: "Strong research support" }),
  app("niche", { help: ["self-guided"], needs: ["sleep"], pay: ["self-pay"] }),
  app("therapy", { help: ["therapist"], needs: ["anxiety-stress", "mood-depression"], pay: ["insurance"] }),
  app("employer", { help: ["therapist"], needs: ["anxiety-stress"], pay: ["employer"], open: false }),
];
const step = (id: string) => STEPS.find((s) => s.id === id)!;

describe("support ladder", () => {
  it("has four steps from least to most support", () => {
    expect(STEPS.map((s) => s.id)).toEqual(["self-guided", "peer", "therapist", "prescriber"]);
  });

  it("puts only open sign-up options on a step, through both lenses", () => {
    expect(onStep(apps[4], step("therapist"), { need: null, wallet: "any" })).toBe(false);
    expect(stepCounts(apps, { need: "sleep", wallet: "any" })).toEqual({ "self-guided": 3, peer: 0, therapist: 0, prescriber: 0 });
    expect(stepCounts(apps, { need: null, wallet: "insurance" }).therapist).toBe(1);
  });

  it("starts with the best-studied, then the most widely used", () => {
    const v = viewStep(apps, step("self-guided"), { need: "sleep", wallet: "any" }, () => null);
    expect(v.picks.map((a) => a.slug)).toEqual(["cbti", "calm", "niche"]);
    expect(v.freeCount).toBe(2);
  });

  it("points to the nearest step that has options", () => {
    const counts = stepCounts(apps, { need: "sleep", wallet: "any" });
    expect(nearestWithOptions(counts, "therapist")).toBe("self-guided");
  });
});

describe("employer-only products", () => {
  it("are recognised by name, wording or the reviewed list", () => {
    expect(isEmployerOnly({ slug: "wysa-for-employers", name: "Wysa for Employers", one_liner: "" })).toBe(true);
    expect(isEmployerOnly({ slug: "x", name: "Talkspace for Business", one_liner: "" })).toBe(true);
    expect(isEmployerOnly({ slug: "lyra", name: "Lyra Health", one_liner: "B2B mental health benefit" })).toBe(true);
    expect(isEmployerOnly({ slug: "calm-health", name: "Calm Health", one_liner: "Clinical wellness platform" })).toBe(true);
    expect(isEmployerOnly({ slug: "wysa", name: "Wysa", one_liner: "AI chatbot for mental wellbeing" })).toBe(false);
    expect(isEmployerOnly({ slug: "nocd", name: "NOCD", one_liner: "Virtual OCD treatment with insurance coverage" })).toBe(false);
  });
});
