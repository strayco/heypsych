import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { conditionFacts, treatmentFacts, measureName, monitoringLabel } from "../facts";
import { conditionQuestions, treatmentQuestions } from "../questions";
import { buildBrief, briefToText } from "../brief";
import {
  EMPTY_PATH,
  addQuestion,
  parseApps,
  parseNoticed,
  parsePath,
  pathCount,
  removeItem,
  saveCondition,
} from "../document";
import { concernsFromNoticed, destinationsFor, durationFromNoticed, prefillFromNoticed } from "../journey";
import { SYMPTOM_REGISTRY } from "@/domains/symptoms/registry";
import { SUPPORT_PATHS } from "@/domains/patient-support/paths";
import { evaluateSupportPath } from "@/domains/patient-support/evaluator";
import { getAllTreatmentSlugs, loadTreatment } from "@/lib/comparison/treatment-loader";
import type { PathSnapshot, SymptomRef, SupportPathId } from "../types";

const ROOT = process.cwd();
const refs: SymptomRef[] = SYMPTOM_REGISTRY.map((s) => ({
  slug: s.slug,
  name: s.name,
  category: s.category,
  alsoCausedBy: s.nonPsychiatricConsiderations,
  seekHelpWhen: s.whenToSeekHelp ?? [],
}));

function conditionFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".json")) out.push(full);
    }
  };
  walk(path.join(ROOT, "data/conditions"));
  return out;
}

/** Advice a question must never give. Questions ask; they don't instruct. */
const ADVICE = /\b(you should|you must|start taking|stop taking|increase your dose|decrease your dose|diagnos(?:e|is) (?:is|of you)|(?<!do )you have)\b/i;

function snapshot(partial: Partial<PathSnapshot>): PathSnapshot {
  return { ...EMPTY_PATH, noticed: [], apps: [], tried: [], ...partial } as PathSnapshot;
}

describe("facts from every reviewed record", () => {
  it("reads every condition record without throwing or inventing text", () => {
    let count = 0;
    let withEvaluation = 0;
    for (const file of conditionFiles()) {
      const record = JSON.parse(fs.readFileSync(file, "utf8"));
      if (record.type !== "condition") continue;
      count += 1;
      const facts = conditionFacts(record.content ?? {}, record.editorial);
      if (facts.evaluation || facts.measures.length) withEvaluation += 1;
      for (const value of [facts.whatItIs, facts.evaluation, facts.whenToSeekHelp, ...facts.measures, ...facts.alsoConsidered, ...facts.approaches]) {
        if (value !== null) expect(value.trim(), file).not.toBe("");
        if (value) expect(value, file).not.toMatch(/\[object Object\]|undefined|null/);
      }
      for (const q of conditionQuestions(record.name, facts)) expect(q.text, file).not.toMatch(ADVICE);
    }
    expect(count).toBeGreaterThan(100);
    expect(withEvaluation).toBeGreaterThan(50);
  });

  it("reads every treatment record without throwing or inventing text", async () => {
    let count = 0;
    for (const slug of getAllTreatmentSlugs()) {
      const t = await loadTreatment(slug);
      if (!t) continue;
      count += 1;
      const facts = treatmentFacts(t);
      for (const value of [facts.whatItIs, facts.onset, facts.course, facts.session, facts.boxedWarning, ...facts.sideEffects, ...facts.monitoring, ...facts.formats, ...facts.usedFor]) {
        if (value !== null) expect(value.trim(), slug).not.toBe("");
        if (value) expect(value, slug).not.toMatch(/\[object Object\]|undefined/);
      }
      const questions = treatmentQuestions(t.identity?.name ?? slug, facts);
      expect(questions.length, slug).toBeGreaterThan(0);
      expect(questions.length, slug).toBeLessThanOrEqual(4);
      for (const q of questions) expect(q.text, slug).not.toMatch(ADVICE);
    }
    expect(count).toBeGreaterThan(400);
  });

  it("puts the boxed warning first for a medication that carries one", async () => {
    const all = getAllTreatmentSlugs();
    let checked = 0;
    for (const slug of all) {
      const t = await loadTreatment(slug);
      if (!t) continue;
      const facts = treatmentFacts(t);
      if (!facts.boxedWarning) continue;
      expect(treatmentQuestions(t.identity.name, facts)[0].text).toMatch(/boxed warning/);
      checked += 1;
      if (checked > 20) break;
    }
    expect(checked).toBeGreaterThan(5);
  });

  it("keeps names, not glosses", () => {
    expect(measureName("Generalized Anxiety Disorder-7 (GAD-7), to check for other anxiety at the same time")).toBe(
      "Generalized Anxiety Disorder-7 (GAD-7)"
    );
    expect(monitoringLabel("Worsening mood and suicidal thoughts: especially during the first 1–2 months")).toBe(
      "Worsening mood and suicidal thoughts"
    );
  });
});

