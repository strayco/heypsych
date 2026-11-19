/**
 * Live updates — the store (existing Supabase Postgres, direct connection).
 *
 * Server only. Admin writes go through here; public reads go through
 * state.ts, which caches them. Every write runs in a transaction, history is
 * append-only, and the table is created by the same additive SQL as
 * supabase/migrations/047_hp_live_revisions.sql.
 */

import type { PoolClient } from "pg";
import { getDbPool } from "@/lib/config/db-pool";
import type { LiveKind } from "./registry";
import type { LiveRow } from "./apply-tools";

export const LIVE_SCHEMA_SQL = `
create table if not exists public.hp_live_revisions (
  id            bigserial primary key,
  kind          text not null check (kind in ('tool', 'tool-new', 'flag', 'copy', 'experiment')),
  key           text not null check (char_length(key) between 1 and 120),
  value         jsonb,
  status        text not null check (status in ('draft', 'published', 'superseded', 'discarded')),
  note          text check (note is null or char_length(note) <= 500),
  author        text not null default 'admin',
  created_at    timestamptz not null default now(),
  published_at  timestamptz,
  restores      bigint references public.hp_live_revisions(id)
);
create index if not exists hp_live_revisions_kind_key on public.hp_live_revisions (kind, key, id desc);
create unique index if not exists hp_live_revisions_one_published on public.hp_live_revisions (kind, key) where status = 'published';
create unique index if not exists hp_live_revisions_one_draft on public.hp_live_revisions (kind, key) where status = 'draft';
alter table public.hp_live_revisions enable row level security;
`;

export interface Revision {
  id: number;
  kind: LiveKind;
  key: string;
  value: unknown;
  status: "draft" | "published" | "superseded" | "discarded";
  note: string | null;
  author: string;
  created_at: string;
  published_at: string | null;
  restores: number | null;
}

let schemaPromise: Promise<void> | null = null;

/**
 * Fallback bootstrap for environments where migration 047 hasn't run.
 * - One bootstrap in flight per process (concurrent first requests share it).
 * - No DDL at all when the table exists: a lock-free to_regclass check, so a
 *   migrated production database never takes an exclusive lock here.
 * - Across processes, DDL is serialised by a transaction-scoped advisory lock
 *   (two concurrent `alter table … enable row level security` deadlocked).
 */
export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const pool = await getDbPool();
      const { rows } = await pool.query("select to_regclass('public.hp_live_revisions') is not null as present");
      if (rows[0]?.present) return;
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("select pg_advisory_xact_lock(hashtext('hp_live_revisions_schema'))");
        await client.query(LIVE_SCHEMA_SQL);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  await ensureSchema();
  const pool = await getDbPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

function toRevision(r: Record<string, unknown>): Revision {
  return {
    id: Number(r.id),
    kind: r.kind as LiveKind,
    key: String(r.key),
    value: r.value ?? null,
    status: r.status as Revision["status"],
    note: (r.note as string | null) ?? null,
    author: String(r.author),
    created_at: new Date(r.created_at as string).toISOString(),
    published_at: r.published_at ? new Date(r.published_at as string).toISOString() : null,
    restores: r.restores === null || r.restores === undefined ? null : Number(r.restores),
  };
}

/** Published rows for some kinds. A missing table reads as "nothing published". */
export async function readPublished(kinds: LiveKind[], options: { includeDrafts?: boolean } = {}): Promise<LiveRow[]> {
  const pool = await getDbPool();
  try {
    const statuses = options.includeDrafts ? ["published", "draft"] : ["published"];
    const { rows } = await pool.query(
      `select id, kind, key, value, status, published_at from public.hp_live_revisions
        where kind = any($1) and status = any($2) order by id`,
      [kinds, statuses]
    );
    if (!options.includeDrafts) return rows.map((r) => ({ id: Number(r.id), kind: r.kind, key: r.key, value: r.value, published_at: r.published_at }));
    // Preview: a draft wins over the published value for the same key.
    const byKey = new Map<string, LiveRow>();
    for (const r of rows) {
      const k = `${r.kind}:${r.key}`;
      if (r.status === "draft" || !byKey.has(k)) byKey.set(k, { id: Number(r.id), kind: r.kind, key: r.key, value: r.value, published_at: r.published_at });
    }
    return [...byKey.values()];
  } catch (error) {
    if ((error as { code?: string }).code === "42P01") return []; // table not created yet
    throw error;
  }
}

