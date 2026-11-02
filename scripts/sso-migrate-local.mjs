import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Match the local D1 binding/persistence configured by vite.config.ts.
// This command never touches a remote database or reads SSO credentials.
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(root, '.wrangler');
await mkdir(directory, { recursive: true });
const config = resolve(directory, 'sso-local.json');
await writeFile(config, JSON.stringify({
  name: 'tekad-arcade-local', compatibility_date: '2026-05-15',
  d1_databases: [{ binding: 'DB', database_name: 'site-creator-d1', database_id: '00000000-0000-4000-8000-000000000000' }],
}));
const result = spawnSync(process.execPath, [
  resolve(root, 'node_modules/wrangler/bin/wrangler.js'), 'd1', 'execute', 'DB', '--local',
  '--config', config, '--persist-to', resolve(directory, 'state'),
  '--file', resolve(root, 'drizzle/0009_arcade_auth_sessions.sql'),
], { cwd: root, stdio: 'inherit', env: { ...process.env, WRANGLER_LOG_PATH: resolve(directory, 'logs'), WRANGLER_SEND_METRICS: 'false' } });
if (result.error) { console.error('Tidak dapat menjalankan migrasi sesi lokal. Pastikan Node.js dan dependensi terpasang.'); process.exit(1); }
process.exit(result.status ?? 1);
