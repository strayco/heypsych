import { describe, expect, it } from "vitest";
import { isLivePath, pruneDeadLinkTokens, pruneDeadLinks } from "../live-paths";

describe("live paths", () => {
  it("knows which pages exist", () => {
    expect(isLivePath("condition", "major-depressive-disorder")).toBe(true);
    expect(isLivePath("condition", "tic-disorders")).toBe(false);
    expect(isLivePath("treatment", "sertraline-zoloft")).toBe(true);
    expect(isLivePath("treatment", "methylphenidate-concerta")).toBe(false);
    expect(isLivePath("provider", "anything")).toBe(true);
  });

  it("unlinks dead tokens and keeps live ones", () => {
    const text =
      "For {link:condition:major-depressive-disorder:depression} and {link:condition:insomnia-made-up:Insomnia (off-label)}.";
    expect(pruneDeadLinkTokens(text)).toBe(
      "For {link:condition:major-depressive-disorder:depression} and Insomnia (off-label)."
    );
    expect(pruneDeadLinkTokens("{link:condition:not-a-page}")).toBe("Not A Page");
  });

  it("walks records and clears dead medication slugs", () => {
    const record = {
      text: "{link:treatment:nope-nope:Nope}",
      linkedMedications: [
        { slug: "sertraline-zoloft", name: "Sertraline", context: "first-line" },
        { slug: "methylphenidate-concerta", name: "Concerta", context: "first-line" },
      ],
    };
    const out = pruneDeadLinks(record);
    expect(out.text).toBe("Nope");
    expect(out.linkedMedications.map((m) => m.slug)).toEqual(["sertraline-zoloft", ""]);
    expect(record.linkedMedications[1].slug).toBe("methylphenidate-concerta");
  });
});