export async function listDrafts(): Promise<Revision[]> {
  await ensureSchema();
  const pool = await getDbPool();
  const { rows } = await pool.query(`select * from public.hp_live_revisions where status = 'draft' order by created_at desc`);
  return rows.map(toRevision);
}

export async function listPublished(): Promise<Revision[]> {
  await ensureSchema();
  const pool = await getDbPool();
  const { rows } = await pool.query(`select * from public.hp_live_revisions where status = 'published' order by published_at desc`);
  return rows.map(toRevision);
}

export async function history(kind?: LiveKind, key?: string, limit = 100): Promise<Revision[]> {
  await ensureSchema();
  const pool = await getDbPool();
  const { rows } = kind && key
    ? await pool.query(`select * from public.hp_live_revisions where kind = $1 and key = $2 order by id desc limit $3`, [kind, key, limit])
    : await pool.query(`select * from public.hp_live_revisions where status <> 'draft' order by id desc limit $1`, [limit]);
  return rows.map(toRevision);
}

/** Save (or replace) the single draft for a key. */
export async function saveDraft(kind: LiveKind, key: string, value: unknown, note: string | null, author: string): Promise<Revision> {
  return tx(async (c) => {
    await c.query(`update public.hp_live_revisions set status = 'discarded' where kind = $1 and key = $2 and status = 'draft'`, [kind, key]);
    const { rows } = await c.query(
      `insert into public.hp_live_revisions (kind, key, value, status, note, author) values ($1, $2, $3, 'draft', $4, $5) returning *`,
      [kind, key, value === null ? null : JSON.stringify(value), note, author]
    );
    return toRevision(rows[0]);
  });
}

export async function discardDraft(kind: LiveKind, key: string): Promise<number> {
  await ensureSchema();
  const pool = await getDbPool();
  const { rowCount } = await pool.query(`update public.hp_live_revisions set status = 'discarded' where kind = $1 and key = $2 and status = 'draft'`, [kind, key]);
  return rowCount ?? 0;
}

/** Publish the key's draft. */
export async function publishDraft(kind: LiveKind, key: string): Promise<Revision> {
  return tx(async (c) => {
    const draft = await c.query(`select id from public.hp_live_revisions where kind = $1 and key = $2 and status = 'draft' for update`, [kind, key]);
    if (draft.rowCount === 0) throw new LiveError("There is no draft to publish", 409);
    await c.query(`update public.hp_live_revisions set status = 'superseded' where kind = $1 and key = $2 and status = 'published'`, [kind, key]);
    const { rows } = await c.query(`update public.hp_live_revisions set status = 'published', published_at = now() where id = $1 returning *`, [draft.rows[0].id]);
    return toRevision(rows[0]);
  });
}

/** Publish a value directly (flag toggles, reverting to the file version with null). */
export async function publishValue(kind: LiveKind, key: string, value: unknown, note: string | null, author: string, restores: number | null = null): Promise<Revision> {
  return tx(async (c) => {
    await c.query(`select id from public.hp_live_revisions where kind = $1 and key = $2 and status = 'published' for update`, [kind, key]);
    await c.query(`update public.hp_live_revisions set status = 'superseded' where kind = $1 and key = $2 and status = 'published'`, [kind, key]);
    const { rows } = await c.query(
      `insert into public.hp_live_revisions (kind, key, value, status, note, author, published_at, restores)
       values ($1, $2, $3, 'published', $4, $5, now(), $6) returning *`,
      [kind, key, value === null ? null : JSON.stringify(value), note, author, restores]
    );
    return toRevision(rows[0]);
  });
}

/** Roll back: publish a copy of an earlier revision of the same key. */
export async function rollbackTo(revisionId: number, author: string): Promise<Revision> {
  await ensureSchema();
  const pool = await getDbPool();
  const { rows } = await pool.query(`select * from public.hp_live_revisions where id = $1`, [revisionId]);
  if (rows.length === 0) throw new LiveError("Revision not found", 404);
  const target = toRevision(rows[0]);
  if (target.status === "draft" || target.status === "discarded") throw new LiveError("Only previously published revisions can be restored", 409);
  return publishValue(target.kind, target.key, target.value, `Rollback to revision ${target.id}`, author, target.id);
}

export class LiveError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}
