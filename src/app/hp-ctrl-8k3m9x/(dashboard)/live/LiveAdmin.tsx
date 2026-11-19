"use client";

/**
 * HeyPsych Admin — live updates.
 *
 * Edit clinician-software records, nonclinical flags, approved copy and
 * experiments; preview; publish; see history; roll back. Every change is
 * validated on the server against the registry and the V4 schema, and the
 * reviewed files in data/ remain the baseline ("Revert to reviewed record").
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";

type Kind = "tool" | "tool-new" | "flag" | "copy" | "experiment";

interface Revision {
  id: number;
  kind: Kind;
  key: string;
  value: unknown;
  status: "draft" | "published" | "superseded" | "discarded";
  note: string | null;
  created_at: string;
  published_at: string | null;
  restores: number | null;
}

interface ToolRow {
  slug: string;
  name: string;
  category: string;
  price: string | null;
  priceVerified: string | null;
  status: string;
  public: boolean;
  created: boolean;
  overridden: boolean;
  draft: boolean;
}

interface Overview {
  tools: ToolRow[];
  liveErrors: { key: string; error: string }[];
  drafts: Revision[];
  published: Revision[];
  recent: Revision[];
  registry: {
    flags: { key: string; label: string; description: string; default: boolean; surface: string }[];
    copy: { key: string; label: string; default: string; maxLength: number; surface: string }[];
    experiments: { key: string; label: string; variants: { id: string; value: string }[]; surface: string }[];
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type ToolRecord = Record<string, any>;

const PRICING_MODELS = ["free", "freemium", "per-provider-month", "per-provider-year", "per-patient", "per-encounter", "flat-monthly", "flat-annual", "enterprise-custom", "usage-based", "revenue-share"];
const CATEGORIES = [
  "ehr-practice-management", "billing-rcm-insurance", "telehealth-communication", "credentialing-workforce", "provider-network-virtual-care",
  "measurement-outcomes-dtx", "ai-scribe-documentation", "ai-copilot-clinical", "clinical-decision-support", "patient-engagement",
  "intake-scheduling-forms", "prescribing-erx", "compliance-consent-security", "analytics-reporting",
];
const INTEGRATION_CATEGORIES = ["ehr", "billing", "telehealth", "lab", "pharmacy", "payer", "calendar", "communication", "analytics", "other"];
const INTEGRATION_TYPES = ["native", "api", "hl7", "fhir", "zapier", "partner", "file-based"];
const EDITABLE = ["name", "company_name", "one_liner", "short_description", "long_description", "website_url", "pricing_url", "demo_url", "support_url", "pricing", "integrations", "capabilities", "primary_category", "secondary_categories", "best_for", "not_for", "positioning", "related_tools", "competitor_tools", "status"];

const input = "w-full rounded-lg border border-separator bg-white px-3 py-2 text-sm text-label-primary focus:border-accent focus:outline-none";
const btn = "rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40";
const primary = `${btn} bg-label-primary text-white hover:bg-accent`;
const secondary = `${btn} border border-separator bg-white text-label-primary hover:bg-fill-quaternary`;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function call(body: Record<string, unknown>) {
  const res = await fetch("/api/hp-ctrl-8k3m9x/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

function profileUrl(t: { slug: string; primary_category?: string; category?: string }) {
  const c = (t.primary_category ?? t.category ?? "") as keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY;
  return `/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[c] ?? c}/${t.slug}`;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-label-secondary">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-label-tertiary">{hint}</span>}
    </label>
  );
}

function Banner({ msg, onClose }: { msg: { kind: "ok" | "error"; text: string } | null; onClose: () => void }) {
  if (!msg) return null;
  return (
    <div role={msg.kind === "error" ? "alert" : "status"} className={`mb-4 flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm ${msg.kind === "error" ? "bg-negative/10 text-negative" : "bg-positive/10 text-label-primary"}`}>
      <span>{msg.text}</span>
      <button onClick={onClose} className="text-xs underline">Dismiss</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool editor
// ---------------------------------------------------------------------------

function ToolEditor({ slug, onDone, notify }: { slug: string; onDone: () => void; notify: (k: "ok" | "error", t: string) => void }) {
  const [data, setData] = useState<{ base: ToolRecord | null; effective: ToolRecord | null; kind: Kind; history: Revision[]; locked: string[] } | null>(null);
  const [form, setForm] = useState<ToolRecord | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/hp-ctrl-8k3m9x/live?view=tool&slug=${encodeURIComponent(slug)}`);
    const d = await res.json();
    if (!res.ok) return notify("error", d.error ?? "Could not load");
    setData(d);
    const draft = (d.history as Revision[]).find((r) => r.status === "draft");
    const start: ToolRecord = { ...(d.effective ?? d.base ?? {}) };
    if (draft?.value && typeof draft.value === "object") Object.assign(start, draft.value);
    setForm(start);
  }, [slug, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data || !form) return <p className="text-sm text-label-secondary">Loading…</p>;
  const base = data.base;
  const draft = data.history.find((r) => r.status === "draft");
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f!, [k]: v }));
  const setPricing = (k: string, v: unknown) => setForm((f) => ({ ...f!, pricing: { ...(f!.pricing ?? { model: "per-provider-month" }), [k]: v } }));
  const pricing = form.pricing ?? {};
  const tiers: ToolRecord[] = pricing.tiers ?? [];
  const integrations: ToolRecord[] = form.integrations ?? [];

  const overlay = () => (data.kind === "tool" ? Object.fromEntries(EDITABLE.filter((k) => k in form).map((k) => [k, form[k]])) : form);
  const changed = base ? EDITABLE.filter((k) => JSON.stringify(form[k]) !== JSON.stringify(base[k])) : ["(new tool)"];

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const r = await call({ action, kind: data.kind, key: slug, note: note || undefined, ...extra });
      notify("ok", action === "save-draft" ? "Draft saved. Preview it, then publish." : action === "publish" ? `Published (revision ${r.revision?.id}). Pages update on their next visit.` : action === "discard" ? "Draft discarded." : `Done (revision ${r.revision?.id}).`);
      await load();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const preview = async () => {
    try {
      await call({ action: "preview-on" });
      window.open(profileUrl({ slug, primary_category: form.primary_category }), "_blank", "noopener");
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Preview failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={onDone} className="text-sm text-label-secondary hover:text-label-primary">← All tools</button>
          <h2 className="mt-1 text-xl font-semibold text-label-primary">{form.name ?? slug}</h2>
          <p className="text-xs text-label-tertiary">
            {slug} · {data.kind === "tool-new" ? "created in Admin" : "reviewed record in data/tools-v4"}
            {draft && " · draft saved"}
          </p>
        </div>
        <a href={profileUrl({ slug, primary_category: form.primary_category })} target="_blank" rel="noopener noreferrer" className={secondary}>View live page ↗</a>
      </div>

      <section className="rounded-xl border border-separator bg-white p-5">
        <h3 className="text-sm font-semibold text-label-primary">Basics</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className={input} value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Company"><input className={input} value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value || undefined)} /></Field>
          <Field label="One-liner" hint="Up to 200 characters"><input className={input} maxLength={200} value={form.one_liner ?? ""} onChange={(e) => set("one_liner", e.target.value || undefined)} /></Field>
          <Field label="Short description" hint="Up to 200 characters; required to publish"><input className={input} maxLength={200} value={form.short_description ?? ""} onChange={(e) => set("short_description", e.target.value || undefined)} /></Field>
          <Field label="Website"><input className={input} type="url" value={form.website_url ?? ""} onChange={(e) => set("website_url", e.target.value || undefined)} /></Field>
          <Field label="Pricing page"><input className={input} type="url" value={form.pricing_url ?? ""} onChange={(e) => set("pricing_url", e.target.value || undefined)} /></Field>
          <Field label="Primary category">
            <select className={input} value={form.primary_category} onChange={(e) => set("primary_category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Status" hint="Draft hides the profile everywhere">
            <select className={input} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {["active", "draft", "archived", "pending-review"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-label-secondary">Also in</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c !== form.primary_category).map((c) => {
              const on = (form.secondary_categories ?? []).includes(c);
              return (
                <label key={c} className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs ${on ? "border-label-primary bg-label-primary text-white" : "border-separator text-label-secondary"}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => set("secondary_categories", on ? form.secondary_categories.filter((x: string) => x !== c) : [...(form.secondary_categories ?? []), c])} />
                  {c}
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>

      <section className="rounded-xl border border-separator bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-label-primary">Pricing</h3>
          <p className="text-xs text-label-tertiary">Feeds the profile, comparisons, alternatives, Practice Architect, cost estimates and practice plans.</p>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Model">
            <select className={input} value={pricing.model ?? "per-provider-month"} onChange={(e) => setPricing("model", e.target.value)}>
              {PRICING_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Starting price (USD)" hint="Leave empty if not published. Never 0 for unknown.">
            <input
              className={input}
              inputMode="decimal"
              value={pricing.starting_price_cents === undefined ? "" : String(pricing.starting_price_cents / 100)}
              onChange={(e) => {
                const v = e.target.value.trim();
                setPricing("starting_price_cents", v === "" ? undefined : Math.round(Number(v) * 100));
              }}
            />
          </Field>
          <Field label="Price as shown"><input className={input} value={pricing.starting_price_display ?? ""} onChange={(e) => setPricing("starting_price_display", e.target.value || undefined)} placeholder="$49/provider/month" /></Field>
          <Field label="Free trial (days)"><input className={input} inputMode="numeric" value={pricing.free_trial_days ?? ""} onChange={(e) => setPricing("free_trial_days", e.target.value === "" ? undefined : Number(e.target.value))} /></Field>
          <Field label="Price last verified" hint="Set only after checking the vendor's own pricing page.">
            <div className="flex gap-2">
              <input className={input} type="date" value={pricing.last_verified ?? ""} onChange={(e) => setPricing("last_verified", e.target.value || undefined)} />
              <button type="button" className={secondary} onClick={() => setPricing("last_verified", today())}>Today</button>
            </div>
          </Field>
          <div className="flex flex-col justify-end gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!pricing.quote_required} onChange={(e) => setPricing("quote_required", e.target.checked)} /> Quote required</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!pricing.free_tier} onChange={(e) => setPricing("free_tier", e.target.checked)} /> Free tier</label>
          </div>
        </div>
        <Field label="Pricing notes"><textarea className={`${input} mt-3`} rows={2} value={pricing.notes ?? ""} onChange={(e) => setPricing("notes", e.target.value || undefined)} /></Field>
        <div className="mt-4">
          <p className="text-xs font-medium text-label-secondary">Tiers</p>
          <table className="mt-1 w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase text-label-tertiary"><th className="py-1">Name</th><th>Price shown</th><th>USD / month</th><th>Description</th><th /></tr></thead>
            <tbody>
              {tiers.map((t, i) => (
                <tr key={i}>
                  <td className="pr-2 py-1"><input aria-label={`Tier ${i + 1} name`} className={input} value={t.name ?? ""} onChange={(e) => setPricing("tiers", tiers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></td>
                  <td className="pr-2"><input aria-label={`Tier ${i + 1} price shown`} className={input} value={t.price ?? ""} onChange={(e) => setPricing("tiers", tiers.map((x, j) => (j === i ? { ...x, price: e.target.value || undefined } : x)))} /></td>
                  <td className="pr-2"><input aria-label={`Tier ${i + 1} USD`} className={input} inputMode="decimal" value={t.price_cents === undefined ? "" : String(t.price_cents / 100)} onChange={(e) => setPricing("tiers", tiers.map((x, j) => (j === i ? { ...x, price_cents: e.target.value === "" ? undefined : Math.round(Number(e.target.value) * 100) } : x)))} /></td>
                  <td className="pr-2"><input aria-label={`Tier ${i + 1} description`} className={input} value={t.description ?? ""} onChange={(e) => setPricing("tiers", tiers.map((x, j) => (j === i ? { ...x, description: e.target.value || undefined } : x)))} /></td>
                  <td><button type="button" className="text-xs text-negative" onClick={() => setPricing("tiers", tiers.filter((_, j) => j !== i))}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className={`${secondary} mt-2`} onClick={() => setPricing("tiers", [...tiers, { name: "New tier" }])}>Add tier</button>
        </div>
      </section>

      <section className="rounded-xl border border-separator bg-white p-5">
        <h3 className="text-sm font-semibold text-label-primary">Integrations</h3>
        <p className="text-xs text-label-tertiary">Tick “verified” only after confirming on the vendor&apos;s site. Unverified integrations are shown as vendor-stated.</p>
        <ul className="mt-2 space-y-2">
          {integrations.map((x, i) => (
            <li key={i} className="grid gap-2 sm:grid-cols-[1fr_140px_140px_auto_auto] sm:items-center">
              <input aria-label="Integration name" className={input} value={x.name ?? ""} onChange={(e) => set("integrations", integrations.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} />
              <select aria-label="Integration category" className={input} value={x.category ?? "other"} onChange={(e) => set("integrations", integrations.map((y, j) => (j === i ? { ...y, category: e.target.value } : y)))}>
                {INTEGRATION_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select aria-label="Integration type" className={input} value={x.integration_type ?? "native"} onChange={(e) => set("integrations", integrations.map((y, j) => (j === i ? { ...y, integration_type: e.target.value } : y)))}>
                {INTEGRATION_TYPES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!x.verified} onChange={(e) => set("integrations", integrations.map((y, j) => (j === i ? { ...y, verified: e.target.checked } : y)))} /> verified</label>
              <button type="button" className="text-xs text-negative" onClick={() => set("integrations", integrations.filter((_, j) => j !== i))}>Remove</button>
            </li>
          ))}
        </ul>
        <button type="button" className={`${secondary} mt-2`} onClick={() => set("integrations", [...integrations, { name: "", category: "other", integration_type: "native", verified: false }])}>Add integration</button>
      </section>

      <section className="rounded-xl border border-dashed border-separator bg-fill-quaternary p-4 text-xs text-label-secondary">
        <p className="font-medium text-label-primary">Not editable here</p>
        <p className="mt-1">{data.locked.join(", ")}. Compliance (HIPAA, BAA, SOC 2) and commercial fields need evidence review and change only in the reviewed files. Clinical content is never edited in Admin.</p>
      </section>

      <section className="sticky bottom-0 rounded-xl border border-separator bg-white p-4 shadow-lg">
        <p className="text-xs text-label-secondary">
          {changed.length === 0 ? "No differences from the reviewed record." : `Changes from the reviewed record: ${changed.join(", ")}`}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input aria-label="Change note" className={`${input} max-w-xs`} placeholder="Note (e.g. checked pricing page 18 Nov)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className={secondary} disabled={busy || changed.length === 0} onClick={() => act("save-draft", { value: overlay() })}>Save draft</button>
          <button className={secondary} disabled={busy || !draft} onClick={preview}>Preview draft ↗</button>
          <button className={primary} disabled={busy || !draft} onClick={() => act("publish")}>Publish</button>
          <button className={secondary} disabled={busy || !draft} onClick={() => act("discard")}>Discard draft</button>
          {data.kind === "tool" && (
            <button className={secondary} disabled={busy || !data.history.some((r) => r.status === "published" && r.value !== null)} onClick={() => act("publish-value", { value: null, note: note || "Revert to reviewed record" })}>
              Revert to reviewed record
            </button>
          )}
        </div>
      </section>

      <History revisions={data.history} onRollback={async (id) => { await act("rollback", { revisionId: id }); }} />
    </div>
  );
}

function History({ revisions, onRollback }: { revisions: Revision[]; onRollback: (id: number) => Promise<void> }) {
  if (revisions.length === 0) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold text-label-primary">History</h3>
      <table className="mt-2 w-full text-left text-sm">
        <thead><tr className="text-[11px] uppercase text-label-tertiary"><th className="py-1">#</th><th>What</th><th>Status</th><th>When</th><th>Note</th><th /></tr></thead>
        <tbody>
          {revisions.map((r) => (
            <tr key={r.id} className="border-t border-separator align-top">
              <td className="py-1.5 pr-2 tabular-nums text-label-tertiary">{r.id}</td>
              <td className="pr-2">{r.kind} · {r.key}{r.value === null ? " (reviewed / default)" : ""}</td>
              <td className="pr-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${r.status === "published" ? "bg-positive/15 text-label-primary" : r.status === "draft" ? "bg-accent-tint text-accent" : "bg-fill-tertiary text-label-secondary"}`}>{r.status}</span>
              </td>
              <td className="pr-2 text-xs text-label-secondary">{new Date(r.published_at ?? r.created_at).toLocaleString()}</td>
              <td className="pr-2 text-xs text-label-secondary">{r.restores ? `Restores #${r.restores}. ` : ""}{r.note}</td>
              <td>{r.status === "superseded" && <button className="text-xs font-medium text-accent underline" onClick={() => onRollback(r.id)}>Restore this</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ---------------------------------------------------------------------------
// New tool
// ---------------------------------------------------------------------------

function NewTool({ onCreated, notify }: { onCreated: (slug: string) => void; notify: (k: "ok" | "error", t: string) => void }) {
  const [f, setF] = useState({ slug: "", name: "", category: "ehr-practice-management", short: "", website: "", price: "", display: "", model: "per-provider-month", hipaa: "unknown" });
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    const record = {
      schema_version: "4.0",
      kind: "clinician-tool",
      id: crypto.randomUUID(),
      slug: f.slug,
      name: f.name,
      primary_category: f.category,
      short_description: f.short,
      website_url: f.website || undefined,
      status: "active",
      pricing: {
        model: f.model,
        starting_price_cents: f.price === "" ? undefined : Math.round(Number(f.price) * 100),
        starting_price_display: f.display || undefined,
      },
      compliance: { hipaa_support: f.hipaa, baa_available: "unknown", soc2: "unknown", hitrust: "unknown", gdpr_compliant: "unknown", notes: "Entered in HeyPsych Admin; vendor-stated, not independently verified." },
      governance: { needs_review: false, last_reviewed: today(), review_notes: "Created in HeyPsych Admin." },
    };
    try {
      await call({ action: "save-draft", kind: "tool-new", key: f.slug, value: record, note: "New tool" });
      notify("ok", "New tool saved as a draft. Review it, then publish.");
      onCreated(f.slug);
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-xl border border-separator bg-white p-5">
      <h3 className="text-sm font-semibold text-label-primary">Add a tool</h3>
      <p className="text-xs text-label-tertiary">Profiles need a short description and a known HIPAA position to go public. HIPAA here is shown as vendor-stated until reviewed.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Slug" hint="lowercase-with-hyphens"><input className={input} value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></Field>
        <Field label="Name"><input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Category"><select className={input} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Short description"><input className={input} maxLength={200} value={f.short} onChange={(e) => setF({ ...f, short: e.target.value })} /></Field>
        <Field label="Website"><input className={input} type="url" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></Field>
        <Field label="HIPAA support (vendor-stated)"><select className={input} value={f.hipaa} onChange={(e) => setF({ ...f, hipaa: e.target.value })}>{["unknown", "yes", "no", "partial"].map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Pricing model"><select className={input} value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })}>{PRICING_MODELS.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Starting price (USD)"><input className={input} inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
        <Field label="Price as shown"><input className={input} value={f.display} onChange={(e) => setF({ ...f, display: e.target.value })} /></Field>
      </div>
      <button className={`${primary} mt-4`} disabled={busy || !f.slug || !f.name} onClick={create}>Save as draft</button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Flags, copy, experiments
// ---------------------------------------------------------------------------

function ConfigPanel({ data, reload, notify }: { data: Overview; reload: () => Promise<void>; notify: (k: "ok" | "error", t: string) => void }) {
  const published = (kind: Kind, key: string) => data.published.find((r) => r.kind === kind && r.key === key);
  const draftOf = (kind: Kind, key: string) => data.drafts.find((r) => r.kind === kind && r.key === key);
  const [copyEdits, setCopyEdits] = useState<Record<string, string>>({});
  const run = async (body: Record<string, unknown>, ok: string) => {
    try {
      await call(body);
      notify("ok", ok);
      await reload();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-label-primary">Feature flags</h2>
        <p className="text-xs text-label-tertiary">Nonclinical presentation only. Changes apply on the next page load; no rebuild.</p>
        <ul className="mt-3 space-y-3">
          {data.registry.flags.map((flag) => {
            const cur = (published("flag", flag.key)?.value as { enabled: boolean; rollout: number } | null) ?? { enabled: flag.default, rollout: 100 };
            return (
              <li key={flag.key} className="rounded-xl border border-separator bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-label-primary">{flag.label}</p>
                    <p className="text-xs text-label-secondary">{flag.description}</p>
                    <p className="mt-1 text-[11px] text-label-tertiary">{flag.key} · {flag.surface} · default {flag.default ? "on" : "off"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      Rollout
                      <select aria-label={`${flag.label} rollout`} className={`${input} w-24`} value={cur.rollout} onChange={(e) => run({ action: "publish-value", kind: "flag", key: flag.key, value: { enabled: cur.enabled, rollout: Number(e.target.value) }, note: `Rollout ${e.target.value}%` }, "Rollout updated.")}>
                        {[0, 10, 25, 50, 75, 100].map((n) => <option key={n} value={n}>{n}%</option>)}
                      </select>
                    </label>
                    <button
                      role="switch"
                      aria-checked={cur.enabled}
                      aria-label={flag.label}
                      onClick={() => run({ action: "publish-value", kind: "flag", key: flag.key, value: { enabled: !cur.enabled, rollout: cur.rollout }, note: cur.enabled ? "Turned off" : "Turned on" }, cur.enabled ? `${flag.label}: off` : `${flag.label}: on`)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${cur.enabled ? "bg-positive" : "bg-fill-tertiary"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${cur.enabled ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-label-primary">Experiments</h2>
        <ul className="mt-3 space-y-3">
          {data.registry.experiments.map((x) => {
            const active = (published("experiment", x.key)?.value as { active: boolean } | null)?.active ?? false;
            return (
              <li key={x.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-separator bg-white p-4">
                <div>
                  <p className="text-sm font-semibold text-label-primary">{x.label}</p>
                  <p className="text-xs text-label-secondary">Variants: {x.variants.map((v) => `${v.id} “${v.value}”`).join(" · ")}. Split evenly, stable per browser.</p>
                </div>
                <button className={active ? secondary : primary} onClick={() => run({ action: "publish-value", kind: "experiment", key: x.key, value: { active: !active }, note: active ? "Stopped" : "Started" }, active ? "Experiment stopped: everyone sees the control." : "Experiment started.")}>
                  {active ? "Stop (everyone sees control)" : "Start"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-label-primary">Approved copy</h2>
        <p className="text-xs text-label-tertiary">Nonclinical interface text only. Save a draft, preview, then publish.</p>
        <ul className="mt-3 space-y-3">
          {data.registry.copy.map((c) => {
            const pub = (published("copy", c.key)?.value as { text: string } | null)?.text ?? c.default;
            const draft = (draftOf("copy", c.key)?.value as { text: string } | null)?.text;
            const value = copyEdits[c.key] ?? draft ?? pub;
            return (
              <li key={c.key} className="rounded-xl border border-separator bg-white p-4">
                <p className="text-sm font-semibold text-label-primary">{c.label}</p>
                <p className="text-[11px] text-label-tertiary">{c.key} · {c.surface}</p>
                <textarea aria-label={c.label} className={`${input} mt-2`} rows={c.maxLength > 120 ? 3 : 1} maxLength={c.maxLength} value={value} onChange={(e) => setCopyEdits({ ...copyEdits, [c.key]: e.target.value })} />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-label-tertiary">{value.length}/{c.maxLength}</span>
                  <button className={secondary} onClick={() => run({ action: "save-draft", kind: "copy", key: c.key, value: { text: value } }, "Copy draft saved.")}>Save draft</button>
                  <button className={secondary} disabled={!draft} onClick={async () => { await call({ action: "preview-on" }); window.open(c.surface, "_blank", "noopener"); }}>Preview ↗</button>
                  <button className={primary} disabled={!draft} onClick={() => run({ action: "publish", kind: "copy", key: c.key }, "Copy published.")}>Publish</button>
                  <button className={secondary} disabled={pub === c.default} onClick={() => run({ action: "publish-value", kind: "copy", key: c.key, value: null, note: "Back to default" }, "Back to the default text.")}>Use default</button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function LiveAdmin() {
  const [tab, setTab] = useState<"tools" | "config" | "history">("tools");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const notify = useCallback((kind: "ok" | "error", text: string) => setMsg({ kind, text }), []);

  const reload = useCallback(async () => {
    const res = await fetch("/api/hp-ctrl-8k3m9x/live?view=overview");
    const d = await res.json();
    if (!res.ok) setError(d.error ?? "Could not load");
    else setData(d);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const tools = useMemo(() => (data?.tools ?? []).filter((t) => `${t.name} ${t.slug} ${t.category}`.toLowerCase().includes(query.toLowerCase())), [data, query]);

  if (error) return <p role="alert" className="text-sm text-negative">{error}</p>;
  if (!data) return <p className="text-sm text-label-secondary">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-label-primary">Live updates</h1>
          <p className="text-sm text-label-secondary">Change tools, flags and copy without a deployment. Clinical content is not editable here.</p>
        </div>
        <div className="flex gap-2">
          <button className={secondary} onClick={async () => { await call({ action: "preview-off" }); notify("ok", "Preview off: you now see what visitors see."); }}>Exit preview</button>
          <a className={secondary} href="/api/hp-ctrl-8k3m9x/live?view=snapshot">Export snapshot</a>
        </div>
      </div>

      <Banner msg={msg} onClose={() => setMsg(null)} />
      {data.liveErrors.length > 0 && (
        <div role="alert" className="mb-4 rounded-lg bg-caution-50 px-4 py-3 text-sm text-label-primary">
          Some published changes failed validation and are not applied (the reviewed record shows instead): {data.liveErrors.map((e) => `${e.key}: ${e.error}`).join("; ")}
        </div>
      )}

      <div role="tablist" className="mb-6 inline-flex rounded-lg bg-fill-quaternary p-1">
        {([["tools", "Tools"], ["config", "Flags, experiments & copy"], ["history", "History"]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setEditing(null); }} className={`rounded-md px-4 py-1.5 text-sm ${tab === id ? "bg-white font-medium text-label-primary shadow-sm" : "text-label-secondary"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "tools" &&
        (editing ? (
          <ToolEditor slug={editing} notify={notify} onDone={() => { setEditing(null); void reload(); }} />
        ) : (
          <div className="space-y-6">
            <input aria-label="Search tools" className={`${input} max-w-sm`} placeholder="Search tools" value={query} onChange={(e) => setQuery(e.target.value)} />
            <table className="w-full text-left text-sm">
              <thead><tr className="text-[11px] uppercase text-label-tertiary"><th className="py-2">Tool</th><th>Category</th><th>Starting price</th><th>Price verified</th><th>State</th></tr></thead>
              <tbody>
                {tools.map((t) => (
                  <tr key={t.slug} className="border-t border-separator">
                    <td className="py-2"><button className="font-medium text-label-primary underline-offset-2 hover:underline" onClick={() => setEditing(t.slug)}>{t.name}</button></td>
                    <td className="text-xs text-label-secondary">{t.category}</td>
                    <td className="text-xs">{t.price ?? <span className="text-label-tertiary">not published</span>}</td>
                    <td className="text-xs">{t.priceVerified ?? <span className="text-label-tertiary">unverified</span>}</td>
                    <td className="space-x-1 text-[11px]">
                      {!t.public && <span className="rounded-full bg-fill-tertiary px-2 py-0.5">not public</span>}
                      {t.overridden && <span className="rounded-full bg-positive/15 px-2 py-0.5">live change</span>}
                      {t.created && <span className="rounded-full bg-accent-tint px-2 py-0.5">created in Admin</span>}
                      {t.draft && <span className="rounded-full bg-caution-50 px-2 py-0.5">draft</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <NewTool notify={notify} onCreated={(slug) => { void reload(); setEditing(slug); }} />
          </div>
        ))}

      {tab === "config" && <ConfigPanel data={data} reload={reload} notify={notify} />}

      {tab === "history" && (
        <History
          revisions={data.recent}
          onRollback={async (id) => {
            try {
              await call({ action: "rollback", revisionId: id });
              notify("ok", `Restored revision ${id}.`);
              await reload();
            } catch (e) {
              notify("error", e instanceof Error ? e.message : "Failed");
            }
          }}
        />
      )}
    </div>
  );
}
