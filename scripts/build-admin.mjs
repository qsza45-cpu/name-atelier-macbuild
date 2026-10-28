// Builds the admin key generator (admin-keygen/) into dist-admin/. Kept apart from dist/ so the user app's
// package (dist/**) can never pick up signing code.
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist-admin');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const common = { bundle: true, logLevel: 'warning', absWorkingDir: root };
await Promise.all([
  build({ ...common, entryPoints: ['admin-keygen/main.ts'], outfile: 'dist-admin/main.js', platform: 'node', format: 'cjs', target: 'node22', external: ['electron'] }),
  build({ ...common, entryPoints: ['admin-keygen/preload.ts'], outfile: 'dist-admin/preload.js', platform: 'node', format: 'cjs', target: 'node22', external: ['electron'] }),
  build({ ...common, entryPoints: ['admin-keygen/renderer.ts'], outfile: 'dist-admin/keygen.js', platform: 'browser', format: 'iife', target: 'chrome138', minify: true }),
]);
for (const f of ['index.html', 'keygen.css']) cpSync(join(root, 'admin-keygen', f), join(out, f));
console.log('NAME ATELIER Keygen built → dist-admin/');
