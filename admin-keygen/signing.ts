// Admin-only signing helpers (never bundled into the user app): Ed25519 key pairs and license signing with Node's
// built-in crypto. The private key is held as a KeyObject in memory and stored only through keyStore.ts.
import { createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, sign, type KeyObject } from 'node:crypto';
import { encodeKey, keyIdText, makePayload, signedMessage, KEY_ID_LEN } from '../src/license/format';
import { checkLicense } from '../src/license/verify';

export interface SigningKey {
  privateKey: KeyObject;
  publicKey: KeyObject;
  publicRawB64: string; // 32-byte raw public key, base64 (what the user app embeds)
}

const rawPublic = (pub: KeyObject) => {
  const der = pub.export({ format: 'der', type: 'spki' });
  return Buffer.from(der.subarray(der.length - 32)).toString('base64');
};

export function newSigningKey(): SigningKey {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return { privateKey, publicKey, publicRawB64: rawPublic(publicKey) };
}

/** Loads a PKCS#8 PEM private key (from the store or a backup file); throws if it is not an Ed25519 key. */
export function signingKeyFromPem(pem: string): SigningKey {
  const block = pem.match(/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/);
  if (!block) throw new Error('no-private-key');
  const privateKey = createPrivateKey({ key: block[0], format: 'pem' });
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('not-ed25519');
  const publicKey = createPublicKey(privateKey);
  return { privateKey, publicKey, publicRawB64: rawPublic(publicKey) };
}

export const privatePem = (k: SigningKey) => k.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();

/** Short, human-comparable fingerprint of a public key (not secret). */
export function fingerprint(publicRawB64: string) {
  const hex = Buffer.from(publicRawB64, 'base64').toString('hex').toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(-8, -4)}-${hex.slice(-4)}`;
}

export interface IssuedKey {
  no: number;
  id: string; // 키 고유 ID (e.g. 3F9A-27C1-88D0-4E12)
  key: string;
  createdAt: string;
}

/** Issues `count` (1–100) distinct keys; each is verified against the key's own public key before it is returned. */
export function issueKeys(k: SigningKey, count: number): IssuedKey[] {
  const n = Math.max(1, Math.min(100, Math.floor(count)));
  const seen = new Set<string>();
  const out: IssuedKey[] = [];
  const createdAt = new Date().toISOString();
  while (out.length < n) {
    const keyId = randomBytes(KEY_ID_LEN);
    const idHex = keyId.toString('hex');
    if (seen.has(idHex)) continue;
    seen.add(idHex);
    const payload = makePayload(keyId);
    const signature = sign(null, Buffer.from(signedMessage(payload)), k.privateKey);
    const key = encodeKey(payload, signature);
    if (!checkLicense(key, k.publicKey).ok) throw new Error('self-check failed');
    out.push({ no: out.length + 1, id: keyIdText(keyId), key, createdAt });
  }
  return out;
}
