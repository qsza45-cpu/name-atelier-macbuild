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
}

export type ThemePref = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemePref;
  animation: boolean;
  last: { genre: Genre; style: StyleId; gender: GenderSel };
  regionStyle: Partial<Record<Region, StyleId>>; // last style picked inside each 한국/동양풍/서양풍 group
  cond: NameConditions; // 조건 뽑기
  avoidText: string; // 이미 쓴 이름 (as pasted; parsed with parseNameList)
}

export interface StoreData {
  version: 1;
  favorites: Favorite[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  animation: true,
  last: { genre: 'fantasy', style: 'rofan', gender: 'any' },
  regionStyle: {},
  cond: { len: 'any', first: '', final: 'any' },
  avoidText: '',
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
