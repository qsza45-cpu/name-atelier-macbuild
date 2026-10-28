// License tests with throwaway test keys generated in memory (never the production signing key).
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sign } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(mkdtempSync(join(tmpdir(), 'na-lic-')), 'lic.mjs');
await build({
  stdin: { contents: "export * from './src/license/format'; export * from './src/license/verify'; export * from './admin-keygen/signing';", resolveDir: root, loader: 'ts' },
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
});
const L = await import(pathToFileURL(out).href);

let pass = 0;
const fails = [];
const check = (name, ok, detail = '') => (ok ? pass++ : fails.push(`${name}${detail ? ` — ${detail}` : ''}`));

const test = L.newSigningKey(); // test key A
const other = L.newSigningKey(); // test key B (stands in for "someone else's key")
const pub = L.publicKeyFromBase64(test.publicRawB64);

// 1 and 100 keys: all distinct, all valid, IDs embedded.
const one = L.issueKeys(test, 1);
check('issue 1', one.length === 1 && L.checkLicense(one[0].key, pub).ok);
const hundred = L.issueKeys(test, 100);
check('issue 100', hundred.length === 100);
check('100 distinct keys', new Set(hundred.map((k) => k.key)).size === 100);
check('100 distinct ids', new Set(hundred.map((k) => k.id)).size === 100);
check('100 all verify', hundred.every((k) => L.checkLicense(k.key, pub).ok));
check('id matches verified key id', hundred.every((k) => L.checkLicense(k.key, pub).keyId === k.id));
check('count clamps to 1..100', L.issueKeys(test, 500).length === 100 && L.issueKeys(test, 0).length === 1);
check('key text shape', /^NA1(-[0-9A-HJKMNP-TV-Z]{1,6}){20}$/.test(one[0].key), one[0].key);

// Signed bytes carry product id, format version and the key id.
const msg = Buffer.from(L.signedMessage(L.makePayload(Buffer.alloc(8, 7)))).toString('latin1');
check('signed message has product + version', msg.startsWith('NAME-ATELIER:license:v1:'));

// Paste tolerance.
const k = one[0].key;
const messy = `  \n${k.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o')}\r\n `;
check('whitespace / case / dashes / O→0 accepted', L.checkLicense(messy, pub).ok);
check('no dashes accepted', L.checkLicense(k.replace(/-/g, ''), pub).ok);

// Tampering: flip one character in the signature part and in the payload part.
const body = k.replace(/-/g, '');
const flip = (s, i) => s.slice(0, i) + (s[i] === 'A' ? 'B' : 'A') + s.slice(i + 1);
check('tampered signature rejected', L.checkLicense(flip(body, body.length - 10), pub).reason === 'signature');
check('tampered key id rejected', L.checkLicense(flip(body, 8), pub).ok === false);

// Wrong format, empty.
check('empty', L.checkLicense('   \n ', pub).reason === 'empty');
check('garbage', L.checkLicense('hello-world-1234', pub).reason === 'format');
check('too short', L.checkLicense(k.slice(0, 40), pub).reason === 'format');
check('too long', L.checkLicense(k + 'AB', pub).reason === 'format');
check('authenticated=true is not a key', L.checkLicense('authenticated=true', pub).ok === false);

// Keys signed with a different private key fail.
const foreign = L.issueKeys(other, 1)[0].key;
check('other signing key rejected', L.checkLicense(foreign, pub).reason === 'signature');

// Other product: wrong product code → product; right code but another product's signed message → signature.
{
  const id = Buffer.alloc(8, 9);
  const p = L.makePayload(id);
  p[0] = 0x50; // some other product's code
  const s = sign(null, Buffer.from(L.signedMessage(p)), test.privateKey);
  check('other product code rejected', L.checkLicense(L.encodeKey(p, s), pub).reason === 'product');
  const p2 = L.makePayload(id);
  const otherMsg = Buffer.concat([Buffer.from('OTHER-APP:license:v1:'), Buffer.from(p2)]);
  const s2 = sign(null, otherMsg, test.privateKey);
  check('other product signature rejected', L.checkLicense(L.encodeKey(p2, s2), pub).reason === 'signature');
  const p3 = L.makePayload(id);
  p3[1] = 2; // future format
  const s3 = sign(null, Buffer.from(L.signedMessage(p3)), test.privateKey);
  check('unknown format version rejected', L.checkLicense(L.encodeKey(p3, s3), pub).reason === 'version');
  check('other prefix rejected', L.checkLicense('NA2' + k.slice(3), pub).reason === 'version');
}

// Backup round trip keeps the same key; a non-key file is refused.
const restored = L.signingKeyFromPem(`메모 줄\n${L.privatePem(test)}\n끝`);
check('backup round trip', restored.publicRawB64 === test.publicRawB64 && L.checkLicense(L.issueKeys(restored, 1)[0].key, pub).ok);
let refused = false;
try {
  L.signingKeyFromPem('-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----');
} catch {
  refused = true;
}
check('non-private-key backup refused', refused);
check('fingerprint shape', /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/.test(L.fingerprint(test.publicRawB64)));

console.log(`license tests: ${pass} passed, ${fails.length} failed`);
for (const f of fails) console.log('  FAIL', f);
process.exit(fails.length ? 1 : 0);
