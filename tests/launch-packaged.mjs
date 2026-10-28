// Launches the PACKAGED user app (Windows win-unpacked, or the macOS .app for this machine's CPU) with an empty
// test home and checks it is still running after a few seconds (it should be showing the key-entry screen).
// On a desktop it opens on monitor 2 via NAME_ATELIER_DISPLAY=2; on CI (CI=true) the single screen is used.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir, arch } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = join(root, 'release');
let bin = null;
if (process.platform === 'win32') bin = join(rel, 'win-unpacked', 'NAME ATELIER.exe');
else if (process.platform === 'darwin') {
  const dirs = readdirSync(rel).filter((d) => d.startsWith('mac'));
  const native = dirs.find((d) => (arch() === 'arm64' ? d === 'mac-arm64' : d === 'mac')) ?? dirs[0];
  if (native) bin = join(rel, native, 'NAME ATELIER.app', 'Contents', 'MacOS', 'NAME ATELIER');
}
if (!bin || !existsSync(bin)) {
  console.log(`launch check failed: packaged app not found (${bin})`);
  process.exit(1);
}
const home = mkdtempSync(join(tmpdir(), 'na-launch-'));
const child = spawn(bin, [], { env: { ...process.env, NAME_ATELIER_HOME: home, NAME_ATELIER_DISPLAY: '2' }, stdio: 'ignore' });
let exited = null;
child.on('exit', (code) => (exited = code));
await new Promise((r) => setTimeout(r, 8000));
if (exited !== null) {
  console.log(`launch check failed: ${bin} exited early with code ${exited}`);
  process.exit(1);
}
child.kill();
console.log(`launch check: ${bin.slice(root.length + 1)} ran for 8 s without exiting`);
