import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSnapshot} from '../src/load.mjs';
const data=readFileSync(new URL('../fixtures/synthetic.json',import.meta.url),'utf8');
const options={now:Date.parse('2026-10-13T12:01:00.000Z')};
const response=(body=data,status=200,type='application/json')=>new Response(body,{status,headers:{'content-type':type}});
test('loads only fixed local source without credentials or redirects',async()=>{
  const got=await loadSnapshot('synthetic',{...options,fetcher:async(url,config)=>{
    assert.equal(url,'/fixtures/synthetic.json');assert.equal(config.credentials,'omit');assert.equal(config.redirect,'error');return response();
  }});assert.equal(got.records.length,3);
});
test('rejects arbitrary remote URL before network',async()=>{
  let calls=0;await assert.rejects(loadSnapshot('https://example.invalid',{fetcher:()=>{calls++;}}),/INVALID_SOURCE/);assert.equal(calls,0);
});
for(const status of [401,403,429,500]) test(`HTTP ${status} cannot become success`,async()=>{
  await assert.rejects(loadSnapshot('synthetic',{...options,fetcher:async()=>response('{"error":"synthetic"}',status)}),new RegExp(`HTTP_${status}`));
});
test('rejects malformed JSON',async()=>{await assert.rejects(loadSnapshot('synthetic',{fetcher:async()=>response('{')}),/INVALID_JSON/);});
test('rejects HTML content',async()=>{await assert.rejects(loadSnapshot('synthetic',{fetcher:async()=>response('<h1>x</h1>',200,'text/html')}),/INVALID_CONTENT_TYPE/);});
test('rejects contract mismatch after successful HTTP',async()=>{await assert.rejects(loadSnapshot('synthetic',{fetcher:async()=>response('{}')}),/INVALID_CONTRACT/);});
test('bounds response even without Content-Length',async()=>{await assert.rejects(loadSnapshot('synthetic',{fetcher:async()=>response(' '.repeat(128*1024+1))}),/BODY_TOO_LARGE/);});
test('timeout covers stalled fetch',async()=>{await assert.rejects(loadSnapshot('synthetic',{timeoutMs:10,fetcher:()=>new Promise(()=>{})}),/TIMEOUT/);});
test('timeout covers stalled body',async()=>{await assert.rejects(loadSnapshot('synthetic',{timeoutMs:10,fetcher:async()=>new Response(new ReadableStream({start(){}}),{headers:{'content-type':'application/json'}})}),/TIMEOUT/);});
