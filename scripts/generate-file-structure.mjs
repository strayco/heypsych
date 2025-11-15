#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const EXCLUDE = new Set([
  "node_modules",
  ".git",
  ".next",
  ".vercel",
  ".turbo",
  "coverage",
  "dist",
  "build",
  "out",
]);
const SAMPLE_FILES = 3;

const PINNED_SAMPLES_BY_CATEGORY = {
  // conditions
  "anxiety-fear": ["generalized-anxiety-disorder.json"],
  "mood-depression": ["major-depressive-disorder.json"],
  // treatments
  medications: ["escitalopram-lexapro.json", "sertraline-Zoloft.json"],
  interventional: ["transcranial-magnetic-stimulation.json", "spravato-esketamine.json"],
  therapy: ["cognitive-behavioral-therapy.json", "emdr.json"],
  supplements: ["fish-oil.json", "magnesium.json"],
};

function isCollapsedDir(relPath) {
  const p = relPath.replace(/\\/g, "/");
  return p === "data/conditions" || p === "data/treatments";
}
function sortDirsFirst(a, b) {
  if (a.isDirectory() && !b.isDirectory()) return -1;
  if (!a.isDirectory() && b.isDirectory()) return 1;
  return a.name.localeCompare(b.name);
}
async function listDir(abs) {
  const ents = await fs.readdir(abs, { withFileTypes: true });
  return ents.filter((e) => !EXCLUDE.has(e.name)).sort(sortDirsFirst);
}
function line(prefix, isLast, name) {
  return `${prefix}${isLast ? "└── " : "├── "}${name}`;
}
function nextPrefix(prefix, isLast) {
  return prefix + (isLast ? "    " : "│   ");
}

async function renderCollapsedDir(absPath, prefix) {
  const cats = (await listDir(absPath)).filter((e) => e.isDirectory());
  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    const isLastCat = i === cats.length - 1;
    const catAbs = path.join(absPath, cat.name);
    console.log(line(prefix, isLastCat, `${cat.name}/`));
    const catPrefix = nextPrefix(prefix, isLastCat);
    const ents = await fs.readdir(catAbs, { withFileTypes: true });
    const files = ents
      .filter((e) => e.isFile() && e.name.endsWith(".json"))
      .map((e) => e.name)
      .sort();
    const subdirs = ents
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();

    const pinned = (PINNED_SAMPLES_BY_CATEGORY[cat.name] || []).filter((f) => files.includes(f));
    const remaining = files.filter((f) => !pinned.includes(f));
    const sample = [...pinned, ...remaining].slice(0, SAMPLE_FILES);

    for (let j = 0; j < sample.length; j++) {
      const hasMore = files.length > SAMPLE_FILES;
      const isLast = j === sample.length - 1 && !hasMore && subdirs.length === 0;
      console.log(line(catPrefix, isLast, sample[j]));
    }
    if (files.length > SAMPLE_FILES) {
      console.log(line(catPrefix, subdirs.length === 0, "<slug>.json  # …more"));
    }
    for (let k = 0; k < subdirs.length; k++) {
      console.log(line(catPrefix, k === subdirs.length - 1, `${subdirs[k]}/  # …more`));
    }
  }
}

async function printTree(absPath, prefix = "") {
  const entries = await listDir(absPath);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const isLast = i === entries.length - 1;
    const childAbs = path.join(absPath, e.name);
    const childRel = path.relative(ROOT, childAbs).replace(/\\/g, "/");
    console.log(line(prefix, isLast, e.isDirectory() ? `${e.name}/` : e.name));
    if (e.isDirectory()) {
      if (isCollapsedDir(childRel)) await renderCollapsedDir(childAbs, nextPrefix(prefix, isLast));
      else await printTree(childAbs, nextPrefix(prefix, isLast));
    }
  }
}

(async () => {
  console.log(".");
  await printTree(ROOT, "");
})();
