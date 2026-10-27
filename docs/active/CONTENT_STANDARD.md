# Patient content standard

Status: **Active** (2026-10-27). Applies to every record a patient can reach:
`data/conditions`, `data/treatments`, `data/learn`, `data/resources`
(assessments, support-community), `data/editorial`.

Check a file with:

```
python3 scripts/audit/content_audit.py --files data/treatments/medications/x.json
```

## Who we write for

A worried, tired person reading on a phone, reading age about 12–14, who
may be reading about themselves or someone they love. Every summary-layer
sentence should make sense to them on first read.

## Two layers

1. **Summary layer** (everything outside `sections[]` and
   `modality_details`): `summary`, `description`, `patient_summary`,
   `clinical_profile.*` (indications context, safety, experience, special
   populations, interactions, monitoring), `faqs`, condition `content.*`.
   These feed the tiles, explorers and "Your situation" cards. **Plain
   language only.**
2. **Full guide** (`sections[]`): longer reading. Clinical words are allowed
   when explained the first time ("akathisia, a strong inner restlessness").

## Rules

1. **Talk to the reader.** "You", "people", "your prescriber". Never FDA-label
   voice: no "patients should", "monitor all patients", "clinical worsening",
   "is indicated for", "pediatric patients". Rewrite as what it means for the
   reader: "Tell your prescriber if your mood gets worse or you have thoughts
   of suicide, especially in the first few months."
2. **Plain words first.** Replace jargon, or keep it in brackets after the plain
   word when people will meet it elsewhere: "low blood sodium (hyponatremia)".
   Glossary below.
3. **No placeholders.** "N/A", "Not applicable for this medication.", "Not
   established in provided notes", "TBD": delete the field (or set it to `null`
   / remove the list item) when nothing true can be said. Never leave filler.
   An empty `black_box_warning` means "no boxed warning".
4. **No research debris.** Remove `[1]`, `][2]`, `([Source][3])`, `turn0search1`.
5. **Do not store cut-off text.** A `summary` ending in "..." or "…" gets
   finished as a full sentence (the UI truncates for itself).
6. **Facts do not change in a rewrite.** Keep every number, dose, warning and
   condition. Do not add claims. If a number looks wrong, leave it and log it
   (see "Numbers" below). Plain language must not soften a safety warning.
7. **Short.** Tiles: one sentence. Context lines: one or two. Lists: one idea
   per item, no trailing period debates — be consistent within a list.
8. **Kind, not alarming, not cute.** No exclamation marks, no "magic pill",
   no slang, no blame ("non-compliant" → "stops taking it").
9. **Not a diagnosis.** Conditions describe what it "can" feel like; never
   "you have".
10. **US-first, honest about approval.** Say "approved in Europe, not in the
    US" where true; never imply FDA approval that does not exist.

## Numbers

Rates shown as "N in 100" come from `common_adverse_effects[].incidence`.
They must come from the drug label or a cited study. When a rate looks
implausible (for example "40%" for a side effect the label reports at 9–14%),
do not invent a replacement: add a line to
`docs/active/audits/content-numbers-review.md` with file, field, value and
why it looks off. Verified corrections are made separately, with the source
added to `sources`.

## Glossary (summary layer)

| Instead of | Write |
| --- | --- |
| titrate / titration | raise (or lower) the dose step by step |
| adjunct / adjunctive / augmentation | added to another medicine (or "as an add-on") |
| monotherapy | on its own |
| comorbid / comorbidities | that often comes with / other conditions at the same time |
| contraindicated | should not be used (if / with) |
| concomitant | at the same time as |
| efficacy | how well it works |
| first-line / second-line | usually tried first / usually tried after other options |
| evidence-based | backed by good research |
| adverse effects | side effects |
| somnolence | sleepiness |
| orthostatic hypotension | dizziness or feeling faint when standing up (a drop in blood pressure) |
| hypotension / hypertension | low / high blood pressure |
| bradycardia / tachycardia | slow / fast heartbeat |
| QTc prolongation, torsades | a heart-rhythm change that can be dangerous (seen on an ECG) |
| hyponatremia / SIADH | low blood sodium, which can cause confusion, headache or seizures |
| serotonergic | that raises serotonin |
| serotonin syndrome | keep the name, add: "too much serotonin: agitation, fever, shaking, fast heartbeat — get urgent help" |
| anticholinergic effects | dry mouth, constipation, blurred vision, trouble peeing, confusion in older adults |
| akathisia | a strong inner restlessness, hard to sit still (akathisia) |
| extrapyramidal symptoms (EPS) | stiffness, shaking or restlessness (movement side effects) |
| tardive dyskinesia | involuntary movements, often of the face or mouth, that can last (tardive dyskinesia) |
| neuroleptic malignant syndrome | a rare emergency: very high fever, rigid muscles, confusion |
| agranulocytosis / neutropenia / leukopenia | a dangerous drop in white blood cells (infection risk) |
| hepatotoxicity / hepatic impairment | liver damage / liver problems |
| renal impairment | kidney problems |
| teratogenic | can harm a developing baby |
| CYP3A4 / CYP2D6 inhibitor | (interactions) "Some medicines change how your body breaks this down, for example …" |
| half-life | how long it stays in your body |
| anxiolytic / hypnotic | anti-anxiety / sleep medicine |
| anhedonia | losing interest or pleasure in things you used to enjoy |
| psychomotor agitation / retardation | restlessness / moving or thinking slowly |
| neurovegetative | sleep, appetite and energy changes |
| dysphoria | a low, uneasy or unhappy mood |
| psychoeducation | learning about the condition |
| prevalence | how common it is |
| meta-analysis / RCT | a review of many studies / a careful study comparing groups |
| psychotic features | losing touch with reality (hearing or believing things others don't) |
| prophylaxis | prevention |
| emesis / pruritus / urticaria / diaphoresis | vomiting / itching / hives / sweating |
| paresthesia | tingling or pins and needles |
| priapism | an erection that won't go away (an emergency) |

## Field notes

- `interactions[].interactant` stays a name ("MAOIs (e.g., phenelzine)").
  `mechanism` / `action` say what happens and what to do, in plain words.
- `monitoring_requirements[].parameter`: what gets checked and why: "Blood
  sodium, especially in older adults".
- `condition_name` in indications: the everyday name ("Depression added to
  another medicine" is wrong; use the condition, and put "as an add-on" in
  `context`).
- `taxonomy.drug_classes`: leave as is (classification data, shown small).
- `legacy_preservation.*`: internal; leave.
