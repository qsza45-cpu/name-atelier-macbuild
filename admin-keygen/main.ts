// NAME ATELIER 인증키 생성기 (admin only): keeps the signing key in its own app-data folder and issues license keys.
// Separate app and build from NAME ATELIER; never shipped to users. Offline: every network request is blocked.
import { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, screen, session } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LICENSE_PUBLIC_KEY_B64 } from '../src/license/publicKey';
import { backupText, keyFile, loadKey, saveKey } from './keyStore';
import { fingerprint, issueKeys, newSigningKey, signingKeyFromPem, type IssuedKey } from './signing';

app.setName('NAME ATELIER Keygen');
if (process.env.NAME_ATELIER_KEYGEN_HOME) app.setPath('userData', process.env.NAME_ATELIER_KEYGEN_HOME);
const dev = !app.isPackaged;
const shot = dev && process.env.NAME_ATELIER_KEYGEN_SHOT;
// Dev/test only: write exports straight into this folder instead of asking with a save dialog.
const exportDir = dev ? process.env.NAME_ATELIER_KEYGEN_EXPORT_DIR : undefined;
const dataDir = () => app.getPath('userData');

function status() {
  const r = loadKey(dataDir());
  const expected = LICENSE_PUBLIC_KEY_B64 === 'PLACEHOLDER' ? null : LICENSE_PUBLIC_KEY_B64;
  if (r.state !== 'ok') return { state: r.state, detail: r.state === 'broken' ? r.detail : '', file: keyFile(dataDir()), expected: expected ? fingerprint(expected) : null };
  return {
    state: 'ok' as const,
    fingerprint: fingerprint(r.key.publicRawB64),
    matchesApp: expected ? r.key.publicRawB64 === expected : null,
    expected: expected ? fingerprint(expected) : null,
    createdAt: r.createdAt,
    protection: r.protection,
    source: r.source,
    file: keyFile(dataDir()),
  };
}

const stamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

async function saveText(win: BrowserWindow | null, defaultName: string, content: string, filters: Electron.FileFilter[]) {
  if (exportDir) {
    const p = join(exportDir, defaultName);
    writeFileSync(p, content, 'utf8');
    return { saved: true, path: p };
  }
  const opts = { defaultPath: join(app.getPath('documents'), defaultName), filters };
  const r = win ? await dialog.showSaveDialog(win, opts) : await dialog.showSaveDialog(opts);
  if (r.canceled || !r.filePath) return { saved: false };
  try {
    writeFileSync(r.filePath, content, 'utf8');
    return { saved: true, path: r.filePath };
  } catch (e: any) {
    return { saved: false, error: String(e?.code ?? e?.message ?? e) };
  }
}

const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : /^[=+\-@]/.test(v) ? `'${v}` : v);

