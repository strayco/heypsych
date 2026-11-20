"use client";

/**
 * HeyPsych Admin — Consensus Score (pilot).
 *
 * Manage private evidence and original summaries for the five pilot
 * products; see the private calculation; approve, publish, unpublish and roll
 * back. Every rule is enforced by the API; this screen only presents it.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConsensusScore } from "@/components/tools/clinician/consensus/ConsensusScore";
import { CONSENSUS_EXPLANATION, type PublicConsensus } from "@/domains/consensus/public";
import { SOURCE_LABELS, SOURCE_TYPES, type ConsensusRecord, type Observation } from "@/domains/consensus/schema";

type Calc = {
  status: "scored" | "withheld";
  score: number | null;
  confidence: string | null;
  rawMean: number | null;
  effectiveReviews: number;
  independentGroups: number;
  spread: number | null;
  sourceNames: string[];
  rationale: string[];
  asOf: string;
  contributions: { observationId: string; source: string; group: string; normalized: number | null; effectiveReviews: number; share: number; status: string; reason?: string }[];
};
type Side = { revision: { id: number; status: string; note: string | null; created_at: string; published_at: string | null }; empty: boolean; record: ConsensusRecord; approvalCurrent: boolean } | null;
type Detail = {
  slug: string;
  name: string;
  algorithm: string;
  draft: Side;
  published: Side;
  publicView: PublicConsensus | null;
  calculation: Calc;
  history: { id: number; status: string; note: string | null; created_at: string; published_at: string | null; empty: boolean; score: number | null; confidence: string | null; observations: number }[];
};
type OverviewRow = { slug: string; name: string; observations: number; draft: boolean; draftApproved: boolean; published: { score: number; confidence: string; updatedAt: string } | null };

const input = "w-full rounded-lg border border-separator bg-white px-3 py-2 text-sm text-label-primary focus:border-accent focus:outline-none";
const btn = "rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40";
const primary = `${btn} bg-label-primary text-white hover:bg-accent`;
const secondary = `${btn} border border-separator bg-white text-label-primary hover:bg-fill-quaternary`;
const label = "block text-xs font-medium text-label-secondary mb-1";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function blankObservation(n: number): Observation {
  return {
    id: `obs-${n}`,
    source: "capterra",
    url: "https://",
    listingName: "",
    match: "exact",
    scope: "full-product",
    rating: 0,
    ratingScale: 5,
    reviewCount: 0,
    observedAt: todayIso(),
    acquisition: "manual-public-page",
    permission: "public-display-permitted",
    themes: { positive: [], negative: [] },
    excluded: false,
  };
}

async function api(body: Record<string, unknown>) {
  const res = await fetch("/api/hp-ctrl-8k3m9x/consensus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function ConsensusAdmin() {
  const [overview, setOverview] = useState<OverviewRow[] | null>(null);
  const [slug, setSlug] = useState<string>("simplepractice");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [record, setRecord] = useState<ConsensusRecord | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [importText, setImportText] = useState("");
  const [note, setNote] = useState("");

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/hp-ctrl-8k3m9x/consensus", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setOverview(data.products);
    else setMessage({ tone: "error", text: data.error || "Could not load the pilot" });
  }, []);

  const loadDetail = useCallback(async (s: string) => {
    const res = await fetch(`/api/hp-ctrl-8k3m9x/consensus?slug=${encodeURIComponent(s)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage({ tone: "error", text: data.error || "Could not load the product" });
      return;
    }
    setDetail(data);
    const base: ConsensusRecord = data.draft?.record ?? data.published?.record ?? { observations: [], editorial: { strengths: [], concerns: [] } };
    setRecord({ observations: base.observations, editorial: base.editorial });
    setDirty(false);
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);
  useEffect(() => {
    void loadDetail(slug);
  }, [slug, loadDetail]);

  async function run(action: string, extra: Record<string, unknown> = {}, ok = "Done") {
    setBusy(true);
    setMessage(null);
    try {
      await api({ action, slug, note: note || undefined, ...extra });
      setNote("");
      setMessage({ tone: "ok", text: ok });
      await Promise.all([loadDetail(slug), loadOverview()]);
    } catch (error) {
      setMessage({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function update(fn: (r: ConsensusRecord) => ConsensusRecord) {
    setRecord((r) => (r ? fn(r) : r));
    setDirty(true);
  }
  function setObs(i: number, patch: Partial<Observation>) {
    update((r) => ({ ...r, observations: r.observations.map((o, j) => (j === i ? { ...o, ...patch } : o)) }));
  }
  function setSummary(kind: "strengths" | "concerns", i: number, text: string) {
    update((r) => {
      const list = [...r.editorial[kind]];
      list[i] = text;
      return { ...r, editorial: { ...r.editorial, [kind]: list.filter((x, j) => x.trim() || j === i) } };
    });
  }
  function importObservations() {
    try {
      const parsed = JSON.parse(importText);
      const list: Observation[] = Array.isArray(parsed) ? parsed : parsed.observations;
      if (!Array.isArray(list)) throw new Error("Paste an array of observations or { observations: [...] }");
      update((r) => ({ ...r, observations: [...r.observations, ...list] }));
      setImportText("");
      setMessage({ tone: "ok", text: `Added ${list.length} observation(s). Save the draft to validate them.` });
    } catch (error) {
      setMessage({ tone: "error", text: (error as Error).message });
    }
  }

  const themes = useMemo(() => {
    const pos = new Map<string, number>();
    const neg = new Map<string, number>();
    for (const o of record?.observations ?? []) {
      if (o.excluded) continue;
      for (const t of o.themes?.positive ?? []) pos.set(t, (pos.get(t) ?? 0) + 1);
      for (const t of o.themes?.negative ?? []) neg.set(t, (neg.get(t) ?? 0) + 1);
    }
    const sort = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
    return { pos: sort(pos), neg: sort(neg) };
  }, [record]);

  const draft = detail?.draft;
  const draftApproval = draft?.record.approval;
  const previewConsensus: PublicConsensus | null =
    draft && draft.approvalCurrent && draftApproval
      ? {
          slug,
          score: draftApproval.result.score,
          confidence: draftApproval.result.confidence,
          updatedAt: draftApproval.result.asOf,
          strengths: draft.record.editorial.strengths,
          concerns: draft.record.editorial.concerns,
          explanation: CONSENSUS_EXPLANATION,
        }
      : null;
  const calc = detail?.calculation;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-label-primary text-2xl font-semibold">Consensus Score</h1>
        <p className="text-label-secondary mt-1 text-sm">
          Pilot of five clinician tools. Evidence, calculations and source records are private. Only an approved, published score reaches the site.
          Saving any change clears approval.
        </p>
      </header>

      {message && (
        <p role="status" className={`rounded-lg px-4 py-2 text-sm ${message.tone === "ok" ? "bg-positive/10 text-label-primary" : "bg-negative-tint text-negative-700"}`}>
          {message.text}
        </p>
      )}

      <section aria-label="Pilot products" className="grid gap-2 sm:grid-cols-5">
        {(overview ?? []).map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setSlug(p.slug)}
            aria-pressed={slug === p.slug}
            className={`rounded-xl border p-3 text-left text-sm ${slug === p.slug ? "border-accent bg-white" : "border-separator bg-white/60 hover:bg-white"}`}
          >
            <span className="text-label-primary block font-medium">{p.name}</span>
            <span className="text-label-tertiary block text-xs">
              {p.published ? `Live: ${p.published.score}/100 · ${p.published.confidence}` : "Not published"}
            </span>
            <span className="text-label-tertiary block text-xs">
              {p.observations} observation(s){p.draft ? (p.draftApproved ? " · draft approved" : " · draft") : ""}
            </span>
          </button>
        ))}
      </section>

      {detail && record && (
        <>
          <section aria-labelledby="calc-title" className="border-separator rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="calc-title" className="text-label-primary text-lg font-semibold">
                Calculation (private) — {detail.name}
              </h2>
              <span className="text-label-tertiary text-xs">
                {detail.algorithm} · as of {calc?.asOf} · {draft ? "saved draft" : detail.published ? "published record" : "no record"}
                {dirty ? " · unsaved edits not included" : ""}
              </span>
            </div>
            {calc && (
              <>
                <p className="text-label-primary mt-3 text-sm">
                  {calc.status === "scored" ? (
                    <>
                      <strong className="text-2xl tabular-nums">{calc.score}</strong>/100 · {calc.confidence} confidence · raw mean {calc.rawMean} · {calc.effectiveReviews} weighted reviews ·{" "}
                      {calc.independentGroups} independent sources{calc.spread !== null ? ` · spread ${calc.spread}` : ""}
                    </>
                  ) : (
                    <strong>Withheld</strong>
                  )}
                </p>
                <ul className="text-label-secondary mt-2 list-disc pl-5 text-sm">
                  {calc.rationale.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                {calc.contributions.length > 0 && (
                  <table className="mt-3 w-full text-left text-xs">
                    <thead className="text-label-tertiary">
                      <tr>
                        <th className="py-1">Observation</th>
                        <th>Source</th>
                        <th>Pool</th>
                        <th>0-100</th>
                        <th>Weighted reviews</th>
                        <th>Share</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calc.contributions.map((c) => (
                        <tr key={c.observationId} className="border-separator border-t">
                          <td className="py-1">{c.observationId}</td>
                          <td>{SOURCE_LABELS[c.source as keyof typeof SOURCE_LABELS] ?? c.source}</td>
                          <td>{c.group}</td>
                          <td>{c.normalized ?? "—"}</td>
                          <td>{c.effectiveReviews}</td>
                          <td>{Math.round(c.share * 100)}%</td>
                          <td>{c.status === "used" ? "Used" : `${c.status === "excluded" ? "Excluded" : "Duplicate"}: ${c.reason}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </section>

          <section aria-labelledby="evidence-title" className="border-separator rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 id="evidence-title" className="text-label-primary text-lg font-semibold">
                Evidence ({record.observations.length})
              </h2>
              <button type="button" className={secondary} onClick={() => update((r) => ({ ...r, observations: [...r.observations, blankObservation(r.observations.length + 1)] }))}>
                Add observation
              </button>
            </div>
            <p className="text-label-tertiary mt-1 text-xs">
              Record what a source publicly shows: overall rating, review count, the date you looked, and short reviewer-reported themes in your own words. Never paste review text.
            </p>
            <div className="mt-4 space-y-4">
              {record.observations.map((o, i) => (
                <fieldset key={i} className={`border-separator rounded-lg border p-4 ${o.excluded ? "opacity-60" : ""}`}>
                  <legend className="text-label-primary px-1 text-sm font-medium">
                    {o.id} · {o.source === "other" ? o.sourceName || "Other" : SOURCE_LABELS[o.source]}
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <label className="block">
                      <span className={label}>Id</span>
                      <input className={input} value={o.id} onChange={(e) => setObs(i, { id: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className={label}>Source</span>
                      <select className={input} value={o.source} onChange={(e) => setObs(i, { source: e.target.value as Observation["source"] })}>
                        {SOURCE_TYPES.map((s) => (
                          <option key={s} value={s}>
                            {SOURCE_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {o.source === "other" && (
                      <label className="block">
                        <span className={label}>Source name</span>
                        <input className={input} value={o.sourceName ?? ""} onChange={(e) => setObs(i, { sourceName: e.target.value })} />
                      </label>
                    )}
                    <label className="block sm:col-span-2">
                      <span className={label}>Private source URL</span>
                      <input className={input} value={o.url} onChange={(e) => setObs(i, { url: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className={label}>Name as listed</span>
                      <input className={input} value={o.listingName} onChange={(e) => setObs(i, { listingName: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className={label}>Product match</span>
                      <select className={input} value={o.match} onChange={(e) => setObs(i, { match: e.target.value as Observation["match"] })}>
                        <option value="exact">Exact</option>
                        <option value="probable">Probable</option>
                        <option value="mismatch">Mismatch (ignored)</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={label}>Reviews are about</span>
                      <select className={input} value={o.scope} onChange={(e) => setObs(i, { scope: e.target.value as Observation["scope"] })}>
                        <option value="full-product">The full product</option>
                        <option value="companion-app">A companion mobile app</option>
                        <option value="different-product">A different product (ignored)</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={label}>Rating</span>
                      <input className={input} type="number" step="0.1" min={0} max={10} value={o.rating} onChange={(e) => setObs(i, { rating: Number(e.target.value) })} />
                    </label>
                    <label className="block">
                      <span className={label}>Scale</span>
                      <select className={input} value={o.ratingScale} onChange={(e) => setObs(i, { ratingScale: Number(e.target.value) as 5 | 10 })}>
                        <option value={5}>out of 5</option>
                        <option value={10}>out of 10</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={label}>Review count</span>
                      <input className={input} type="number" min={0} value={o.reviewCount} onChange={(e) => setObs(i, { reviewCount: Math.max(0, Math.round(Number(e.target.value))) })} />
                    </label>
                    <label className="block">
                      <span className={label}>Observed on</span>
                      <input className={input} type="date" value={o.observedAt} onChange={(e) => setObs(i, { observedAt: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className={label}>How acquired</span>
                      <select className={input} value={o.acquisition} onChange={(e) => setObs(i, { acquisition: e.target.value as Observation["acquisition"] })}>
                        <option value="manual-public-page">Read manually from a public page</option>
                        <option value="licensed-feed">Licensed feed</option>
                        <option value="provided-by-source">Provided by the source</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={label}>Permission</span>
                      <select className={input} value={o.permission} onChange={(e) => setObs(i, { permission: e.target.value as Observation["permission"] })}>
                        <option value="public-display-permitted">Public; use permitted</option>
                        <option value="licensed">Licensed</option>
                        <option value="unclear">Unclear</option>
                        <option value="prohibited">Prohibited (ignored)</option>
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={label}>Positive themes (user-reported, comma-separated)</span>
                      <input
                        className={input}
                        value={(o.themes?.positive ?? []).join(", ")}
                        onChange={(e) => setObs(i, { themes: { ...o.themes, positive: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) } })}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={label}>Negative themes (user-reported, comma-separated)</span>
                      <input
                        className={input}
                        value={(o.themes?.negative ?? []).join(", ")}
                        onChange={(e) => setObs(i, { themes: { ...o.themes, negative: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) } })}
                      />
                    </label>
                    <label className="block sm:col-span-3">
                      <span className={label}>Provenance note</span>
                      <input className={input} value={o.note ?? ""} onChange={(e) => setObs(i, { note: e.target.value || undefined })} />
                    </label>
                    <div className="flex items-end gap-3">
                      <label className="text-label-secondary flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={o.excluded} onChange={(e) => setObs(i, { excluded: e.target.checked })} /> Exclude
                      </label>
                      <button type="button" className={secondary} onClick={() => update((r) => ({ ...r, observations: r.observations.filter((_, j) => j !== i) }))}>
                        Remove
                      </button>
                    </div>
                  </div>
                </fieldset>
              ))}
            </div>
            <details className="mt-4">
              <summary className="text-label-secondary cursor-pointer text-sm">Import observations (JSON)</summary>
              <textarea className={`${input} mt-2 h-32 font-mono text-xs`} value={importText} onChange={(e) => setImportText(e.target.value)} aria-label="Observations JSON" />
              <button type="button" className={`${secondary} mt-2`} onClick={importObservations} disabled={!importText.trim()}>
                Add to draft
              </button>
            </details>
          </section>

          <section aria-labelledby="editorial-title" className="border-separator rounded-xl border bg-white p-5">
            <h2 id="editorial-title" className="text-label-primary text-lg font-semibold">
              Strengths and concerns (public, original wording)
            </h2>
            <p className="text-label-tertiary mt-1 text-xs">Up to three each, 10-160 characters. Summarise patterns across sources; attribute experiences to reviewers. AI may help draft; an editor must verify every line against the evidence.</p>
            {(themes.pos.length > 0 || themes.neg.length > 0) && (
              <p className="text-label-secondary mt-3 text-xs">
                Reviewer themes in the evidence — positive: {themes.pos.map(([t, c]) => `${t} (${c})`).join(", ") || "none"}; negative:{" "}
                {themes.neg.map(([t, c]) => `${t} (${c})`).join(", ") || "none"}
              </p>
            )}
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {(["strengths", "concerns"] as const).map((kind) => (
                <div key={kind} className="space-y-2">
                  <p className="text-label-primary text-sm font-medium">{kind === "strengths" ? "Strengths" : "Concerns"}</p>
                  {[0, 1, 2].map((i) => (
                    <input
                      key={i}
                      className={input}
                      maxLength={160}
                      aria-label={`${kind === "strengths" ? "Strength" : "Concern"} ${i + 1}`}
                      value={record.editorial[kind][i] ?? ""}
                      onChange={(e) => setSummary(kind, i, e.target.value)}
                      disabled={i > record.editorial[kind].length}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="actions-title" className="border-separator rounded-xl border bg-white p-5">
            <h2 id="actions-title" className="text-label-primary text-lg font-semibold">
              Review and publish
            </h2>
            <label className="mt-3 block">
              <span className={label}>Note for history (optional)</span>
              <input className={input} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={primary}
                disabled={busy || !dirty}
                onClick={() =>
                  run(
                    "save-draft",
                    { record: { observations: record.observations, editorial: { strengths: record.editorial.strengths.filter((s) => s.trim()), concerns: record.editorial.concerns.filter((s) => s.trim()) } } },
                    "Draft saved and recalculated"
                  )
                }
              >
                Save draft &amp; recalculate
              </button>
              <button type="button" className={secondary} disabled={busy || dirty || !draft || draft.approvalCurrent} onClick={() => run("approve", {}, "Approved")}>
                Approve
              </button>
              <button type="button" className={secondary} disabled={busy || dirty || !draft?.approvalCurrent} onClick={() => run("publish", {}, "Published")}>
                Publish
              </button>
              <button type="button" className={secondary} disabled={busy || !detail.publicView} onClick={() => run("unpublish", {}, "Unpublished")}>
                Unpublish
              </button>
              <button type="button" className={secondary} disabled={busy || !draft} onClick={() => run("discard", {}, "Draft discarded")}>
                Discard draft
              </button>
              <button type="button" className={secondary} disabled={busy} onClick={() => loadDetail(slug)}>
                Reload
              </button>
            </div>
            <p className="text-label-tertiary mt-2 text-xs">
              {dirty
                ? "Unsaved changes."
                : !draft
                  ? "No draft."
                  : draft.approvalCurrent
                    ? `Draft approved ${new Date(draft.record.approval!.approvedAt).toLocaleString()} — ready to publish.`
                    : "Draft not approved."}
            </p>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-label-secondary mb-2 text-xs font-medium">Approved draft, as it would appear</p>
                {previewConsensus ? <ConsensusScore consensus={previewConsensus} name={detail.name} /> : <p className="text-label-tertiary text-sm">Approve the draft to preview it.</p>}
              </div>
              <div>
                <p className="text-label-secondary mb-2 text-xs font-medium">Live on the site</p>
                {detail.publicView ? <ConsensusScore consensus={detail.publicView} name={detail.name} /> : <p className="text-label-tertiary text-sm">Nothing published. The site shows no score.</p>}
              </div>
            </div>
          </section>

          <section aria-labelledby="history-title" className="border-separator rounded-xl border bg-white p-5">
            <h2 id="history-title" className="text-label-primary text-lg font-semibold">
              History
            </h2>
            {detail.history.length === 0 ? (
              <p className="text-label-tertiary mt-2 text-sm">No published revisions yet.</p>
            ) : (
              <table className="mt-3 w-full text-left text-sm">
                <thead className="text-label-tertiary text-xs">
                  <tr>
                    <th className="py-1">#</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Observations</th>
                    <th>Note</th>
                    <th>When</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {detail.history.map((h) => (
                    <tr key={h.id} className="border-separator border-t">
                      <td className="py-1">{h.id}</td>
                      <td>{h.status}</td>
                      <td>{h.empty ? "Unpublished" : h.score !== null ? `${h.score} · ${h.confidence}` : "—"}</td>
                      <td>{h.empty ? "—" : h.observations}</td>
                      <td className="max-w-[16rem] truncate">{h.note}</td>
                      <td>{new Date(h.published_at ?? h.created_at).toLocaleString()}</td>
                      <td>
                        {h.status === "superseded" && (
                          <button type="button" className={secondary} disabled={busy} onClick={() => run("rollback", { revisionId: h.id }, `Restored revision ${h.id}`)}>
                            Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
