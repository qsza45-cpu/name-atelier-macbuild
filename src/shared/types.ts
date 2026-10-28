// Types shared by the main process, preload and renderer.
import type { Genre } from '../data/types';
import type { GenderSel, NameConditions, Region, StyleId } from '../engine/generate';

export interface Favorite {
  id: string;
  ko: string;
  orig: string;
  roman?: string;
  genre: Genre;
  style: StyleId;
  gender: GenderSel;
  savedAt: string; // ISO time
  meaning?: string; // 한자 뜻 (선협·무협)
  nick?: string[]; // 애칭 (서양 이름)
  memo?: string; // 즐겨찾기 메모
  work?: string; // 작품 분류 ('' = 미분류)
  confirmed?: boolean; // 확정: already used in the work, so its 작업 공간 avoids similar names
}

export type ThemePref = 'system' | 'light' | 'dark';

/** Everything a 작품 작업 공간 remembers. */
export interface WorkSettings {
  last: { genre: Genre; style: StyleId; gender: GenderSel };
  regionStyle: Partial<Record<Region, StyleId>>; // last style picked inside each 한국/동양풍/서양풍 group
  cond: NameConditions; // 조건 뽑기 + 분위기
  avoidText: string; // 이미 쓴 이름 (as pasted; parsed with parseNameList)
}

/** App settings. The WorkSettings fields at the top level are the current 작업 공간's values (mirrored into workspaces). */
export interface Settings extends WorkSettings {
  theme: ThemePref;
  animation: boolean;
  keepFavorites: boolean; // favourited cards stay in place on 다시 뽑기
  tipsSeen: boolean; // first-run card-button help dismissed
  work: string; // current 작업 공간 ('' = 기본)
  workspaces: Record<string, WorkSettings>;
}

export interface StoreData {
  version: 1;
  favorites: Favorite[];
  settings: Settings;
}

export const MAX_FAVORITES = 5000;

export const DEFAULT_WORK: WorkSettings = {
  last: { genre: 'fantasy', style: 'rofan', gender: 'any' },
  regionStyle: {},
  cond: { len: 'any', first: '', final: 'any', era: 'any', tone: 'any', flair: 'any' },
  avoidText: '',
};

export const DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_WORK,
  theme: 'system',
  animation: true,
  keepFavorites: true,
  tipsSeen: false,
  work: '',
  workspaces: {},
};

export interface SaveResult {
  ok: boolean;
  error?: string;
}

export interface AtelierApi {
  load(): Promise<StoreData>;
  saveFavorites(list: Favorite[]): Promise<SaveResult>;
  saveSettings(s: Settings): Promise<SaveResult>;
  copy(text: string): Promise<void>;
  exportFile(kind: 'txt' | 'csv', content: string, defaultName: string): Promise<{ saved: boolean; path?: string; error?: string }>;
  saveImage(pngDataUrl: string, defaultName: string): Promise<{ saved: boolean; path?: string; error?: string }>;
  assetDataUrl(rel: string): Promise<string | null>;
  info(): Promise<{ version: string; dataPath: string; platform: string }>;
}
