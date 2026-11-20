/**
 * HeyPsych Consensus Score — server-side helpers shared by Admin and the
 * public reader. Server only (imports the private engine).
 */

import { computeConsensus, contentHash, ALGORITHM, today, type ScoreResult } from "./engine";
import { toPublicConsensus, type PublicConsensus } from "./public";
import { ConsensusRecordZ, emptyRecord, type ConsensusRecord } from "./schema";

/** Parse a stored value; anything invalid reads as an empty record. */
export function parseRecord(value: unknown): ConsensusRecord {
  const parsed = ConsensusRecordZ.safeParse(value ?? {});
  return parsed.success ? parsed.data : emptyRecord();
}

/** True when the record's approval covers exactly its current evidence and summaries. */
export function approvalIsCurrent(record: ConsensusRecord): boolean {
  return Boolean(record.approval && record.approval.hash === contentHash(record));
}

/**
 * Published rows -> public projections. Rows whose approval does not match
 * their content (edited after approval) are dropped: nothing unapproved can
 * reach a page.
 */
export function projectConsensusRows(rows: { key: string; value: unknown }[]): PublicConsensus[] {
  const out: PublicConsensus[] = [];
  for (const row of rows) {
    const parsed = ConsensusRecordZ.safeParse(row.value);
    if (!parsed.success || !approvalIsCurrent(parsed.data)) continue;
    const projected = toPublicConsensus(row.key, parsed.data);
    if (projected) out.push(projected);
  }
  return out;
}

/** Score a record now, for the admin view and for approval. */
export function scoreRecord(record: ConsensusRecord, asOf = today()): ScoreResult {
  return computeConsensus(record.observations, asOf);
}

export { ALGORITHM, contentHash };
