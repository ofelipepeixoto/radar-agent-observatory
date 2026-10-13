import test from 'node:test';
import assert from 'node:assert/strict';
import {startServer} from '../src/server.mjs';
test('local server serves only allowlisted read-only files with restrictive CSP',async()=>{
  const server=await startServer();const url=`http://127.0.0.1:${server.address().port}`;
  try {
    const page=await fetch(url);assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/script-src 'self'/);
    assert.equal((await fetch(url+'/fixtures/synthetic.json')).status,200);
    assert.equal((await fetch(url+'/package.json')).status,404);
    assert.equal((await fetch(url+'/.env')).status,404);
    assert.equal((await fetch(url+'/',{method:'POST'})).status,405);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
