/**
 * serve-dist.mjs — local static server for dist/ that applies the same security
 * headers as vercel.json (so tests run under the same CSP), with correct content
 * types and trailing-slash handling. Used by `npm run preview` and the tests.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize, sep } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.glb': 'model/gltf-binary', '.ktx2': 'image/ktx2', '.hdr': 'image/vnd.radiance',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
};

const CSP = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' blob: data:; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests";

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let rel = urlPath.replace(/^\/+/, '') || 'index.html';
  let file = join(ROOT, normalize(rel));
  if (!file.startsWith(ROOT + sep) && file !== ROOT) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && existsSync(join(ROOT, '404.html'))) {
    res.writeHead(404, { 'content-type': MIME['.html'] });
    return res.end(readFileSync(join(ROOT, '404.html')));
  }
  if (!existsSync(file)) { res.writeHead(404); return res.end('not found'); }

  const headers = {
    'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'content-security-policy': CSP,
  };
  const pathWithSlash = urlPath.endsWith('/') ? urlPath : urlPath + '/';
  if (/\/play\/arrival-english\//.test(pathWithSlash)) headers['permissions-policy'] = 'camera=(), microphone=(self), geolocation=(), payment=(), usb=()';
  else headers['permissions-policy'] = 'camera=(), microphone=(), geolocation=(), payment=(), usb=()';
  if (/\/posters\//.test(pathWithSlash) || /\/play\/[a-z0-9-]+\/.*\.(js|css|glb|bin|ktx2|wasm|webp|jpg|png|hdr|mp3|ogg|m4a|woff2)$/i.test(urlPath)) {
    headers['cache-control'] = 'public, max-age=31536000, immutable';
  } else if (extname(file) === '.html') {
    headers['cache-control'] = 'no-cache';
  }
  res.writeHead(200, headers);
  res.end(readFileSync(file));
});

server.listen(PORT, () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT} with vercel.json-equivalent headers`));
