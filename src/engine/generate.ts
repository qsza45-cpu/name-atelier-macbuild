// Name engine: picks real names from the curated per-culture lists (src/data/names) and builds 창작 판타지식 names from
// syllable pools. Pure and offline; pass an rng for reproducible tests.
import type { Genre, G, GivenName, StyleData, Surname } from '../data/types';
import { FANTASY, MURIM, STYLES, XIANXIA } from '../data/names';
import type { HanjaPools, HanjaSyl } from '../data/names/hanja';
import { BLOCK_SUBSTRINGS } from '../data/blocklist';

export type StyleId = 'ko' | 'rofan' | 'xianxia' | 'murim' | 'us' | 'gb' | 'fr' | 'de' | 'jp' | 'fantasy';
const HANJA_STYLES: Partial<Record<StyleId, { pools: HanjaPools; label: string }>> = {
  xianxia: { pools: XIANXIA, label: '선협식' },
  murim: { pools: MURIM, label: '무협식' },
};
// Chip order: the styles writers use most first.
const ORDER: StyleId[] = ['ko', 'rofan', 'xianxia', 'murim', 'us', 'gb', 'fr', 'de', 'jp', 'fantasy'];
export type GenderSel = 'm' | 'f' | 'any';

export const GENRES: { id: Genre; label: string }[] = [
  { id: 'fantasy', label: '판타지' },
  { id: 'romance', label: '로맨스' },
  { id: 'modern', label: '현대물' },
  { id: 'murim', label: '무협' },
];
const ALL_STYLES: { id: StyleId; label: string }[] = [
  ...STYLES.map((s) => ({ id: s.id as StyleId, label: s.label })),
  ...Object.entries(HANJA_STYLES).map(([id, h]) => ({ id: id as StyleId, label: h!.label })),
  { id: 'fantasy', label: '창작 판타지식' },
];
export const STYLE_OPTIONS = ORDER.map((id) => ALL_STYLES.find((s) => s.id === id)).filter((s): s is { id: StyleId; label: string } => !!s);

// Top-level grouping shown first in the picker: 한국 / 동양풍 / 서양풍.
export type Region = 'korea' | 'east' | 'west';
export const REGIONS: { id: Region; label: string; styles: StyleId[] }[] = [
  { id: 'korea', label: '한국', styles: ['ko'] },
  { id: 'east', label: '동양풍', styles: ['xianxia', 'murim', 'jp'] },
  { id: 'west', label: '서양풍', styles: ['rofan', 'us', 'gb', 'fr', 'de', 'fantasy'] },
];
export const regionOf = (s: StyleId): Region => REGIONS.find((r) => r.styles.includes(s))?.id ?? 'west';
export const GENDERS: { id: GenderSel; label: string }[] = [
  { id: 'm', label: '남성' },
  { id: 'f', label: '여성' },
  { id: 'any', label: '성별 무관' },
];
export const label = {
  genre: (id: Genre) => GENRES.find((x) => x.id === id)?.label ?? id,
  style: (id: StyleId) => STYLE_OPTIONS.find((x) => x.id === id)?.label ?? id,
  gender: (id: GenderSel) => GENDERS.find((x) => x.id === id)?.label ?? id,
};

export interface NameResult {
  id: string; // stable key: style + Korean form without spaces
  ko: string; // Korean display form
  orig: string; // original script ('' for 창작 names)
  roman?: string;
  genre: Genre;
  style: StyleId;
  gender: GenderSel; // the gender filter it was generated under
}

export interface GenerateRequest {
  genre: Genre;
  style: StyleId;
  gender: GenderSel;
  count: number;
  avoid?: Iterable<string>; // ids not to repeat (session history + names already on screen)
  rng?: () => number;
}
export interface GenerateResponse {
  names: NameResult[];
  repeated: boolean; // true when the pool ran dry and some names repeat earlier results
}

const MAX_TRIES_PER_NAME = 400;

