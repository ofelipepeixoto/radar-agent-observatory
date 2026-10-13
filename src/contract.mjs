// Copyright (c) 2026 Carlos Felipe. SPDX-License-Identifier: MIT
export const MAX_BYTES = 128 * 1024;
export const MAX_RECORDS = 50;
const FAIL = () => { throw new Error('INVALID_CONTRACT'); };
const object = (v, keys) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) FAIL();
  const actual = Object.keys(v);
  if (actual.length !== keys.length || actual.some(k => !keys.includes(k))) FAIL();
};
const text = (v, max = 160) => {
  if (typeof v !== 'string' || !v.trim() || v.length > max || /[\u0000-\u001f\u007f]/u.test(v)) FAIL();
  return v;
};
const iso = v => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)) FAIL();
  const d = new Date(v);
  if (!Number.isFinite(d.getTime()) || d.toISOString() !== v) FAIL();
  return v;
};
export function validateSnapshot(input, now = Date.now()) {
  object(input, ['schemaVersion', 'mode', 'observedAt', 'sourceLabel', 'records']);
  if (input.schemaVersion !== 1 || !['synthetic', 'historical'].includes(input.mode)) FAIL();
  iso(input.observedAt);
  if (!Number.isFinite(now) || Date.parse(input.observedAt) > now + 60_000) FAIL();
  text(input.sourceLabel);
  if (!Array.isArray(input.records) || input.records.length > MAX_RECORDS) FAIL();
  const seen = new Set();
  const records = input.records.map(r => {
    object(r, ['id', 'status', 'recordedAt', 'summary', 'evidence']);
    text(r.id, 80); text(r.summary, 400); if (r.recordedAt !== null) iso(r.recordedAt);
    if (seen.has(r.id) || (r.recordedAt !== null && Date.parse(r.recordedAt) > Date.parse(input.observedAt))) FAIL();
    seen.add(r.id);
    if (!['completed', 'abstained', 'unknown', 'failed'].includes(r.status)) FAIL();
    if (!Array.isArray(r.evidence) || r.evidence.length > 5) FAIL();
    const ids = new Set();
    const evidence = r.evidence.map(e => {
      object(e, ['id', 'document', 'page', 'revision']);
      text(e.id, 80); text(e.document);
      if (ids.has(e.id) || !Number.isSafeInteger(e.page) || e.page < 1 || !Number.isSafeInteger(e.revision) || e.revision < 1) FAIL();
      ids.add(e.id);
      return Object.freeze({...e});
    });
    return Object.freeze({...r, evidence: Object.freeze(evidence)});
  });
  return Object.freeze({...input, records: Object.freeze(records)});
}
export function freshness(snapshot, now = Date.now(), maxAgeMs = 300_000) {
  if (snapshot.mode === 'synthetic') return 'synthetic';
  return now - Date.parse(snapshot.observedAt) > maxAgeMs ? 'stale' : 'recent';
}
