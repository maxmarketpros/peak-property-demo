// Local preview server that mimics Netlify's pretty-URL routing:
// /page and /page/ serve page.html, unknown paths serve 404.html with a 404.
// Usage: node build/serve.mjs [port]   (default 8011)
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8011;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};

function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]).replace(/\/+$/, '') || '/';
  if (p === '/') return join(ROOT, 'index.html');
  const file = normalize(join(ROOT, p));
  if (!file.startsWith(ROOT)) return null;
  if (existsSync(file) && statSync(file).isFile()) return file;
  if (!extname(p) && existsSync(file + '.html')) return file + '.html';
  return null;
}

createServer((req, res) => {
  const file = resolve(req.url);
  if (file) {
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } else {
    res.writeHead(404, { 'Content-Type': MIME['.html'] });
    res.end(existsSync(join(ROOT, '404.html')) ? readFileSync(join(ROOT, '404.html')) : 'Not found');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}/ (pretty URLs on)`));
