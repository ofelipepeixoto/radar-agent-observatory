// Copyright (c) 2026 Carlos Felipe. SPDX-License-Identifier: MIT
import {MAX_BYTES, validateSnapshot} from './contract.mjs';
export const SOURCES = Object.freeze({
  synthetic: './fixtures/synthetic.json', historical: './fixtures/historical.json', empty: './fixtures/empty.json', invalid: './fixtures/invalid.json'
});
export async function loadSnapshot(choice, {fetcher = fetch, timeoutMs = 5000, now = Date.now()} = {}) {
  if (!Object.hasOwn(SOURCES, choice)) throw new Error('INVALID_SOURCE');
  const controller = new AbortController();
  let timer;
  const work = async () => {
    const response = await fetcher(SOURCES[choice], {
      signal: controller.signal, credentials: 'omit', redirect: 'error', cache: 'no-store'
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    if (response.redirected) throw new Error('REDIRECT_DENIED');
    if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') || '')) throw new Error('INVALID_CONTENT_TYPE');
    if (!response.body) throw new Error('EMPTY_BODY');
    const reader = response.body.getReader();
    const chunks = []; let size = 0;
    try {
      for (;;) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) throw new Error('BODY_TOO_LARGE');
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let data;
    try { data = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)); }
    catch { throw new Error('INVALID_JSON'); }
    return validateSnapshot(data, now);
  };
  try {
    return await Promise.race([work(), new Promise((_, reject) => {
      timer = setTimeout(() => {controller.abort(); reject(new Error('TIMEOUT'));}, timeoutMs);
    })]);
  } finally { clearTimeout(timer); controller.abort(); }
}
