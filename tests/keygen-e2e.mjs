// Admin key generator tests on the real app (monitor 2). Uses isolated, throwaway keygen homes and an export
// folder in the OS temp dir — never the real admin data folder or the production signing key.
import { createRequire } from 'node:module';
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLicenseLib } from './helpers/testLicense.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
execSync('node scripts/build-admin.mjs', { cwd: root, stdio: 'ignore' });
// The electron package exports the path of its binary (electron.exe, or Electron.app/… on macOS).
const electron = createRequire(import.meta.url)('electron');
const L = await loadLicenseLib();
const shots = join(root, 'test-output', 'keygen-e2e');
mkdirSync(shots, { recursive: true });
const tmp = (p) => mkdtempSync(join(tmpdir(), p));

let skipped = false;
function run(name, env, js) {
  const shot = join(shots, `${name}.png`);
  const r = spawnSync(electron, ['dist-admin/main.js'], { cwd: root, env: { ...process.env, ...env, NAME_ATELIER_KEYGEN_SHOT: shot, NAME_ATELIER_KEYGEN_SHOT_JS: js }, timeout: 120000 });
  if (r.status === 3) skipped = true;
  return existsSync(`${shot}.json`) ? JSON.parse(readFileSync(`${shot}.json`, 'utf8')) : null;
}
const checks = {};

const homeA = tmp('na-kg-a-');
const exportDir = tmp('na-kg-out-');
const flow = `(async () => {
  const s = (ms) => new Promise((r) => setTimeout(r, ms));
  window.confirm = () => true; window.alert = () => {};
  const btn = (t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t));
  const out = { before: document.querySelector('#key-status').textContent, issueDisabledBefore: document.querySelector('#issue-btn').disabled };
  out.issueWithoutKey = await keygen.issue(3);
  btn('새 서명 키 만들기').click(); await s(500);
  out.after = document.querySelector('#key-status').textContent;
  const count = document.querySelector('#count');
  const issue = async (n) => { count.value = String(n); document.querySelector('#issue-form').requestSubmit(); await s(700); return [...document.querySelectorAll('#keys tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent)); };
  out.rows1 = await issue(1);
  out.rows100 = await issue(100);
  out.outOfRange = await keygen.issue(101);
  btn('목록 복사').click(); await s(200);
  btn('TXT 저장').click(); await s(300);
  btn('CSV 저장').click(); await s(300);
  btn('비밀키 백업 저장').click(); await s(300);
  return out;
})()`;
const a = run('1-create-issue', { NAME_ATELIER_KEYGEN_HOME: homeA, NAME_ATELIER_KEYGEN_EXPORT_DIR: exportDir }, flow);
if (skipped) {
  console.log('keygen e2e skipped: no second monitor (screen tests only run on monitor 2)');
  process.exit(3);
}
checks['no key: clear notice'] = /서명 키가 없습니다/.test(a?.before ?? '');
checks['no key: issuing blocked'] = a?.issueDisabledBefore === true && a?.issueWithoutKey?.ok === false;
checks['key created: fingerprint shown'] = /지문 [0-9A-F]{4}-/.test(a?.after ?? '');
const stored = JSON.parse(readFileSync(join(homeA, 'signing-key.json'), 'utf8'));
checks['private key not stored as plain text'] = stored.protection === 'os' && !JSON.stringify(stored).includes('PRIVATE KEY');
const pub = L.publicKeyFromBase64(stored.publicKey);
checks['1 key issued + valid'] = a?.rows1?.length === 1 && L.checkLicense(a.rows1[0][2], pub).ok;
const keys = (a?.rows100 ?? []).map((r) => r[2]);
const ids = (a?.rows100 ?? []).map((r) => r[1]);
checks['100 keys issued'] = keys.length === 100;
checks['100 keys distinct (keys and IDs)'] = new Set(keys).size === 100 && new Set(ids).size === 100;
checks['100 keys all valid, ID matches'] = (a?.rows100 ?? []).every((r) => {
  const v = L.checkLicense(r[2], pub);
  return v.ok && v.keyId === r[1];
});
checks['count over 100 refused'] = a?.outOfRange?.ok === false;
const files = readdirSync(exportDir);
const txt = files.find((f) => f.endsWith('.txt'));
const csv = files.find((f) => f.endsWith('.csv'));
const pem = files.find((f) => f.endsWith('.pem'));
const txtLines = txt ? readFileSync(join(exportDir, txt), 'utf8').trim().split(/\r?\n/) : [];
const csvLines = csv ? readFileSync(join(exportDir, csv), 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/) : [];
checks['TXT: 100 keys, same as list'] = txtLines.length === 100 && txtLines.every((k, i) => k === keys[i]);
checks['CSV: header + 100 rows with IDs'] = csvLines[0] === '번호,키 ID,인증키,생성일' && csvLines.length === 101 && csvLines.slice(1).every((l, i) => l.split(',')[1] === ids[i] && l.split(',')[2] === keys[i]);
const clip = execSync(process.platform === 'win32' ? 'powershell -NoProfile -Command "Get-Clipboard"' : 'pbpaste', { encoding: 'utf8' }).trim().split(/\r?\n/);
checks['copy: clipboard holds the 100 keys'] = clip.length === 100 && clip[0] === keys[0] && clip[99] === keys[99];
checks['backup file written'] = !!pem && readFileSync(join(exportDir, pem), 'utf8').includes('BEGIN PRIVATE KEY');

