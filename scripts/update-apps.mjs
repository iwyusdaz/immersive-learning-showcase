/**
 * update-apps.mjs — used by check-releases.yml and locally.
 * --check: report which apps have a newer release than apps.json pins.
 * --update <slug> <version> <sha256>: set a pin (the caller computes the sha256
 * from the published <slug>-<version>.tar.gz.sha256 asset).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const mode = process.argv[2];
const appsFile = join(ROOT, 'apps.json');

async function latestRelease(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { accept: 'application/vnd.github+json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${repo}: GitHub API ${res.status}`);
  const data = await res.json();
  const asset = (data.assets || []).find((a) => a.name.endsWith('.tar.gz.sha256'));
  return { tag: data.tag_name, shaAsset: asset?.browser_download_url || null };
}

const apps = JSON.parse(readFileSync(appsFile, 'utf8'));

if (mode === '--check') {
  let stale = 0;
  for (const app of apps.apps) {
    const rel = await latestRelease(app.repo);
    const ver = rel?.tag?.replace(/^v/, '');
    const pinned = app.version;
    if (ver && ver !== pinned) {
      console.log(`${app.slug}: pinned ${pinned || 'none'} -> available ${ver} (sha: ${rel.shaAsset})`);
      stale++;
    } else {
      console.log(`${app.slug}: up to date${ver ? ` (${ver})` : ' (no release yet)'}`);
    }
  }
  process.exit(stale ? 2 : 0);
}

if (mode === '--update') {
  const [, , slug, version, sha256] = process.argv;
  const app = apps.apps.find((a) => a.slug === slug);
  if (!app) { console.error(`unknown slug ${slug}`); process.exit(1); }
  app.status = 'live';
  app.version = version;
  app.sha256 = sha256;
  writeFileSync(appsFile, JSON.stringify(apps, null, 2) + '\n');
  console.log(`apps.json: ${slug} pinned to ${version}`);
  process.exit(0);
}

console.error('usage: node scripts/update-apps.mjs --check | --update <slug> <version> <sha256>');
process.exit(1);
