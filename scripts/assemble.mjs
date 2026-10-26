/**
 * assemble.mjs — download each live app's release archive, verify its SHA-256
 * against apps.json (fail loudly on mismatch), extract into dist/play/<slug>/
 * with a path-traversal guard, and validate the embedded showcase.json.
 * (08-vercel-deployment.md section 6.2)
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { parse } from 'node:path';
import * as tar from 'tar';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const apps = JSON.parse(readFileSync(join(ROOT, 'apps.json'), 'utf8'));

function validateApps() {
  const schema = JSON.parse(readFileSync(join(ROOT, 'schemas', 'apps.schema.json'), 'utf8'));
  const errors = [];
  for (const app of apps.apps) {
    if (!/^[a-z0-9-]+$/.test(app.slug)) errors.push(`${app.slug}: bad slug`);
    if (app.status === 'live' && (!app.version || !app.sha256)) errors.push(`${app.slug}: live entries need version + sha256`);
    if (app.status === 'live' && app.sha256 && !/^[a-f0-9]{64}$/.test(app.sha256)) errors.push(`${app.slug}: bad sha256`);
  }
  if (errors.length) throw new Error('apps.json validation failed:\n' + errors.join('\n'));
}

async function fetchWithRetry(url, dest, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(dest, buf);
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
}

/** Guard against absolute paths and .. in archive entries. */
function safeEntries(files) {
  for (const f of files) {
    const p = resolve(String(f));
    if (p.startsWith('..') || String(f).startsWith('/') || String(f).includes('..\\')) {
      throw new Error(`unsafe archive entry rejected: ${f}`);
    }
  }
  return files;
}

async function main() {
  validateApps();
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, 'play'), { recursive: true });
  const tmp = join(ROOT, 'tmp', 'assembled');
  mkdirSync(tmp, { recursive: true });

  for (const app of apps.apps) {
    if (app.status !== 'live') continue;
    const url = `https://github.com/${app.repo}/releases/download/v${app.version}/${app.slug}-${app.version}.tar.gz`;
    const archive = join(tmp, `${app.slug}-${app.version}.tar.gz`);
    console.log(`assemble: downloading ${url}`);
    await fetchWithRetry(url, archive);

    const hash = createHash('sha256').update(readFileSync(archive)).digest('hex');
    if (hash !== app.sha256) {
      throw new Error(`checksum mismatch for ${app.slug}: expected ${app.sha256}, got ${hash}`);
    }

    const dest = join(DIST, 'play', app.slug);
    mkdirSync(dest, { recursive: true });
    await tar.x({ file: archive, cwd: dest, onReadEntry: (entry) => { safeEntries([entry.path]); return entry; } });

    const manifestPath = join(dest, 'showcase.json');
    if (!existsSync(manifestPath)) throw new Error(`${app.slug}: showcase.json missing from release archive`);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (manifest.slug !== app.slug) throw new Error(`${app.slug}: showcase.json slug mismatch (${manifest.slug})`);
    if (manifest.version !== app.version) throw new Error(`${app.slug}: showcase.json version ${manifest.version} != apps.json ${app.version}`);
    for (const f of ['index.html', 'attribution.json', manifest.poster?.webp, manifest.poster?.jpg]) {
      if (!f || !existsSync(join(dest, f))) throw new Error(`${app.slug}: required file missing from release: ${f}`);
    }
    console.log(`assemble: ${app.slug} ${app.version} verified (sha256 ok)`);
  }
  console.log('assemble: done');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
