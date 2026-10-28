// Types shared by the main process, preload and renderer.
import type { Genre } from '../data/types';
import type { GenderSel, Region, StyleId } from '../engine/generate';

export interface Favorite {
  id: string;
  ko: string;
  orig: string;
  roman?: string;
  genre: Genre;
  style: StyleId;
  gender: GenderSel;
  savedAt: string; // ISO time
}

export type ThemePref = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemePref;
  animation: boolean;
  last: { genre: Genre; style: StyleId; gender: GenderSel };
  regionStyle: Partial<Record<Region, StyleId>>; // last style picked inside each 한국/동양풍/서양풍 group
}

export interface StoreData {
  version: 1;
  favorites: Favorite[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = { theme: 'system', animation: true, last: { genre: 'fantasy', style: 'rofan', gender: 'any' }, regionStyle: {} };

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
  info(): Promise<{ version: string; dataPath: string; platform: string }>;
}
