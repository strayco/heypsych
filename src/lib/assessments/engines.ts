// src/lib/assessments/engines.ts
export type EngineResult = {
  score: number; // primary score (usually "total")
  max: number; // max possible
  band?: string; // severity band if computed
  interpretation?: string; // human-readable summary (bands/subscores/alerts)
};

export type Engine = (resource: any, answers: Record<string, any>) => EngineResult;

/* ---------------- helpers ---------------- */

function sumAnswers(a: Record<string, any>): number {
  return Object.values(a).reduce((s, v) => {
    const n = Number(v);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function getMax(resource: {
  questions?: unknown;
  items?: unknown;
  response_options?: Array<{ value?: unknown }>;
  scoring?: { max_per_item?: unknown };
}): number {
  const qCount = Array.isArray(resource?.items)
    ? resource.items.length
    : Array.isArray(resource?.questions)
      ? resource.questions.length
      : 0;
  if (!qCount) return 0;

  const options = Array.isArray(resource?.response_options)
    ? (resource.response_options as Array<{ value?: unknown }>)
    : [];

  if (options.length) {
    const numericVals = options
      .map((o) => Number((o?.value as number | string | null | undefined) ?? 0))
      .filter((n) => Number.isFinite(n));
    const maxVal = numericVals.length ? Math.max(...numericVals) : 0;
    return qCount * maxVal;
  }

  const maxPerItem = Number(resource?.scoring?.max_per_item ?? 0);
  return qCount * (Number.isFinite(maxPerItem) ? maxPerItem : 0);
}

function resolveBandAndText(
  scoring: any,
  score: number
): { band?: string; interpretation?: string } {
  if (!scoring || typeof scoring !== "object") return {};

  // 1) Range map like { "0-4":"Minimal", ... }
  const rangeMap = scoring?.interpretation;
  if (rangeMap && typeof rangeMap === "object") {
    const entries = Object.entries(rangeMap);
    const hasRanges = entries.some(([k]) => k.includes("-"));
    if (hasRanges) {
      for (const [range, label] of entries) {
        const [lo, hi] = String(range)
          .split("-")
          .map((n) => Number(n));
        if (!Number.isNaN(lo) && !Number.isNaN(hi) && score >= lo && score <= hi) {
          const band = String(label);
          const textFromBand = typeof rangeMap[band] === "string" ? String(rangeMap[band]) : band;
          return { band, interpretation: textFromBand };
        }
      }
    }
  }

  // 2) Bands array: [{min,max,label}, ...] with optional interpretation[band]
  const bands: Array<{ min: number; max: number; label: string }> | undefined = scoring?.bands;
  if (Array.isArray(bands) && bands.length) {
    for (const b of bands) {
      const lo = Number(b?.min);
      const hi = Number(b?.max);
      if (!Number.isNaN(lo) && !Number.isNaN(hi) && score >= lo && score <= hi) {
        const band = String(b?.label ?? "");
        const text = (scoring?.interpretation && scoring.interpretation[band]) || band;
        return { band, interpretation: String(text) };
      }
    }
  }

  return {};
}

function getRules(resource: any) {
  return (resource?.scoring?.rules ?? {}) as any;
}

function getNumericMapping(resource: any): Record<string, number> {
  const nm = getRules(resource).numeric_mapping;
  if (nm && typeof nm === "object") return nm;

  const map: Record<string, number> = {};

  // Handle new response_options format (object with sets)
  const responseOptions = resource?.response_options;
  if (responseOptions && typeof responseOptions === "object" && !Array.isArray(responseOptions)) {
    // Take the first response set as default
    const firstSet = Object.values(responseOptions)[0];
    if (Array.isArray(firstSet)) {
      for (const opt of firstSet) {
        if (opt?.label != null && opt?.value != null) map[String(opt.label)] = Number(opt.value);
      }
    }
  } else if (Array.isArray(responseOptions)) {
    // Handle legacy format (array)
    for (const opt of responseOptions) {
      if (opt?.label != null && opt?.value != null) map[String(opt.label)] = Number(opt.value);
    }
  }

  return Object.keys(map).length
    ? map
    : { "Not at all": 0, "Several days": 1, "More than half the days": 2, "Nearly every day": 3 };
}

function reverseNumericLabelMap(resource: any): Record<number, string> {
  const nm = getNumericMapping(resource);
  const rev: Record<number, string> = {};
  for (const [label, val] of Object.entries(nm)) rev[Number(val)] = label;
  return rev;
}

function getMaxPerItem(resource: any): number {
  const responseOptions = resource?.response_options ?? [];

  if (Array.isArray(responseOptions)) {
    const vals = responseOptions
      .map((o: any) => Number(o?.value ?? 0))
      .filter((n: number) => Number.isFinite(n));
    if (vals.length) return Math.max(...vals);
  } else if (typeof responseOptions === "object") {
    // Handle new format - take max from first response set
    const firstSet = Object.values(responseOptions)[0];
    if (Array.isArray(firstSet)) {
      const vals = firstSet
        .map((o: any) => Number(o?.value ?? 0))
        .filter((n: number) => Number.isFinite(n));
      if (vals.length) return Math.max(...vals);
    }
  }

  const fallback = Number(resource?.scoring?.max_per_item ?? 0);
  return Number.isFinite(fallback) ? fallback : 0;
}

function getAllScoredItems(resource: any): string[] {
  const notScored = new Set<string>(getRules(resource).not_scored_items ?? []);
  const list: string[] = [];

  // Handle both items and questions arrays
  const questions = resource?.items || resource?.questions || [];
  for (const q of questions) {
    const key = q?.id || `q${q?.number}`;
    if (key && !notScored.has(key)) list.push(key);
  }

  return list;
}

function sumItems(resource: any, answers: Record<string, any>, itemKeys: string[]): number {
  const rules = getRules(resource);
  const reverse: Set<string> = new Set(rules.reverse_scored ?? []);
  const weights: Record<string, number> = rules.item_weights ?? {};
  const maxPer = getMaxPerItem(resource);

  return itemKeys.reduce((sum, key) => {
    const raw = Number(answers[key] ?? NaN);
    if (!Number.isFinite(raw)) return sum;
    let num = raw;
    if (reverse.has(key)) num = maxPer - num;
    const w = Number.isFinite(weights[key]) ? weights[key] : 1;
    return sum + num * w;
  }, 0);
}

function getItems(resource: any, key?: "all_scored" | string): string[] {
  if (!key || key === "all_scored") return getAllScoredItems(resource);
  const rules = getRules(resource);
  const items = rules[key] ?? [];

  // Convert numbers to question IDs if needed
  return items.map((x: any) => {
    if (typeof x === "number") return `q${x}`;
    return String(x);
  });
}

/* ---------------- generic rule-driven engine ---------------- */

export const engines: Record<string, Engine> = {
  sum: (r, a) => genericEngine(r, a),
  sum_with_bands: (r, a) => genericEngine(r, a),
  phq9: (r, a) => genericEngine(r, a),
  gad7: (r, a) => genericEngine(r, a),
  vanderbilt: (r, a) => genericEngine(r, a),
  asrs_custom: (r, a) => require("./engines/asrs-custom").compute(r, a),
  assist_who_v3: (r, a) => require("./engines/assist-who-v3").compute(r, a),
};

function genericEngine(resource: any, answers: Record<string, any>): EngineResult {
  const rulesAll = getRules(resource);
  const perItem = answers; // your UI supplies string keys
  const ctx: Record<string, any> = { alerts: [] };

  // Default total for convenience (in case JSON doesn't define sum_total)
  const defaultTotal = sumItems(resource, answers, getAllScoredItems(resource));
  ctx.total = defaultTotal;

  const handlers: Record<string, (rule: any) => void> = {
    /** Sum items (Likert totals); result_key defaults to "total" */
    sum_total: (rule) => {
      const items = getItems(resource, rule.items ?? "all_scored");
      ctx[rule.result_key ?? "total"] = sumItems(resource, answers, items);
    },

    /** Map a numeric score to severity bands */
    threshold_bands: (rule) => {
      const sourceKey = rule.source ?? "total";
      const x = Number(ctx[sourceKey] ?? 0);
      const bands: Array<{ min: number; max: number; label: string }> =
        rule.bands ?? resource?.scoring?.bands ?? [];
      let label: string | undefined;
      for (const b of bands) {
        if (x >= Number(b.min) && x <= Number(b.max)) {
          label = String(b.label);
          break;
        }
      }
      ctx[rule.result_key ?? "band"] = label ?? null;
    },

    /** Fire an alert based on a single item's numeric value */
    item_alert: (rule) => {
      const itemKey = String(rule.item);
      const op: string = rule.op ?? ">=";
      const val = Number(rule.value ?? 0);
      const x = Number(perItem[itemKey] ?? NaN);
      if (!Number.isFinite(x)) return;
      const ok =
        (op === ">=" && x >= val) ||
        (op === ">" && x > val) ||
        (op === "==" && x === val) ||
        (op === "<=" && x <= val) ||
        (op === "<" && x < val);
      if (ok) ctx.alerts.push(rule.message ?? `Alert on item ${itemKey}`);
    },

    /** Compute named subscale totals, e.g., Vanderbilt/SCARED */
    domain_subscores: (rule) => {
      const domains = rulesAll[rule.domains_key] ?? {};
      const prefix = rule.result_prefix ?? "sub_";
      for (const [name, items] of Object.entries(domains)) {
        const itemKeys = (items as any[]).map((x) => (typeof x === "number" ? `q${x}` : String(x)));
        const s = sumItems(resource, answers, itemKeys);
        ctx[`${prefix}${name}`] = s;
      }
    },

    /** Boolean flag when a score meets cutoff */
    cutoff_flag: (rule) => {
      const x = Number(ctx[rule.source] ?? 0);
      const op: string = rule.op ?? ">=";
      const co = Number(rule.cutoff ?? 0);
      const ok =
        (op === ">=" && x >= co) ||
        (op === ">" && x > co) ||
        (op === "==" && x === co) ||
        (op === "<=" && x <= co) ||
        (op === "<" && x < co);
      ctx[rule.flag_key ?? `${rule.source}_flag`] = !!ok;
    },

    /**
     * A generic counter for "positives", parameterized by JSON.
     * Works for:
     *  - ASRS Part A shaded (by label)
     *  - SCOFF yes/no >= N (by numeric)
     *
     * JSON shapes:
     *  - predicate.label_in can be:
     *      • Array<string> → same label set for all items
     *      • Object{ [itemKey]: Array<string> } → per-item label set
     *  - predicate.num_equals / num_gte / num_lte → numeric predicates
     */
    count_when: (rule) => {
      const items = getItems(resource, rule.items ?? "all_scored");
      const rev = reverseNumericLabelMap(resource);

      // Normalize label_in to a function: item -> Set(labels) | null
      const labelIn = rule.predicate?.label_in;
      const getLabelSetFor = (itemKey: string): Set<string> | null => {
        if (!labelIn) return null;
        if (Array.isArray(labelIn)) return new Set(labelIn.map(String));
        const arr = (labelIn[itemKey] ?? []) as string[];
        return Array.isArray(arr) ? new Set(arr.map(String)) : null;
      };

      const numEq = rule.predicate?.num_equals as number | undefined;
      const numGte = rule.predicate?.num_gte as number | undefined;
      const numLte = rule.predicate?.num_lte as number | undefined;

      let count = 0;
      for (const itemKey of items) {
        const raw = perItem[itemKey];
        if (raw == null) continue;

        const n = Number(raw);
        const lbl = rev[n];

        let ok = false;

        // label-based match (if provided)
        const set = getLabelSetFor(itemKey);
        if (!ok && set && lbl && set.has(lbl)) ok = true;

        // numeric-based matches (optional)
        if (!ok && numEq !== undefined && Number.isFinite(n) && n === numEq) ok = true;
        if (!ok && numGte !== undefined && Number.isFinite(n) && n >= numGte) ok = true;
        if (!ok && numLte !== undefined && Number.isFinite(n) && n <= numLte) ok = true;

        if (ok) count++;
      }

      ctx[rule.count_key ?? "count"] = count;
      if (rule.cutoff != null) {
        ctx[rule.flag_key ?? "count_flag"] = count >= Number(rule.cutoff);
      }
    },
  };

  // Run the declared pipeline in order (if any)
  const pipeline = (rulesAll.types ?? []) as Array<{ type: string; [k: string]: any }>;
  for (const rule of pipeline) {
    const fn = handlers[rule.type];
    if (fn) fn(rule);
  }

  // Choose primary score: prefer ctx.total set by rules; else default sum
  const score = Number.isFinite(Number(ctx.total)) ? Number(ctx.total) : defaultTotal;
  const max = getMax(resource);

  // If band not explicitly set by rules, try the global scoring bands/ranges
  let band: string | undefined = ctx.band;
  let bandText: string | undefined;
  if (!band) {
    const via = resolveBandAndText(resource?.scoring, score);
    band = via.band;
    bandText = via.interpretation;
  }

  // Build interpretation (band text, subscores, alerts, counts)
  const parts: string[] = [];
  if (bandText) parts.push(bandText);

  for (const k of Object.keys(ctx)) {
    if (k.startsWith("sub_")) parts.push(`${k.replace(/^sub_/, "")}: ${ctx[k]}`);
  }
  if (Array.isArray(ctx.alerts) && ctx.alerts.length)
    parts.push(`Alerts: ${ctx.alerts.join("; ")}`);

  if (ctx.count != null && (ctx.count_flag != null || ctx.count_key != null)) {
    // generic count_when summary if caller didn't supply custom keys
    const label = (pipeline.find((r) => r.type === "count_when") as any)?.count_key ?? "count";
    const flag = (pipeline.find((r) => r.type === "count_when") as any)?.flag_key ?? "count_flag";
    const cutoff = (pipeline.find((r) => r.type === "count_when") as any)?.cutoff;
    const flagVal = ctx[flag];
    parts.push(
      `${label}: ${ctx[label]}` +
        (cutoff != null ? ` (≥${cutoff}: ${flagVal ? "meets cutoff" : "below cutoff"})` : "")
    );
  }

  return {
    score,
    max,
    band,
    interpretation: parts.filter(Boolean).join(" — ") || undefined,
  };
}
