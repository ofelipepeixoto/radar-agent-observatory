// Local fixture server only. No arbitrary paths, proxy, provider, auth or write API.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const paths = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ...['app','load','contract'].map(n => [`/src/${n}.mjs`, [`src/${n}.mjs`, 'text/javascript; charset=utf-8']]),
  ['/src/style.css', ['src/style.css', 'text/css; charset=utf-8']],
  ...['synthetic','historical','empty'].map(n => [`/fixtures/${n}.json`, [`fixtures/${n}.json`, 'application/json; charset=utf-8']])
]);
export async function startServer(port = 0) {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Cache-Control','no-store');
    res.setHeader('Referrer-Policy','no-referrer');
    if (req.method !== 'GET') { res.writeHead(405);res.end('Method not allowed');return; }
    const entry = paths.get(req.url);
    if (!entry) {res.writeHead(404);res.end('Not found');return;}
    try { const bytes = await readFile(new URL('../'+entry[0], import.meta.url));res.writeHead(200, {'Content-Type':entry[1]});res.end(bytes); }
    catch { res.writeHead(500);res.end('Unavailable'); }
  });
  await new Promise((resolve,reject) => {server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await startServer(8787);
  console.log(`Fixture viewer: http://127.0.0.1:${server.address().port} (synthetic data only)`);
}
