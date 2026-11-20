import fs from "fs";
import { describe, expect, it } from "vitest";
import { buildClinicianRedirects } from "../clinician-redirects";

describe("retired Iris Telehealth alternatives page", () => {
  const redirects = buildClinicianRedirects(process.cwd());
  const match = redirects.filter((r) => r.source === "/tools/alternatives/iris-telehealth");

  it("301s once, to the vendor's live page", () => {
    expect(match).toEqual([{ source: "/tools/alternatives/iris-telehealth", destination: "/tools/iris-telehealth#compare", permanent: true }]);
  });

  it("points at a live record and does not chain", () => {
    const rec = JSON.parse(fs.readFileSync("data/resources/tools/iris-telehealth.json", "utf8"));
    expect(rec.slug).toBe("iris-telehealth");
    expect(rec.status).toBe("active");
    expect(redirects.some((r) => r.source === "/tools/iris-telehealth")).toBe(false);
  });
});
