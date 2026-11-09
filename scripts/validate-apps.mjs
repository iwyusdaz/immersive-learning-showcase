/**
 * validate-apps.mjs — schema-check apps.json (CI gate).
 */
import { readFileSync } from 'node:fs';

const apps = JSON.parse(readFileSync('apps.json', 'utf8'));
const errors = [];
if (!Array.isArray(apps.apps) || apps.apps.length === 0) errors.push('apps.apps must be a non-empty array');
for (const a of apps.apps) {
  if (!/^[a-z0-9-]+$/.test(a.slug || '')) errors.push(`${a.slug}: bad slug`);
  if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(a.repo || '')) errors.push(`${a.slug}: bad repo`);
  if (!['live', 'coming-soon'].includes(a.status)) errors.push(`${a.slug}: bad status`);
  // A preview pin (plan 10 §8 owner previews, never merged to main) carries a pre-release version.
  const versionRe = a.previewTag ? /^\d+\.\d+\.\d+-preview\.[0-9a-f]{7}$/ : /^\d+\.\d+\.\d+$/;
  if (a.status === 'live' && (!a.version || !versionRe.test(a.version))) errors.push(`${a.slug}: live needs version`);
  if (a.previewTag && (!/^v\d+-preview-[0-9a-f]{7}$/.test(a.previewTag) || !/^[0-9a-f]{40}$/.test(a.commit || ''))) errors.push(`${a.slug}: preview pins need previewTag v<major>-preview-<sha7> and the full commit`);
  if (a.status === 'live' && (!a.sha256 || !/^[a-f0-9]{64}$/.test(a.sha256))) errors.push(`${a.slug}: live needs sha256`);
}
if (errors.length) {
  console.error('apps.json validation failed:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`apps.json OK (${apps.apps.length} apps)`);