describe("the stored path", () => {
  it("survives anything stored under its key", () => {
    for (const raw of [null, "", "{", "[]", "42", '{"conditions":"x"}', '{"conditions":[{"slug":"../../etc","name":"x","savedAt":1,"facts":{}}]}']) {
      const doc = parsePath(raw);
      expect(doc.conditions).toEqual([]);
      expect(doc.treatments).toEqual([]);
    }
  });

  it("drops one bad item, keeps the rest", () => {
    const good = { slug: "panic-disorder", name: "Panic Disorder", savedAt: 1, facts: { measures: ["PDSS"] } };
    const doc = parsePath(JSON.stringify({ conditions: [good, { slug: 3 }, good] }));
    expect(doc.conditions).toHaveLength(1);
    expect(doc.conditions[0].facts.measures).toEqual(["PDSS"]);
  });

  it("refreshes facts without moving or re-dating a saved item", () => {
    const facts = conditionFacts({}, undefined);
    let doc = saveCondition(EMPTY_PATH, { slug: "a", name: "A", savedAt: 1, facts });
    doc = saveCondition(doc, { slug: "b", name: "B", savedAt: 2, facts });
    doc = saveCondition(doc, { slug: "a", name: "A2", savedAt: 3, facts });
    expect(doc.conditions.map((c) => [c.slug, c.name, c.savedAt])).toEqual([
      ["b", "B", 2],
      ["a", "A2", 1],
    ]);
    expect(removeItem(doc, "condition", "a").conditions.map((c) => c.slug)).toEqual(["b"]);
  });

  it("caps and cleans the visitor's own questions", () => {
    let doc = EMPTY_PATH;
    for (let i = 0; i < 20; i += 1) doc = addQuestion(doc, `  question   ${i}  `);
    expect(doc.questions).toHaveLength(8);
    expect(doc.questions[0]).toBe("question 0");
    expect(addQuestion(EMPTY_PATH, "x".repeat(500)).questions[0]).toHaveLength(200);
    expect(addQuestion(EMPTY_PATH, "   ").questions).toEqual([]);
  });

  it("reads the existing symptom and saved-app stores", () => {
    expect(parseNoticed('[{"slug":"low-mood","name":"Low Mood","duration":"weeks"},{"slug":"x","name":"X","duration":"forever"}]')).toEqual([
      { slug: "low-mood", name: "Low Mood", duration: "weeks", addedAt: undefined },
      { slug: "x", name: "X", duration: null, addedAt: undefined },
    ]);
    expect(parseNoticed("not json")).toEqual([]);
    expect(parseApps('[{"slug":"headspace","name":"Headspace"},{"slug":"headspace","name":"Headspace"}]')).toHaveLength(1);
  });

  it("counts what the visitor kept", () => {
    expect(pathCount({ noticed: [1, 2], conditions: [1], treatments: [], apps: [1], nextStep: {} })).toBe(5);
  });
});

