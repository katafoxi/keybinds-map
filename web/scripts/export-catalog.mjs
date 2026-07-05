import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const script = resolve(repoRoot, 'scripts/export-catalog.mjs');

const result = spawnSync(process.execPath, [script], {
  cwd: repoRoot,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
