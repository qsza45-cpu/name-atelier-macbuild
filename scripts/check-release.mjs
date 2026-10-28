// Release guard for the USER app. Before packaging: the real public key is embedded and dist/ has no signing code.
// With --packaged: the built app.asar (release/win-unpacked) and the release folder contain no admin tool,
// no private key and no signing code. Exits 1 on any finding.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packaged = process.argv.includes('--packaged');
const problems = [];

const pubSrc = readFileSync(join(root, 'src/license/publicKey.ts'), 'utf8');
if (pubSrc.includes("'PLACEHOLDER'")) problems.push('src/license/publicKey.ts still has the PLACEHOLDER public key');

// Things that must never appear in the user app: private key material, key generation/signing, the admin tool.
const FORBIDDEN = [
  [/-----BEGIN (ENCRYPTED )?PRIVATE KEY-----/, 'PEM private key'],
  [/generateKeyPair/, 'key-pair generation'],
  [/signingKeyFromPem|issueKeys|newSigningKey|privatePem/, 'admin signing code'],
  [/NAME_ATELIER_KEYGEN|signing-key\.json|admin-keygen|인증키 생성기/, 'admin tool'],
  [/createPrivateKey/, 'private key loading'],
];
function scanText(label, text) {
  for (const [re, what] of FORBIDDEN) if (re.test(text)) problems.push(`${label}: contains ${what} (${re})`);
}
function walk(dir, fn) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, fn);
    else fn(p);
  }
}

// The admin's real signing key must not be readable from the user build (compare its public half, never print it).
const adminKeyFile = join(process.env.APPDATA ?? '', 'NAME ATELIER Keygen', 'signing-key.json');
const adminStored = existsSync(adminKeyFile) ? JSON.parse(readFileSync(adminKeyFile, 'utf8')) : null;
const adminSecretB64 = adminStored?.privateKey && adminStored.privateKey.length > 40 ? adminStored.privateKey.slice(0, 40) : null;

if (!packaged) {
  walk(join(root, 'dist'), (p) => /\.(js|html|json)$/.test(p) && scanText(p.slice(root.length + 1), readFileSync(p, 'utf8')));
} else {
  // Windows: release/win-unpacked/resources/app.asar · macOS: release/mac*/NAME ATELIER.app/Contents/Resources/app.asar
  const candidates = [join(root, 'release', 'win-unpacked', 'resources', 'app.asar')];
  if (existsSync(join(root, 'release')))
    for (const d of readdirSync(join(root, 'release'))) if (d.startsWith('mac')) candidates.push(join(root, 'release', d, 'NAME ATELIER.app', 'Contents', 'Resources', 'app.asar'));
  const asars = candidates.filter((p) => existsSync(p));
  if (!asars.length) problems.push('no packaged app.asar found under release/');
  for (const asarPath of asars) {
    console.log(`checking ${asarPath.slice(root.length + 1)}`);
    const asar = createRequire(import.meta.url)('@electron/asar');
    // listPackage returns native paths (\dist\main.js on Windows); extractFile wants them without the leading separator.
    const files = asar.listPackage(asarPath);
    for (const raw of files) {
      const f = raw.replace(/\\/g, '/');
      if (/admin-keygen|dist-admin|signing-key|\.pem$|\.key$/i.test(f)) problems.push(`app.asar lists ${f}`);
      if (/\.(js|html|json|txt|md)$/.test(f)) {
        const text = asar.extractFile(asarPath, raw.replace(/^[\\/]/, '')).toString('utf8');
        scanText(`app.asar${f}`, text);
        if (adminSecretB64 && text.includes(adminSecretB64)) problems.push(`app.asar${f}: contains the admin's stored private key`);
      }
    }
    const main = asar.extractFile(asarPath, join('dist', 'main.js')).toString('utf8');
    const pub = /LICENSE_PUBLIC_KEY_B64(?:: string)? = '([^']+)'/.exec(pubSrc)?.[1];
    if (!pub || !main.includes(pub)) problems.push('packaged main.js does not embed the release public key');
    if (adminStored && pub && adminStored.publicKey !== pub) problems.push("embedded public key does not match the admin tool's signing key on this computer");
  }
  walk(join(root, 'release'), (p) => {
    if (/keygen|signing-key|\.pem$/i.test(p)) problems.push(`release folder has ${p}`);
  });
}

if (problems.length) {
  console.error(`release check failed (${problems.length}):`);
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}
console.log(packaged ? 'release check (packaged): no admin tool, private key or signing code in the user app; release public key embedded.' : 'release check: real public key set, dist/ clean.');
