// NAME ATELIER main process: one window, a JSON store in userData, clipboard and file export. No network.
import { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, nativeTheme, screen, session } from 'electron';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync, writeSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_SETTINGS, type Favorite, type Settings, type StoreData } from '../shared/types';
import { GENDERS, GENRES, REGIONS, STYLE_OPTIONS } from '../engine/generate';

// Tests point the store elsewhere so they never touch the real favourites.
if (process.env.NAME_ATELIER_HOME) app.setPath('userData', process.env.NAME_ATELIER_HOME);

const storePath = () => join(app.getPath('userData'), 'name-atelier-data.json');
const MAX_FAVORITES = 5000;

// Everything that reaches the store goes through these, so a bad file or payload can't break drawing.
const oneOf = <T extends string>(v: unknown, ok: readonly T[], dflt: T): T => (ok.includes(v as T) ? (v as T) : dflt);
const STYLE_IDS = STYLE_OPTIONS.map((s) => s.id);
const GENRE_IDS = GENRES.map((g) => g.id);
const GENDER_IDS = GENDERS.map((g) => g.id);
function cleanSettings(raw: any): Settings {
  const s = raw && typeof raw === 'object' ? raw : {};
  const last = s.last && typeof s.last === 'object' ? s.last : {};
  const regionStyle: Settings['regionStyle'] = {};
  for (const r of REGIONS) {
    const v = s.regionStyle?.[r.id];
    if (r.styles.includes(v)) regionStyle[r.id] = v;
  }
  return {
    theme: oneOf(s.theme, ['system', 'light', 'dark'] as const, DEFAULT_SETTINGS.theme),
    animation: typeof s.animation === 'boolean' ? s.animation : DEFAULT_SETTINGS.animation,
    last: {
      genre: oneOf(last.genre, GENRE_IDS, DEFAULT_SETTINGS.last.genre),
      style: oneOf(last.style, STYLE_IDS, DEFAULT_SETTINGS.last.style),
      gender: oneOf(last.gender, GENDER_IDS, DEFAULT_SETTINGS.last.gender),
    },
    regionStyle,
  };
}
function cleanFavorites(raw: unknown): Favorite[] {
  if (!Array.isArray(raw)) return [];
  const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
  return raw
    .filter((f) => f && typeof f.ko === 'string' && f.ko && typeof f.id === 'string' && f.id)
    .slice(0, MAX_FAVORITES)
    .map((f) => ({
      id: str(f.id),
      ko: str(f.ko),
      orig: str(f.orig),
      ...(typeof f.roman === 'string' ? { roman: str(f.roman) } : {}),
      genre: oneOf(f.genre, GENRE_IDS, 'fantasy'),
      style: oneOf(f.style, STYLE_IDS, 'fantasy'),
      gender: oneOf(f.gender, GENDER_IDS, 'any'),
      savedAt: str(f.savedAt, 40) || new Date().toISOString(),
    }));
}

function readStore(): StoreData {
  const file = storePath();
  if (!existsSync(file)) return { version: 1, favorites: [], settings: DEFAULT_SETTINGS };
  try {
    // Notepad may add a BOM when the user edits the file by hand.
    const raw = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
    return { version: 1, favorites: cleanFavorites(raw.favorites), settings: cleanSettings(raw.settings) };
  } catch {
    // Unreadable store: keep it aside instead of letting the next save overwrite the user's favourites.
    try {
      renameSync(file, `${file}.corrupt-${Date.now()}`);
    } catch {}
    return { version: 1, favorites: [], settings: DEFAULT_SETTINGS };
  }
}

let store: StoreData;

// Write to a temp file, fsync, then rename, so a crash or power cut never leaves a half-written store.
// Antivirus can briefly lock the file on Windows, so retry a few times before giving up.
function writeStore(): { ok: boolean; error?: string } {
  const tmp = `${storePath()}.tmp`;
  let error = '';
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      mkdirSync(app.getPath('userData'), { recursive: true });
      const fd = openSync(tmp, 'w');
      try {
        writeSync(fd, JSON.stringify(store, null, 2), null, 'utf8');
        fsyncSync(fd);
      } finally {
        closeSync(fd);
      }
      renameSync(tmp, storePath());
      return { ok: true };
    } catch (e: any) {
      error = String(e?.code ?? e?.message ?? e);
      const until = Date.now() + 60 * (attempt + 1);
      while (Date.now() < until);
    }
  }
  return { ok: false, error };
}