describe("pre-filling the next-step journey", () => {
  it("suggests the categories of what was noticed, most frequent first", () => {
    const noticed = [
      { slug: "trouble-sleeping", name: "", duration: null },
      { slug: "low-mood", name: "", duration: null },
      { slug: "loss-of-interest", name: "", duration: null },
    ];
    expect(concernsFromNoticed(noticed, refs)).toEqual(["mood-motivation", "sleep"]);
  });

  it("uses the longest duration noted", () => {
    expect(durationFromNoticed([{ slug: "a", name: "", duration: "days" }])).toBe("less-than-2-weeks");
    expect(durationFromNoticed([{ slug: "a", name: "", duration: "days" }, { slug: "b", name: "", duration: "weeks" }])).toBe("2-weeks-to-3-months");
    expect(durationFromNoticed([{ slug: "a", name: "", duration: "years" }])).toBe("more-than-3-months");
    expect(durationFromNoticed([{ slug: "a", name: "", duration: null }])).toBeUndefined();
  });

  it("ignores symptoms it does not know and suggests nothing from nothing", () => {
    expect(prefillFromNoticed([{ slug: "not-a-symptom", name: "", duration: "years" }], refs)).toEqual({
      primaryConcerns: [],
      duration: undefined,
      fromNoticed: 0,
    });
  });
});

