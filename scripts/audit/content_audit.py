#!/usr/bin/env python3
"""
Patient-facing content audit.

Scans every content record (conditions, treatments, learn, resources) for the
problems a patient would notice: placeholder text, prescriber jargon with no
plain-language explanation, FDA-label voice ("patients", "clinical
worsening"), citation debris, truncated strings and broken templates.

Usage:
  python3 scripts/audit/content_audit.py            # summary
  python3 scripts/audit/content_audit.py --json out.json
  python3 scripts/audit/content_audit.py --files a.json b.json   # just these

Rules are in RULES below; each one is (id, severity, regex, note). The audit
reads the whole record but skips fields that are not shown to people
(seo, editorial, sources, ids, slugs, urls).

Standard: docs/active/CONTENT_STANDARD.md
"""

import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DIRS = [
    "data/conditions",
    "data/treatments",
    "data/learn",
    "data/resources/assessments-screeners",
    "data/resources/support-community",
    "data/editorial",
]

SKIP_KEYS = {
    "seo", "editorial", "sources", "references", "citations", "citation", "url", "urls",
    "slug", "id", "ids", "wikidata_qid", "canonical", "doi", "pmid", "condition_slug",
    "medicalReviewerIds", "schema_version", "kind", "type", "modality", "category",
    "search_metadata", "metadata", "ui", "status", "image", "icon", "href", "links",
    "legacy_preservation", "drug_classes", "aliases", "brand_names",
}

# A jargon word is fine when it is explained right after it, e.g.
# "akathisia (an inner restlessness)" or "hyponatremia — low blood sodium".
EXPLAINED = r"\s*(\(|—|–|-\s|, (which|meaning|or|a |an ))"

JARGON = [
    "titrat(e|ed|ion|ing)", "hyponatr(a)?emia", "SIADH", "torsade(s)? de pointes", "QTc", "CYP\\w*",
    "pharmacokinetic\\w*", "steady[- ]state", "contraindicat\\w+", "concomitant(ly)?",
    "adverse (events?|effects?|reactions?)", "somnolence", "akathisia", "extrapyramidal",
    "orthostatic", "hepatotoxicity", "nephrotoxicity", "teratogen\\w*", "prophyla\\w+",
    "monotherapy", "adjunct(ive)?", "augmentation", "efficacy", "comorbid\\w*", "etiolog\\w+",
    "sequelae", "idiopathic", "anhedonia", "psychomotor", "neurovegetative", "dysphoria",
    "anxiolytic\\w*", "hypnotic", "sedative-hypnotic", "anticholinergic", "serotonergic",
    "dopaminergic", "noradrenergic", "agranulocytosis", "neutropenia", "leukopenia",
    "thrombocytopenia", "rhabdomyolysis", "hyperprolactin\\w+", "galactorrhea", "gynecomastia",
    "priapism", "bradycardia", "tachycardia", "hypotension", "hypertensive crisis",
    "neuroleptic malignant", "tardive dyskinesia", "dyskinesia", "dystonia", "ataxia",
    "nystagmus", "diplopia", "paresthesia", "pruritus", "urticaria", "emesis", "dyspepsia",
    "xerostomia", "diaphoresis", "enuresis", "nocturia", "polyuria", "polydipsia",
    "obtundation", "encephalopathy", "hepatic impairment", "renal impairment", "AUC",
    "Cmax", "Tmax", "bioavailability", "half-life", "plasma level\\w*", "receptor (agonist|antagonist)",
    "partial agonist", "reuptake inhibit\\w+", "prevalence", "incidence", "remission rates?",
    "response rates?", "placebo-controlled", "meta-analys[ie]s", "RCTs?", "NNT", "number needed to treat",
    "first-line", "second-line", "third-line", "evidence-based", "psychoeducation", "sequela",
    "differential diagnosis", "DSM-5(-TR)? criteria", "specifiers?", "ICD-10", "neurocognitive",
    "psychotic features", "catatonic features", "mixed features", "with peripartum onset",
]

