/**
 * Claim language guard.
 *
 * Catalog data is largely vendor-reported, and most records have never been
 * independently reviewed. Interfaces may describe what a vendor states; they
 * may not assert that HeyPsych has verified it, or that a product delivers a
 * regulatory outcome.
 *
 * This scans the shipped source for phrasings that overstate what the data
 * supports. It is a lint for honesty rather than a behavioural test, so it
 * reads files instead of rendering components, which keeps it cheap and makes
 * it cover pages that have no test of their own.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = ["src/app", "src/components", "src/domains", "src/lib/seo", "src/lib/tools"];
const EXTENSIONS = new Set([".ts", ".tsx"]);

/**
 * Phrases that assert verification or compliance we cannot stand behind.
 *
 * Each entry explains the preferred alternative, so a failure tells the author
 * what to write instead rather than just what not to write.
 */
const PROHIBITED: Array<{ pattern: RegExp; use: string }> = [
  {
    pattern: /verified HIPAA complian/i,
    use: "\"vendors state HIPAA support\" — we have not audited compliance",
  },
  {
    pattern: /HIPAA[- ]verified/i,
    use: "\"states HIPAA support\" — HIPAA compliance is not something we certify",
  },
  {
    pattern: /\bEPCS verified\b|\bverified EPCS\b|\bEPCS compliance verified\b/i,
    use: "\"EPCS support requires verification\"",
  },
  {
    pattern: /E-Prescribing with EPCS/i,
    use: "\"E-Prescribing\" — EPCS is a separate, unverified claim",
  },
  {
    pattern: /\bfully compliant\b/i,
    use: "a specific, checkable statement about what the vendor provides",
  },
  {
    pattern: /approved for controlled substances/i,
    use: "\"vendor advertises EPCS support\" — approval is not ours to grant",
  },
  {
    pattern: /guaranteed (?:fit|prescribing|compliance|eligibility)/i,
    use: "language that admits uncertainty, such as \"requires verification\"",
  },
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      out.push(...sourceFiles(path));
    } else if (EXTENSIONS.has(extname(entry)) && !entry.includes(".test.")) {
      out.push(path);
    }
  }
  return out;
}

describe("user-facing copy does not overstate verification", () => {
  const files = ROOTS.flatMap((root) => sourceFiles(root));

  it("scans a meaningful number of files", () => {
    // Guards against the walker silently matching nothing and the suite
    // passing for the wrong reason.
    expect(files.length).toBeGreaterThan(100);
  });

  for (const { pattern, use } of PROHIBITED) {
    it(`never says ${pattern.source}`, () => {
      const offenders: string[] = [];

      for (const file of files) {
        const contents = readFileSync(file, "utf8");
        contents.split("\n").forEach((line, index) => {
          // Comments may name a prohibited phrase to explain why it is
          // avoided; only shipped strings matter here. This includes
          // continuation lines of a block comment, which start with "*".
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
            return;
          }
          const code = line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
          if (pattern.test(code)) {
            offenders.push(`${file}:${index + 1}: ${line.trim()}`);
          }
        });
      }

      expect(
        offenders,
        `Prohibited claim language found. Prefer ${use}.\n${offenders.join("\n")}`
      ).toEqual([]);
    });
  }
});
