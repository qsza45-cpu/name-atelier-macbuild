// License key format, shared by the user app (verify) and the admin key generator (sign). No crypto here.
//
//   key text  = "NA1-" + Crockford-base32( payload(10 bytes) ‖ signature(64 bytes) ), grouped by 6
//   payload   = productCode(1) ‖ formatVersion(1) ‖ keyId(8 random bytes)
//   signed    = UTF-8("NAME-ATELIER:license:v1:") ‖ payload      (Ed25519)
//
// The product name and format version are inside the signed bytes, so a key for another product or format fails
// verification even if someone edits the visible prefix.

export const PRODUCT_ID = 'NAME-ATELIER';
export const PRODUCT_CODE = 0x4e; // 'N'
export const FORMAT_VERSION = 1;
export const KEY_PREFIX = 'NA1';
export const PAYLOAD_LEN = 10;
export const SIG_LEN = 64;
export const KEY_ID_LEN = 8;
const GROUP = 6;

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I L O U

export function base32Encode(bytes: Uint8Array): string {
  let out = '';
  let bits = 0;
  let value = 0;
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Uint8Array | null {
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of text) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) return null;
    value = ((value << 5) | v) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

/** The exact bytes that are signed for a payload. */
export function signedMessage(payload: Uint8Array): Uint8Array {
  const head = new TextEncoder().encode(`${PRODUCT_ID}:license:v${FORMAT_VERSION}:`);
  const msg = new Uint8Array(head.length + payload.length);
  msg.set(head, 0);
  msg.set(payload, head.length);
  return msg;
}

export function makePayload(keyId: Uint8Array): Uint8Array {
  if (keyId.length !== KEY_ID_LEN) throw new Error('key id must be 8 bytes');
  const p = new Uint8Array(PAYLOAD_LEN);
  p[0] = PRODUCT_CODE;
  p[1] = FORMAT_VERSION;
  p.set(keyId, 2);
  return p;
}

/** Builds the text a user types or pastes. */
export function encodeKey(payload: Uint8Array, signature: Uint8Array): string {
  const all = new Uint8Array(payload.length + signature.length);
  all.set(payload, 0);
  all.set(signature, payload.length);
  const body = base32Encode(all);
  const groups = body.match(new RegExp(`.{1,${GROUP}}`, 'g')) ?? [];
  return [KEY_PREFIX, ...groups].join('-');
}

export const keyIdText = (keyId: Uint8Array) =>
  Array.from(keyId, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .replace(/(.{4})(?=.)/g, '$1-');

export type ParseFailure = 'empty' | 'format' | 'product' | 'version';
export type Parsed = { ok: true; payload: Uint8Array; signature: Uint8Array; keyId: Uint8Array } | { ok: false; reason: ParseFailure };

/**
 * Accepts what people actually paste: spaces, line breaks, missing or extra dashes, lower case, and the
 * Crockford look-alikes (O→0, I/L→1). Checks the layout only; the signature is checked by the caller.
 */
export function parseKey(input: string): Parsed {
  let s = String(input ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[\s​ "'`“”‘’]/g, '');
  if (!s) return { ok: false, reason: 'empty' };
  s = s.replace(/[-–—_.]/g, '');
  if (s.startsWith(KEY_PREFIX)) s = s.slice(KEY_PREFIX.length);
  else if (/^NA\d/.test(s)) return { ok: false, reason: 'version' };
  s = s.replace(/O/g, '0').replace(/[IL]/g, '1');
  const bytes = base32Decode(s);
  const expectedChars = Math.ceil(((PAYLOAD_LEN + SIG_LEN) * 8) / 5);
  if (!bytes || s.length !== expectedChars || bytes.length !== PAYLOAD_LEN + SIG_LEN) return { ok: false, reason: 'format' };
  const payload = bytes.slice(0, PAYLOAD_LEN);
  if (payload[0] !== PRODUCT_CODE) return { ok: false, reason: 'product' };
  if (payload[1] !== FORMAT_VERSION) return { ok: false, reason: 'version' };
  return { ok: true, payload, signature: bytes.slice(PAYLOAD_LEN), keyId: payload.slice(2) };
}
