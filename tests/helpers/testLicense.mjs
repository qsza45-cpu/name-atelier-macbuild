// Test-only license helpers: a throwaway Ed25519 key pair made in memory for each test run.
// The production signing key is never used or read by tests.
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export async function loadLicenseLib() {
  const out = join(mkdtempSync(join(tmpdir(), 'na-lic-')), 'lic.mjs');
  await build({
    stdin: { contents: "export * from './src/license/format'; export * from './src/license/verify'; export * from './admin-keygen/signing';", resolveDir: root, loader: 'ts' },
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
  });
  return import(pathToFileURL(out).href);
}

/** A test signing key plus one issued key; `env` points a dev run of the app at the test public key. */
export async function makeTestLicense() {
  const L = await loadLicenseLib();
  const signing = L.newSigningKey();
  const [issued] = L.issueKeys(signing, 1);
  return { L, signing, key: issued.key, id: issued.id, env: { NAME_ATELIER_LICENSE_PUBKEY: signing.publicRawB64 } };
}

/** Pre-activates a test home so screen tests can go straight to the main screen. */
export function seedLicense(home, key) {
  writeFileSync(join(home, 'license.json'), JSON.stringify({ version: 1, key, activatedAt: new Date().toISOString() }), 'utf8');
}
