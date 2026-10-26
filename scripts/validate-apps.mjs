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
  if (a.status === 'live' && (!a.version || !/^\d+\.\d+\.\d+$/.test(a.version))) errors.push(`${a.slug}: live needs version`);
  if (a.status === 'live' && (!a.sha256 || !/^[a-f0-9]{64}$/.test(a.sha256))) errors.push(`${a.slug}: live needs sha256`);
}
if (errors.length) {
  console.error('apps.json validation failed:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`apps.json OK (${apps.apps.length} apps)`);
