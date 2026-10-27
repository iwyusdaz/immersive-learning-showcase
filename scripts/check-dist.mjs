/**
 * check-dist.mjs — size report, largest files, absolute-path scan (fails the build
 * on absolute asset paths except the allowed "/" "All projects" links), required
 * files. (08-vercel-deployment.md section 6.2/11)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const BUDGET_PROJECT = 150 * 1024 * 1024; // 150 MB target per project
const BUDGET_SITE = 1024 * 1024 * 1024;   // 1 GB whole site

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(DIST);
let total = 0;
const perProject = {};
const big = [];
for (const f of files) {
  const size = statSync(f).size;
  total += size;
  const rel = relative(DIST, f);
  const m = rel.match(/^play\/([a-z0-9-]+)\//);
  if (m) {
    perProject[m[1]] = (perProject[m[1]] || 0) + size;
    if (size > 20 * 1024 * 1024) big.push(`${rel}: ${(size / 1048576).toFixed(1)} MB`);
  }
}

console.log(`check-dist: total ${(total / 1048576).toFixed(1)} MB`);
for (const [slug, size] of Object.entries(perProject)) {
  console.log(`check-dist: play/${slug} ${(size / 1048576).toFixed(1)} MB${size > BUDGET_PROJECT ? '  [over 150 MB budget]' : ''}`);
}
if (big.length) { console.error('check-dist: files over 20 MB:\n' + big.join('\n')); process.exit(1); }
if (total > BUDGET_SITE) { console.error('check-dist: whole site over 1 GB'); process.exit(1); }

// absolute-path scan in PROJECT text assets only (contract 5.1 — the landing page
// itself legitimately uses absolute /styles, /scripts, /assets paths at the root)
const bad = [];
for (const f of files) {
  const rel = relative(DIST, f);
  if (!rel.startsWith('play/')) continue;
  const ext = extname(f);
  if (!['.html', '.css', '.js'].includes(ext)) continue;
  const text = readFileSync(f, 'utf8');
  // src="/, href="/assets, url(/ — but allow href="/" (All projects link), href="/credits/", href="/accessibility/", srcset absolute site URLs, og:image absolute URL
  const re = /(src="\/(?!\/)|href="\/assets|url\(\s*['"]?\/(?!\/))/g;
  let m;
  while ((m = re.exec(text))) {
    bad.push(`${relative(DIST, f)}: ${text.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\n/g, ' ')}`);
  }
}
if (bad.length) {
  console.error(`check-dist: absolute asset paths found (${bad.length}):\n` + bad.slice(0, 20).join('\n'));
  process.exit(1);
}

// required files
for (const f of ['index.html', '404.html', 'sitemap.xml', 'robots.txt', 'credits/index.html', 'accessibility/index.html']) {
  if (!existsSync(join(DIST, f))) { console.error(`check-dist: missing required file ${f}`); process.exit(1); }
}

// Every local file referenced by the site's own pages must exist in dist/
// (catches a stylesheet or script that the build forgot to copy).
const missingRefs = [];
for (const f of files) {
  const rel = relative(DIST, f);
  if (rel.startsWith('play/') || extname(f) !== '.html') continue;
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
    const ref = m[1];
    if (ref === '/' || ref.endsWith('/') || ref.startsWith('/play/')) continue; // page links, checked by tests
    if (!existsSync(join(DIST, ref))) missingRefs.push(`${rel} -> ${ref}`);
  }
}
if (missingRefs.length) {
  console.error('check-dist: pages reference files missing from dist:\n' + [...new Set(missingRefs)].join('\n'));
  process.exit(1);
}
console.log('check-dist: OK');