describe("where each path leads", () => {
  const routeExists = (href: string) => {
    if (!href.startsWith("/")) return true; // tel:, sms:
    const clean = href.split(/[?#]/)[0].replace(/^\//, "");
    const dir = path.join(ROOT, "src/app", clean);
    return fs.existsSync(path.join(dir, "page.tsx")) || fs.existsSync(path.join(dir, "page.ts"));
  };

  it("points every path at a page that exists today", () => {
    for (const id of Object.keys(SUPPORT_PATHS) as SupportPathId[]) {
      for (const pay of [undefined, "use-insurance", "out-of-pocket", "not-sure"] as const) {
        const actions = destinationsFor(id, pay);
        expect(actions.length, id).toBeGreaterThan(0);
        for (const a of actions) expect(routeExists(a.href), `${id}: ${a.href}`).toBe(true);
      }
    }
  });

  it("gives crisis support only crisis actions", () => {
    const actions = destinationsFor("crisis-support", "use-insurance");
    expect(actions[0].href).toBe("tel:988");
    expect(actions.some((a) => a.href.startsWith("/tools"))).toBe(false);
  });

  it("leaves the evaluator's own next actions on live pages too", () => {
    const result = evaluateSupportPath({ urgencyCheck: "planning-ahead", primaryConcerns: [], goals: ["explore-medication", "talk-to-someone-regularly"] });
    for (const a of result.nextActions) expect(routeExists(a.href), a.href).toBe(true);
  });
});

describe("the appointment brief", () => {
  const facts = {
    whatItIs: "Panic disorder means having sudden panic attacks again and again.",
    evaluation: "Rule out cardiac, respiratory, endocrine, and neurological conditions.",
    measures: ["Panic Disorder Severity Scale (PDSS)"],
    alsoConsidered: ["Heart attack or cardiac emergency", "Generalized anxiety"],
    approaches: ["Therapy", "Medications"],
    whenToSeekHelp: null,
    reviewed: "2025-11-24",
  };
  const path1 = snapshot({
    noticed: [
      { slug: "panic-episodes", name: "Panic Episodes", duration: "months" },
      { slug: "low-mood", name: "Low Mood", duration: null },
    ],
    conditions: [{ slug: "panic-disorder", name: "Panic Disorder", savedAt: 1, facts }],
    tried: [{ conditionSlug: "panic-disorder", items: ["Regular aerobic exercise"] }],
    questions: ["Can I keep my current job schedule?"],
  });

  it("is deterministic", () => {
    expect(buildBrief(path1, refs)).toEqual(buildBrief(path1, refs));
    expect(briefToText(buildBrief(path1, refs))).toEqual(briefToText(buildBrief(path1, refs)));
  });

  it("organises what the visitor kept, with provenance", () => {
    const brief = buildBrief(path1, refs);
    expect(brief.isEmpty).toBe(false);
    expect(brief.noticed).toEqual([
      { name: "Panic-Like Episodes", duration: "for months" },
      { name: "Low Mood", duration: null },
    ]);
    expect(brief.alsoCheck.length).toBeGreaterThan(0);
    expect(brief.reading[0].provenance).toBe("HeyPsych guide, reviewed November 24, 2025");
    expect(brief.reading[0].questions.map((q) => q.text)).toContain("What would an evaluation involve for me?");
    expect(brief.ownQuestions).toEqual(["Can I keep my current job schedule?"]);
    expect(brief.tried).toEqual(["Regular aerobic exercise"]);
  });

  it("always carries crisis lines and the disclaimer, and never ranks a diagnosis", () => {
    const empty = buildBrief(snapshot({}), refs);
    expect(empty.isEmpty).toBe(true);
    expect(empty.crisis).toMatch(/988/);
    const text = briefToText(buildBrief(path1, refs));
    expect(text).toMatch(/988/);
    expect(text).toMatch(/not a diagnosis/);
    expect(text).not.toMatch(/likely|probably|you have|match(es)? \d/i);
  });

  it("leaves self-harm statements to the crisis line rather than the 'sooner' list", () => {
    const brief = buildBrief(snapshot({ noticed: [{ slug: "low-mood", name: "Low Mood", duration: null }] }), refs);
    expect(brief.sooner.some((s) => /self-harm|suicid/i.test(s))).toBe(false);
  });

  it("describes the next step the visitor chose to keep", () => {
    const brief = buildBrief(
      snapshot({
        nextStep: {
          savedAt: 1,
          pathId: "therapy-counseling",
          pathName: "Talk Therapy",
          typicalFirst: "Search for therapists.",
          whyThisFits: [],
          alternatives: [],
          confidence: "clear-path",
          missingInfo: [],
          answers: { primaryConcerns: ["worry-fear"], goals: ["learn-coping-strategies"], duration: "more-than-3-months", insurancePreference: "use-insurance" },
          versions: { definition: "1.0.0", evaluator: "1.1.0" },
        },
      }),
      refs
    );
    expect(brief.lookingFor?.path).toBe("Talk Therapy");
    expect(brief.lookingFor?.details).toEqual([
      "Hoping to: learn ways to cope",
      "Affecting daily life: more than three months",
      "Paying: with insurance",
    ]);
  });
});

describe("lower", () => {
  it("keeps acronyms and lowers ordinary capitalised words", async () => {
    const { lower } = await import("../questions");
    expect(lower("GI upset")).toBe("GI upset");
    expect(lower("Dry Mouth")).toBe("dry mouth");
    expect(lower("Sedation / Drowsiness")).toBe("sedation / drowsiness");
    expect(lower("PHQ-9 or HAM-D")).toBe("PHQ-9 or HAM-D");
  });
});

describe("what would change the next step", () => {
  it("only reports variations the evaluator actually routes elsewhere, never to crisis", async () => {
    const { whatIfs, evaluate } = await import("../what-if");
    const base = { primaryConcerns: ["mood-motivation" as const], goals: ["talk-to-someone-regularly" as const], duration: "more-than-3-months" as const };
    const current = evaluate("struggling-now", base).primaryPath.id;
    const list = whatIfs("struggling-now", base);
    expect(list.length).toBeGreaterThan(0);
    for (const w of list) {
      expect(w.pathId).not.toBe(current);
      expect(w.pathId).not.toBe("crisis-support");
      expect(evaluate("struggling-now", w.answers).primaryPath.id).toBe(w.pathId);
    }
    expect(list.map((w) => w.label)).toContain("If you also wanted to find out whether medication could help");
    expect(new Set(list.map((w) => w.pathId)).size).toBe(list.length);
  });

  it("speaks to the visitor, not as them", async () => {
    const { whatIfs } = await import("../what-if");
    for (const w of whatIfs("planning-ahead", { primaryConcerns: [], goals: [] }, 10)) expect(w.label).not.toMatch(/\bI('m|'ve)?\b|\bmy\b/);
  });
});

describe("readiness", () => {
  it("measures the notes and names the next useful step", async () => {
    const { readiness, daysUntil } = await import("../readiness");
    const empty = readiness(snapshot({}), "2026-11-18");
    expect(empty.ready).toBe(false);
    expect(empty.next?.id).toBe("next-step");
    const r = readiness(
      snapshot({
        noticed: [{ slug: "low-mood", name: "Low Mood", duration: null }],
        appointment: "2026-11-25",
      }),
      "2026-11-18"
    );
    expect(r.missingDurations).toEqual(["low-mood"]);
    expect(r.daysToAppointment).toBe(7);
    expect(daysUntil("2026-03-09", "2026-03-07")).toBe(2); // across a DST change
    expect(readiness(snapshot({ appointment: "2026-11-01" }), "2026-11-18").daysToAppointment).toBeNull();
  });

  it("nudges prescriber questions only for medicines with interactions", async () => {
    const { readiness, LIST_MEDICINES_QUESTION } = await import("../readiness");
    const t = (kind: "medication" | "therapy", hasInteractions: boolean) => ({
      slug: kind, name: kind, savedAt: 1,
      facts: { kind, drugClass: null, whatItIs: null, onset: null, course: null, session: null, formats: [], boxedWarning: null, sideEffects: [], monitoring: [], hasInteractions, controlled: null, prescription: null, hasPregnancyGuidance: false, usedFor: [], usedForSlugs: [], reviewed: null },
    });
    expect(readiness(snapshot({ treatments: [t("therapy", true)] }), "2026-11-18").nudges.map((n) => n.id)).not.toContain("list-medicines");
    expect(readiness(snapshot({ treatments: [t("medication", true)] }), "2026-11-18").nudges[0].question).toBe(LIST_MEDICINES_QUESTION);
    expect(readiness(snapshot({ treatments: [t("medication", true)], questions: [LIST_MEDICINES_QUESTION] }), "2026-11-18").nudges.map((n) => n.id)).not.toContain("list-medicines");
  });
});

describe("connections", () => {
  it("connects only through reviewed relationships and never scores them", async () => {
    const { buildGraph, nodeId } = await import("../graph");
    const lowMood = refs.find((r) => r.slug === "low-mood")!;
    const graphRefs = refs.map((r) => (r.slug === "low-mood" ? { ...r, conditions: ["major-depressive-disorder"] } : r));
    const tfacts = { kind: "medication" as const, drugClass: null, whatItIs: null, onset: null, course: null, session: null, formats: [], boxedWarning: null, sideEffects: [], monitoring: [], hasInteractions: false, controlled: null, prescription: true, hasPregnancyGuidance: false, usedFor: [], usedForSlugs: ["major-depressive-disorder"], reviewed: null };
    const g = buildGraph(
      snapshot({
        noticed: [{ slug: lowMood.slug, name: lowMood.name, duration: null }, { slug: "trouble-sleeping", name: "x", duration: null }],
        conditions: [{ slug: "major-depressive-disorder", name: "Major Depressive Disorder", savedAt: 1, facts: conditionFacts({}, undefined) }],
        treatments: [{ slug: "sertraline-zoloft", name: "Sertraline", savedAt: 1, facts: tfacts }],
        nextStep: { savedAt: 1, pathId: "psychiatric-eval", pathName: "Psychiatric Evaluation", typicalFirst: "", whyThisFits: [], alternatives: [], confidence: "clear-path", missingInfo: [], answers: { primaryConcerns: [], goals: [] }, versions: { definition: "", evaluator: "" } },
      }),
      graphRefs
    );
    const c = nodeId("condition", "major-depressive-disorder");
    expect([...g.neighbours.get(c)!].sort()).toEqual([nodeId("symptom", "low-mood"), nodeId("treatment", "sertraline-zoloft")].sort());
    expect(g.neighbours.get(nodeId("symptom", "trouble-sleeping"))!.size).toBe(0);
    expect(g.neighbours.get(nodeId("treatment", "sertraline-zoloft"))!.has(nodeId("next-step", "psychiatric-eval"))).toBe(true);
    for (const e of g.edges) expect(e.why).not.toMatch(/match|likely|score|\d+%/i);
  });
});

describe("kept next step history", () => {
  it("records what changed and why, newest first, capped", async () => {
    const { keepNextStep, parsePath } = await import("../document");
    const step = (pathId: "therapy-counseling" | "integrated-care", pathName: string, at: number) => ({
      savedAt: at, pathId, pathName, typicalFirst: "", whyThisFits: [], alternatives: [], confidence: "clear-path" as const, missingInfo: [],
      answers: { primaryConcerns: [], goals: [] }, versions: { definition: "1", evaluator: "1" },
    });
    let doc = keepNextStep(EMPTY_PATH, step("therapy-counseling", "Talk Therapy", 1), null);
    expect(doc.nextStep?.history).toEqual([]);
    doc = keepNextStep(doc, step("therapy-counseling", "Talk Therapy", 2), "x");
    expect(doc.nextStep?.history).toEqual([]); // same step: nothing to record
    doc = keepNextStep(doc, step("integrated-care", "Integrated Care", 3), 'you added "find out whether medication could help"');
    expect(doc.nextStep?.history?.[0]).toEqual({ at: 3, from: "Talk Therapy", to: "Integrated Care", because: 'you added "find out whether medication could help"' });
    expect(parsePath(JSON.stringify(doc)).nextStep?.history).toHaveLength(1);
  });
});

describe("safety cells never assert absence", () => {
  it("shows a boxed warning only when the record has one", async () => {
    const { boxedWarningCell, controlledCell, NOT_IN_GUIDE } = await import("../safety-cells");
    expect(boxedWarningCell({ kind: "medication", boxedWarning: "Can raise suicidal thoughts in young people." })).toMatch(/suicidal/);
    // Lithium-style record: no field. Must not read as "none".
    expect(boxedWarningCell({ kind: "medication", boxedWarning: null })).toBe(NOT_IN_GUIDE);
    expect(boxedWarningCell({ kind: "medication", boxedWarning: null })).not.toMatch(/none|no boxed/i);
    expect(controlledCell({ kind: "medication", controlled: "Schedule II" })).toBe("Yes (Schedule II)");
    // Methylphenidate-style record with no controlled-substance data: never "No".
    expect(controlledCell({ kind: "medication", controlled: null })).toBe(NOT_IN_GUIDE);
    expect(controlledCell({ kind: "therapy", controlled: null })).toBe("—");
    // Only an explicit record value says "No".
    expect(controlledCell({ kind: "medication", controlled: null, notControlled: true })).toBe("No");
  });
});

describe("legacy records: boxed warning stated in the record's own words", () => {
  it("reuses the record's own sentence and ignores negations", async () => {
    const { statedBoxedWarning } = await import("@/lib/comparison/treatment-normalizer");
    const rec = (description: string) => ({ summary: "", description, sections: [] as { type: string; content?: string }[] });
    expect(statedBoxedWarning(rec("A long-acting injection. This form carries its own boxed warning for post-injection delirium/sedation syndrome (PDSS)."))).toMatch(/^This form carries its own boxed warning/);
    expect(statedBoxedWarning(rec("Unlike the oral form, it has no boxed warning."))).toBeUndefined();
    expect(statedBoxedWarning(rec("It does not carry a black-box warning in the US."))).toBeUndefined();
    expect(statedBoxedWarning(rec("A calm, plain summary with no warnings mentioned."))).toBeUndefined();
  });
});
