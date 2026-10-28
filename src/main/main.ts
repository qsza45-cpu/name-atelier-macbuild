// NAME ATELIER main process: one window, a JSON store in userData, clipboard and file export. No network.
import { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, nativeTheme, session, shell } from 'electron';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_SETTINGS, type Favorite, type Settings, type StoreData } from '../shared/types';

// Tests point the store elsewhere so they never touch the real favourites.
if (process.env.NAME_ATELIER_HOME) app.setPath('userData', process.env.NAME_ATELIER_HOME);

const storePath = () => join(app.getPath('userData'), 'name-atelier-data.json');

function readStore(): StoreData {
  try {
    const raw = JSON.parse(readFileSync(storePath(), 'utf8'));
    return {
      version: 1,
      favorites: Array.isArray(raw.favorites) ? raw.favorites.filter((f: Favorite) => f && typeof f.ko === 'string' && typeof f.id === 'string') : [],
      settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}), last: { ...DEFAULT_SETTINGS.last, ...(raw.settings?.last ?? {}) }, regionStyle: { ...(raw.settings?.regionStyle ?? {}) } },
    };
  } catch {
    return { version: 1, favorites: [], settings: DEFAULT_SETTINGS };
  }
}

let store: StoreData;

// Write to a temp file then rename, so a crash mid-write never leaves a half-written store.
function writeStore() {
  mkdirSync(app.getPath('userData'), { recursive: true });
  const tmp = `${storePath()}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  renameSync(tmp, storePath());
}

function createWindow() {
  const isDark = store.settings.theme === 'dark' || (store.settings.theme === 'system' && nativeTheme.shouldUseDarkColors);
  const icon = join(__dirname, 'icon', 'app_icon_256.png');
  const win = new BrowserWindow({
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
  const shot = !app.isPackaged && process.env.NAME_ATELIER_SHOT;
  if (shot) {
    win.webContents.once('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, 800));
      if (process.env.NAME_ATELIER_SHOT_JS) await win.webContents.executeJavaScript(process.env.NAME_ATELIER_SHOT_JS);
      await new Promise((r) => setTimeout(r, 1200));
      writeFileSync(shot, (await win.webContents.capturePage()).toPNG());
      app.quit();
    });
  }
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.loadFile(join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  store = readStore();
  // Block every network request: the app is offline by design.
  session.defaultSession.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !/^(file|devtools|data|blob):/.test(d.url) }));

  // Keep the standard Edit menu on macOS (copy/paste shortcuts need it); no menu bar on Windows.
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]));
  } else {
    Menu.setApplicationMenu(null);
  }

  ipcMain.handle('store:load', () => store);
  ipcMain.handle('store:favorites', (_e, list: Favorite[]) => {
    store.favorites = Array.isArray(list) ? list.slice(0, 5000) : [];
    writeStore();
  });
  ipcMain.handle('store:settings', (_e, s: Settings) => {
    store.settings = { ...DEFAULT_SETTINGS, ...s };
    writeStore();
  });
  ipcMain.handle('clipboard:write', (_e, text: string) => clipboard.writeText(String(text ?? '')));
  ipcMain.handle('file:export', async (e, kind: 'txt' | 'csv', content: string, defaultName: string) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const filters = kind === 'csv' ? [{ name: 'CSV (UTF-8)', extensions: ['csv'] }] : [{ name: '텍스트 (UTF-8)', extensions: ['txt'] }];
    const opts = { title: kind === 'csv' ? 'CSV로 저장' : 'TXT로 저장', defaultPath: join(app.getPath('documents'), defaultName), filters };
    const r = win ? await dialog.showSaveDialog(win, opts) : await dialog.showSaveDialog(opts);
    if (r.canceled || !r.filePath) return { saved: false };
    writeFileSync(r.filePath, content, 'utf8');
    return { saved: true, path: r.filePath };
  });
  ipcMain.handle('app:info', () => ({ version: app.getVersion(), dataPath: storePath(), platform: process.platform }));
  ipcMain.handle('app:reveal', () => shell.showItemInFolder(storePath()));

  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on('window-all-closed', () => app.quit());
