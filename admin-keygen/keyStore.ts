// Where the admin tool keeps the signing (private) key: a JSON file in its own app-data folder, outside the project
// and outside every build. The private key is encrypted with Electron safeStorage (Windows DPAPI: readable only by
// this Windows account) when available. Backups are plain PEM files the admin keeps offline.
import { safeStorage } from 'electron';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { privatePem, signingKeyFromPem, type SigningKey } from './signing';

interface StoredKey {
  version: 1;
  publicKey: string; // raw base64, for display and mismatch checks
  protection: 'os' | 'none';
  privateKey: string; // base64 of safeStorage ciphertext ('os'), or PEM text ('none')
  createdAt: string;
  source: 'created' | 'imported';
}

export type LoadResult = { state: 'ok'; key: SigningKey; createdAt: string; protection: 'os' | 'none'; source: StoredKey['source'] } | { state: 'missing' } | { state: 'broken'; detail: string };

export const keyFile = (dir: string) => join(dir, 'signing-key.json');

export function loadKey(dir: string): LoadResult {
  const file = keyFile(dir);
  if (!existsSync(file)) return { state: 'missing' };
  try {
    const s = JSON.parse(readFileSync(file, 'utf8')) as StoredKey;
    const pem = s.protection === 'os' ? safeStorage.decryptString(Buffer.from(s.privateKey, 'base64')) : s.privateKey;
    const key = signingKeyFromPem(pem);
    if (key.publicRawB64 !== s.publicKey) return { state: 'broken', detail: '저장된 공개키와 비밀키가 서로 맞지 않습니다.' };
    return { state: 'ok', key, createdAt: s.createdAt, protection: s.protection, source: s.source };
  } catch (e: any) {
    return { state: 'broken', detail: e?.message === 'no-private-key' || e?.message === 'not-ed25519' ? '비밀키 형식이 올바르지 않습니다.' : '비밀키 파일을 읽을 수 없습니다(다른 Windows 계정에서 만들었거나 파일이 손상됨).' };
  }
}

export function saveKey(dir: string, key: SigningKey, source: StoredKey['source']) {
  const file = keyFile(dir);
  // Never silently replace an existing key: keep the old file next to it.
  if (existsSync(file)) renameSync(file, `${file}.replaced-${Date.now()}`);
  const pem = privatePem(key);
  const os = safeStorage.isEncryptionAvailable();
  const stored: StoredKey = {
    version: 1,
    publicKey: key.publicRawB64,
    protection: os ? 'os' : 'none',
    privateKey: os ? safeStorage.encryptString(pem).toString('base64') : pem,
    createdAt: new Date().toISOString(),
    source,
  };
  writeFileSync(file, JSON.stringify(stored, null, 2), { encoding: 'utf8', mode: 0o600 });
}

/** Text of a backup file: a short Korean note plus the PEM block (the importer reads only the PEM block). */
export function backupText(key: SigningKey, fingerprint: string) {
  return [
    'NAME ATELIER 인증키 생성기 — 서명 비밀키 백업',
    `만든 날: ${new Date().toISOString().slice(0, 10)}  ·  지문: ${fingerprint}`,
    '',
    '이 파일이 있으면 누구나 NAME ATELIER 인증키를 만들 수 있습니다.',
    '인터넷에 올리거나 메일·메신저로 보내지 마세요. USB 등 오프라인 저장소 두 곳에 보관하세요.',
    '이 파일을 잃으면 이미 배포한 NAME ATELIER가 받아들이는 새 인증키를 더 이상 만들 수 없습니다.',
    '',
    privatePem(key).trim(),
    '',
  ].join('\r\n');
}