/** Small deterministic PRNG (mulberry32) for tests. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const compact = (s: string) => s.replace(/\s+/g, '');
export function isBlocked(ko: string) {
  const c = compact(ko);
  return BLOCK_SUBSTRINGS.some((b) => b && c.includes(b));
}

function pickWeighted<T>(items: T[], weight: (x: T) => number, rng: () => number): T | undefined {
  let total = 0;
  for (const it of items) total += weight(it);
  if (total <= 0) return undefined;
  let r = rng() * total;
  for (const it of items) {
    r -= weight(it);
    if (r < 0) return it;
  }
  return items[items.length - 1];
}
const pick = <T>(xs: T[], rng: () => number) => xs[Math.floor(rng() * xs.length)];

// Genre affinity boosts a name; it never excludes one.
const GENRE_BOOST = 4;
const genreW = (tags: Genre[] | undefined, genre: Genre) => (tags?.includes(genre) ? GENRE_BOOST : 1);
function genderW(g: G, sel: GenderSel) {
  if (sel === 'any') return g === 'u' ? 2 : 1;
  if (g === sel) return 1;
  return g === 'u' ? 0.6 : 0;
}

// Nobiliary particles for aristocratic genres (Friedrich von …, Camille de …).
const PARTICLE: Partial<Record<string, { ko: string; orig: string; chance: number }>> = {
  de: { ko: '폰', orig: 'von', chance: 0.25 },
  fr: { ko: '드', orig: 'de', chance: 0.2 },
};

function realName(style: StyleData, req: GenerateRequest, rng: () => number): NameResult | undefined {
  const given = pickWeighted<GivenName>(style.given, (n) => genderW(n.g, req.gender) * genreW(n.tags, req.genre), rng);
  const sur = pickWeighted<Surname>(style.surnames, (s) => genreW(s.tags, req.genre), rng);
  if (!given || !sur) return undefined;
  let surKo = sur.ko;
  let surOrig = sur.orig;
  const p = PARTICLE[style.id];
  if (p && (req.genre === 'fantasy' || req.genre === 'romance') && rng() < p.chance) {
    // French "de" elides before a vowel (d'Artois), so only use it before consonants.
    const vowelStart = /^[AEIOUYÀÂÉÈÊÎÔÛaeiouy]/.test(sur.orig);
    if (!(style.id === 'fr' && vowelStart)) {
      surKo = `${p.ko} ${sur.ko}`;
      surOrig = `${p.orig} ${sur.orig}`;
    }
  }
  const surnameFirst = style.order === 'surname-first';
  const ko = surnameFirst ? [surKo, given.ko].join(style.sep) : [given.ko, surKo].join(style.sep || ' ');
  const origSep = style.id === 'ko' ? '' : ' ';
  const orig = surnameFirst ? `${surOrig}${origSep}${given.orig}` : `${given.orig} ${surOrig}`;
  const roman = given.roman || sur.roman ? (surnameFirst ? `${sur.roman ?? ''} ${given.roman ?? ''}` : `${given.roman ?? ''} ${sur.roman ?? ''}`).trim() : undefined;
  // Korean given names often have no single standard hanja, so the card's second line shows the romanization instead.
  const second = style.id === 'ko' ? roman ?? '' : orig;
  return { id: `${style.id}:${compact(ko)}`, ko, orig: second, roman, genre: req.genre, style: style.id as StyleId, gender: req.gender };
}

// 선협식·무협식: surname + one or two hanja syllables. The first given syllable uses its word-initial reading
// (蓮 → 연화), later ones the plain reading (청련). orig shows the hanja (白蓮花).
function hanjaName(styleId: StyleId, pools: HanjaPools, req: GenerateRequest, rng: () => number): NameResult | undefined {
  const fits = (s: HanjaSyl) => req.gender === 'any' || s.g === req.gender || s.g === 'u';
  const pool = pools.given.filter(fits);
  if (!pool.length || !pools.surnames.length) return undefined;
  const sur = pick(pools.surnames, rng);
  const syls = [pick(pool, rng)];
  if (rng() < 0.85) syls.push(pick(pool, rng));
  if (syls.length === 2 && syls[0].hanja === syls[1].hanja) return undefined;
  const readings: string[] = [];
  syls.forEach((s, i) => {
    let r = i === 0 ? s.initial ?? s.ko : s.ko;
    // 렬·률 become 열·율 after a vowel or ㄴ (선율, 규율), as in standard Korean readings.
    if (i > 0 && (r === '렬' || r === '률')) {
      const fin = (readings[i - 1].charCodeAt(0) - 0xac00) % 28;
      if (fin === 0 || fin === 4) r = r === '렬' ? '열' : '율';
    }
    readings.push(r);
  });
  const given = readings.join('');
  const ko = `${sur.initial ?? sur.ko}${given}`;
  return { id: `${styleId}:${ko}`, ko, orig: `${sur.hanja}${syls.map((s) => s.hanja).join('')}`, genre: req.genre, style: styleId, gender: req.gender };
}

// 창작 판타지식: rule-based syllable names. Rejects doubled syllables (리리) and over-long results.
function inventedName(req: GenerateRequest, rng: () => number): NameResult | undefined {
  const F = FANTASY;
  const tails = req.gender === 'm' ? F.tailM : req.gender === 'f' ? F.tailF : [...F.tailU, ...F.tailM, ...F.tailF];
  const parts = [pick(F.head, rng)];
  if (rng() < 0.45) parts.push(pick(F.mid, rng));
  parts.push(pick(tails, rng));
  const given = parts.join('');
  for (let i = 1; i < given.length; i++) if (given[i] === given[i - 1]) return undefined;
  if (given.length < 2 || given.length > 5) return undefined;
  // A family name suits fantasy/romance characters; modern-genre invented names stay single.
  const surnameChance = req.genre === 'modern' ? 0 : 0.6;
  const ko = rng() < surnameChance ? `${given} ${pick(F.houseHead, rng)}${pick(F.houseTail, rng)}` : given;
  return { id: `fantasy:${compact(ko)}`, ko, orig: '', genre: req.genre, style: 'fantasy', gender: req.gender };
}

export function generate(req: GenerateRequest): GenerateResponse {
  const rng = req.rng ?? Math.random;
  const avoid = new Set(req.avoid ?? []);
  const style = STYLES.find((s) => s.id === req.style);
  const hanja = HANJA_STYLES[req.style];
  const make = () => (req.style === 'fantasy' ? inventedName(req, rng) : hanja ? hanjaName(req.style, hanja.pools, req, rng) : style ? realName(style, req, rng) : undefined);
  const names: NameResult[] = [];
  const taken = new Set<string>();
  let repeated = false;
  for (let i = 0; i < req.count; i++) {
    let fallback: NameResult | undefined;
    let chosen: NameResult | undefined;
    for (let t = 0; t < MAX_TRIES_PER_NAME && !chosen; t++) {
      const n = make();
      if (!n || isBlocked(n.ko) || taken.has(n.id)) continue;
      if (avoid.has(n.id)) {
        fallback ??= n;
        continue;
      }
      chosen = n;
    }
    // Pool exhausted for this filter: accept an earlier name rather than loop forever, and tell the caller.
    if (!chosen && fallback) {
      chosen = fallback;
      repeated = true;
    }
    if (!chosen) {
      repeated = true;
      continue;
    }
    taken.add(chosen.id);
    names.push(chosen);
  }
  return { names, repeated };
}

/** Rough number of distinct names a filter can produce (for the "pool running low" hint and tests). */
export function poolSize(styleId: StyleId, gender: GenderSel): number {
  if (styleId === 'fantasy') return 10000;
  const h = HANJA_STYLES[styleId];
  if (h) {
    const g = h.pools.given.filter((s) => gender === 'any' || s.g === gender || s.g === 'u').length;
    return h.pools.surnames.length * g * g;
  }
  const s = STYLES.find((x) => x.id === styleId);
  if (!s) return 0;
  const g = s.given.filter((n) => genderW(n.g, gender) > 0).length;
  return g * s.surnames.length;
}
