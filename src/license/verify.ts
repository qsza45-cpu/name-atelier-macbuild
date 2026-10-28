// License check for the user app's main process: Ed25519 signature verification with Node's built-in crypto.
// This file holds no private key and no signing code — only the public key and verify().
import { createPublicKey, verify, type KeyObject } from 'node:crypto';
import { keyIdText, parseKey, signedMessage, type ParseFailure } from './format';

// DER prefix that turns a raw 32-byte Ed25519 public key into SPKI.
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export function publicKeyFromBase64(rawB64: string): KeyObject {
  const raw = Buffer.from(rawB64, 'base64');
  if (raw.length !== 32) throw new Error('public key must be 32 bytes');
  return createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: 'der', type: 'spki' });
}

export type LicenseResult = { ok: true; keyId: string; normalized: string } | { ok: false; reason: ParseFailure | 'signature' };

/** Parses and verifies a pasted key. `normalized` is the canonical text to store. */
export function checkLicense(input: string, publicKey: KeyObject): LicenseResult {
  const p = parseKey(input);
  if (!p.ok) return p;
  let valid = false;
  try {
    valid = verify(null, Buffer.from(signedMessage(p.payload)), publicKey, Buffer.from(p.signature));
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, reason: 'signature' };
  return { ok: true, keyId: keyIdText(p.keyId), normalized: String(input).trim() };
}

/** Messages shown to people (no implementation details). */
export const LICENSE_MESSAGES: Record<ParseFailure | 'signature' | 'corrupt', string> = {
  empty: '인증키를 붙여 넣어 주세요.',
  format: '인증키 형식이 올바르지 않습니다. 받은 인증키 전체를 그대로 붙여 넣어 주세요.',
  product: 'NAME ATELIER용 인증키가 아닙니다. 받은 인증키를 다시 확인해 주세요.',
  version: '이 버전에서 사용할 수 없는 인증키입니다. 받은 인증키를 다시 확인해 주세요.',
  signature: '유효하지 않은 인증키입니다. 한 글자라도 바뀌지 않았는지 확인해 주세요.',
  corrupt: '저장된 인증 정보를 확인할 수 없습니다. 인증키를 다시 입력해 주세요.',
};
