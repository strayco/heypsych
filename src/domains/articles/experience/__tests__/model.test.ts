import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { fromKnowledgeHub, fromLearn, plain, textToBlocks, type LinkTargets } from "../model";
import { linkTargets } from "../targets";
import { CONDITION_SLUGS, RESOURCE_SLUGS } from "@/lib/entities/entity-slugs.generated";

const dir = path.join(process.cwd(), "data/learn");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

describe("every /learn article", () => {
  for (const file of files) {
    it(file, () => {
      const a = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      const x = fromLearn(a, linkTargets);
      expect(x.title).toBeTruthy();
      expect(x.blocks.length).toBeGreaterThan(0);
      expect(x.minutes).toBeGreaterThan(0);
      expect(new Set(x.contents.map((c) => c.id)).size).toBe(x.contents.length);
      // Every related link points at a page that exists.
      for (const l of x.related.conditions) expect(CONDITION_SLUGS.has(l.href.split("/")[2])).toBe(true);
      for (const l of x.related.resources) expect(RESOURCE_SLUGS.has(l.href.split("/")[2])).toBe(true);
      for (const l of x.related.articles) expect(files).toContain(`${l.href.split("/")[2]}.json`);
    });
  }
});

describe("textToBlocks", () => {
  it("splits paragraphs and bullet lists", () => {
    expect(textToBlocks("Intro line\n\n• one\n• two\n\nAfter")).toEqual([
      { kind: "p", text: "Intro line" },
      { kind: "list", items: ["one", "two"] },
      { kind: "p", text: "After" },
    ]);
  });
  it("handles a lead-in line directly above bullets", () => {
    expect(textToBlocks("Signs:\n- a\n- b")).toEqual([
      { kind: "p", text: "Signs:" },
      { kind: "list", items: ["a", "b"] },
    ]);
  });
  it("strips inline link markup", () => {
    expect(plain("See {link:condition:adhd:ADHD} today")).toBe("See ADHD today");
  });
});

describe("knowledge hub", () => {
  const none: LinkTargets = { condition: () => null, treatment: () => null, resource: () => null, article: () => null };
  it("builds intro, sections and the bottom line; drops anonymous bylines and placeholder links", () => {
    const x = fromKnowledgeHub(
      {
        name: "SSRIs",
        description: "What to expect",
        data: {
          author: "anonymous",
          introduction: "Intro.",
          sections: [{ heading: "How they work", content: "Para.\n\n• a\n• b" }, { title: "How they work", text: "More." }],
          conclusion: "End.",
          relatedConditionSlugs: ["nope"],
          references: [{ title: "Study", url: "https://example.com/x" }],
          editorial: { lastReviewed: "2025-11-24", medicalReviewerIds: ["john-lee-md"] },
        },
        metadata: { read_time: "7 min read" },
      },
      none
    );
    expect(x.author).toBeNull();
    expect(x.minutes).toBe(7);
    expect(x.contents.map((c) => c.id)).toEqual(["how-they-work", "how-they-work-2", "the-bottom-line"]);
    expect(x.related.conditions).toEqual([]);
    expect(x.references[0].url).toBeNull();
    expect(x.reviewerIds).toEqual(["john-lee-md"]);
  });
});