RULES = [
    ("placeholder", "error",
     r"\b(not applicable for this|not established in provided notes|provided notes|needs verification|"
     r"to be (confirmed|determined)|TBD|TODO|lorem ipsum|placeholder|insert (here|text)|\[citation needed\]|N/?A\.?$)",
     "Placeholder or unfinished text shown to people."),
    ("citation-debris", "error", r"\]\[\d+\]|\(\[[^\]]+\]\[\d+\]\)|\[\d+(,\s*\d+)*\](?!\()|\bturn\d+(search|view)\d+",
     "Leftover citation markers from a research tool."),
    ("template", "error",
     r"is a (online|digital|telehealth)[^.]*(designed to support|platform for)|offers comprehensive mental health support|"
     r"with easy-to-use features|Pricing information needs verification|Free, or Free|\{\{|\}\}|(?-i:\bundefined\b|\bNaN\b|\bnull\b)",
     "Template copy or a broken template."),
    ("label-voice", "warn",
     r"\b(closely )?monitor (all )?(antidepressant-treated )?patients\b|\bpatients (should|must|may|treated|receiving|taking|with)\b|"
     r"\bclinical worsening\b|\bpediatric patients\b|\bgeriatric patients\b|\bthe patient\b|\bthe clinician should\b|"
     r"\bprescribers? should\b|\bis indicated for\b|\bwas observed\b",
     "Written for prescribers (FDA label voice), not for the person reading."),
    ("truncated", "warn", r"(\.\.\.|…)\s*$", "String stored already cut off."),
    ("shouting", "warn", r"\b[A-Z]{4,}(?:\s+[A-Z]{3,}){3,}\b", "All-caps label text."),
    ("double-space", "info", r"\S  +\S", "Double spaces."),
]

JARGON_RE = re.compile(r"\b(" + "|".join(JARGON) + r")\b(?!" + EXPLAINED + ")", re.I)
RULES_RE = [(rid, sev, re.compile(rx, re.I if rid not in ("shouting",) else 0), note) for rid, sev, rx, note in RULES]


def walk(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in SKIP_KEYS:
                continue
            yield from walk(v, f"{path}.{k}" if path else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from walk(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        yield path, obj


def is_full_guide(path: str) -> bool:
    """The long-form guide may use clinical words; the summary tiles may not."""
    return path.startswith("sections") or path.startswith("content.sections") or ".modality_details" in path


def audit_file(path):
    try:
        data = json.load(open(path, encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        return [{"rule": "invalid-json", "severity": "error", "path": "", "text": str(e)}]
    if not isinstance(data, dict):
        return []
    if data.get("draft") is True or data.get("noIndex") is True:
        return []
    issues = []
    for field, text in walk(data):
        if not text.strip():
            continue
        for rid, sev, rx, _ in RULES_RE:
            if rx.search(text):
                issues.append({"rule": rid, "severity": sev, "path": field, "text": text[:220]})
        # Jargon: only in the summary layer (everything outside the full guide).
        if not is_full_guide(field):
            m = JARGON_RE.search(text)
            if m:
                issues.append({"rule": "jargon", "severity": "warn", "path": field, "term": m.group(1), "text": text[:220]})
    return issues


def files(selected=None):
    if selected:
        return selected
    out = []
    for d in DIRS:
        for f in glob.glob(os.path.join(ROOT, d, "**", "*.json"), recursive=True):
            if ".legacy." in f or "/_" in f or "backup" in f:
                continue
            out.append(f)
    return sorted(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json")
    ap.add_argument("--files", nargs="*")
    args = ap.parse_args()
    report = {}
    for f in files(args.files):
        issues = audit_file(f)
        if issues:
            report[os.path.relpath(f, ROOT)] = issues
    counts = {}
    for issues in report.values():
        for i in issues:
            counts[(i["rule"], i["severity"])] = counts.get((i["rule"], i["severity"]), 0) + 1
    print(f"files with issues: {len(report)}")
    for (rule, sev), n in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {sev:5} {rule:16} {n}")
    if args.json:
        json.dump(report, open(args.json, "w"), indent=1)
    return 1 if any(i["severity"] == "error" for v in report.values() for i in v) else 0


if __name__ == "__main__":
    sys.exit(main())