// Test runs (screenshot runs, or NAME_ATELIER_DISPLAY=2) open on the second monitor so they never cover the
// user's work on the main one. Without a second monitor a test run stops instead of falling back to the main screen.
const shot = !app.isPackaged && process.env.NAME_ATELIER_SHOT;
const wantsSecondDisplay = !!shot || process.env.NAME_ATELIER_DISPLAY === '2';
function secondDisplayBounds(w: number, h: number) {
  const primary = screen.getPrimaryDisplay();
  const d = screen.getAllDisplays().find((x) => x.id !== primary.id);
  if (!d) return null;
  const a = d.workArea;
  return { x: Math.round(a.x + (a.width - w) / 2), y: Math.round(a.y + (a.height - h) / 2) };
}

function createWindow() {
  const isDark = store.settings.theme === 'dark' || (store.settings.theme === 'system' && nativeTheme.shouldUseDarkColors);
  const icon = join(__dirname, 'icon', 'app_icon_256.png');
  let pos: { x: number; y: number } | undefined;
  if (wantsSecondDisplay) {
    const p = secondDisplayBounds(960, 680);
    if (!p) {
      console.error('NAME ATELIER: 모니터 2를 찾지 못해 시험 실행을 중단합니다.');
      app.exit(3);
      return;
    }
    pos = p;
  }
  const win = new BrowserWindow({
    ...(pos ?? {}),
    width: 960,
    height: 680,
    minWidth: 760,
    minHeight: 600,
    title: 'NAME ATELIER — 작명 아틀리에',
    backgroundColor: isDark ? '#16111A' : '#F4EDE2',
    show: false,
    icon: existsSync(icon) ? icon : undefined,
    webPreferences: { preload: join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  win.once('ready-to-show', () => win.show());
  // Dev-only screenshot run (ignored in packaged builds): NAME_ATELIER_SHOT=<out.png> [NAME_ATELIER_SHOT_JS=<script>]
  if (shot) {
    win.webContents.once('did-finish-load', async () => {
      const size = process.env.NAME_ATELIER_SHOT_SIZE?.match(/^(\d+)x(\d+)$/);
      if (size) win.setContentSize(Number(size[1]), Number(size[2]));
      await new Promise((r) => setTimeout(r, 800));
      if (process.env.NAME_ATELIER_SHOT_JS) {
        const result = await win.webContents.executeJavaScript(process.env.NAME_ATELIER_SHOT_JS);
        if (result !== undefined) writeFileSync(`${shot}.json`, JSON.stringify(result, null, 2));
      }
      await new Promise((r) => setTimeout(r, 1200));
      writeFileSync(shot, (await win.webContents.capturePage()).toPNG());
      app.quit();
    });
  }
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.loadFile(join(__dirname, 'renderer', 'index.html'));
}

// One instance only: two windows would each hold their own copy of the store and overwrite each other's favourites.
const primary = app.requestSingleInstanceLock();
if (!primary) app.quit();
app.on('second-instance', () => {
  const w = BrowserWindow.getAllWindows()[0];
  if (w) {
    if (w.isMinimized()) w.restore();
    w.focus();
  }
});

app.whenReady().then(() => {
  if (!primary) return;
  store = readStore();
  // Block every network request and permission prompt: the app is offline by design and needs no device access.
  session.defaultSession.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !/^(file|devtools|data|blob):/.test(d.url) }));
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));

  // Keep the standard Edit menu on macOS (copy/paste shortcuts need it); no menu bar on Windows.
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]));
  } else {
    Menu.setApplicationMenu(null);
  }

  ipcMain.handle('store:load', () => store);
  ipcMain.handle('store:favorites', (_e, list: unknown) => {
    store.favorites = cleanFavorites(list);
    return writeStore();
  });
  ipcMain.handle('store:settings', (_e, s: unknown) => {
    store.settings = cleanSettings(s);
    return writeStore();
  });
  ipcMain.handle('clipboard:write', (_e, text: string) => clipboard.writeText(String(text ?? '').slice(0, 1_000_000)));
  ipcMain.handle('file:export', async (e, kind: 'txt' | 'csv', content: string, defaultName: string) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const filters = kind === 'csv' ? [{ name: 'CSV (UTF-8)', extensions: ['csv'] }] : [{ name: '텍스트 (UTF-8)', extensions: ['txt'] }];
    const opts = { title: kind === 'csv' ? 'CSV로 저장' : 'TXT로 저장', defaultPath: join(app.getPath('documents'), defaultName), filters };
    const r = win ? await dialog.showSaveDialog(win, opts) : await dialog.showSaveDialog(opts);
    if (r.canceled || !r.filePath) return { saved: false };
    try {
      writeFileSync(r.filePath, String(content ?? ''), 'utf8');
    } catch (err: any) {
      // Typically the file is still open in Excel (EBUSY/EPERM).
      return { saved: false, error: String(err?.code ?? err?.message ?? err) };
    }
    return { saved: true, path: r.filePath };
  });
  ipcMain.handle('app:info', () => ({ version: app.getVersion(), dataPath: storePath(), platform: process.platform }));

  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on('window-all-closed', () => app.quit());
