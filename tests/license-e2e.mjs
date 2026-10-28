// License screen tests on the real app (monitor 2, isolated test homes, throwaway test key).
// Exit 3 = skipped because there is no second monitor.
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeTestLicense, loadLicenseLib } from './helpers/testLicense.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
execSync('node scripts/build.mjs', { cwd: root, stdio: 'ignore' });
const electron = join(root, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron');
const lic = await makeTestLicense();
const L = await loadLicenseLib();
const shotsDir = join(root, 'test-output', 'license-e2e');
execSync(`node -e "require('fs').mkdirSync(process.argv[1],{recursive:true})" "${shotsDir}"`);

let skipped = false;
function run(home, name, js) {
  const shot = join(shotsDir, `${name}.png`);
  const r = spawnSync(electron, ['.'], { cwd: root, env: { ...process.env, ...lic.env, NAME_ATELIER_HOME: home, NAME_ATELIER_SHOT: shot, NAME_ATELIER_SHOT_JS: js }, timeout: 90000 });
  if (r.status === 3) skipped = true;
  return existsSync(`${shot}.json`) ? JSON.parse(readFileSync(`${shot}.json`, 'utf8')) : null;
}
const newHome = () => mkdtempSync(join(tmpdir(), 'na-lic-e2e-'));
const checks = {};

// Page probe: which screen is showing, and can the page reach the main-screen IPC?
const probe = `(async () => {
  let storeBlocked = false;
  try { await window.atelier.load(); } catch { storeBlocked = true; }
  return { page: location.pathname.split('/').pop(), hasCards: !!document.querySelector('.draw'), hasKeyBox: !!document.querySelector('#key'), notice: document.querySelector('#notice') && !document.querySelector('#notice').hidden ? document.querySelector('#notice').textContent : '', storeBlocked };
})()`;
const typeAndSubmit = (text) => `(async () => {
  const s = (ms) => new Promise((r) => setTimeout(r, ms));
  const box = document.querySelector('#key');
  box.value = ${JSON.stringify(text)};
  box.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('#form').requestSubmit();
  await s(300);
  return { msg: document.querySelector('#msg').textContent };
})()`;

// 1. Unlicensed: key screen only, main-screen IPC refused. Existing favourites are kept.
const homeA = newHome();
writeFileSync(join(homeA, 'name-atelier-data.json'), JSON.stringify({ version: 1, favorites: [{ id: 'ko:김서윤', ko: '김서윤', orig: 'Kim Seo-yun', genre: 'modern', style: 'ko', gender: 'f', savedAt: '2026-10-28T00:00:00Z', memo: '보존 확인' }], settings: {} }));
const p1 = run(homeA, '1-unlicensed', probe);
if (skipped) {
  console.log('license e2e skipped: no second monitor (screen tests only run on monitor 2)');
  process.exit(3);
}
checks['unlicensed: key screen shown'] = p1?.page === 'license.html' && p1.hasKeyBox && !p1.hasCards;
checks['unlicensed: main features blocked (store IPC refused)'] = p1?.storeBlocked === true;

// 2. Wrong inputs are refused with a message; nothing is saved.
const bad = run(homeA, '2-bad', typeAndSubmit('NA1-ABCDEF-123456'));
checks['bad format refused'] = /형식/.test(bad?.msg ?? '');
const otherProduct = (() => {
  const p = L.makePayload(Buffer.alloc(8, 3));
  p[0] = 0x50;
  return L.encodeKey(p, Buffer.alloc(64, 1));
})();
const op = run(homeA, '3-other-product', typeAndSubmit(otherProduct));
checks['other-product key refused'] = /NAME ATELIER용 인증키가 아닙니다/.test(op?.msg ?? '');
const foreign = L.issueKeys(L.newSigningKey(), 1)[0].key;
const fk = run(homeA, '4-foreign', typeAndSubmit(foreign));
checks['key from another signing key refused'] = /유효하지 않은/.test(fk?.msg ?? '');
checks['nothing saved after refusals'] = !existsSync(join(homeA, 'license.json'));

// 3. Valid key (pasted with spaces and line breaks) → main screen; license stored.
const ok = run(homeA, '5-activate', typeAndSubmit(`\n  ${lic.key.toLowerCase()}  \r\n`));
checks['valid key accepted'] = /인증되었습니다/.test(ok?.msg ?? '');
checks['license stored'] = existsSync(join(homeA, 'license.json'));

// 4. Restart: straight to the main screen, favourites intact.
const p4 = run(homeA, '6-restart', `(${probe}).then(async (r) => ({ ...r, fav: (await window.atelier.load()).favorites.map((f) => f.memo).join(',') }))`);
checks['restart: stays licensed'] = p4?.page === 'index.html' && p4.hasCards && !p4.storeBlocked;
checks['restart: favourites kept'] = p4?.fav === '보존 확인';

// 5. Tampered license.json → key screen again (with notice), favourites still intact afterwards.
const licFile = join(homeA, 'license.json');
const saved = JSON.parse(readFileSync(licFile, 'utf8'));
const chars = saved.key.split('');
const i = chars.length - 8;
chars[i] = chars[i] === 'A' ? 'B' : 'A';
writeFileSync(licFile, JSON.stringify({ ...saved, key: chars.join('') }));
const p5 = run(homeA, '7-tampered', probe);
checks['tampered key: re-entry required'] = p5?.page === 'license.html' && p5.storeBlocked;
checks['tampered key: notice shown'] = /다시 입력/.test(p5?.notice ?? '');
writeFileSync(licFile, JSON.stringify({ version: 1, authenticated: true, licensed: true }));
const p5b = run(homeA, '8-flag-only', probe);
checks['"authenticated: true" alone is not accepted'] = p5b?.page === 'license.html';
writeFileSync(licFile, '{ broken json');
const p5c = run(homeA, '9-broken-file', probe);
checks['broken license file: re-entry required'] = p5c?.page === 'license.html';
run(homeA, '10-reactivate', typeAndSubmit(lic.key));
const p5d = run(homeA, '11-after-reactivate', `(${probe}).then(async (r) => ({ ...r, fav: (await window.atelier.load()).favorites.map((f) => f.memo).join(',') }))`);
checks['re-activation works, favourites kept'] = p5d?.page === 'index.html' && p5d.fav === '보존 확인';

// 6. Same key in a separate user environment (another home) works too.
const homeB = newHome();
run(homeB, '12-second-env', typeAndSubmit(lic.key));
const p6 = run(homeB, '13-second-env-restart', probe);
checks['same key works in a second environment'] = p6?.page === 'index.html' && p6.hasCards;

const failed = Object.entries(checks).filter(([, v]) => !v);
console.log(`license e2e: ${Object.keys(checks).length - failed.length} passed, ${failed.length} failed`);
for (const [k] of failed) console.log('  FAIL', k);
console.log(`screenshots: ${shotsDir}`);
process.exit(failed.length ? 1 : 0);