// Next launch of the same home: the stored (OS-encrypted) key must still open — this caught a lost-key bug.
const a2 = run('1b-reopen', { NAME_ATELIER_KEYGEN_HOME: homeA }, `(async () => { const s = await keygen.status(); const r = await keygen.issue(1); return { state: s.state, fp: s.fingerprint, key: r.keys?.[0]?.key }; })()`);
const fpA0 = /지문 ([0-9A-F-]{19})/.exec(a?.after ?? '')?.[1];
checks['stored key opens again on the next launch'] = a2?.state === 'ok' && a2.fp === fpA0 && L.checkLicense(a2?.key ?? '', pub).ok;
checks['new key: backup offered right after creation'] = readdirSync(exportDir).filter((f) => f.endsWith('.pem')).length >= 1;

// Restore the backup on a "new computer" (empty home): same fingerprint, keys still valid.
const homeB = tmp('na-kg-b-');
const b = run('2-import', { NAME_ATELIER_KEYGEN_HOME: homeB, NAME_ATELIER_KEYGEN_IMPORT_FILE: join(exportDir, pem ?? 'x') }, `(async () => {
  window.confirm = () => true; window.alert = () => {};
  [...document.querySelectorAll('button')].find((x) => x.textContent.includes('백업에서 불러오기')).click();
  await new Promise((r) => setTimeout(r, 600));
  const r = await keygen.issue(1);
  return { status: document.querySelector('#key-status').textContent, key: r.keys?.[0]?.key };
})()`);
const fpA = /지문 ([0-9A-F-]{19})/.exec(a?.after ?? '')?.[1];
checks['backup restores the same signing key'] = !!fpA && (b?.status ?? '').includes(fpA) && L.checkLicense(b?.key ?? '', pub).ok;

// Broken key file → clear message, issuing refused.
const homeC = tmp('na-kg-c-');
writeFileSync(join(homeC, 'signing-key.json'), '{"version":1,"publicKey":"x","protection":"none","privateKey":"not a key"}');
const c = run('3-broken', { NAME_ATELIER_KEYGEN_HOME: homeC }, `(async () => ({ status: document.querySelector('#key-status').textContent, issue: await keygen.issue(1) }))()`);
checks['broken key: clear message, issuing refused'] = /쓸 수 없습니다/.test(c?.status ?? '') && c?.issue?.ok === false;

const failed = Object.entries(checks).filter(([, v]) => !v);
console.log(`keygen e2e: ${Object.keys(checks).length - failed.length} passed, ${failed.length} failed`);
for (const [k] of failed) console.log('  FAIL', k);
process.exit(failed.length ? 1 : 0);
