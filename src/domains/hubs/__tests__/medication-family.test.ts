import { describe, expect, it } from "vitest";
import { medicationFamily } from "../treatment-hub";
import { onsetSummary, plainBoxedWarning } from "@/domains/treatments/experience/model";
import { resolveConditionSlug, resolveConditionSlugs } from "@/lib/conditions/condition-aliases";
import { MERGED_TREATMENTS } from "@/lib/treatments/merged-treatments";

describe("medication families", () => {
  it("a bare 'Antidepressant' listed first does not hide the specific class", () => {
    // Lexapro's record lists "Antidepressant" before "SSRI"; it used to land in Other antidepressants.
    expect(medicationFamily(["Antidepressant", "Selective Serotonin Reuptake Inhibitor (SSRI)"])).toBe("ssri");
    expect(medicationFamily(["Antidepressant", "Serotonin-Norepinephrine Reuptake Inhibitor (SNRI)"])).toBe("snri");
    expect(medicationFamily(["Antidepressant", "Dopamine/Norepinephrine Reuptake Inhibitor", "Smoking Cessation Aid"])).toBe("antidepressant");
    expect(medicationFamily(["Antidepressant", "GABA-A Receptor Positive Modulator"])).toBe("antidepressant");
  });

  it("keeps the first specific class as primary", () => {
    expect(medicationFamily(["Tricyclic Antidepressant (TCA)", "Serotonin-Norepinephrine Reuptake Inhibitor (mixed)"])).toBe("antidepressant");
  });

  it("does not confuse look-alike classes", () => {
    expect(medicationFamily(["Nonbenzodiazepine Benzodiazepine Receptor Agonist", "Hypnotic"])).toBe("sleep");
    expect(medicationFamily(["Antidepressant", "Alpha-2 Adrenergic Antagonist (NaSSA)"])).toBe("antidepressant");
    expect(medicationFamily(["Alpha2-Adrenergic Agonist", "Antihypertensive", "Nonstimulant ADHD Agent"])).toBe("adhd");
    expect(medicationFamily(["Antiemetic", "Selective 5-HT3 Receptor Antagonist"])).toBe("other");
    expect(medicationFamily(["Benzodiazepine", "Anxiolytic"])).toBe("anxiety");
  });

  it("uses hand-checked families where classes mislead or are missing", () => {
    expect(medicationFamily(["Central Nervous System Stimulant", "Wakefulness-Promoting Agent"], "modafinil-provigil")).toBe("sleep");
    expect(medicationFamily(["N-Methyl-D-Aspartate (NMDA) Receptor Antagonist"], "memantine-namenda")).toBe("dementia");
    expect(medicationFamily([], "zotepine")).toBe("antipsychotic");
  });
});

describe("treatment page wording", () => {
  it("'Starts working' says when people feel better, not pharmacokinetics", () => {
    expect(
      onsetSummary("Biologic steady state reached in about 1 week; clinical mood and anxiety benefits typically emerge over 2–6 weeks.")
    ).toBe("Clinical mood and anxiety benefits typically emerge over 2–6 weeks");
    expect(onsetSummary("Not applicable for this medication.")).toBeNull();
    expect(onsetSummary("20–40 minutes to peak plasma levels")).toBeNull();
  });

  it("boxed warnings read plainly", () => {
    expect(
      plainBoxedWarning("Closely monitor all antidepressant-treated patients, especially children, adolescents, and young adults, for clinical worsening and suicidal thoughts.")
    ).toMatch(/^In people under 25, it can raise suicidal thoughts/);
    expect(plainBoxedWarning("Concomitant use of benzodiazepines and opioids may result in profound sedation, respiratory depression, coma, and death.")).toMatch(/opioids, alcohol or other sedatives/);
    expect(plainBoxedWarning("Elderly patients with dementia-related psychosis treated with antipsychotic drugs are at an increased risk of death.")).toMatch(/older adults with dementia-related psychosis/);
    expect(plainBoxedWarning("Methadone exposes patients to the risks of opioid addiction, abuse, and misuse. Use with benzodiazepines…", "Methadone")).toMatch(/^Carries opioid risks/);
  });
});

describe("condition aliases", () => {
  it("maps record slugs to the condition pages they mean", () => {
    expect(resolveConditionSlug("insomnia")).toBe("insomnia-disorder");
    expect(resolveConditionSlug("post-traumatic-stress-disorder-ptsd")).toBe("posttraumatic-stress-disorder");
    expect(resolveConditionSlug("generalized-anxiety-disorder-adjunctive")).toBe("generalized-anxiety-disorder");
    expect(resolveConditionSlugs("bipolar-disorder")).toEqual(["bipolar-i-disorder", "bipolar-ii-disorder"]);
    expect(resolveConditionSlug("major-depressive-disorder")).toBe("major-depressive-disorder");
    expect(resolveConditionSlug("anxiety-disorders")).toBeNull();
  });
});

describe("merged treatments", () => {
  it("never redirect a page to itself or to another merged page", () => {
    for (const [from, to] of Object.entries(MERGED_TREATMENTS)) {
      expect(to).not.toBe(from);
      expect(MERGED_TREATMENTS[to]).toBeUndefined();
    }
  });
});