function createWindow() {
  let pos: { x: number; y: number } | undefined;
  if (shot) {
    const d = screen.getAllDisplays().find((x) => x.id !== screen.getPrimaryDisplay().id);
    if (!d) {
      console.error('Keygen: 모니터 2를 찾지 못해 시험 실행을 중단합니다.');
      app.exit(3);
      return;
    }
    pos = { x: d.workArea.x + 80, y: d.workArea.y + 80 };
  }
  const win = new BrowserWindow({
    ...(pos ?? {}),
    width: 900,
    height: 720,
    minWidth: 760,
    minHeight: 600,
    title: 'NAME ATELIER 인증키 생성기 (관리자용)',
    backgroundColor: '#F4EDE2',
    webPreferences: { preload: join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false, backgroundThrottling: !shot },
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (shot) {
    win.webContents.once('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, 600));
      if (process.env.NAME_ATELIER_KEYGEN_SHOT_JS) {
        // A failing test script must still end the run (and say why) instead of leaving the window open.
        const result = await win.webContents.executeJavaScript(process.env.NAME_ATELIER_KEYGEN_SHOT_JS).catch((e) => ({ scriptError: String(e?.message ?? e) }));
        if (result !== undefined) writeFileSync(`${shot}.json`, JSON.stringify(result, null, 2));
      }
      await new Promise((r) => setTimeout(r, 600));
      writeFileSync(shot, (await win.webContents.capturePage()).toPNG());
      app.quit();
    });
  }
  win.loadFile(join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !/^(file|devtools|data):/.test(d.url) }));
  session.defaultSession.setPermissionRequestHandler((_w, _p, cb) => cb(false));
  Menu.setApplicationMenu(process.platform === 'darwin' ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }]) : null);

  // Dev only: create the production signing key without the window and print its PUBLIC key (never the private one).
  if (dev && process.env.NAME_ATELIER_KEYGEN_INIT === '1') {
    const cur = loadKey(dataDir());
    if (cur.state === 'ok') console.log(`PUBLIC_KEY=${cur.key.publicRawB64}`);
    else if (cur.state === 'missing') {
      const k = newSigningKey();
      saveKey(dataDir(), k, 'created');
      console.log(`PUBLIC_KEY=${k.publicRawB64}`);
    } else console.log('BROKEN');
    // Quit normally (never app.exit): the OS-encryption key that protects the stored private key is written to
    // "Local State" only during a graceful shutdown. Exiting abruptly would leave the stored key unreadable.
    app.quit();
    return;
  }

  ipcMain.handle('key:status', () => status());
  ipcMain.handle('key:create', () => {
    if (loadKey(dataDir()).state === 'ok') return { ok: false, error: '이미 서명 키가 있습니다. 교체하려면 백업에서 불러오기를 쓰세요.' };
    saveKey(dataDir(), newSigningKey(), 'created');
    // Make sure the OS-encryption key reaches disk now rather than only at shutdown (see the INIT note above).
    session.defaultSession.flushStorageData();
    return { ok: true };
  });
  ipcMain.handle('key:import', async (e) => {
    // Dev/test only: import this file instead of asking with an open dialog.
    let file = dev ? process.env.NAME_ATELIER_KEYGEN_IMPORT_FILE : undefined;
    if (!file) {
      const win = BrowserWindow.fromWebContents(e.sender);
      const r = await dialog.showOpenDialog(win!, { title: '서명 비밀키 백업 불러오기', properties: ['openFile'], filters: [{ name: '비밀키 백업', extensions: ['pem', 'txt', 'key'] }] });
      if (r.canceled || !r.filePaths[0]) return { ok: false };
      file = r.filePaths[0];
    }
    try {
      const k = signingKeyFromPem(readFileSync(file, 'utf8'));
      saveKey(dataDir(), k, 'imported');
      return { ok: true };
    } catch {
      return { ok: false, error: '이 파일에서 서명 비밀키를 찾을 수 없습니다. 생성기에서 만든 백업 파일인지 확인해 주세요.' };
    }
  });
  ipcMain.handle('key:backup', async (e) => {
    const r = loadKey(dataDir());
    if (r.state !== 'ok') return { saved: false, error: '백업할 서명 키가 없습니다.' };
    return saveText(BrowserWindow.fromWebContents(e.sender), `NAME_ATELIER_서명비밀키_백업_${stamp()}.pem`, backupText(r.key, fingerprint(r.key.publicRawB64)), [{ name: '비밀키 백업', extensions: ['pem'] }]);
  });
  ipcMain.handle('keys:issue', (_e, count: number) => {
    const r = loadKey(dataDir());
    if (r.state !== 'ok') return { ok: false, error: r.state === 'missing' ? '서명 키가 없습니다. 먼저 서명 키를 만들거나 백업에서 불러오세요.' : `서명 키를 쓸 수 없습니다: ${r.detail}` };
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 100) return { ok: false, error: '1부터 100 사이의 개수를 입력해 주세요.' };
    return { ok: true, keys: issueKeys(r.key, n) };
  });
  ipcMain.handle('keys:copy', (_e, text: string) => clipboard.writeText(String(text ?? '')));
  ipcMain.handle('keys:export', async (e, kind: 'txt' | 'csv', keys: IssuedKey[]) => {
    const rows = Array.isArray(keys) ? keys : [];
    const name = `NAME_ATELIER_인증키_${rows.length}개_${stamp()}_${Date.now().toString(36).slice(-4)}.${kind}`;
    const content =
      kind === 'csv'
        ? '﻿' + ['번호,키 ID,인증키,생성일', ...rows.map((k) => [String(k.no), k.id, k.key, k.createdAt.slice(0, 10)].map(cell).join(','))].join('\r\n') + '\r\n'
        : rows.map((k) => k.key).join('\r\n') + '\r\n';
    return saveText(BrowserWindow.fromWebContents(e.sender), name, content, kind === 'csv' ? [{ name: 'CSV (UTF-8)', extensions: ['csv'] }] : [{ name: '텍스트', extensions: ['txt'] }]);
  });
  ipcMain.handle('app:folder', () => dataDir());

  createWindow();
});

app.on('window-all-closed', () => app.quit());
