import { describe, it, expect, vi } from "vitest";

// No database in unit tests: treat every name as unknown, so text passes through.
vi.mock("../utils", () => ({
  parseEntityNames: (text: string) => text.split(",").map((s) => s.trim()).filter(Boolean),
  validateEntityExists: async () => null,
}));

import { enhanceEntityContent } from "../content-enhancer";

describe("enhanceEntityContent", () => {
  it("keeps structured list items instead of turning them into [object Object]", async () => {
    const differential = [
      { condition: "Panic Disorder", distinguishing_features: "Recurrent panic attacks." },
      { condition: "Social Anxiety Disorder", distinguishing_features: "Fear of scrutiny." },
    ];
    const entity = {
      slug: "agoraphobia",
      type: "condition",
      title: "Agoraphobia",
      data: { differential_diagnosis: differential, comorbidities: ["Depression"] },
    } as any;

    const out = await enhanceEntityContent(entity);
    const json = JSON.stringify(out);

    expect(json).not.toContain("[object Object]");
    expect((out as any).data.differential_diagnosis).toEqual(differential);
    expect((out as any).data.comorbidities).toEqual(["Depression"]);
  });
});
