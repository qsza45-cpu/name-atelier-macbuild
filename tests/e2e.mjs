// Screen smoke test: builds, launches the real app on monitor 2 (NAME_ATELIER_SHOT run) with a temporary store,
// drives it with tests/e2e-smoke.js and checks the result. Exits 1 on failure; skips (exit 3) without a second monitor.
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
execSync('node scripts/build.mjs', { cwd: root, stdio: 'ignore' });
const home = mkdtempSync(join(tmpdir(), 'na-e2e-'));
const shot = join(home, 'shot.png');
const electron = join(root, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron');
const r = spawnSync(electron, ['.'], { cwd: root, env: { ...process.env, NAME_ATELIER_HOME: home, NAME_ATELIER_SHOT: shot, NAME_ATELIER_SHOT_JS: readFileSync(join(root, 'tests', 'e2e-smoke.js'), 'utf8') }, timeout: 90000 });
if (r.status === 3) {
  console.log('e2e skipped: no second monitor (test windows only open on monitor 2)');
  process.exit(3);
}
if (!existsSync(`${shot}.json`)) {
  console.log('e2e failed: no result', r.stderr?.toString().slice(-500));
  process.exit(1);
}
const res = JSON.parse(readFileSync(`${shot}.json`, 'utf8'));
const checks = {
  'three names on first draw': res.first.filter(Boolean).length === 3,
  'favourite stays on reroll': res.keptStays,
  'no repeats in 50': res.dupsIn50 === 0,
  'all favourited → redraw all': res.allKeptRedrawn,
  'east region chips': JSON.stringify(res.eastChips) === JSON.stringify(['선협식', '무협식', '일본식']),
  'region remembers style': res.westRemembered === '독일식',
  'drawer lists favourites': res.drawerItems === 3,
};
const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(`e2e: ${Object.keys(checks).length - failed.length} passed, ${failed.length} failed`);
for (const [k] of failed) console.log('  FAIL', k);
process.exit(failed.length ? 1 : 0);
