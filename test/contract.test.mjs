import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSnapshot, freshness} from '../src/contract.mjs';
const fixture = () => JSON.parse(readFileSync(new URL('../fixtures/synthetic.json',import.meta.url)));
const now = Date.parse('2026-10-13T12:01:00.000Z');
test('preserves outcomes and never interprets completed as authorization', () => {
  const value=validateSnapshot(fixture(),now);
  assert.deepEqual(value.records.map(r=>r.status),['completed','abstained','unknown']);
  assert.ok(Object.isFrozen(value.records[0].evidence[0]));
  assert.equal('authorized' in value.records[0],false);
});
test('empty input is valid without fabricating results',()=>{
  const f=fixture();f.records=[];assert.equal(validateSnapshot(f,now).records.length,0);
});
for (const [name,mutate] of [
  ['live mode',f=>f.mode='live'],
  ['extra authorization claim',f=>f.records[0].authorized=true],
  ['unknown envelope fields',f=>f.apiKey='synthetic-marker'],
  ['unknown status',f=>f.records[0].status='verified'],
  ['duplicate receipt',f=>f.records.push(f.records[0])],
  ['duplicate evidence',f=>f.records[0].evidence.push(f.records[0].evidence[0])],
  ['future observation',f=>f.observedAt='2099-01-01T00:00:00.000Z'],
  ['impossible calendar date',f=>f.observedAt='2026-02-30T00:00:00.000Z'],
  ['record after observation',f=>f.records[0].recordedAt='2026-10-13T12:00:30.000Z'],
  ['boolean page',f=>f.records[0].evidence[0].page=true],
  ['oversize summary',f=>f.records[0].summary='a'.repeat(401)],
  ['too many receipts',f=>f.records=Array.from({length:51},(_,i)=>({...f.records[0],id:String(i)}))],
]) test(`rejects ${name}`,()=>{const f=fixture();mutate(f);assert.throws(()=>validateSnapshot(f,now),/INVALID_CONTRACT/);});
test('preserves hostile markup as data for safe DOM rendering',()=>{
  const f=fixture();f.records[0].summary='<img src=x onerror=alert(1)>';
  assert.equal(validateSnapshot(f,now).records[0].summary,f.records[0].summary);
});
test('freshness distinguishes synthetic, recent historical and stale historical',()=>{
  const f=fixture();assert.equal(freshness(f,now),'synthetic');f.mode='historical';
  assert.equal(freshness(f,now),'recent');assert.equal(freshness(f,now+300_000),'stale');
});

test('missing record timestamp remains null, never observation time',()=>{
  const value=JSON.parse(readFileSync(new URL('../fixtures/synthetic.json',import.meta.url),'utf8'));
  value.records[0].recordedAt=null;
  assert.equal(validateSnapshot(value,Date.parse('2026-10-13T12:01:00.000Z')).records[0].recordedAt,null);
});
